// Mirror TypeScript dari polsim.run_audit_engine (SQL) — untuk unit test.
// Aturan & bobot HARUS sinkron dengan data/config.ts dan fungsi SQL.

import { GAME_CONFIG } from "@/data/config";

export type FlagType = "vendor_relational" | "jam_tidak_wajar" | "anggaran_janggal";

export interface ProjectForAudit {
  id: string;
  vendorIsSponsorLinked: boolean;
  isSponsorDemand: boolean; // sponsor_demand_id != null
  executedAtUtcHour: number | null; // jam UTC saat eksekusi
  anggaran: number;
  baseCost: number;
}

export interface AuditFlag {
  projectId: string;
  flagType: FlagType;
  severity: 1 | 2 | 3;
}

const TH = GAME_CONFIG.audit_thresholds;
const W = GAME_CONFIG.ipk_weights;

/** Rule engine deterministik: hasilkan flag per proyek selesai. */
export function detectFlags(projects: ProjectForAudit[]): AuditFlag[] {
  const flags: AuditFlag[] = [];
  for (const p of projects) {
    if (p.vendorIsSponsorLinked) {
      flags.push({ projectId: p.id, flagType: "vendor_relational", severity: p.isSponsorDemand ? 3 : 2 });
    }
    if (
      p.executedAtUtcHour !== null &&
      p.executedAtUtcHour >= TH.night_start &&
      p.executedAtUtcHour <= TH.night_end - 1
    ) {
      flags.push({ projectId: p.id, flagType: "jam_tidak_wajar", severity: 2 });
    }
    const markup = (p.anggaran - p.baseCost) / p.baseCost;
    if (markup > TH.markup_warn) {
      const severity = markup > TH.markup_high ? 3 : markup > TH.markup_med ? 2 : 1;
      flags.push({ projectId: p.id, flagType: "anggaran_janggal", severity });
    }
  }
  return flags;
}

/**
 * IPK (Indeks Persepsi Kerawanan) 0..100:
 * clamp( Σ bobot[tipe]×severity + complied×w_sponsor − clean×w_clean , 0, 100 )
 * clean = proyek selesai tanpa flag sama sekali.
 */
export function computeIpk(
  flags: AuditFlag[],
  compliedDemands: number,
  cleanProjects: number
): number {
  const sum = flags.reduce((acc, f) => acc + W[f.flagType] * f.severity, 0);
  const raw = sum + compliedDemands * W.sponsor_complied - cleanProjects * W.clean_project_credit;
  return Math.max(0, Math.min(100, raw));
}

export const IPK_OTT_THRESHOLD = GAME_CONFIG.ipk_ott_threshold.value;
