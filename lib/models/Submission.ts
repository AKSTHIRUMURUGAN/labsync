import { ObjectId } from 'mongodb';

export type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

export interface ObservationRow {
  rowId: string;
  cells: { [columnId: string]: any };
}

export interface ObservationData {
  tableId: string;
  tableName: string;
  rows: ObservationRow[];
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  captureTime?: Date;
  device?: string;
}

export interface ProofImage {
  id: string;
  cloudinaryId: string;
  url: string;
  thumbnailUrl: string;
  hash: string;
  uploadedAt: Date;
  metadata: ImageMetadata;
}

export interface CalculationResult {
  columnId: string;
  formula: string;
  result: number;
  dependencies: { [columnId: string]: any };
}

export interface EditHistoryEntry {
  timestamp: Date;
  field: string;
  oldValue: any;
  newValue: any;
}

export interface Submission {
  _id?: ObjectId;
  labSessionId: ObjectId;
  studentId: ObjectId;
  experimentTemplateId: ObjectId;
  templateVersion: string;
  status: SubmissionStatus;
  observationData: ObservationData[];
  proofImages: ProofImage[];
  calculations: CalculationResult[];
  results: string;
  conclusion: string;
  submittedAt?: Date;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  reviewComments?: string;
  rejectionReason?: string;
  editHistory: EditHistoryEntry[];
  flagged: boolean;
  flagReason?: string;
  pdfId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
