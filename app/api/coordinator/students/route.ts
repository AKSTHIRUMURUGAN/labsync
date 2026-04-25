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
      role: 'student',
      active: true,
    };

    if (authResult.role !== 'principal') {
      if (!authResult.departmentId) {
        return validationError({ departmentId: 'User department is not assigned' });
      }
      query.departmentId = new ObjectId(authResult.departmentId);
    }

    const students = await db
      .collection<User>('users')
      .find(query, {
        projection: {
          passwordHash: 0,
        },
      })
      .sort({ firstName: 1, lastName: 1 })
      .toArray();

    return successResponse(students);
  } catch (error) {
    console.error('Get coordinator students error:', error);
    return serverError('Failed to fetch students');
  }
}
