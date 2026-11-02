// Shared types. OWNED BY RAMANSH. Keep in sync with openapi.yaml.
// Jerome and Bipin import from "@civicpulse/contract" and never edit this package.

export type Role = "citizen" | "staff" | "admin";

export type Category =
  | "road"
  | "streetlight"
  | "garbage"
  | "water"
  | "traffic"
  | "parks";

export const CATEGORIES: Category[] = ["road", "streetlight", "garbage", "water", "traffic", "parks"];

export const CATEGORY_LABELS: Record<Category, string> = {
  road: "Road & pothole",
  streetlight: "Streetlight & electricity",
  garbage: "Garbage & sanitation",
  water: "Water & drainage",
  traffic: "Traffic & public safety",
  parks: "Parks & public spaces",
};

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

export const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: "Submitted",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  duplicate: "Duplicate",
  reopened: "Reopened",
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
  upvoted?: boolean; // present only when the caller is logged in
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

export interface CreateReportInput {
  category: Category;
  description: string; // 5..1000 chars
  lat: number;
  lng: number;
  areaLabel?: string; // coarse, public-safe label chosen by the client
  anonymous?: boolean;
  mediaIds: string[]; // from /media/upload-url, 1..5
}

export interface CreateReportResponse {
  report: Report;
  nearbyDuplicates: Report[];
}

export interface ReportListResponse {
  items: Report[];
  total: number;
}

export interface UploadUrlRequest {
  kind: "photo" | "video";
  contentType: string;
  stage?: MediaItem["stage"]; // non-"original" is staff/admin only
}

/** Upload with supabase.storage.from(bucket).uploadToSignedUrl(path, token, file). */
export interface UploadUrlResponse {
  mediaId: string;
  path: string;
  token: string;
  publicUrl: string;
}

export interface ApiError {
  error: { code: string; message: string };
}
