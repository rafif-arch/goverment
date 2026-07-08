// Transformasi statistik BPS riil → indikator region fiksi.
// Deterministik: noise ±5–15% dihasilkan PRNG seeded dari string kunci,
// sehingga hasil selalu sama untuk input yang sama (testable, reproducible).

/** Hash string sederhana (FNV-1a 32-bit) → seed integer. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG mulberry32 — cepat, deterministik, cukup untuk noise kosmetik. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Multiplier noise deterministik pada rentang ±[minPct..maxPct].
 * Contoh: minPct=0.05, maxPct=0.15 → hasil di [0.85..0.95] ∪ [1.05..1.15].
 */
export function deterministicNoiseMultiplier(
  key: string,
  minPct = 0.05,
  maxPct = 0.15
): number {
  const rng = mulberry32(hashString(key));
  const magnitude = minPct + rng() * (maxPct - minPct);
  const sign = rng() < 0.5 ? -1 : 1;
  return 1 + sign * magnitude;
}

/**
 * Transformasi nilai indikator riil → nilai fiksi:
 * nilai × noise deterministik, di-clamp ke rentang plausibel indikator.
 * key noise = `${regionCode}|${indикator}|${periode}` — stabil antar-run.
 */
export function transformIndicator(
  value: number,
  regionCode: string,
  indicator: string,
  periode: string,
  clamp: [number, number]
): number {
  const mult = deterministicNoiseMultiplier(`${regionCode}|${indicator}|${periode}`);
  const noisy = value * mult;
  const [lo, hi] = clamp;
  const clamped = Math.min(hi, Math.max(lo, noisy));
  // presisi 2 desimal cukup untuk semua indikator kita
  return Math.round(clamped * 100) / 100;
}
