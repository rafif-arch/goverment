import { describe, expect, it } from "vitest";
import { computeFinalScore } from "@/lib/formula/score";

describe("skor akhir leaderboard (mirror compute_final_score SQL)", () => {
  it("0.4×pembangunan + 0.3×faksi + 0.3×(100−IPK)", () => {
    expect(computeFinalScore({ pembangunanScore: 50, factionStandingAvg: 60, ipk: 20 })) //
      .toBe(0.4 * 50 + 0.3 * 60 + 0.3 * 80);
  });

  it("pembangunan di-cap 100", () => {
    const capped = computeFinalScore({ pembangunanScore: 250, factionStandingAvg: 50, ipk: 0 });
    const at100 = computeFinalScore({ pembangunanScore: 100, factionStandingAvg: 50, ipk: 0 });
    expect(capped).toBe(at100);
  });

  it("IPK tinggi menghancurkan skor integritas", () => {
    const bersih = computeFinalScore({ pembangunanScore: 60, factionStandingAvg: 60, ipk: 0 });
    const korup = computeFinalScore({ pembangunanScore: 60, factionStandingAvg: 60, ipk: 90 });
    expect(bersih - korup).toBeCloseTo(27); // 0.3 × 90
  });
});
