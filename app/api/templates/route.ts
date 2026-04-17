import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { ExperimentTemplate } from '@/lib/models/ExperimentTemplate';
import { User } from '@/lib/models/User';
import { successResponse, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['student', 'faculty_coordinator', 'lab_faculty', 'hod', 'principal']);
  
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

    if (departmentId) {
      query.departmentId = new ObjectId(departmentId);
    }

    if (active !== null) {
      query.active = active === 'true';
    }

    // Students should only see active templates
    if (authResult.role === 'student') {
      query.active = true;
    }

    const skip = (page - 1) * limit;
    const templates = await db
      .collection<ExperimentTemplate>('experimentTemplates')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection<ExperimentTemplate>('experimentTemplates').countDocuments(query);

    return successResponse(templates, { page, limit, total });
  } catch (error) {
    console.error('Get templates error:', error);
    return serverError('Failed to fetch templates');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['lab_faculty', 'faculty_coordinator', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { title, description, objectives, steps, observationTables, requiredFields, calculationRules, departmentId, sections } = body;

    const db = await getDatabase();
    let resolvedDepartmentId = departmentId;

    // Fallback: derive department from authenticated user's profile.
    if (!resolvedDepartmentId) {
      const user = await db
        .collection<User>('users')
        .findOne({ _id: new ObjectId(authResult.userId) }, { projection: { departmentId: 1 } });

      if (user?.departmentId) {
        resolvedDepartmentId = user.departmentId.toString();
      }
    }

    // Validation
    const errors: { [key: string]: string } = {};
    if (!title) errors.title = 'Title is required';
    if (!description) errors.description = 'Description is required';
    if (!objectives || objectives.length === 0) errors.objectives = 'At least one objective is required';
    if (!observationTables || observationTables.length === 0) errors.observationTables = 'At least one observation table is required';
    if (!resolvedDepartmentId) errors.departmentId = 'Department is not assigned to this account';

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const template: any = {
      version: '1.0.0',
      title,
      description,
      objectives,
      steps: steps || [],
      observationTables,
      requiredFields: requiredFields || [],
      calculationRules: calculationRules || [],
      sections: sections || [], // Save sections
      createdBy: new ObjectId(authResult.userId),
      departmentId: new ObjectId(resolvedDepartmentId),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('experimentTemplates').insertOne(template);
    template._id = result.insertedId;

    return successResponse(template);
  } catch (error) {
    console.error('Create template error:', error);
    return serverError('Failed to create template');
  }
}
