import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { LabSession } from '@/lib/models/LabSession';
import { successResponse, validationError, conflictError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const labSessionId = searchParams.get('labSessionId');
    const studentId = searchParams.get('studentId');

    const db = await getDatabase();
    const query: any = {};

    // Students can only see their own submissions
    if (authResult.role === 'student') {
      query.studentId = new ObjectId(authResult.userId);
    } else if (studentId) {
      query.studentId = new ObjectId(studentId);
    }

    if (status) {
      query.status = status;
    }

    if (labSessionId) {
      query.labSessionId = new ObjectId(labSessionId);
    }

    const skip = (page - 1) * limit;
    const submissions = await db
      .collection<Submission>('submissions')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection<Submission>('submissions').countDocuments(query);

    return successResponse(submissions, { page, limit, total });
  } catch (error) {
    console.error('Get submissions error:', error);
    return serverError('Failed to fetch submissions');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { labSessionId, observationData, results, conclusion } = body;

    // Validation
    const errors: { [key: string]: string } = {};
    if (!labSessionId) errors.labSessionId = 'Lab session ID is required';

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const db = await getDatabase();

    // Check if session is active
    const session = await db
      .collection<LabSession>('labSessions')
      .findOne({ _id: new ObjectId(labSessionId) });

    if (!session) {
      return validationError({ labSessionId: 'Session not found' });
    }

    if (session.status !== 'active') {
      return conflictError('Cannot submit to inactive session');
    }

    // Check for existing submission
    const existingSubmission = await db
      .collection<Submission>('submissions')
      .findOne({
        labSessionId: new ObjectId(labSessionId),
        studentId: new ObjectId(authResult.userId),
      });

    if (existingSubmission) {
      return conflictError('Submission already exists for this session');
    }

    const submission: Submission = {
      labSessionId: new ObjectId(labSessionId),
      studentId: new ObjectId(authResult.userId),
      experimentTemplateId: session.experimentTemplateId,
      templateVersion: session.templateVersion,
      status: 'in_progress',
      observationData: observationData || [],
      proofImages: [],
      calculations: [],
      results: results || '',
      conclusion: conclusion || '',
      editHistory: [],
      flagged: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Submission>('submissions').insertOne(submission);
    submission._id = result.insertedId;

    return successResponse(submission);
  } catch (error) {
    console.error('Create submission error:', error);
    return serverError('Failed to create submission');
  }
}
