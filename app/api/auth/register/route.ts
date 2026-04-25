import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { hashPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse, validationError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role, institutionId, departmentId, enrollmentNumber, employeeId } = body;

    // Validation
    const errors: { [key: string]: string } = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (password && password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';
    if (!role) errors.role = 'Role is required';
    if (!institutionId) errors.institutionId = 'Institution ID is required';
    if (role && role !== 'principal' && !departmentId) {
      errors.departmentId = 'Department is required';
    }
    if (departmentId && !ObjectId.isValid(departmentId)) {
      errors.departmentId = 'Invalid department ID';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const db = await getDatabase();

    // Governance guard: student/lab faculty onboarding is allowed only after
    // department has at least one active coordinator and one active HOD.
    if (role !== 'principal' && departmentId && ['student', 'lab_faculty'].includes(role)) {
      const departmentObjectId = new ObjectId(departmentId);

      const [coordinatorCount, hodCount] = await Promise.all([
        db.collection<User>('users').countDocuments({
          departmentId: departmentObjectId,
          role: 'faculty_coordinator',
          active: true,
        }),
        db.collection<User>('users').countDocuments({
          departmentId: departmentObjectId,
          role: 'hod',
          active: true,
        }),
      ]);

      if (coordinatorCount === 0 || hodCount === 0) {
        return validationError({
          departmentId:
            'Department governance is incomplete. Add at least one coordinator and one HOD before onboarding students or lab faculty.',
        });
      }
    }

    // Check if user already exists
    const existingUser = await db.collection<User>('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse('USER_EXISTS', 'User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user: User = {
      email: email.toLowerCase(),
      passwordHash,
      role,
      firstName,
      lastName,
      institutionId: new ObjectId(institutionId),
      departmentId: departmentId ? new ObjectId(departmentId) : undefined,
      enrollmentNumber,
      employeeId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<User>('users').insertOne(user);
    user._id = result.insertedId;

    // Generate token
    const token = await generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId.toString(),
      departmentId: user.departmentId?.toString(),
    });

    // Create response with cookie
    const response = successResponse({
      user: {
        id: user._id.toString(),
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
    console.error('Register error:', error);
    return errorResponse('SERVER_ERROR', 'An error occurred during registration', 500);
  }
}
