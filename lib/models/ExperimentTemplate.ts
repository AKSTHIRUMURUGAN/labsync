import { ObjectId } from 'mongodb';

export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'calculated';

export interface TableColumn {
  id: string;
  name: string;
  dataType: DataType;
  required: boolean;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  decimalPlaces?: number;
  enumValues?: string[];
  calculationFormula?: string;
}

export interface ObservationTable {
  id: string;
  name: string;
  columns: TableColumn[];
}

export interface ExperimentStep {
  order: number;
  instruction: string;
  safetyNotes?: string;
}

export interface CalculationRule {
  targetColumnId: string;
  formula: string;
  dependencies: string[];
}

export interface ExperimentTemplate {
  _id?: ObjectId;
  version: string;
  title: string;
  description: string;
  objectives: string[];
  steps: ExperimentStep[];
  observationTables: ObservationTable[];
  requiredFields: string[];
  calculationRules: CalculationRule[];
  createdBy: ObjectId;
  departmentId: ObjectId;
  visibleToDepartmentIds?: ObjectId[];
  previousVersionId?: ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
