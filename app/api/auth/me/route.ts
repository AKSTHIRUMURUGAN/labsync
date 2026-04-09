import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { successResponse, notFoundError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne(
      { _id: new ObjectId(authResult.userId) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return notFoundError('User not found');
    }

    return successResponse({
      id: user._id!.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      institutionId: user.institutionId.toString(),
      departmentId: user.departmentId?.toString(),
      enrollmentNumber: user.enrollmentNumber,
      employeeId: user.employeeId,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return notFoundError('User not found');
  }
}
