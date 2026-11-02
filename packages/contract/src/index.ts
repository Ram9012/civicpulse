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
  capacity?: number;
  activeTasks?: number; // assigned + in_progress right now
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
  mine?: boolean; // present only when the caller is logged in
  aiSuggestion?: AiSuggestion | null; // staff queue + detail only
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
  keywords?: string[];
  source?: "groq" | "rules";
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

export interface TransitionInput {
  to: "verified" | "assigned" | "in_progress" | "resolved" | "duplicate";
  workerId?: string; // required when to=assigned
  departmentId?: string; // optional override at verify
  priority?: Priority; // optional change at verify
  duplicateOf?: string; // required when to=duplicate
  onSiteMediaId?: string; // optional when to=in_progress
  proofMediaId?: string; // required when to=resolved
  note?: string;
}

export interface RoutingRule {
  category: Category;
  departmentId: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string | null;
  detail: string | null;
}

export interface SavedArea {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface DepartmentStats {
  id: string;
  name: string;
  open: number;
  resolvedThisMonth: number;
  avgDays: number | null;
  workers: number;
}

export interface WeeklyPoint {
  week: string; // e.g. "3 Nov"
  submitted: number;
  resolved: number;
}

export interface Analytics {
  totals: {
    total: number;
    open: number;
    resolved: number;
    resolvedThisMonth: number;
    avgResolutionDays: number | null;
    reopenedRate: number; // 0..1
    duplicateRate: number; // 0..1
  };
  byStatus: Partial<Record<ReportStatus, number>>;
  byCategory: Partial<Record<Category, number>>;
  weekly: WeeklyPoint[];
  departments: DepartmentStats[];
  hotspots: { area: string; count: number; category: Category }[];
  workers: Worker[];
}

export interface PublicStats {
  reportsSubmitted: number;
  issuesResolved: number;
  departmentsConnected: number;
  avgResponseDays: number | null;
  departments: DepartmentStats[];
  weekly: WeeklyPoint[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  source: "groq" | "rules";
}

export interface ApiError {
  error: { code: string; message: string };
}
