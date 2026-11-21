export type Category =
  | "Roads"
  | "Waste"
  | "Water"
  | "Electricity"
  | "Drainage"
  | "Trees"
  | "Public Safety"
  | "Other";

export type Severity = "Critical" | "High" | "Medium" | "Low";

export type TicketStatus = "Pending" | "Assigned" | "In Progress" | "Resolved";

export type AnalysisSource = "gemini" | "fallback";

export const ALL_CATEGORIES: Category[] = [
  "Roads",
  "Waste",
  "Water",
  "Electricity",
  "Drainage",
  "Trees",
  "Public Safety",
  "Other",
];

export const ALL_SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

export const ALL_STATUSES: TicketStatus[] = [
  "Pending",
  "Assigned",
  "In Progress",
  "Resolved",
];

export const DEPARTMENT_MAP: Record<Category, string> = {
  Roads: "Roads & Engineering",
  Waste: "Sanitation Department",
  Water: "Water Supply Department",
  Electricity: "Electrical Department",
  Drainage: "Stormwater & Drainage Department",
  Trees: "Parks & Horticulture Department",
  "Public Safety": "Municipal Emergency Response",
  Other: "General Municipal Services",
};

export const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export interface TriageResult {
  summary: string;
  detectedLanguage: string;
  category: Category;
  severity: Severity;
  severityReason: string;
  department: string;
  priorityScore: number;
  suggestedAction: string;
  analysisSource: AnalysisSource;
  fallbackReason?: string;
}

export interface ComplaintTicket {
  id: string;
  description: string;
  location: string;
  citizenName?: string;
  photoDataUrl?: string;
  summary: string;
  detectedLanguage: string;
  category: Category;
  severity: Severity;
  severityReason: string;
  department: string;
  priorityScore: number;
  suggestedAction: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  analysisSource: AnalysisSource;
  fallbackReason?: string;
}

export type AppView = "dashboard" | "submit" | "tickets" | "analytics";
