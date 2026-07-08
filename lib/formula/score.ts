// Mirror TypeScript dari polsim.compute_final_score (SQL).
import { GAME_CONFIG } from "@/data/config";

export function computeFinalScore(params: {
  pembangunanScore: number;
  factionStandingAvg: number;
  ipk: number;
}): number {
  const w = GAME_CONFIG.score_weights;
  const pemb = Math.min(100, params.pembangunanScore);
  const score =
    w.pembangunan * pemb +
    w.faksi * params.factionStandingAvg +
    w.integritas * (100 - params.ipk);
  return Math.round(score * 10) / 10;
}
