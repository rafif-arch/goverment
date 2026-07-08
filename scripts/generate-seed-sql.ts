// Menghasilkan SQL seed idempotent (stdout) dari file /data — sumber kebenaran
// yang sama dengan scripts/seed.ts. Berguna bila ingin seed lewat SQL editor
// (mis. tanpa service role key di mesin lokal): npm run seed:sql > seed.sql

import { GAME_CONFIG } from "../data/config";
import { FACTIONS } from "../data/factions";
import { REGIONS } from "../data/regions";
import { PARTIES } from "../data/parties";
import { POLITICIANS } from "../data/politicians";
import { CRISIS_EVENTS } from "../data/crisis-events";
import { VENDORS } from "../data/vendors";
import { SPONSOR_DEMAND_TEMPLATES } from "../data/sponsor-demands";
import { COSMETICS } from "../data/cosmetics";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const j = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

const lines: string[] = ["set search_path to polsim;", ""];

for (const [key, value] of Object.entries(GAME_CONFIG)) {
  lines.push(
    `insert into polsim.game_config(key, value) values (${q(key)}, ${j(value)})` +
      ` on conflict (key) do update set value = excluded.value, updated_at = now();`
  );
}

for (const f of FACTIONS) {
  lines.push(
    `insert into polsim.factions(code, name, description, icon) values (${q(f.code)}, ${q(f.name)}, ${q(f.description)}, ${q(f.icon)})` +
      ` on conflict (code) do update set name = excluded.name, description = excluded.description, icon = excluded.icon;`
  );
}

for (const r of REGIONS) {
  lines.push(
    `insert into polsim.regions(code, name, type, difficulty, is_vip_only, deskripsi, map_ref, pendapatan_daerah, ipm, gini_ratio, tingkat_pengangguran, isu_sektoral)` +
      ` values (${q(r.code)}, ${q(r.name)}, ${q(r.type)}, ${r.difficulty}, ${r.is_vip_only}, ${q(r.deskripsi)}, ${q(r.map_ref)}, ${r.pendapatan_daerah}, ${r.ipm}, ${r.gini_ratio}, ${r.tingkat_pengangguran}, ${j(r.isu_sektoral)})` +
      ` on conflict (code) do update set name = excluded.name, type = excluded.type, difficulty = excluded.difficulty, is_vip_only = excluded.is_vip_only, deskripsi = excluded.deskripsi, map_ref = excluded.map_ref, isu_sektoral = excluded.isu_sektoral;`
  );
}

lines.push(
  `insert into polsim.region_faction_satisfaction(region_id, faction_id, satisfaction_level)` +
    ` select r.id, f.id, 50 from polsim.regions r cross join polsim.factions f` +
    ` on conflict (region_id, faction_id) do nothing;`
);

for (const p of PARTIES) {
  lines.push(
    `insert into polsim.parties(code, name, archetype_ideologi, basis_konstituen, sejarah_fiksi, warna, mahar_politik)` +
      ` values (${q(p.code)}, ${q(p.name)}, ${q(p.archetype_ideologi)}, ${q(p.basis_konstituen)}, ${q(p.sejarah_fiksi)}, ${q(p.warna)}, ${p.mahar_politik})` +
      ` on conflict (code) do update set name = excluded.name, archetype_ideologi = excluded.archetype_ideologi, basis_konstituen = excluded.basis_konstituen, sejarah_fiksi = excluded.sejarah_fiksi, warna = excluded.warna, mahar_politik = excluded.mahar_politik;`
  );
}

for (const p of POLITICIANS) {
  lines.push(
    `insert into polsim.politicians(code, name, party_id, gender, generasi, axis_ekonomi, axis_basis, axis_komunikasi, axis_legitimasi, backstory, portrait_description, is_running_mate_candidate)` +
      ` values (${q(p.code)}, ${q(p.name)}, (select id from polsim.parties where code = ${q(p.party_code)}), ${q(p.gender)}, ${q(p.generasi)}, ${p.axis_ekonomi}, ${p.axis_basis}, ${p.axis_komunikasi}, ${q(p.axis_legitimasi)}, ${q(p.backstory)}, ${q(p.portrait_description)}, ${p.is_running_mate_candidate})` +
      ` on conflict (code) do update set name = excluded.name, party_id = excluded.party_id, gender = excluded.gender, generasi = excluded.generasi, axis_ekonomi = excluded.axis_ekonomi, axis_basis = excluded.axis_basis, axis_komunikasi = excluded.axis_komunikasi, axis_legitimasi = excluded.axis_legitimasi, backstory = excluded.backstory, portrait_description = excluded.portrait_description;`
  );
}

for (const e of CRISIS_EVENTS) {
  lines.push(
    `insert into polsim.crisis_events(code, title, description, options, trigger_stage, source)` +
      ` values (${q(e.code)}, ${q(e.title)}, ${q(e.description)}, ${j(e.options)}, ${q(e.trigger_stage)}, 'hand_authored')` +
      ` on conflict (code) do update set title = excluded.title, description = excluded.description, options = excluded.options;`
  );
}

for (const v of VENDORS) {
  lines.push(
    `insert into polsim.vendors(code, nama, is_sponsor_linked, afiliasi, track_record, markup_bias)` +
      ` values (${q(v.code)}, ${q(v.nama)}, ${v.is_sponsor_linked}, ${j(v.afiliasi)}, ${q(v.track_record)}, ${v.markup_bias})` +
      ` on conflict (code) do update set nama = excluded.nama, is_sponsor_linked = excluded.is_sponsor_linked, afiliasi = excluded.afiliasi, track_record = excluded.track_record, markup_bias = excluded.markup_bias;`
  );
}

for (const t of SPONSOR_DEMAND_TEMPLATES) {
  lines.push(
    `insert into polsim.sponsor_demand_templates(code, deskripsi, vendor_code, nama_proyek, base_cost, markup_paksa, deadline_days, efek_refuse)` +
      ` values (${q(t.code)}, ${q(t.deskripsi)}, ${q(t.vendor_code)}, ${q(t.nama_proyek)}, ${t.base_cost}, ${t.markup_paksa}, ${t.deadline_days}, ${j(t.efek_refuse)})` +
      ` on conflict (code) do update set deskripsi = excluded.deskripsi, vendor_code = excluded.vendor_code, nama_proyek = excluded.nama_proyek, base_cost = excluded.base_cost, markup_paksa = excluded.markup_paksa, deadline_days = excluded.deadline_days, efek_refuse = excluded.efek_refuse;`
  );
}

for (const c of COSMETICS) {
  lines.push(
    `insert into polsim.cosmetic_items(code, nama, tipe, harga_token, asset_ref, deskripsi)` +
      ` values (${q(c.code)}, ${q(c.nama)}, ${q(c.tipe)}, ${c.harga_token}, ${q(c.asset_ref)}, ${q(c.deskripsi)})` +
      ` on conflict (code) do update set nama = excluded.nama, tipe = excluded.tipe, harga_token = excluded.harga_token, asset_ref = excluded.asset_ref, deskripsi = excluded.deskripsi;`
  );
}

process.stdout.write(lines.join("\n") + "\n");
