import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { Notification } from '@/lib/models/Notification';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireRole(request, ['lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { comments } = body;

    const db = await getDatabase();
    const submission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(params.id) });

    if (!submission) {
      return notFoundError('Submission not found');
    }

    // Update submission status
    await db
      .collection<Submission>('submissions')
      .updateOne(
        { _id: new ObjectId(params.id) },
        {
          $set: {
            status: 'approved',
            reviewedBy: new ObjectId(authResult.userId),
            reviewedAt: new Date(),
            reviewComments: comments || '',
            updatedAt: new Date(),
          },
        }
      );

    // Create notification for student
    await db.collection<Notification>('notifications').insertOne({
      userId: submission.studentId,
      type: 'submission_approved',
      title: 'Submission Approved',
      message: 'Your lab work has been approved by the faculty.',
      relatedEntityId: params.id,
      relatedEntityType: 'submission',
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    const updatedSubmission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(params.id) });

    return successResponse(updatedSubmission);
  } catch (error) {
    console.error('Approve submission error:', error);
    return serverError('Failed to approve submission');
  }
}
