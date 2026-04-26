import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { LabSession } from '@/lib/models/LabSession';
import { successResponse, validationError, conflictError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

const MIN_SESSION_DURATION_MINUTES = 30;
const MAX_SESSION_DURATION_MINUTES = 480;

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['student', 'lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const labGroupId = searchParams.get('labGroupId');

    const db = await getDatabase();
    const query: any = {};

    if (authResult.role === 'student') {
      const enrolledGroups = await db
        .collection('labGroups')
        .find(
          { students: new ObjectId(authResult.userId), active: { $ne: false } },
          { projection: { _id: 1 } }
        )
        .toArray();

      const enrolledGroupIds = enrolledGroups.map((group: any) => group._id);
      if (enrolledGroupIds.length === 0) {
        return successResponse([], { page, limit, total: 0 });
      }
      query.labGroupId = { $in: enrolledGroupIds };
    }

    if (authResult.role === 'lab_faculty') {
      const facultyGroupQuery: any = {
        facultyId: new ObjectId(authResult.userId),
        active: { $ne: false },
      };

      if (authResult.departmentId) {
        facultyGroupQuery.departmentId = new ObjectId(authResult.departmentId);
      }

      const assignedGroups = await db
        .collection('labGroups')
        .find(facultyGroupQuery, { projection: { _id: 1 } })
        .toArray();

      const assignedGroupIds = assignedGroups.map((group: any) => group._id);
      if (assignedGroupIds.length === 0) {
        return successResponse([], { page, limit, total: 0 });
      }

      if (query.labGroupId?.$in) {
        const intersection = assignedGroupIds.filter((groupId: ObjectId) =>
          query.labGroupId.$in.some((candidate: ObjectId) => candidate.toString() === groupId.toString())
        );
        query.labGroupId = { $in: intersection };
      } else {
        query.labGroupId = { $in: assignedGroupIds };
      }
    }

    if (authResult.role === 'hod' && authResult.departmentId) {
      const departmentGroups = await db
        .collection('labGroups')
        .find(
          {
            departmentId: new ObjectId(authResult.departmentId),
            active: { $ne: false },
          },
          { projection: { _id: 1 } }
        )
        .toArray();

      const departmentGroupIds = departmentGroups.map((group: any) => group._id);
      if (departmentGroupIds.length === 0) {
        return successResponse([], { page, limit, total: 0 });
      }

      if (query.labGroupId?.$in) {
        const intersection = departmentGroupIds.filter((groupId: ObjectId) =>
          query.labGroupId.$in.some((candidate: ObjectId) => candidate.toString() === groupId.toString())
        );
        query.labGroupId = { $in: intersection };
      } else {
        query.labGroupId = { $in: departmentGroupIds };
      }
    }

    if (status) {
      query.status = status;
    }

    if (labGroupId) {
      const requestedGroupId = new ObjectId(labGroupId);
      if (query.labGroupId?.$in) {
        const allowed = query.labGroupId.$in.some((groupId: ObjectId) => groupId.toString() === requestedGroupId.toString());
        if (!allowed) {
          return successResponse([], { page, limit, total: 0 });
        }
      }
      query.labGroupId = requestedGroupId;
    }

    const skip = (page - 1) * limit;
    const sessions = await db
      .collection<LabSession>('labSessions')
      .aggregate([
        { $match: query },
        { $sort: { startTime: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'labGroups',
            localField: 'labGroupId',
            foreignField: '_id',
            as: 'labGroup',
          },
        },
        {
          $lookup: {
            from: 'experimentTemplates',
            localField: 'experimentTemplateId',
            foreignField: '_id',
            as: 'template',
          },
        },
        {
          $addFields: {
            groupName: { $arrayElemAt: ['$labGroup.name', 0] },
            className: { $arrayElemAt: ['$labGroup.className', 0] },
            semester: { $arrayElemAt: ['$labGroup.semester', 0] },
            academicYear: { $arrayElemAt: ['$labGroup.academicYear', 0] },
            templateTitle: { $arrayElemAt: ['$template.title', 0] },
          },
        },
        { $project: { labGroup: 0, template: 0 } },
      ])
      .toArray();

    const total = await db.collection<LabSession>('labSessions').countDocuments(query);

    return successResponse(sessions, { page, limit, total });
  } catch (error) {
    console.error('Get sessions error:', error);
    return serverError('Failed to fetch sessions');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { labGroupId, experimentTemplateId, duration, location, equipment } = body;
    const numericDuration = Number(duration);

    // Validation
    const errors: { [key: string]: string } = {};
    if (!labGroupId) errors.labGroupId = 'Lab group ID is required';
    if (!experimentTemplateId) errors.experimentTemplateId = 'Experiment template ID is required';
    if (!Number.isFinite(numericDuration)) {
      errors.duration = 'Duration must be a valid number';
    } else if (numericDuration < MIN_SESSION_DURATION_MINUTES || numericDuration > MAX_SESSION_DURATION_MINUTES) {
      errors.duration = `Duration must be between ${MIN_SESSION_DURATION_MINUTES} and ${MAX_SESSION_DURATION_MINUTES} minutes`;
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const db = await getDatabase();

    if (authResult.role === 'lab_faculty') {
      const labGroup = await db.collection('labGroups').findOne({
        _id: new ObjectId(labGroupId),
        facultyId: new ObjectId(authResult.userId),
      });

      if (!labGroup) {
        return validationError({ labGroupId: 'No active lab group assignment found for this faculty' });
      }
    }

    // Check for existing active session
    const existingSession = await db
      .collection<LabSession>('labSessions')
      .findOne({
        labGroupId: new ObjectId(labGroupId),
        experimentTemplateId: new ObjectId(experimentTemplateId),
        status: 'active',
      });

    if (existingSession) {
      return conflictError('An active session already exists for this lab group and experiment');
    }

    // Get template version
    const template = await db
      .collection('experimentTemplates')
      .findOne({ _id: new ObjectId(experimentTemplateId) });

    if (!template) {
      return validationError({ experimentTemplateId: 'Template not found' });
    }

    const session: LabSession = {
      labGroupId: new ObjectId(labGroupId),
      experimentTemplateId: new ObjectId(experimentTemplateId),
      templateVersion: template.version,
      conductedBy: new ObjectId(authResult.userId),
      status: 'created',
      startTime: new Date(),
      duration: numericDuration,
      location,
      equipment: equipment ? equipment.map((id: string) => new ObjectId(id)) : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<LabSession>('labSessions').insertOne(session);
    session._id = result.insertedId;

    return successResponse(session);
  } catch (error) {
    console.error('Create session error:', error);
    return serverError('Failed to create session');
  }
}
