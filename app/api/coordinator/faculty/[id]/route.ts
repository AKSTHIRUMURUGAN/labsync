import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { successResponse, validationError, notFoundError, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(request, ['faculty_coordinator', 'hod', 'principal']);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return validationError({ id: 'Invalid faculty ID' });
    }

    const db = await getDatabase();
    const facultyObjectId = new ObjectId(id);

    const facultyQuery: any = {
      _id: facultyObjectId,
      role: 'lab_faculty',
      active: true,
    };

    if (authResult.role !== 'principal') {
      if (!authResult.departmentId) {
        return validationError({ departmentId: 'User department is not assigned' });
      }
      facultyQuery.departmentId = new ObjectId(authResult.departmentId);
    }

    const faculty = await db.collection('users').findOne(facultyQuery, {
      projection: {
        passwordHash: 0,
      },
    });

    if (!faculty) {
      return notFoundError('Faculty not found');
    }

    const groups = await db
      .collection('labGroups')
      .find(
        {
          facultyId: facultyObjectId,
          active: { $ne: false },
        },
        {
          projection: {
            _id: 1,
            name: 1,
            className: 1,
            semester: 1,
            academicYear: 1,
            students: 1,
          },
        }
      )
      .sort({ name: 1 })
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
                status: 1,
                createdAt: 1,
                startTime: 1,
              },
            }
          )
          .sort({ createdAt: -1 })
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
                _id: 1,
                labSessionId: 1,
                status: 1,
                createdAt: 1,
                experimentTitle: 1,
              },
            }
          )
          .sort({ createdAt: -1 })
          .toArray()
      : [];

    const sessionToGroup = new Map<string, string>();
    sessions.forEach((session: any) => {
      sessionToGroup.set(session._id.toString(), session.labGroupId.toString());
    });

    let pendingReviews = 0;
    let acceptedSubmissions = 0;
    let rejectedSubmissions = 0;

    submissions.forEach((submission: any) => {
      if (submission.status === 'submitted') pendingReviews += 1;
      if (submission.status === 'approved') acceptedSubmissions += 1;
      if (submission.status === 'rejected') rejectedSubmissions += 1;
    });

    const groupSummaries = groups.map((group: any) => {
      const groupId = group._id.toString();
      const groupSessionIds = sessions
        .filter((session: any) => session.labGroupId.toString() === groupId)
        .map((session: any) => session._id.toString());

      const groupSubmissions = submissions.filter((submission: any) =>
        groupSessionIds.includes(submission.labSessionId.toString())
      );

      const groupPending = groupSubmissions.filter((submission: any) => submission.status === 'submitted').length;
      const groupApproved = groupSubmissions.filter((submission: any) => submission.status === 'approved').length;
      const groupRejected = groupSubmissions.filter((submission: any) => submission.status === 'rejected').length;

      return {
        _id: groupId,
        name: group.name || 'Unnamed Group',
        className: group.className || '',
        semester: group.semester || '',
        academicYear: group.academicYear || '',
        studentCount: Array.isArray(group.students) ? group.students.length : 0,
        sessionCount: groupSessionIds.length,
        submissionCount: groupSubmissions.length,
        pendingReviews: groupPending,
        acceptedSubmissions: groupApproved,
        rejectedSubmissions: groupRejected,
      };
    });

    const recentSubmissions = submissions.slice(0, 10).map((submission: any) => ({
      _id: submission._id.toString(),
      experimentTitle: submission.experimentTitle || 'Untitled Experiment',
      status: submission.status || 'in_progress',
      labGroupId: sessionToGroup.get(submission.labSessionId.toString()) || null,
      createdAt: submission.createdAt,
    }));

    return successResponse({
      faculty: {
        _id: faculty._id?.toString() || id,
        firstName: faculty.firstName || '',
        lastName: faculty.lastName || '',
        email: faculty.email || '',
        employeeId: faculty.employeeId || '',
      },
      summary: {
        assignedGroups: groups.length,
        assignedStudents: groups.reduce((sum: number, group: any) => sum + (Array.isArray(group.students) ? group.students.length : 0), 0),
        totalSessions: sessions.length,
        totalSubmissions: submissions.length,
        pendingReviews,
        acceptedSubmissions,
        rejectedSubmissions,
      },
      groups: groupSummaries,
      recentSubmissions,
    });
  } catch (error) {
    console.error('Get coordinator faculty detail error:', error);
    return serverError('Failed to fetch faculty detail');
  }
}
