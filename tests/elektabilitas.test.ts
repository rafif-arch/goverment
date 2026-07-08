import { describe, expect, it } from "vitest";
import {
  initialElektabilitas,
  runningMateCompatibility,
  worldEventCampaignModifier,
} from "@/lib/formula/elektabilitas";

describe("formula elektabilitas", () => {
  it("elektabilitas awal ter-clamp 5..45", () => {
    expect(
      initialElektabilitas({ kepercayaan_publik: 0, koneksi_politik: 0, partyAffinityAvg: -10, mateCompatibility: 0 })
    ).toBe(5);
    expect(
      initialElektabilitas({ kepercayaan_publik: 100, koneksi_politik: 100, partyAffinityAvg: 10, mateCompatibility: 100 })
    ).toBe(45);
  });

  it("kepercayaan lebih tinggi → elektabilitas awal lebih tinggi", () => {
    const low = initialElektabilitas({ kepercayaan_publik: 40, koneksi_politik: 20, partyAffinityAvg: 0, mateCompatibility: 50 });
    const high = initialElektabilitas({ kepercayaan_publik: 70, koneksi_politik: 20, partyAffinityAvg: 0, mateCompatibility: 50 });
    expect(high).toBeGreaterThan(low);
  });

  it("kompatibilitas wakil 0..100 dan menghargai populis di region timpang", () => {
    const region = { gini_ratio: 0.42, difficulty: 2 };
    const populis = runningMateCompatibility({ axis_ekonomi: -75, axis_basis: -80, axis_komunikasi: -20 }, region);
    const promarket = runningMateCompatibility({ axis_ekonomi: 80, axis_basis: 85, axis_komunikasi: 60 }, region);
    expect(populis).toBeGreaterThan(promarket);
    for (const v of [populis, promarket]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("region sulit (ibu kota) menghargai basis elite", () => {
    const capital = { gini_ratio: 0.42, difficulty: 5 };
    const elite = runningMateCompatibility({ axis_ekonomi: 0, axis_basis: 70, axis_komunikasi: 0 }, capital);
    const akar = runningMateCompatibility({ axis_ekonomi: 0, axis_basis: -70, axis_komunikasi: 0 }, capital);
    expect(elite).toBeGreaterThan(akar);
  });

  it("modifier world event menjumlahkan sentimen_publik", () => {
    expect(
      worldEventCampaignModifier([
        { effects: { efek_variabel: { sentimen_publik: -2 } } },
        { effects: { efek_variabel: { sentimen_publik: 3 } } },
        { effects: {} },
      ])
    ).toBe(1);
  });
});
