import { ObjectId } from 'mongodb';

export interface FacultyAssignment {
  _id?: ObjectId;
  departmentId: ObjectId;
  labGroupId: ObjectId;
  facultyId: ObjectId;
  studentIds: ObjectId[];
  studentSource: 'manual' | 'external' | 'group';
  externalSyncId?: string;
  subjectName: string;
  labName: string;
  semester: string;
  className: string;
  active: boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
