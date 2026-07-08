-- ============================================================
-- PolSim Arcapada — Migration 0002: Governance & Audit (Babak IV)
-- ============================================================
set search_path to polsim;

-- Vendor pengadaan fiksi
create table polsim.vendors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nama text not null,
  afiliasi jsonb not null default '{}'::jsonb,   -- {sponsor_code, keterangan} — lore
  is_sponsor_linked boolean not null default false, -- basis deterministik aturan audit vendor_relational
  track_record text,
  markup_bias numeric not null default 0          -- kecenderungan markup vendor (fraksi, mis. 0.15)
);

-- Proyek pemerintahan (KAK/RAB sederhana)
create table polsim.government_projects (
  id uuid primary key default gen_random_uuid(),
  campaign_state_id uuid not null references polsim.campaign_state(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nama_proyek text not null,
  isu_target text not null,                       -- kode isu dari regions.isu_sektoral
  base_cost bigint not null check (base_cost > 0),-- HPS wajar
  anggaran bigint not null check (anggaran > 0),  -- RAB diajukan pemain
  vendor_id uuid references polsim.vendors(id),
  status text not null default 'draft_kak' check (status in ('draft_kak', 'lobi_dprd', 'eksekusi', 'selesai')),
  executed_at timestamptz,
  political_power_cost int not null default 0,
  sponsor_demand_id uuid,                          -- terisi jika proyek titipan sponsor
  impact int not null default 10,                  -- poin pembangunan saat selesai
  created_at timestamptz not null default now()
);
create index government_projects_campaign_idx on polsim.government_projects(campaign_state_id);

-- Template "proyek titipan" sponsor (referensi, di-seed)
create table polsim.sponsor_demand_templates (
  code text primary key,
  deskripsi text not null,
  vendor_code text not null,       -- vendor titipan (harus is_sponsor_linked)
  nama_proyek text not null,
  base_cost bigint not null,
  markup_paksa numeric not null default 0.3,  -- markup yang "diminta" sponsor
  deadline_days int not null default 5,
  efek_refuse jsonb not null default '{}'::jsonb
);

-- Tagihan sponsor aktif per karakter (hanya jika has_oligarch_trait)
create table polsim.sponsor_demands (
  id uuid primary key default gen_random_uuid(),
  player_character_id uuid not null references polsim.player_characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  template_code text references polsim.sponsor_demand_templates(code),
  deskripsi text not null,
  vendor_code text,
  deadline_day int,
  status text not null default 'pending' check (status in ('pending', 'complied', 'refused')),
  efek_refuse jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index sponsor_demands_user_idx on polsim.sponsor_demands(user_id);

-- Temuan audit (service role only; pemain hanya melihat agregat via RPC get_my_ipk)
create table polsim.audit_flags (
  id uuid primary key default gen_random_uuid(),
  campaign_state_id uuid not null references polsim.campaign_state(id) on delete cascade,
  flag_type text not null check (flag_type in ('vendor_relational', 'jam_tidak_wajar', 'anggaran_janggal')),
  severity int not null check (severity between 1 and 3),
  detected_at timestamptz not null default now(),
  detail jsonb not null default '{}'::jsonb,
  project_id uuid references polsim.government_projects(id) on delete cascade
);
-- audit engine idempoten: satu flag per (proyek, tipe)
create unique index audit_flags_project_type_uidx
  on polsim.audit_flags(project_id, flag_type) where project_id is not null;
create index audit_flags_campaign_idx on polsim.audit_flags(campaign_state_id);

-- Riwayat skor IPK (Indeks Persepsi Kerawanan) — service role only
create table polsim.ipk_scores (
  id uuid primary key default gen_random_uuid(),
  campaign_state_id uuid not null references polsim.campaign_state(id) on delete cascade,
  score numeric not null check (score >= 0 and score <= 100),
  computed_at timestamptz not null default now(),
  breakdown jsonb not null default '{}'::jsonb
);
create index ipk_scores_campaign_idx on polsim.ipk_scores(campaign_state_id, computed_at desc);

-- Log game over
create table polsim.game_over_log (
  id uuid primary key default gen_random_uuid(),
  campaign_state_id uuid not null references polsim.campaign_state(id) on delete cascade,
  reason text not null,
  final_stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Leaderboard global (insert via RPC submit_leaderboard / audit engine)
create table polsim.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_state_id uuid not null unique references polsim.campaign_state(id) on delete cascade,
  display_name text not null,
  score numeric not null,
  breakdown jsonb not null default '{}'::jsonb,
  badge_code text,          -- kosmetik lencana yang sedang dipakai saat submit
  outcome text not null default 'selesai' check (outcome in ('selesai', 'kalah', 'ott')),
  created_at timestamptz not null default now()
);
create index leaderboard_score_idx on polsim.leaderboard_entries(score desc);
