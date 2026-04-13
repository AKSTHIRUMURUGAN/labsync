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
    
    const submissions = await db
      .collection<Submission>('submissions')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $addFields: {
            studentName: {
              $concat: [
                { $arrayElemAt: ['$student.firstName', 0] },
                ' ',
                { $arrayElemAt: ['$student.lastName', 0] }
              ]
            }
          }
        },
        {
          $project: {
            student: 0
          }
        }
      ])
      .toArray();

    const submission = submissions[0];

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
    
    // If submission was rejected and is being edited, clear rejection fields
    const updateFields: any = {
      ...body,
      updatedAt: new Date(),
    };
    
    // Clear rejection fields when student edits after rejection
    if (submission.rejectionReason && body.status !== 'rejected') {
      updateFields.rejectionReason = '';
      updateFields.reviewComments = '';
      updateFields.reviewedBy = null;
      updateFields.reviewedAt = null;
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
            ...updateFields,
            editHistory,
            version: submission.version + 1,
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
