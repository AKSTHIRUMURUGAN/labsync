import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import { successResponse, errorResponse, validationError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, email, displayName, photoURL, uid, firstName, lastName, role } = body;

    if (!idToken || !email) {
      return validationError({ 
        idToken: !idToken ? 'Firebase ID token is required' : '',
        email: !email ? 'Email is required' : ''
      });
    }

    // Note: In production, verify Firebase token with Firebase Admin SDK
    // For now, we trust the token from Firebase client SDK

    const db = await getDatabase();

    // Check if user exists
    let user = await db.collection<User>('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user from Google/Firebase auth
      const nameParts = displayName?.split(' ') || ['', ''];
      
      const newUser: User = {
        email: email.toLowerCase(),
        passwordHash: '', // No password for Google sign-in users
        role: role || 'student',
        firstName: firstName || nameParts[0] || 'User',
        lastName: lastName || nameParts.slice(1).join(' ') || '',
        institutionId: new ObjectId('507f1f77bcf86cd799439011'), // Default institution
        googleId: uid,
        profilePicture: photoURL,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection<User>('users').insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // Update Google ID and profile picture if not set
      const updates: any = { lastLogin: new Date() };
      if (!user.googleId) {
        updates.googleId = uid;
      }
      if (photoURL && !user.profilePicture) {
        updates.profilePicture = photoURL;
      }
      
      await db.collection<User>('users').updateOne(
        { _id: user._id },
        { $set: updates }
      );
      
      user = { ...user, ...updates };
    }

    // At this point, user is guaranteed to be non-null
    if (!user) {
      return errorResponse('SERVER_ERROR', 'Failed to create or retrieve user', 500);
    }

    // Generate token
    const token = await generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId.toString(),
      departmentId: user.departmentId?.toString(),
    });

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
      isNewUser: !user.lastLogin,
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
    console.error('Google/Firebase auth error:', error);
    return errorResponse('SERVER_ERROR', 'An error occurred during authentication', 500);
  }
}
