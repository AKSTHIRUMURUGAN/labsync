import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { LabGroup } from '@/lib/models/LabGroup';
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
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return validationError({ studentIds: 'Student IDs array is required' });
    }

    const db = await getDatabase();
    const labGroup = await db
      .collection<LabGroup>('labGroups')
      .findOne({ _id: new ObjectId(id) });

    if (!labGroup) {
      return notFoundError('Lab group not found');
    }

    // Add students (avoid duplicates)
    const existingStudentIds = labGroup.students.map(id => id.toString());
    const newStudentIds = studentIds
      .filter((id: string) => !existingStudentIds.includes(id))
      .map((id: string) => new ObjectId(id));

    await db
      .collection<LabGroup>('labGroups')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $push: { students: { $each: newStudentIds } },
          $set: { updatedAt: new Date() },
        }
      );

    const updatedLabGroup = await db
      .collection<LabGroup>('labGroups')
      .findOne({ _id: new ObjectId(id) });

    return successResponse(updatedLabGroup);
  } catch (error) {
    console.error('Add students error:', error);
    return serverError('Failed to add students');
  }
}
