import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { generateToken } from '@/lib/auth';
import { successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    // Generate new token
    const token = await generateToken({
      userId: authResult.userId,
      email: authResult.email,
      role: authResult.role,
      institutionId: authResult.institutionId,
      departmentId: authResult.departmentId,
    });

    // Create response with new cookie
    const response = successResponse({ token });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return successResponse({ message: 'Token refresh failed' });
  }
}
