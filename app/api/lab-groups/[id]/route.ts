import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { LabGroup } from '@/lib/models/LabGroup';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['lab_faculty', 'faculty_coordinator', 'hod', 'principal', 'student']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();
    const labGroup = await db
      .collection<LabGroup>('labGroups')
      .findOne({ _id: new ObjectId(id) });

    if (!labGroup) {
      return notFoundError('Lab group not found');
    }

    return successResponse(labGroup);
  } catch (error) {
    console.error('Get lab group error:', error);
    return notFoundError('Lab group not found');
  }
}

export async function PUT(
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
    const db = await getDatabase();

    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    // Convert string IDs to ObjectIds
    if (body.students) {
      updateData.students = body.students.map((id: string) => new ObjectId(id));
    }
    if (body.experimentTemplates) {
      updateData.experimentTemplates = body.experimentTemplates.map((id: string) => new ObjectId(id));
    }
    if (body.departmentId) {
      updateData.departmentId = new ObjectId(body.departmentId);
    }

    await db
      .collection<LabGroup>('labGroups')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    const updatedLabGroup = await db
      .collection<LabGroup>('labGroups')
      .findOne({ _id: new ObjectId(id) });

    return successResponse(updatedLabGroup);
  } catch (error) {
    console.error('Update lab group error:', error);
    return serverError('Failed to update lab group');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();

    // Soft delete
    await db
      .collection<LabGroup>('labGroups')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { active: false, updatedAt: new Date() } }
      );

    return successResponse({ message: 'Lab group deleted successfully' });
  } catch (error) {
    console.error('Delete lab group error:', error);
    return serverError('Failed to delete lab group');
  }
}
