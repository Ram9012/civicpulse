import { describe, expect, it } from "vitest";
import { ruleChat, ruleSuggest } from "./ai.js";
import { buildAnalytics } from "./analytics.js";

describe("ruleSuggest", () => {
  it("classifies a streetlight problem and flags sparking cables as critical", () => {
    const s = ruleSuggest("High voltage cable sparking near the society gate, very dark and a hazard");
    expect(s.category).toBe("streetlight");
    expect(s.priority).toBe("critical");
    expect(s.source).toBe("rules");
  });
  it("returns low confidence when nothing matches", () => {
    expect(ruleSuggest("hello there").confidence).toBeLessThan(0.5);
  });
});

describe("ruleChat", () => {
  it("gives emergency numbers", () => {
    expect(ruleChat("what is the ambulance number", null)).toContain("108");
  });
  it("prefers resolved report facts", () => {
    expect(ruleChat("status of CIV-10001", "CIV-10001 is In progress.")).toBe("CIV-10001 is In progress.");
  });
});

describe("buildAnalytics", () => {
  const now = new Date("2026-11-04T10:00:00Z");
  const base = { worker_id: null, area_label: "Ward 12", resolved_at: null };
  const out = buildAnalytics({
    now,
    reopenedCount: 1,
    departments: [{ id: "d1", name: "Roads" }],
    workers: [{ id: "w1", name: "A", department_id: "d1", active: true, capacity: 5 }],
    reports: [
      { ...base, status: "resolved", category: "road", department_id: "d1", created_at: "2026-11-01T00:00:00Z", resolved_at: "2026-11-03T00:00:00Z" },
      { ...base, status: "in_progress", category: "road", department_id: "d1", worker_id: "w1", created_at: "2026-11-02T00:00:00Z" },
      { ...base, status: "duplicate", category: "road", department_id: "d1", created_at: "2026-11-02T00:00:00Z" },
      { ...base, status: "submitted", category: "water", department_id: null, created_at: "2026-11-03T00:00:00Z" },
    ],
  });
  it("counts totals and averages", () => {
    expect(out.totals.total).toBe(4);
    expect(out.totals.open).toBe(2);
    expect(out.totals.resolved).toBe(1);
    expect(out.totals.avgResolutionDays).toBe(2);
    expect(out.totals.duplicateRate).toBe(0.25);
    expect(out.totals.reopenedRate).toBe(0.25);
  });
  it("tracks department and worker load", () => {
    expect(out.departments[0]).toMatchObject({ open: 1, resolvedThisMonth: 1, workers: 1 });
    expect(out.workers[0]?.activeTasks).toBe(1);
  });
  it("builds six weekly buckets", () => {
    expect(out.weekly).toHaveLength(6);
    expect(out.weekly.reduce((n, w) => n + w.submitted, 0)).toBe(4);
  });
});
