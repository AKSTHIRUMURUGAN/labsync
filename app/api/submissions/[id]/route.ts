import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { successResponse, notFoundError, forbiddenError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();
    const submission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    if (!submission) {
      return notFoundError('Submission not found');
    }

    // Check permissions
    if (
      authResult.role === 'student' &&
      submission.studentId.toString() !== authResult.userId
    ) {
      return forbiddenError('Access denied');
    }

    return successResponse(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    return notFoundError('Submission not found');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDatabase();

    const submission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    if (!submission) {
      return notFoundError('Submission not found');
    }

    // Check permissions
    if (
      authResult.role === 'student' &&
      submission.studentId.toString() !== authResult.userId
    ) {
      return forbiddenError('Access denied');
    }

    // Cannot edit approved submissions
    if (submission.status === 'approved') {
      return forbiddenError('Cannot edit approved submission');
    }

    // Track changes in edit history
    const editHistory = submission.editHistory || [];
    Object.keys(body).forEach((field) => {
      if (submission[field as keyof Submission] !== body[field]) {
        editHistory.push({
          timestamp: new Date(),
          field,
          oldValue: submission[field as keyof Submission],
          newValue: body[field],
        });
      }
    });

    await db
      .collection<Submission>('submissions')
      .updateOne(
        { _id: new ObjectId(id), version: submission.version },
        {
          $set: {
            ...body,
            editHistory,
            version: submission.version + 1,
            updatedAt: new Date(),
          },
        }
      );

    const updatedSubmission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    return successResponse(updatedSubmission);
  } catch (error) {
    console.error('Update submission error:', error);
    return serverError('Failed to update submission');
  }
}
