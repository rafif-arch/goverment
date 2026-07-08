// Pipeline BPS: tarik indikator dari BPS Web API resmi → simpan mentah ke
// polsim.bps_raw_cache → transformasi fiksi deterministik → update polsim.regions.
// Runtime game HANYA membaca dari Supabase, tidak pernah memanggil BPS langsung.
//
// Jalankan: npm run fetch:bps  (butuh SUPABASE_SERVICE_ROLE_KEY; BPS_API_KEY opsional)
// Tanpa BPS_API_KEY (atau endpoint gagal) → memakai fallback data/bps-fallback.json.

import { loadEnv } from "../lib/load-env";
import { createServiceClient } from "../lib/supabase/service";
import { REGION_MAPPINGS, BPS_VARIABLES } from "../data/region-mapping";
import { transformIndicator } from "../lib/bps-transform";
import fallbackJson from "../data/bps-fallback.json";

loadEnv();

type IndicatorKey = keyof typeof BPS_VARIABLES;
const INDICATORS = Object.keys(BPS_VARIABLES) as IndicatorKey[];
const PERIODE = new Date().getFullYear().toString();

interface RawValue {
  indikator: IndicatorKey;
  wilayah: string;
  nilai: number;
  periode: string;
  source: "bps_api" | "fallback";
}

/**
 * Ambil satu variabel dari BPS Web API (model data, domain 0000 = nasional per provinsi).
 * Struktur respons BPS: { vervar: [{val,label}], tahun: [{val,label}], datacontent: {"<vervar><var><turvar><th><turth>": nilai} }
 * Parsing best-effort; nilai tidak ketemu → null (caller pakai fallback).
 */
async function fetchBpsVariable(
  varId: number,
  provinceCode: string,
  apiKey: string
): Promise<{ nilai: number; periode: string } | null> {
  const url = `https://webapi.bps.go.id/v1/api/list/model/data/domain/0000/var/${varId}/key/${apiKey}/`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return null;
  const body: any = await res.json();
  if (body?.status !== "OK" || !body?.datacontent) return null;

  const vervar: Array<{ val: number | string; label: string }> = body.vervar ?? [];
  const tahun: Array<{ val: number | string; label: string }> = body.tahun ?? [];
  if (!vervar.length || !tahun.length) return null;

  // cari wilayah yang val-nya diawali kode provinsi (BPS memakai 4 digit, mis. 3100)
  const prefix = provinceCode.slice(0, 2);
  const wilayah = vervar.find((v) => String(v.val).startsWith(prefix));
  if (!wilayah) return null;

  // ambil tahun terbaru yang punya nilai
  const turvar = body.turvar?.[0]?.val ?? 0;
  const turth = body.turtahun?.[0]?.val ?? 0;
  const sorted = [...tahun].sort((a, b) => Number(b.val) - Number(a.val));
  for (const th of sorted) {
    const key = `${wilayah.val}${varId}${turvar}${th.val}${turth}`;
    const nilai = body.datacontent[key];
    if (typeof nilai === "number" && Number.isFinite(nilai)) {
      return { nilai, periode: String(th.label ?? th.val) };
    }
  }
  return null;
}

async function collectRawValues(): Promise<RawValue[]> {
  const apiKey = process.env.BPS_API_KEY;
  const fallback = fallbackJson as Record<string, Record<string, number>>;
  const out: RawValue[] = [];

  for (const mapping of REGION_MAPPINGS) {
    for (const indikator of INDICATORS) {
      let value: { nilai: number; periode: string } | null = null;
      if (apiKey) {
        try {
          value = await fetchBpsVariable(BPS_VARIABLES[indikator].varId, mapping.bpsProvinceCode, apiKey);
        } catch (err) {
          console.warn(`  ! BPS API gagal utk ${indikator}/${mapping.bpsProvinceCode}: ${(err as Error).message}`);
        }
      }
      if (value) {
        out.push({ indikator, wilayah: mapping.bpsProvinceCode, nilai: value.nilai, periode: value.periode, source: "bps_api" });
      } else {
        const fb = fallback[mapping.bpsProvinceCode]?.[indikator];
        if (fb === undefined) {
          console.warn(`  ! Tidak ada fallback utk ${indikator}/${mapping.bpsProvinceCode} — dilewati`);
          continue;
        }
        out.push({ indikator, wilayah: mapping.bpsProvinceCode, nilai: fb, periode: `fallback-${PERIODE}`, source: "fallback" });
      }
    }
  }
  return out;
}

async function main() {
  console.log("== PolSim: pipeline BPS ==");
  if (!process.env.BPS_API_KEY) {
    console.log("BPS_API_KEY kosong → memakai jalur fallback (data/bps-fallback.json).");
  }
  const supabase = createServiceClient();
  const raw = await collectRawValues();
  console.log(`Terkumpul ${raw.length} nilai indikator (${raw.filter(r => r.source === "bps_api").length} dari API).`);

  // 1) simpan mentah ke cache
  for (const r of raw) {
    const { error } = await supabase.from("bps_raw_cache").upsert(
      { indikator: r.indikator, wilayah_sumber: r.wilayah, nilai: r.nilai, periode: r.periode, fetched_at: new Date().toISOString() },
      { onConflict: "indikator,wilayah_sumber,periode" }
    );
    if (error) throw new Error(`bps_raw_cache upsert gagal: ${error.message}`);
  }

  // 2) transformasi fiksi deterministik → update regions
  for (const mapping of REGION_MAPPINGS) {
    const patch: Record<string, number | string> = {};
    for (const indikator of INDICATORS) {
      const r = raw.find((x) => x.wilayah === mapping.bpsProvinceCode && x.indikator === indikator);
      if (!r) continue;
      patch[indikator] = transformIndicator(
        r.nilai, mapping.regionCode, indikator, r.periode, BPS_VARIABLES[indikator].clamp
      );
    }
    if (Object.keys(patch).length === 0) continue;
    patch["source_updated_at"] = new Date().toISOString();
    const { error } = await supabase.from("regions").update(patch).eq("code", mapping.regionCode);
    if (error) throw new Error(`update regions ${mapping.regionCode} gagal: ${error.message}`);
    console.log(`  ✓ ${mapping.regionCode}:`, patch);
  }
  console.log("Selesai.");
}

main().catch((err) => {
  console.error("fetch-bps gagal:", err.message);
  process.exit(1);
});
