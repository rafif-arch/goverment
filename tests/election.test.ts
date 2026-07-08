import { describe, expect, it } from "vitest";
import { computeElectionResult } from "@/lib/formula/election";

describe("formula hari pemilihan (mirror resolve_election SQL)", () => {
  it("60:40 elektabilitas vs faksi, komponen faksi 50:50 personal vs baseline", () => {
    const r = computeElectionResult({
      elektabilitas: 60,
      factionStandingAvg: 70,
      regionBaselineAvg: 50,
      difficulty: 1,
    });
    // 0.6*60 + 0.4*(0.5*70+0.5*50) = 36 + 0.4*60 = 60
    expect(r.finalScore).toBe(60);
    expect(r.komponenFaksi).toBe(60);
    expect(r.win).toBe(true);
  });

  it("difficulty memberi penalti (difficulty-1)*2", () => {
    const easy = computeElectionResult({ elektabilitas: 50, factionStandingAvg: 50, regionBaselineAvg: 50, difficulty: 1 });
    const hard = computeElectionResult({ elektabilitas: 50, factionStandingAvg: 50, regionBaselineAvg: 50, difficulty: 5 });
    expect(easy.finalScore - hard.finalScore).toBe(8);
    expect(easy.win).toBe(true); // 50 >= 50
    expect(hard.win).toBe(false); // 42 < 50
  });

  it("ambang menang tepat di batas (>= ambang)", () => {
    const r = computeElectionResult({ elektabilitas: 50, factionStandingAvg: 50, regionBaselineAvg: 50, difficulty: 1 });
    expect(r.finalScore).toBe(50);
    expect(r.win).toBe(true);
  });
});
