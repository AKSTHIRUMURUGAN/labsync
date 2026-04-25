import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { successResponse, validationError, serverError } from '@/lib/api-response';

type RangeKey = 'week' | 'month' | 'semester' | 'year';

function getRangeStart(range: RangeKey): Date {
  const now = new Date();
  const start = new Date(now);

  switch (range) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'semester':
      start.setMonth(now.getMonth() - 6);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
      break;
  }

  return start;
}

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['faculty_coordinator', 'hod', 'principal']);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'month') as RangeKey;
    const allowedRanges: RangeKey[] = ['week', 'month', 'semester', 'year'];
    const normalizedRange: RangeKey = allowedRanges.includes(range) ? range : 'month';
    const startDate = getRangeStart(normalizedRange);

    const db = await getDatabase();
    const departmentFilter =
      authResult.role !== 'principal'
        ? authResult.departmentId
          ? { departmentId: new ObjectId(authResult.departmentId) }
          : null
        : {};

    if (departmentFilter === null) {
      return validationError({ departmentId: 'User department is not assigned' });
    }

    const facultyQuery: any = {
      role: 'lab_faculty',
      active: true,
      ...(departmentFilter || {}),
    };

    const studentQuery: any = {
      role: 'student',
      active: true,
      ...(departmentFilter || {}),
    };

    const groupQuery: any = {
      ...(departmentFilter || {}),
      active: { $ne: false },
    };

    const [faculty, totalStudents, groups] = await Promise.all([
      db
        .collection('users')
        .find(facultyQuery, {
          projection: {
            firstName: 1,
            lastName: 1,
            email: 1,
            employeeId: 1,
          },
        })
        .sort({ firstName: 1, lastName: 1 })
        .toArray(),
      db.collection('users').countDocuments(studentQuery),
      db
        .collection('labGroups')
        .aggregate([
          { $match: groupQuery },
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
              facultyName: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: [{ $arrayElemAt: ['$faculty.firstName', 0] }, ''] },
                      ' ',
                      { $ifNull: [{ $arrayElemAt: ['$faculty.lastName', 0] }, ''] },
                    ],
                  },
                },
              },
              studentCount: { $size: { $ifNull: ['$students', []] } },
            },
          },
          {
            $project: {
              name: 1,
              className: 1,
              semester: 1,
              academicYear: 1,
              facultyId: 1,
              facultyName: 1,
              studentCount: 1,
            },
          },
        ])
        .toArray(),
    ]);

    const groupIds = groups.map((group: any) => group._id);

    const sessions = groupIds.length
      ? await db
          .collection('labSessions')
          .find(
            {
              labGroupId: { $in: groupIds },
              createdAt: { $gte: startDate },
            },
            { projection: { labGroupId: 1, conductedBy: 1, status: 1 } }
          )
          .toArray()
      : [];

    const sessionIds = sessions.map((session: any) => session._id);

    const submissions = sessionIds.length
      ? await db
          .collection('submissions')
          .find(
            {
              labSessionId: { $in: sessionIds },
              createdAt: { $gte: startDate },
            },
            { projection: { labSessionId: 1, status: 1 } }
          )
          .toArray()
      : [];

    const sessionToGroupMap = new Map<string, string>();
    sessions.forEach((session: any) => {
      sessionToGroupMap.set(session._id.toString(), session.labGroupId.toString());
    });

    const sessionsByGroup = new Map<string, number>();
    sessions.forEach((session: any) => {
      const key = session.labGroupId.toString();
      sessionsByGroup.set(key, (sessionsByGroup.get(key) || 0) + 1);
    });

    const activeSessions = sessions.filter((session: any) => session.status === 'active').length;

    const submissionsByGroup = new Map<string, number>();
    const pendingByGroup = new Map<string, number>();

    let approvedCount = 0;
    let rejectedCount = 0;
    let submittedCount = 0;

    submissions.forEach((submission: any) => {
      const groupId = sessionToGroupMap.get(submission.labSessionId.toString());
      if (!groupId) return;

      submissionsByGroup.set(groupId, (submissionsByGroup.get(groupId) || 0) + 1);

      if (submission.status === 'submitted') {
        submittedCount += 1;
        pendingByGroup.set(groupId, (pendingByGroup.get(groupId) || 0) + 1);
      } else if (submission.status === 'approved') {
        approvedCount += 1;
      } else if (submission.status === 'rejected') {
        rejectedCount += 1;
      }
    });

    const groupsByFaculty = new Map<string, string[]>();
    groups.forEach((group: any) => {
      if (!group.facultyId) return;
      const facultyId = group.facultyId.toString();
      const current = groupsByFaculty.get(facultyId) || [];
      current.push(group._id.toString());
      groupsByFaculty.set(facultyId, current);
    });

    const facultyPerformance = faculty.map((member: any) => {
      const facultyId = member._id.toString();
      const ownedGroupIds = groupsByFaculty.get(facultyId) || [];

      let facultyPending = 0;
      let facultySessions = 0;
      let facultySubmissions = 0;

      ownedGroupIds.forEach((groupId) => {
        facultyPending += pendingByGroup.get(groupId) || 0;
        facultySessions += sessionsByGroup.get(groupId) || 0;
        facultySubmissions += submissionsByGroup.get(groupId) || 0;
      });

      return {
        _id: facultyId,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        employeeId: member.employeeId || '',
        assignedGroups: ownedGroupIds.length,
        sessionsInRange: facultySessions,
        submissionsInRange: facultySubmissions,
        pendingReviews: facultyPending,
      };
    });

    const groupActivity = groups.map((group: any) => {
      const groupId = group._id.toString();
      const totalGroupSubmissions = submissionsByGroup.get(groupId) || 0;
      const groupPending = pendingByGroup.get(groupId) || 0;
      const groupApproved = submissions
        .filter((submission: any) => {
          const parentGroupId = sessionToGroupMap.get(submission.labSessionId.toString());
          return parentGroupId === groupId && submission.status === 'approved';
        })
        .length;

      return {
        _id: groupId,
        name: group.name || 'Unnamed Group',
        className: group.className || '',
        semester: group.semester || '',
        academicYear: group.academicYear || '',
        facultyName: group.facultyName || 'Not assigned',
        studentCount: group.studentCount || 0,
        sessionsInRange: sessionsByGroup.get(groupId) || 0,
        submissionsInRange: totalGroupSubmissions,
        pendingReviews: groupPending,
        approvalRate:
          totalGroupSubmissions > 0 ? Math.round((groupApproved / totalGroupSubmissions) * 100) : 0,
      };
    });

    const totalGroups = groups.length;
    const totalFaculty = faculty.length;
    const groupsWithFaculty = groups.filter((group: any) => !!group.facultyId).length;
    const approvalBase = approvedCount + rejectedCount + submittedCount;
    const approvalRate = approvalBase > 0 ? Math.round((approvedCount / approvalBase) * 100) : 0;

    return successResponse({
      range: normalizedRange,
      generatedAt: new Date().toISOString(),
      summary: {
        totalFaculty,
        totalStudents,
        totalGroups,
        groupsWithFaculty,
        groupsWithoutFaculty: Math.max(totalGroups - groupsWithFaculty, 0),
        totalSessions: sessions.length,
        activeSessions,
        totalSubmissions: submissions.length,
        pendingReviews: submittedCount,
        approvedSubmissions: approvedCount,
        rejectedSubmissions: rejectedCount,
        approvalRate,
      },
      statusBreakdown: {
        submitted: submittedCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      facultyPerformance,
      groupActivity,
    });
  } catch (error) {
    console.error('Get coordinator reports error:', error);
    return serverError('Failed to fetch coordinator reports');
  }
}
