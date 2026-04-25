import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { LabGroup } from '@/lib/models/LabGroup';
import { successResponse, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['lab_faculty', 'faculty_coordinator', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const departmentId = searchParams.get('departmentId');
    const active = searchParams.get('active');

    const db = await getDatabase();
    const query: any = {};

    if (authResult.role !== 'principal' && authResult.departmentId) {
      query.departmentId = new ObjectId(authResult.departmentId);
    }

    if (departmentId) {
      query.departmentId = new ObjectId(departmentId);
    }

    if (active !== null) {
      query.active = active === 'true';
    }

    const skip = (page - 1) * limit;
    const labGroups = await db
      .collection<LabGroup>('labGroups')
      .aggregate([
        { $match: query },
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
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { faculty: 0 } },
      ])
      .toArray();

    const total = await db.collection<LabGroup>('labGroups').countDocuments(query);

    return successResponse(labGroups, { page, limit, total });
  } catch (error) {
    console.error('Get lab groups error:', error);
    return serverError('Failed to fetch lab groups');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['lab_faculty', 'faculty_coordinator', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { name, className, semester, academicYear, departmentId, facultyId, students, experimentTemplates } = body;

    let resolvedDepartmentId = departmentId;
    if (!resolvedDepartmentId && authResult.departmentId) {
      resolvedDepartmentId = authResult.departmentId;
    }

    if (authResult.role === 'faculty_coordinator') {
      if (!authResult.departmentId) {
        return validationError({ departmentId: 'Coordinator account has no department assigned' });
      }
      if (resolvedDepartmentId && resolvedDepartmentId !== authResult.departmentId) {
        return validationError({ departmentId: 'Coordinator can create groups only for their own department' });
      }
      resolvedDepartmentId = authResult.departmentId;
    }

    // Validation
    const errors: { [key: string]: string } = {};
    if (!name) errors.name = 'Name is required';
    if (!className) errors.className = 'Class name is required';
    if (!semester) errors.semester = 'Semester is required';
    if (!academicYear) errors.academicYear = 'Academic year is required';
    if (!resolvedDepartmentId) errors.departmentId = 'Department ID is required';
    if (!facultyId) errors.facultyId = 'Faculty is required';

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const db = await getDatabase();
    const labGroup: LabGroup = {
      name,
      className,
      semester,
      academicYear,
      departmentId: new ObjectId(resolvedDepartmentId),
      facultyId: new ObjectId(facultyId),
      students: students ? students.map((id: string) => new ObjectId(id)) : [],
      experimentTemplates: experimentTemplates ? experimentTemplates.map((id: string) => new ObjectId(id)) : [],
      createdBy: new ObjectId(authResult.userId),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<LabGroup>('labGroups').insertOne(labGroup);
    labGroup._id = result.insertedId;

    return successResponse(labGroup);
  } catch (error) {
    console.error('Create lab group error:', error);
    return serverError('Failed to create lab group');
  }
}
