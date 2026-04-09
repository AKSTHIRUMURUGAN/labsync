import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Notification } from '@/lib/models/Notification';
import { successResponse, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const db = await getDatabase();
    const query: any = { userId: new ObjectId(authResult.userId) };

    if (unreadOnly) {
      query.read = false;
    }

    const skip = (page - 1) * limit;
    const notifications = await db
      .collection<Notification>('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection<Notification>('notifications').countDocuments(query);
    const unreadCount = await db
      .collection<Notification>('notifications')
      .countDocuments({ userId: new ObjectId(authResult.userId), read: false });

    return successResponse(
      { notifications, unreadCount },
      { page, limit, total }
    );
  } catch (error) {
    console.error('Get notifications error:', error);
    return serverError('Failed to fetch notifications');
  }
}
