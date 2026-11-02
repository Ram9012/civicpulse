import { describe, expect, it } from "vitest";
import { canTransition } from "./statusMachine.js";

describe("statusMachine", () => {
  it("allows staff to verify a submitted report", () => {
    expect(canTransition("submitted", "verified", "staff")).toBe(true);
  });
  it("blocks skipping steps", () => {
    expect(canTransition("submitted", "resolved", "staff")).toBe(false);
  });
  it("blocks citizens from verifying", () => {
    expect(canTransition("submitted", "verified", "citizen")).toBe(false);
  });
  it("lets a citizen reopen a resolved report", () => {
    expect(canTransition("resolved", "reopened", "citizen")).toBe(true);
  });
});
