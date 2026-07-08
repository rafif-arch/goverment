// Formula elektabilitas (Babak III) — terdokumentasi di README.

export interface PoliticianAxes {
  axis_ekonomi: number;
  axis_basis: number;
  axis_komunikasi: number;
}

/**
 * Kompatibilitas calon wakil (0..100) terhadap kebutuhan region:
 * wakil yang "melengkapi" lebih baik daripada yang identik.
 *  - basis akar rumput (axis_basis negatif) menutup kelemahan di region difficulty rendah
 *  - komunikasi blak-blakan disukai buruh/tani; formal disukai bisnis/urban
 * Skor = 50 + komplemen basis + kecocokan ekonomi dgn gini + bonus komunikasi.
 */
export function runningMateCompatibility(
  mate: PoliticianAxes,
  region: { gini_ratio: number; difficulty: number }
): number {
  // region timpang (gini tinggi) → wakil populis (axis_ekonomi negatif) menolong
  const ekonomiFit = region.gini_ratio >= 0.38 ? -mate.axis_ekonomi / 4 : mate.axis_ekonomi / 8;
  // region sulit (kota besar) → basis elite membantu mesin politik; region kecil → akar rumput
  const basisFit = region.difficulty >= 4 ? mate.axis_basis / 5 : -mate.axis_basis / 5;
  // komunikasi moderat paling aman: penalti ekstrem
  const komunikasiFit = 10 - Math.abs(mate.axis_komunikasi) / 10;
  const skor = 50 + ekonomiFit + basisFit + komunikasiFit;
  return Math.max(0, Math.min(100, Math.round(skor)));
}

/**
 * Elektabilitas awal saat masuk tahap Perang Elektabilitas:
 * 5 + 0.2×kepercayaan + 0.1×koneksi + afinitasPartai + 0.15×kompatibilitasWakil
 * (clamp 5..45 — sisanya direbut lewat crisis events & faksi)
 */
export function initialElektabilitas(params: {
  kepercayaan_publik: number;
  koneksi_politik: number;
  partyAffinityAvg: number; // rata2 faksi_afinitas partai (-10..10)
  mateCompatibility: number; // 0..100
}): number {
  const raw =
    5 +
    0.2 * params.kepercayaan_publik +
    0.1 * params.koneksi_politik +
    params.partyAffinityAvg +
    0.15 * params.mateCompatibility;
  return Math.max(5, Math.min(45, Math.round(raw * 10) / 10));
}

/** Modifier kampanye dari world_events aktif (efek_variabel.sentimen_publik). */
export function worldEventCampaignModifier(
  events: Array<{ effects: { efek_variabel?: Record<string, number> } }>
): number {
  return events.reduce(
    (sum, e) => sum + (e.effects?.efek_variabel?.sentimen_publik ?? 0),
    0
  );
}
