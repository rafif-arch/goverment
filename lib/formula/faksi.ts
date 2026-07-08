// Trade-off faksi: setiap pilihan menggeser standing personal (0..100).

export type FactionStanding = Record<string, number>;

export const DEFAULT_STANDING: FactionStanding = {
  buruh_tani: 50,
  menengah_urban: 50,
  tokoh_agama: 50,
  konsorsium_bisnis: 50,
};

export function applyFactionDeltas(
  standing: FactionStanding,
  deltas: Record<string, number>
): FactionStanding {
  const next = { ...standing };
  for (const [code, delta] of Object.entries(deltas)) {
    const current = next[code] ?? 50;
    next[code] = Math.max(0, Math.min(100, current + delta));
  }
  return next;
}

export function avgStanding(standing: FactionStanding): number {
  const values = Object.values(standing);
  if (values.length === 0) return 50;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
