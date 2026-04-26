import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { LabSession } from '@/lib/models/LabSession';
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
    const { comments } = body;

    if (!comments || !comments.trim()) {
      return validationError({ comments: 'Please provide guidance for the student on what to redo' });
    }

    const db = await getDatabase();
    const submission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    if (!submission) {
      return notFoundError('Submission not found');
    }

    const session = await db.collection<LabSession>('labSessions').findOne({ _id: submission.labSessionId });
    const labGroup = session
      ? await db.collection('labGroups').findOne({ _id: session.labGroupId })
      : null;

    if (authResult.role === 'lab_faculty') {
      if (!authResult.departmentId || !labGroup) {
        return notFoundError('Submission not found');
      }

      const sameDepartment = labGroup.departmentId?.toString() === authResult.departmentId;
      const assignedFaculty = labGroup.facultyId?.toString() === authResult.userId;

      if (!sameDepartment || !assignedFaculty) {
        return notFoundError('Submission not found');
      }
    }

    if (authResult.role === 'faculty_coordinator' || authResult.role === 'hod') {
      if (!authResult.departmentId || !labGroup || labGroup.departmentId?.toString() !== authResult.departmentId) {
        return notFoundError('Submission not found');
      }
    }

    // Set status back to in_progress so student can edit and resubmit
    // Keep all existing sectionData / observationData intact — student can see and edit their work
    await db.collection<Submission>('submissions').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'in_progress',
          reviewedBy: new ObjectId(authResult.userId),
          reviewedAt: new Date(),
          reviewComments: comments.trim(),
          // Mark as redo so the student UI can show the right message
          rejectionReason: `REDO_REQUESTED: ${comments.trim()}`,
          updatedAt: new Date(),
        },
      }
    );

    // Notify the student
    await db.collection<Notification>('notifications').insertOne({
      userId: submission.studentId,
      type: 'submission_rejected', // reuse existing type — student gets notified
      title: 'Redo Requested',
      message: `Your faculty has asked you to redo your submission. Guidance: ${comments.trim()}`,
      relatedEntityId: id,
      relatedEntityType: 'submission',
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    const updated = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    return successResponse(updated);
  } catch (error) {
    console.error('Redo submission error:', error);
    return serverError('Failed to request redo');
  }
}
