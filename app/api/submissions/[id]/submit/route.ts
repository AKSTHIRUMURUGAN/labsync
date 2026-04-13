import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { Notification } from '@/lib/models/Notification';
import { successResponse, notFoundError, forbiddenError, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function POST(
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
    if (submission.studentId.toString() !== authResult.userId) {
      return forbiddenError('Access denied');
    }

    // Validate required fields - make it more lenient
    const errors: { [key: string]: string } = {};
    
    // Check if there's any content at all
    const hasObservations = submission.observationData && submission.observationData.length > 0;
    const hasResults = submission.results && submission.results.trim().length > 0;
    const hasConclusion = submission.conclusion && submission.conclusion.trim().length > 0;

    if (!hasObservations && !hasResults && !hasConclusion) {
      errors.content = 'Please fill in at least observations, results, or conclusion before submitting';
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Update submission status
    await db
      .collection<Submission>('submissions')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'submitted',
            submittedAt: new Date(),
            updatedAt: new Date(),
          },
          $unset: {
            rejectionReason: '',
            reviewComments: '',
            reviewedBy: '',
            reviewedAt: '',
          },
        }
      );

    // Get session to find faculty
    const session = await db
      .collection('labSessions')
      .findOne({ _id: submission.labSessionId });

    if (session) {
      // Create notification for faculty
      await db.collection<Notification>('notifications').insertOne({
        userId: session.conductedBy,
        type: 'pending_review',
        title: 'New Submission for Review',
        message: 'A student has submitted lab work for your review.',
        relatedEntityId: id,
        relatedEntityType: 'submission',
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });
    }

    const updatedSubmission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    return successResponse(updatedSubmission);
  } catch (error) {
    console.error('Submit submission error:', error);
    return serverError('Failed to submit submission');
  }
}
