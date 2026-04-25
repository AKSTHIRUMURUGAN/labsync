import { ObjectId } from 'mongodb';

export interface LabGroup {
  _id?: ObjectId;
  name: string;
  className: string;
  semester: string;
  academicYear: string;
  departmentId: ObjectId;
  facultyId?: ObjectId;
  students: ObjectId[];
  experimentTemplates: ObjectId[];
  createdBy: ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
