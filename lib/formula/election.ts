// Mirror TypeScript dari polsim.resolve_election (SQL) — untuk unit test & pratinjau UI.
// Keduanya HARUS dijaga sinkron.

export interface ElectionInput {
  elektabilitas: number;
  factionStandingAvg: number; // rata2 standing personal
  regionBaselineAvg: number; // rata2 region_faction_satisfaction
  difficulty: number; // 1..5
  bobotElektabilitas?: number; // default 0.6
  bobotFaksi?: number; // default 0.4
  ambangMenang?: number; // default 50
}

export function computeElectionResult(input: ElectionInput): {
  finalScore: number;
  win: boolean;
  komponenFaksi: number;
} {
  const be = input.bobotElektabilitas ?? 0.6;
  const bf = input.bobotFaksi ?? 0.4;
  const ambang = input.ambangMenang ?? 50;
  const komponenFaksi = 0.5 * input.factionStandingAvg + 0.5 * input.regionBaselineAvg;
  const finalScore =
    be * input.elektabilitas + bf * komponenFaksi - (input.difficulty - 1) * 2;
  return {
    finalScore: Math.round(finalScore * 100) / 100,
    win: finalScore >= ambang,
    komponenFaksi: Math.round(komponenFaksi * 100) / 100,
  };
}
