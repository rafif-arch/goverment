import { describe, expect, it } from "vitest";
import { computeIpk, detectFlags, IPK_OTT_THRESHOLD, type ProjectForAudit } from "@/lib/formula/audit";

const base: ProjectForAudit = {
  id: "p1",
  vendorIsSponsorLinked: false,
  isSponsorDemand: false,
  executedAtUtcHour: 10,
  anggaran: 10000,
  baseCost: 10000,
};

describe("audit engine (mirror run_audit_engine SQL)", () => {
  it("proyek bersih tidak menghasilkan flag", () => {
    expect(detectFlags([base])).toEqual([]);
  });

  it("vendor sponsor-linked → vendor_relational sev 2; proyek titipan → sev 3", () => {
    const flags = detectFlags([
      { ...base, id: "a", vendorIsSponsorLinked: true },
      { ...base, id: "b", vendorIsSponsorLinked: true, isSponsorDemand: true },
    ]);
    expect(flags).toContainEqual({ projectId: "a", flagType: "vendor_relational", severity: 2 });
    expect(flags).toContainEqual({ projectId: "b", flagType: "vendor_relational", severity: 3 });
  });

  it("jam tidak wajar: 00:00–03:59 UTC kena, 04:00 tidak", () => {
    expect(detectFlags([{ ...base, executedAtUtcHour: 0 }])).toHaveLength(1);
    expect(detectFlags([{ ...base, executedAtUtcHour: 3 }])).toHaveLength(1);
    expect(detectFlags([{ ...base, executedAtUtcHour: 4 }])).toHaveLength(0);
    expect(detectFlags([{ ...base, executedAtUtcHour: 23 }])).toHaveLength(0);
  });

  it("anggaran janggal: severity mengikuti threshold markup 20/35/50%", () => {
    const mk = (markup: number): ProjectForAudit => ({ ...base, anggaran: Math.round(10000 * (1 + markup)) });
    expect(detectFlags([mk(0.2)])).toHaveLength(0); // tepat 20% belum kena (> warn)
    expect(detectFlags([mk(0.25)])[0]).toMatchObject({ flagType: "anggaran_janggal", severity: 1 });
    expect(detectFlags([mk(0.4)])[0]).toMatchObject({ severity: 2 });
    expect(detectFlags([mk(0.6)])[0]).toMatchObject({ severity: 3 });
  });

  it("IPK = Σ bobot×severity + complied×5 − clean×4, clamp 0..100", () => {
    const flags = detectFlags([
      { ...base, id: "a", vendorIsSponsorLinked: true, isSponsorDemand: true }, // 12×3 = 36
      { ...base, id: "b", anggaran: 16000 }, // markup 60% → 10×3 = 30
      { ...base, id: "c", executedAtUtcHour: 2 }, // 8×2 = 16
    ]);
    expect(computeIpk(flags, 1, 0)).toBe(36 + 30 + 16 + 5); // 87 → OTT!
    expect(computeIpk(flags, 1, 0)).toBeGreaterThanOrEqual(IPK_OTT_THRESHOLD);
    // clean project menurunkan IPK
    expect(computeIpk(flags, 0, 2)).toBe(36 + 30 + 16 - 8);
    // clamp bawah
    expect(computeIpk([], 0, 10)).toBe(0);
  });

  it("skenario 'pancing OTT' README: 2 proyek titipan + 1 markup tinggi tengah malam ≥ 80", () => {
    const flags = detectFlags([
      { ...base, id: "t1", vendorIsSponsorLinked: true, isSponsorDemand: true, anggaran: 15000 }, // 36 + 30
      { ...base, id: "t2", vendorIsSponsorLinked: true, isSponsorDemand: true, anggaran: 14000 }, // 36 + 30
      { ...base, id: "n1", executedAtUtcHour: 2 }, // 16
    ]);
    const ipk = computeIpk(flags, 2, 0);
    expect(ipk).toBeGreaterThanOrEqual(IPK_OTT_THRESHOLD);
    expect(ipk).toBe(100); // clamp atas
  });
});
