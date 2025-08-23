export interface Tithe {
  pathianRam: number;
  ramthar: number;
  tualchhung: number;
}

export interface Family {
  id: string; // Firestore document ID
  name: string;
  ipSerialNo: number | null;
  currentBial: string; // The Upa Bial this family belongs to
}

// Represents a single month's tithe data for a family in Firestore
export interface TitheLog {
  year: number;
  month: string;
  familyId: string;
  upaBial: string;
  tithe: Tithe;
}

// This is a hydrated object, combining Family and their monthly TitheLog
export interface FamilyWithTithe extends Omit<Family, 'currentBial'> {
  tithe: Tithe;
}


export type TitheCategory = keyof Tithe;

// New Types for Aggregate Report
export interface BialTotal {
  pathianRam: number;
  ramthar: number;
  tualchhung: number;
  total: number;
}

export interface AggregateReportData {
  [upaBial: string]: BialTotal;
}

// For Authentication
export interface User {
  uid: string;
  name: string;
  email: string;
  assignedBial: string | null; // e.g., "Upa Bial 1", null for admin
}

// For Family Yearly Report
export interface FamilyYearlyTitheData {
  [month: string]: Tithe;
}

// For Bial Yearly Report (list of families with yearly totals)
export interface YearlyFamilyTotal extends Omit<Family, 'currentBial'> {
    tithe: Tithe;
}