import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { successResponse, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['faculty_coordinator', 'hod', 'principal']);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const db = await getDatabase();
    const query: any = {
      role: 'lab_faculty',
      active: true,
    };

    if (authResult.role !== 'principal') {
      if (!authResult.departmentId) {
        return validationError({ departmentId: 'User department is not assigned' });
      }
      query.departmentId = new ObjectId(authResult.departmentId);
    }

    const faculty = await db
      .collection<User>('users')
      .find(query, {
        projection: {
          passwordHash: 0,
        },
      })
      .sort({ firstName: 1, lastName: 1 })
      .toArray();

    if (faculty.length === 0) {
      return successResponse([]);
    }

    const facultyIds = faculty
      .filter((member) => member._id)
      .map((member) => member._id as ObjectId);

    const groups = await db
      .collection('labGroups')
      .find(
        {
          facultyId: { $in: facultyIds },
          active: { $ne: false },
        },
        {
          projection: {
            _id: 1,
            facultyId: 1,
            students: 1,
          },
        }
      )
      .toArray();

    const groupIds = groups.map((group: any) => group._id);

    const sessions = groupIds.length
      ? await db
          .collection('labSessions')
          .find(
            { labGroupId: { $in: groupIds } },
            {
              projection: {
                _id: 1,
                labGroupId: 1,
              },
            }
          )
          .toArray()
      : [];

    const sessionIds = sessions.map((session: any) => session._id);

    const submissions = sessionIds.length
      ? await db
          .collection('submissions')
          .find(
            { labSessionId: { $in: sessionIds } },
            {
              projection: {
                labSessionId: 1,
                status: 1,
              },
            }
          )
          .toArray()
      : [];

    const groupToFaculty = new Map<string, string>();
    const facultyAssignedGroups = new Map<string, number>();
    const facultyStudentCount = new Map<string, number>();

    groups.forEach((group: any) => {
      const groupId = group._id?.toString();
      const facultyId = group.facultyId?.toString();
      if (!groupId || !facultyId) return;

      groupToFaculty.set(groupId, facultyId);
      facultyAssignedGroups.set(facultyId, (facultyAssignedGroups.get(facultyId) || 0) + 1);
      facultyStudentCount.set(
        facultyId,
        (facultyStudentCount.get(facultyId) || 0) + (Array.isArray(group.students) ? group.students.length : 0)
      );
    });

    const sessionToFaculty = new Map<string, string>();
    sessions.forEach((session: any) => {
      const sessionId = session._id?.toString();
      const groupId = session.labGroupId?.toString();
      if (!sessionId || !groupId) return;

      const facultyId = groupToFaculty.get(groupId);
      if (facultyId) {
        sessionToFaculty.set(sessionId, facultyId);
      }
    });

    const facultySubmissionTotals = new Map<string, number>();
    const facultyPending = new Map<string, number>();
    const facultyAccepted = new Map<string, number>();
    const facultyRejected = new Map<string, number>();

    submissions.forEach((submission: any) => {
      const facultyId = sessionToFaculty.get(submission.labSessionId?.toString());
      if (!facultyId) return;

      facultySubmissionTotals.set(facultyId, (facultySubmissionTotals.get(facultyId) || 0) + 1);

      if (submission.status === 'submitted') {
        facultyPending.set(facultyId, (facultyPending.get(facultyId) || 0) + 1);
      } else if (submission.status === 'approved') {
        facultyAccepted.set(facultyId, (facultyAccepted.get(facultyId) || 0) + 1);
      } else if (submission.status === 'rejected') {
        facultyRejected.set(facultyId, (facultyRejected.get(facultyId) || 0) + 1);
      }
    });

    const enrichedFaculty = faculty.map((member: any) => {
      const facultyId = member._id?.toString() || '';
      return {
        _id: facultyId,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        employeeId: member.employeeId || '',
        assignedGroups: facultyAssignedGroups.get(facultyId) || 0,
        assignedStudents: facultyStudentCount.get(facultyId) || 0,
        totalSubmissions: facultySubmissionTotals.get(facultyId) || 0,
        pendingReviews: facultyPending.get(facultyId) || 0,
        acceptedSubmissions: facultyAccepted.get(facultyId) || 0,
        rejectedSubmissions: facultyRejected.get(facultyId) || 0,
      };
    });

    return successResponse(enrichedFaculty);
  } catch (error) {
    console.error('Get coordinator faculty error:', error);
    return serverError('Failed to fetch faculty');
  }
}
