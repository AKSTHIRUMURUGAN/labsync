import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { LabSession } from '@/lib/models/LabSession';
import { successResponse, validationError, conflictError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

const MIN_SESSION_DURATION_MINUTES = 30;
const MAX_SESSION_DURATION_MINUTES = 480;

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['student', 'lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const labGroupId = searchParams.get('labGroupId');

    const db = await getDatabase();
    const query: any = {};

    if (authResult.role === 'student') {
      const enrolledGroups = await db
        .collection('labGroups')
        .find(
          { students: new ObjectId(authResult.userId) },
          { projection: { _id: 1 } }
        )
        .toArray();

      const enrolledGroupIds = enrolledGroups.map((group: any) => group._id);

      // Apply membership filter only when enrollment data exists.
      // If no enrollment mapping is present yet, keep backward-compatible behavior
      // so active sessions are still visible on the student dashboard.
      if (enrolledGroupIds.length > 0) {
        query.labGroupId = { $in: enrolledGroupIds };
      }
    }

    if (status) {
      query.status = status;
    }

    if (labGroupId) {
      query.labGroupId = new ObjectId(labGroupId);
    }

    const skip = (page - 1) * limit;
    const sessions = await db
      .collection<LabSession>('labSessions')
      .find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection<LabSession>('labSessions').countDocuments(query);

    return successResponse(sessions, { page, limit, total });
  } catch (error) {
    console.error('Get sessions error:', error);
    return serverError('Failed to fetch sessions');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { labGroupId, experimentTemplateId, duration, location, equipment } = body;
    const numericDuration = Number(duration);

    // Validation
    const errors: { [key: string]: string } = {};
    if (!labGroupId) errors.labGroupId = 'Lab group ID is required';
    if (!experimentTemplateId) errors.experimentTemplateId = 'Experiment template ID is required';
    if (!Number.isFinite(numericDuration)) {
      errors.duration = 'Duration must be a valid number';
    } else if (numericDuration < MIN_SESSION_DURATION_MINUTES || numericDuration > MAX_SESSION_DURATION_MINUTES) {
      errors.duration = `Duration must be between ${MIN_SESSION_DURATION_MINUTES} and ${MAX_SESSION_DURATION_MINUTES} minutes`;
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const db = await getDatabase();

    // Check for existing active session
    const existingSession = await db
      .collection<LabSession>('labSessions')
      .findOne({
        labGroupId: new ObjectId(labGroupId),
        experimentTemplateId: new ObjectId(experimentTemplateId),
        status: 'active',
      });

    if (existingSession) {
      return conflictError('An active session already exists for this lab group and experiment');
    }

    // Get template version
    const template = await db
      .collection('experimentTemplates')
      .findOne({ _id: new ObjectId(experimentTemplateId) });

    if (!template) {
      return validationError({ experimentTemplateId: 'Template not found' });
    }

    const session: LabSession = {
      labGroupId: new ObjectId(labGroupId),
      experimentTemplateId: new ObjectId(experimentTemplateId),
      templateVersion: template.version,
      conductedBy: new ObjectId(authResult.userId),
      status: 'created',
      startTime: new Date(),
      duration: numericDuration,
      location,
      equipment: equipment ? equipment.map((id: string) => new ObjectId(id)) : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<LabSession>('labSessions').insertOne(session);
    session._id = result.insertedId;

    return successResponse(session);
  } catch (error) {
    console.error('Create session error:', error);
    return serverError('Failed to create session');
  }
}
