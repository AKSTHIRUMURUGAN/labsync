import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload, hasPermission } from '../auth';
import { UserRole } from '../models/User';
import { unauthorizedError, forbiddenError } from '../api-response';

export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  const payload = await verifyToken(token);
  return payload;
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload | Response> {
  const payload = await authenticateRequest(request);
  
  if (!payload) {
    return unauthorizedError('Authentication required');
  }
  
  return payload;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<JWTPayload | Response> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  if (!hasPermission(authResult.role, allowedRoles)) {
    return forbiddenError('Insufficient permissions');
  }
  
  return authResult;
}
