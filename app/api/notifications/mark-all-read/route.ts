import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Notification } from '@/lib/models/Notification';
import { successResponse, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const db = await getDatabase();
    
    const result = await db
      .collection<Notification>('notifications')
      .updateMany(
        { userId: new ObjectId(authResult.userId), read: false },
        { $set: { read: true } }
      );

    return successResponse({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return serverError('Failed to mark all notifications as read');
  }
}
