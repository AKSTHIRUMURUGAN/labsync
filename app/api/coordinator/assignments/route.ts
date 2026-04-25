import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { FacultyAssignment } from '@/lib/models/FacultyAssignment';
import { successResponse, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['faculty_coordinator', 'hod', 'principal']);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const db = await getDatabase();
    const query: any = { active: true };

    if (authResult.role !== 'principal') {
      if (!authResult.departmentId) {
        return validationError({ departmentId: 'User department is not assigned' });
      }
      query.departmentId = new ObjectId(authResult.departmentId);
    }

    const assignments = await db
      .collection<FacultyAssignment>('facultyAssignments')
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
          $lookup: {
            from: 'labGroups',
            localField: 'labGroupId',
            foreignField: '_id',
            as: 'labGroup',
          },
        },
        {
          $addFields: {
            faculty: { $arrayElemAt: ['$faculty', 0] },
            labGroup: { $arrayElemAt: ['$labGroup', 0] },
          },
        },
        {
          $project: {
            'faculty.passwordHash': 0,
          },
        },
      ])
      .toArray();

    return successResponse(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    return serverError('Failed to fetch assignments');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['faculty_coordinator', 'hod', 'principal']);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { departmentId, labGroupId, facultyId, studentIds, studentSource, externalSyncId } = body;

    const errors: { [key: string]: string } = {};
    if (!labGroupId) errors.labGroupId = 'Lab group is required';
    if (!facultyId) errors.facultyId = 'Faculty is required';
    if (!studentSource) errors.studentSource = 'Student source is required';

    const resolvedDepartmentId = authResult.role === 'principal'
      ? departmentId
      : authResult.departmentId;

    if (!resolvedDepartmentId) {
      errors.departmentId = 'Department is required';
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const db = await getDatabase();

    const labGroup = await db.collection('labGroups').findOne({
      _id: new ObjectId(labGroupId),
      ...(authResult.role !== 'principal' ? { departmentId: new ObjectId(resolvedDepartmentId) } : {}),
    });

    if (!labGroup) {
      return validationError({ labGroupId: 'Lab group not found' });
    }

    const subjectName = labGroup.subject || labGroup.name || 'Lab Group';
    const labName = labGroup.labName || labGroup.name || 'Lab';
    const semester = labGroup.semester || 'Unknown';
    const className = labGroup.className || 'Unknown';
    const resolvedStudentIds = Array.isArray(studentIds) && studentIds.length > 0
      ? studentIds
      : Array.isArray(labGroup.students)
        ? labGroup.students.map((id: any) => id.toString())
        : [];

    if (studentSource === 'manual' && resolvedStudentIds.length === 0) {
      return validationError({ studentIds: 'Select at least one student for manual assignment' });
    }

    const assignment: FacultyAssignment = {
      departmentId: new ObjectId(resolvedDepartmentId),
      labGroupId: new ObjectId(labGroupId),
      facultyId: new ObjectId(facultyId),
      studentIds: resolvedStudentIds.map((id: string) => new ObjectId(id)),
      studentSource,
      externalSyncId: externalSyncId || undefined,
      subjectName: String(subjectName),
      labName: String(labName),
      semester: String(semester),
      className: String(className),
      active: true,
      createdBy: new ObjectId(authResult.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<FacultyAssignment>('facultyAssignments').insertOne(assignment);
    assignment._id = result.insertedId;

    return successResponse(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    return serverError('Failed to create assignment');
  }
}
