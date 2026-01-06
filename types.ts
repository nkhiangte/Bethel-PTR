
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

// For Authentication to match Firebase user and custom claims
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  assignedBial: string | null; // e.g., "Upa Bial 1", null for admin
  isAdmin: boolean;
}

// Represents the user document in the 'users' collection in Firestore
export interface UserDoc {
    uid: string;
    email: string | null;
    displayName: string | null;
    isAdmin: boolean;
    assignedBial: string | null;
}


// For Family Yearly Report
export interface FamilyYearlyTitheData {
  [month: string]: Tithe;
}

// For Bial Yearly Report (list of families with yearly totals)
export interface YearlyFamilyTotal extends Omit<Family, 'currentBial'> {
    tithe: Tithe;
}

// For Bial Vawngtu information
export interface BialVawngtu {
  name: string;
  phone: string;
}

export interface BialInfo {
  vawngtu: BialVawngtu[];
}

// For archiving status of a year
export interface ArchiveStatus {
  isArchived: boolean;
}