import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { Notification } from '@/lib/models/Notification';
import { successResponse, notFoundError, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { reason, comments } = body;

    if (!reason) {
      return validationError({ reason: 'Rejection reason is required' });
    }

    const db = await getDatabase();
    const submission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    if (!submission) {
      return notFoundError('Submission not found');
    }

    // Update submission status to in_progress so student can edit and resubmit
    await db
      .collection<Submission>('submissions')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'in_progress', // Changed from 'rejected' to allow editing
            reviewedBy: new ObjectId(authResult.userId),
            reviewedAt: new Date(),
            rejectionReason: reason,
            reviewComments: comments || '',
            updatedAt: new Date(),
          },
        }
      );

    // Create notification for student
    await db.collection<Notification>('notifications').insertOne({
      userId: submission.studentId,
      type: 'submission_rejected',
      title: 'Submission Rejected',
      message: `Your lab work has been rejected. Reason: ${reason}`,
      relatedEntityId: id,
      relatedEntityType: 'submission',
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    const updatedSubmission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    return successResponse(updatedSubmission);
  } catch (error) {
    console.error('Reject submission error:', error);
    return serverError('Failed to reject submission');
  }
}
