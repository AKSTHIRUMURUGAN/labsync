import { ObjectId } from 'mongodb';

export type NotificationType = 
  | 'submission_approved' 
  | 'submission_rejected' 
  | 'session_started' 
  | 'session_ending' 
  | 'pending_review';

export interface Notification {
  _id?: ObjectId;
  userId: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId: string;
  relatedEntityType: 'submission' | 'session' | 'template';
  read: boolean;
  createdAt: Date;
  expiresAt: Date;
}
