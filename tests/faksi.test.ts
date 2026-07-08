import { describe, expect, it } from "vitest";
import { applyFactionDeltas, avgStanding, DEFAULT_STANDING } from "@/lib/formula/faksi";

describe("trade-off faksi", () => {
  it("delta diterapkan dan ter-clamp 0..100", () => {
    const next = applyFactionDeltas(DEFAULT_STANDING, { buruh_tani: 6, konsorsium_bisnis: -4 });
    expect(next.buruh_tani).toBe(56);
    expect(next.konsorsium_bisnis).toBe(46);
    const maxed = applyFactionDeltas({ ...DEFAULT_STANDING, buruh_tani: 98 }, { buruh_tani: 10 });
    expect(maxed.buruh_tani).toBe(100);
    const floored = applyFactionDeltas({ ...DEFAULT_STANDING, tokoh_agama: 3 }, { tokoh_agama: -10 });
    expect(floored.tokoh_agama).toBe(0);
  });

  it("tidak memutasi objek asal (immutable)", () => {
    const before = { ...DEFAULT_STANDING };
    applyFactionDeltas(DEFAULT_STANDING, { buruh_tani: 5 });
    expect(DEFAULT_STANDING).toEqual(before);
  });

  it("faksi tak dikenal diinisialisasi dari 50", () => {
    const next = applyFactionDeltas({}, { buruh_tani: 5 });
    expect(next.buruh_tani).toBe(55);
  });

  it("avgStanding menghitung rata-rata; default 50 saat kosong", () => {
    expect(avgStanding({ a: 40, b: 60 })).toBe(50);
    expect(avgStanding({})).toBe(50);
  });
});
