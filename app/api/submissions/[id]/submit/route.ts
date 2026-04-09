import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { Notification } from '@/lib/models/Notification';
import { successResponse, notFoundError, forbiddenError, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const db = await getDatabase();
    const submission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(params.id) });

    if (!submission) {
      return notFoundError('Submission not found');
    }

    // Check permissions
    if (submission.studentId.toString() !== authResult.userId) {
      return forbiddenError('Access denied');
    }

    // Validate required fields
    const errors: { [key: string]: string } = {};
    
    if (!submission.proofImages || submission.proofImages.length === 0) {
      errors.proofImages = 'At least one proof image is required';
    }

    if (!submission.observationData || submission.observationData.length === 0) {
      errors.observationData = 'Observation data is required';
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Update submission status
    await db
      .collection<Submission>('submissions')
      .updateOne(
        { _id: new ObjectId(params.id) },
        {
          $set: {
            status: 'submitted',
            submittedAt: new Date(),
            updatedAt: new Date(),
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
        relatedEntityId: params.id,
        relatedEntityType: 'submission',
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });
    }

    const updatedSubmission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(params.id) });

    return successResponse(updatedSubmission);
  } catch (error) {
    console.error('Submit submission error:', error);
    return serverError('Failed to submit submission');
  }
}
