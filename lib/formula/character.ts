// Formula stat awal karakter (Babak II) — terdokumentasi di README.
// Uang dalam juta Ʀupa.

export type Pendidikan = "sma" | "s1" | "s2" | "s3";
export type Profesi = "pengusaha" | "birokrat" | "aktivis" | "akademisi" | "pesohor";
export type Trait = "merakyat" | "teknokrat" | "oligarki" | "vip";

export interface CharacterInput {
  nama: string;
  umur: number; // 25..75
  pendidikan: Pendidikan;
  profesi: Profesi;
  trait: Trait;
}

export interface StartingStats {
  uang: number;
  kepercayaan_publik: number;
  koneksi_politik: number;
  utang_politik_level: number;
  has_oligarch_trait: boolean;
  has_vip_trait: boolean;
  dana_kampanye: number;
}

const PENDIDIKAN_BONUS: Record<Pendidikan, { kepercayaan: number; koneksi: number }> = {
  sma: { kepercayaan: 0, koneksi: 0 },
  s1: { kepercayaan: 3, koneksi: 2 },
  s2: { kepercayaan: 5, koneksi: 4 },
  s3: { kepercayaan: 6, koneksi: 6 },
};

const PROFESI_BASE: Record<Profesi, { uang: number; kepercayaan: number; koneksi: number }> = {
  pengusaha: { uang: 8000, kepercayaan: 45, koneksi: 30 },
  birokrat: { uang: 2500, kepercayaan: 50, koneksi: 45 },
  aktivis: { uang: 800, kepercayaan: 65, koneksi: 25 },
  akademisi: { uang: 1500, kepercayaan: 60, koneksi: 20 },
  pesohor: { uang: 5000, kepercayaan: 55, koneksi: 15 },
};

/**
 * Stat awal:
 *  - uang        = base profesi × faktor umur (pengalaman menabung: +1.5%/tahun di atas 25)
 *  - kepercayaan = base profesi + bonus pendidikan + penalti trait oligarki (−10)
 *  - koneksi     = base profesi + bonus pendidikan + umur/4 + bonus trait
 *  - trait oligarki: uang ×3, dana kampanye awal besar, utang_politik 7 → sponsor menagih saat menjabat
 *  - trait vip (premium, tanpa debuff): uang ×2, koneksi +15, utang 0
 */
export function computeStartingStats(input: CharacterInput): StartingStats {
  const p = PROFESI_BASE[input.profesi];
  const e = PENDIDIKAN_BONUS[input.pendidikan];
  const umurFactor = 1 + Math.max(0, input.umur - 25) * 0.015;

  let uang = Math.round(p.uang * umurFactor);
  let kepercayaan = p.kepercayaan + e.kepercayaan;
  let koneksi = Math.min(100, p.koneksi + e.koneksi + Math.floor(input.umur / 4));
  let utang = 0;
  let dana = Math.round(uang * 0.3);

  if (input.trait === "merakyat") {
    kepercayaan += 8;
    koneksi = Math.max(5, koneksi - 5);
  } else if (input.trait === "teknokrat") {
    kepercayaan += 3;
    koneksi += 5;
  } else if (input.trait === "oligarki") {
    uang *= 3;
    dana = Math.round(uang * 0.5);
    kepercayaan -= 10;
    utang = 7;
  } else if (input.trait === "vip") {
    uang *= 2;
    dana = Math.round(uang * 0.4);
    koneksi += 15;
  }

  return {
    uang,
    kepercayaan_publik: Math.max(0, Math.min(100, kepercayaan)),
    koneksi_politik: Math.max(0, Math.min(100, koneksi)),
    utang_politik_level: utang,
    has_oligarch_trait: input.trait === "oligarki",
    has_vip_trait: input.trait === "vip",
    dana_kampanye: dana,
  };
}
