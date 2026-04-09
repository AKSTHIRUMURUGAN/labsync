import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { LabSession } from '@/lib/models/LabSession';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();
    const session = await db
      .collection<LabSession>('labSessions')
      .findOne({ _id: new ObjectId(id) });

    if (!session) {
      return notFoundError('Session not found');
    }

    return successResponse(session);
  } catch (error) {
    console.error('Get session error:', error);
    return notFoundError('Session not found');
  }
}
