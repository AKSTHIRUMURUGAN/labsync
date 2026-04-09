import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { LabGroup } from '@/lib/models/LabGroup';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; studentId: string } }
) {
  const authResult = await requireRole(request, ['lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const db = await getDatabase();
    const labGroup = await db
      .collection<LabGroup>('labGroups')
      .findOne({ _id: new ObjectId(params.id) });

    if (!labGroup) {
      return notFoundError('Lab group not found');
    }

    await db
      .collection<LabGroup>('labGroups')
      .updateOne(
        { _id: new ObjectId(params.id) },
        {
          $pull: { students: new ObjectId(params.studentId) },
          $set: { updatedAt: new Date() },
        }
      );

    const updatedLabGroup = await db
      .collection<LabGroup>('labGroups')
      .findOne({ _id: new ObjectId(params.id) });

    return successResponse(updatedLabGroup);
  } catch (error) {
    console.error('Remove student error:', error);
    return serverError('Failed to remove student');
  }
}
