import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Notification } from '@/lib/models/Notification';
import { successResponse, notFoundError, forbiddenError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();
    const notification = await db
      .collection<Notification>('notifications')
      .findOne({ _id: new ObjectId(id) });

    if (!notification) {
      return notFoundError('Notification not found');
    }

    if (notification.userId.toString() !== authResult.userId) {
      return forbiddenError('Access denied');
    }

    await db
      .collection<Notification>('notifications')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { read: true } }
      );

    const updatedNotification = await db
      .collection<Notification>('notifications')
      .findOne({ _id: new ObjectId(id) });

    return successResponse(updatedNotification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    return serverError('Failed to mark notification as read');
  }
}
