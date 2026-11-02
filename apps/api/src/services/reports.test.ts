import { describe, expect, it } from "vitest";
import { distanceMeters } from "./reports.js";

describe("distanceMeters", () => {
  it("is zero for the same point", () => {
    expect(distanceMeters(13.0072, 76.1023, 13.0072, 76.1023)).toBe(0);
  });
  it("measures roughly 111 m per 0.001 degree of latitude", () => {
    const d = distanceMeters(13.0, 76.1, 13.001, 76.1);
    expect(d).toBeGreaterThan(105);
    expect(d).toBeLessThan(118);
  });
});
