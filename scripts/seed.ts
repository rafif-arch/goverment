// Seed semua data referensi ke schema polsim (idempotent — upsert by code/key).
// Jalankan: npm run seed  (butuh SUPABASE_SERVICE_ROLE_KEY di .env.local)

import { loadEnv } from "../lib/load-env";
import { createServiceClient } from "../lib/supabase/service";
import { GAME_CONFIG } from "../data/config";
import { FACTIONS } from "../data/factions";
import { REGIONS } from "../data/regions";
import { PARTIES } from "../data/parties";
import { POLITICIANS } from "../data/politicians";
import { CRISIS_EVENTS } from "../data/crisis-events";
import { VENDORS } from "../data/vendors";
import { SPONSOR_DEMAND_TEMPLATES } from "../data/sponsor-demands";
import { COSMETICS } from "../data/cosmetics";

loadEnv();

async function main() {
  const db = createServiceClient();
  const fail = (step: string, error: { message: string } | null) => {
    if (error) throw new Error(`${step}: ${error.message}`);
  };

  // game_config
  for (const [key, value] of Object.entries(GAME_CONFIG)) {
    fail(`config ${key}`, (await db.from("game_config").upsert({ key, value }, { onConflict: "key" })).error);
  }

  // factions
  fail("factions", (await db.from("factions").upsert(FACTIONS, { onConflict: "code" })).error);

  // regions (indikator awal = nilai fallback; pipeline BPS akan menimpanya)
  fail("regions", (await db.from("regions").upsert(
    REGIONS.map((r) => ({
      code: r.code, name: r.name, type: r.type, difficulty: r.difficulty,
      is_vip_only: r.is_vip_only, deskripsi: r.deskripsi, map_ref: r.map_ref,
      pendapatan_daerah: r.pendapatan_daerah, ipm: r.ipm, gini_ratio: r.gini_ratio,
      tingkat_pengangguran: r.tingkat_pengangguran, isu_sektoral: r.isu_sektoral,
    })), { onConflict: "code" })).error);

  // region_faction_satisfaction baseline 50 utk semua kombinasi
  const { data: regions } = await db.from("regions").select("id, code");
  const { data: factions } = await db.from("factions").select("id, code");
  if (regions && factions) {
    const rows = regions.flatMap((r) => factions.map((f) => ({ region_id: r.id, faction_id: f.id, satisfaction_level: 50 })));
    fail("rfs", (await db.from("region_faction_satisfaction").upsert(rows, { onConflict: "region_id,faction_id", ignoreDuplicates: true })).error);
  }

  // parties (faksi_afinitas ikut disimpan di kolom basis? tidak — afinitas dipakai formula client, ada di data file)
  fail("parties", (await db.from("parties").upsert(
    PARTIES.map((p) => ({
      code: p.code, name: p.name, archetype_ideologi: p.archetype_ideologi,
      basis_konstituen: p.basis_konstituen, sejarah_fiksi: p.sejarah_fiksi,
      warna: p.warna, mahar_politik: p.mahar_politik,
    })), { onConflict: "code" })).error);

  // politicians
  const { data: partyRows } = await db.from("parties").select("id, code");
  const partyId = new Map((partyRows ?? []).map((p) => [p.code, p.id]));
  fail("politicians", (await db.from("politicians").upsert(
    POLITICIANS.map((p) => ({
      code: p.code, name: p.name, party_id: partyId.get(p.party_code),
      gender: p.gender, generasi: p.generasi,
      axis_ekonomi: p.axis_ekonomi, axis_basis: p.axis_basis,
      axis_komunikasi: p.axis_komunikasi, axis_legitimasi: p.axis_legitimasi,
      backstory: p.backstory, portrait_description: p.portrait_description,
      is_running_mate_candidate: p.is_running_mate_candidate,
    })), { onConflict: "code" })).error);

  // crisis events
  fail("crisis_events", (await db.from("crisis_events").upsert(
    CRISIS_EVENTS.map((e) => ({
      code: e.code, title: e.title, description: e.description,
      options: e.options, trigger_stage: e.trigger_stage, source: "hand_authored",
    })), { onConflict: "code" })).error);

  // vendors
  fail("vendors", (await db.from("vendors").upsert(
    VENDORS.map((v) => ({
      code: v.code, nama: v.nama, is_sponsor_linked: v.is_sponsor_linked,
      afiliasi: v.afiliasi, track_record: v.track_record, markup_bias: v.markup_bias,
    })), { onConflict: "code" })).error);

  // sponsor demand templates
  fail("sponsor_demand_templates", (await db.from("sponsor_demand_templates").upsert(
    SPONSOR_DEMAND_TEMPLATES.map((t) => ({
      code: t.code, deskripsi: t.deskripsi, vendor_code: t.vendor_code,
      nama_proyek: t.nama_proyek, base_cost: t.base_cost, markup_paksa: t.markup_paksa,
      deadline_days: t.deadline_days, efek_refuse: t.efek_refuse,
    })), { onConflict: "code" })).error);

  // cosmetics
  fail("cosmetic_items", (await db.from("cosmetic_items").upsert(
    COSMETICS.map((c) => ({
      code: c.code, nama: c.nama, tipe: c.tipe, harga_token: c.harga_token,
      asset_ref: c.asset_ref, deskripsi: c.deskripsi,
    })), { onConflict: "code" })).error);

  console.log("Seed selesai ✔ (regions, factions, parties, politicians, crisis_events, vendors, sponsor templates, cosmetics, config)");
}

main().catch((err) => {
  console.error("Seed gagal:", err.message);
  process.exit(1);
});
