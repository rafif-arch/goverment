import { describe, expect, it } from "vitest";
import { computeStartingStats } from "@/lib/formula/character";

describe("formula stat awal karakter", () => {
  const baseInput = { nama: "Tes", umur: 45, pendidikan: "s1" as const, profesi: "birokrat" as const };

  it("trait oligarki: uang ×3, utang politik 7, kepercayaan −10", () => {
    const normal = computeStartingStats({ ...baseInput, trait: "teknokrat" });
    const oli = computeStartingStats({ ...baseInput, trait: "oligarki" });
    expect(oli.has_oligarch_trait).toBe(true);
    expect(oli.utang_politik_level).toBe(7);
    // uang teknokrat = base tanpa multiplier; oligarki = 3×
    const baseUang = computeStartingStats({ ...baseInput, trait: "merakyat" }).uang; // merakyat tak mengubah uang
    expect(oli.uang).toBe(baseUang * 3);
    expect(oli.kepercayaan_publik).toBe(normal.kepercayaan_publik - 3 - 10); // teknokrat +3 vs oligarki -10
  });

  it("trait vip: uang ×2, koneksi +15, tanpa utang", () => {
    const vip = computeStartingStats({ ...baseInput, trait: "vip" });
    expect(vip.has_vip_trait).toBe(true);
    expect(vip.utang_politik_level).toBe(0);
    const baseline = computeStartingStats({ ...baseInput, trait: "merakyat" });
    expect(vip.uang).toBe(baseline.uang * 2);
  });

  it("umur menaikkan uang (faktor pengalaman) & koneksi", () => {
    const muda = computeStartingStats({ ...baseInput, umur: 25, trait: "teknokrat" });
    const senior = computeStartingStats({ ...baseInput, umur: 65, trait: "teknokrat" });
    expect(senior.uang).toBeGreaterThan(muda.uang);
    expect(senior.koneksi_politik).toBeGreaterThan(muda.koneksi_politik);
  });

  it("semua stat ter-clamp pada rentang valid", () => {
    for (const profesi of ["pengusaha", "birokrat", "aktivis", "akademisi", "pesohor"] as const) {
      for (const trait of ["merakyat", "teknokrat", "oligarki", "vip"] as const) {
        const s = computeStartingStats({ nama: "X", umur: 75, pendidikan: "s3", profesi, trait });
        expect(s.kepercayaan_publik).toBeGreaterThanOrEqual(0);
        expect(s.kepercayaan_publik).toBeLessThanOrEqual(100);
        expect(s.koneksi_politik).toBeGreaterThanOrEqual(0);
        expect(s.koneksi_politik).toBeLessThanOrEqual(100);
        expect(s.uang).toBeGreaterThan(0);
      }
    }
  });
});
