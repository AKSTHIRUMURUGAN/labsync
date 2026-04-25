import { ObjectId } from 'mongodb';

export interface Department {
  _id?: ObjectId;
  name: string;
  code: string;
  institutionId: ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
