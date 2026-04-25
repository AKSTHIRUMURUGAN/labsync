import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { LabGroup } from '@/lib/models/LabGroup';
import { successResponse, notFoundError, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(request, ['lab_faculty', 'faculty_coordinator', 'hod', 'principal']);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();
    const labGroup = await db.collection<LabGroup>('labGroups').aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'facultyId',
          foreignField: '_id',
          as: 'faculty',
        },
      },
      {
        $addFields: {
          faculty: { $arrayElemAt: ['$faculty', 0] },
          facultyName: {
            $cond: [
              { $ifNull: [{ $arrayElemAt: ['$faculty', 0] }, false] },
              {
                $concat: [
                  { $ifNull: [{ $arrayElemAt: ['$faculty.firstName', 0] }, ''] },
                  ' ',
                  { $ifNull: [{ $arrayElemAt: ['$faculty.lastName', 0] }, ''] },
                ],
              },
              null,
            ],
          },
          studentCount: { $size: { $ifNull: ['$students', []] } },
        },
      },
      { $project: { faculty: 0 } },
    ]).toArray();

    if (!labGroup[0]) {
      return notFoundError('Lab group not found');
    }

    return successResponse(labGroup[0]);
  } catch (error) {
    console.error('Get lab group error:', error);
    return notFoundError('Lab group not found');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(request, ['faculty_coordinator', 'hod', 'principal']);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, className, semester, academicYear, facultyId, students, experimentTemplates } = body;

    const errors: { [key: string]: string } = {};
    if (!name) errors.name = 'Name is required';
    if (!className) errors.className = 'Class name is required';
    if (!semester) errors.semester = 'Semester is required';
    if (!academicYear) errors.academicYear = 'Academic year is required';
    if (!facultyId) errors.facultyId = 'Faculty is required';

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const db = await getDatabase();
    const existing = await db.collection('labGroups').findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return validationError({ id: 'Lab group not found' });
    }

    if (authResult.role === 'faculty_coordinator') {
      if (!authResult.departmentId) {
        return validationError({ departmentId: 'Coordinator account has no department assigned' });
      }
      if (existing.departmentId?.toString() !== authResult.departmentId) {
        return validationError({ departmentId: 'Coordinator can edit groups only for their own department' });
      }
    }

    const updateResult = await db.collection('labGroups').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          className,
          semester,
          academicYear,
          facultyId: new ObjectId(facultyId),
          students: Array.isArray(students) ? students.map((studentId: string) => new ObjectId(studentId)) : [],
          experimentTemplates: Array.isArray(experimentTemplates) ? experimentTemplates.map((templateId: string) => new ObjectId(templateId)) : [],
          updatedAt: new Date(),
        },
      }
    );

    return successResponse({ updated: updateResult.modifiedCount > 0 });
  } catch (error) {
    console.error('Update lab group error:', error);
    return serverError('Failed to update lab group');
  }
}
