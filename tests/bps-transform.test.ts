import { describe, expect, it } from "vitest";
import {
  deterministicNoiseMultiplier,
  hashString,
  mulberry32,
  transformIndicator,
} from "@/lib/bps-transform";

describe("bps-transform", () => {
  it("hashString deterministik & berbeda antar input", () => {
    expect(hashString("candrakala|ipm|2025")).toBe(hashString("candrakala|ipm|2025"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("mulberry32 menghasilkan urutan sama untuk seed sama", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });

  it("noise multiplier deterministik dan berada di ±5–15%", () => {
    for (const key of ["x|ipm|2025", "y|gini|2024", "z|tpt|2023", "candrakala|ipm|f1"]) {
      const m1 = deterministicNoiseMultiplier(key);
      const m2 = deterministicNoiseMultiplier(key);
      expect(m1).toBe(m2); // deterministik
      const dev = Math.abs(m1 - 1);
      expect(dev).toBeGreaterThanOrEqual(0.05);
      expect(dev).toBeLessThanOrEqual(0.15);
    }
  });

  it("noise berbeda antar region utk indikator sama", () => {
    const a = deterministicNoiseMultiplier("candrakala|ipm|2025");
    const b = deterministicNoiseMultiplier("kutabara|ipm|2025");
    expect(a).not.toBe(b);
  });

  it("transformIndicator meng-clamp ke rentang valid indikator", () => {
    // nilai dekat batas atas: hasil tidak boleh melewati clamp
    const v = transformIndicator(94, "candrakala", "ipm", "2025", [40, 95]);
    expect(v).toBeLessThanOrEqual(95);
    expect(v).toBeGreaterThanOrEqual(40);
    // gini 0..1
    const g = transformIndicator(0.58, "kutabara", "gini_ratio", "2025", [0.2, 0.6]);
    expect(g).toBeLessThanOrEqual(0.6);
    expect(g).toBeGreaterThanOrEqual(0.2);
  });

  it("transformIndicator deterministik antar-run", () => {
    const a = transformIndicator(70, "lembah_sarna", "ipm", "2025", [40, 95]);
    const b = transformIndicator(70, "lembah_sarna", "ipm", "2025", [40, 95]);
    expect(a).toBe(b);
  });
});
