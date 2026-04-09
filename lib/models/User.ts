import { ObjectId } from 'mongodb';

export type UserRole = 'student' | 'lab_faculty' | 'faculty_coordinator' | 'hod' | 'principal';

export interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  institutionId: ObjectId;
  departmentId?: ObjectId;
  enrollmentNumber?: string;
  employeeId?: string;
  googleId?: string;
  profilePicture?: string;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  institutionId: string;
  departmentId?: string;
  enrollmentNumber?: string;
  employeeId?: string;
}
