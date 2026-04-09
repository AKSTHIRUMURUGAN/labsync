import { ObjectId } from 'mongodb';

export type SessionStatus = 'created' | 'active' | 'ended';

export interface LabSession {
  _id?: ObjectId;
  labGroupId: ObjectId;
  experimentTemplateId: ObjectId;
  templateVersion: string;
  conductedBy: ObjectId;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  duration: number;
  location?: string;
  equipment: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
