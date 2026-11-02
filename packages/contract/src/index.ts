// Shared types. OWNED BY THE ARCHITECT. Keep in sync with openapi.yaml.
// Jerome and Bipin import from "@civicpulse/contract" and never edit this package.

export type Role = "citizen" | "staff" | "admin";

export type Category =
  | "road"
  | "streetlight"
  | "garbage"
  | "water"
  | "traffic"
  | "parks";

export type Priority = "low" | "medium" | "high" | "critical";

export type ReportStatus =
  | "submitted"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "duplicate"
  | "reopened";

/** Allowed status transitions. The API enforces this; the UI uses it to show valid actions. */
export const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: ["verified", "duplicate"],
  verified: ["assigned", "duplicate"],
  assigned: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["reopened"],
  duplicate: [],
  reopened: ["assigned"],
};

export interface Profile {
  id: string;
  name: string;
  role: Role;
  departmentId: string | null; // staff only
}

export interface Department {
  id: string;
  name: string;
}

export interface Worker {
  id: string;
  name: string;
  departmentId: string;
  active: boolean;
}

export interface MediaItem {
  id: string;
  kind: "photo" | "video";
  stage: "original" | "on_site" | "proof";
  url: string;
}

export interface ReportEvent {
  id: string;
  reportId: string;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  actorName: string;
  note: string | null;
  createdAt: string;
}

export interface Report {
  id: string; // human id, e.g. CIV-10482
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: ReportStatus;
  lat: number;
  lng: number;
  areaLabel: string; // coarse, safe for public display
  departmentId: string | null;
  workerId: string | null;
  reporterName: string | null; // null when anonymous
  upvotes: number;
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetail extends Report {
  events: ReportEvent[];
  aiSuggestion: AiSuggestion | null;
}

export interface AiSuggestion {
  category: Category;
  priority: Priority;
  departmentId: string | null;
  confidence: number; // 0..1
  summary: string;
}

export interface Notification {
  id: string;
  reportId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ApiError {
  error: { code: string; message: string };
}
