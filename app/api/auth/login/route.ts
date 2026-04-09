import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { verifyPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse, validationError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return validationError({
        email: !email ? 'Email is required' : '',
        password: !password ? 'Password is required' : '',
      });
    }

    // Find user
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ email: email.toLowerCase() });

    if (!user || !user.active) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Generate token
    const token = await generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId.toString(),
      departmentId: user.departmentId?.toString(),
    });

    // Update last login
    await db.collection<User>('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Create response with cookie
    const response = successResponse({
      user: {
        id: user._id!.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('SERVER_ERROR', 'An error occurred during login', 500);
  }
}
