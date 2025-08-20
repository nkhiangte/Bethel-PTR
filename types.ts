export interface Tithe {
  pathianRam: number;
  ramthar: number;
  tualchhung: number;
}

export interface Family {
  id: string;
  name: string;
  ipSerialNo: number | null;
  tithe: Tithe;
}

export type TitheCategory = keyof Tithe;


// New Types for nested data structure
export interface UpaBialData {
  [upaBial: string]: Family[];
}

export interface MonthlyData {
  [month: string]: UpaBialData;
}

export interface YearlyData {
  [year: number]: MonthlyData;
}

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
  id: string;
  name: string;
  phone: string;
  passwordHash: string; // In a real app, this would be a securely hashed password
  assignedBial: string | null; // e.g., "Upa Bial 1", null for admin
}

// For Family Yearly Report
export interface FamilyYearlyTitheData {
  [month: string]: Tithe;
}
