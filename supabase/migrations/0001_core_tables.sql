-- ============================================================
-- PolSim Arcapada — Migration 0001: Core tables (Babak I-III)
-- Semua objek dibuat di schema polsim. Schema public TIDAK disentuh.
-- ============================================================
set search_path to polsim;

-- Wilayah fiksi Republik Arcapada
create table polsim.regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null check (type in ('provinsi', 'kota', 'kabupaten')),
  parent_region_id uuid references polsim.regions(id),
  -- indikator makro (hasil transformasi BPS, satuan mengikuti indikator riil)
  pendapatan_daerah numeric,                -- miliar Ʀupa (mata uang fiksi) / tahun
  ipm numeric check (ipm >= 0 and ipm <= 100),
  gini_ratio numeric check (gini_ratio >= 0 and gini_ratio <= 1),
  tingkat_pengangguran numeric check (tingkat_pengangguran >= 0 and tingkat_pengangguran <= 100),
  isu_sektoral jsonb not null default '[]'::jsonb,  -- [{kode, judul, sektor, severity 1-5, base_cost}]
  difficulty int not null default 1 check (difficulty between 1 and 5),
  is_vip_only boolean not null default false,
  deskripsi text,
  map_ref text,                             -- id <path> pada SVG peta
  source_updated_at timestamptz
);

-- Cache mentah BPS Web API (service role only via RLS)
create table polsim.bps_raw_cache (
  id bigint generated always as identity primary key,
  indikator text not null,
  wilayah_sumber text not null,
  nilai numeric,
  periode text not null default '',
  fetched_at timestamptz not null default now(),
  unique (indikator, wilayah_sumber, periode)
);

-- 4 faksi masyarakat
create table polsim.factions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon text
);

-- Kepuasan faksi per region (world state global, dipengaruhi world_events)
create table polsim.region_faction_satisfaction (
  region_id uuid not null references polsim.regions(id) on delete cascade,
  faction_id uuid not null references polsim.factions(id) on delete cascade,
  satisfaction_level int not null default 50 check (satisfaction_level between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (region_id, faction_id)
);

-- Partai fiksi (archetype ideologis, bukan kloning partai riil)
create table polsim.parties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  archetype_ideologi text not null check (archetype_ideologi in (
    'nasionalis_sekuler', 'religius_konservatif', 'teknokrat_progresif',
    'oligarki_bisnis', 'populis_akar_rumput'
  )),
  basis_konstituen text,
  sejarah_fiksi text,
  warna text,
  mahar_politik bigint not null default 0   -- "biaya tiket" satire, Ʀupa
);

-- Tokoh NPC composite-archetype (calon wakil, elit partai)
create table polsim.politicians (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  party_id uuid references polsim.parties(id),
  gender text not null check (gender in ('pria', 'wanita')),
  generasi text not null check (generasi in ('muda', 'menengah', 'senior')),
  -- 4 axis composite: nilai -100 .. +100
  axis_ekonomi int not null check (axis_ekonomi between -100 and 100),      -- -100 populis .. +100 pro-market
  axis_basis int not null check (axis_basis between -100 and 100),          -- -100 akar rumput .. +100 elite
  axis_komunikasi int not null check (axis_komunikasi between -100 and 100),-- -100 blak-blakan .. +100 formal
  axis_legitimasi text not null check (axis_legitimasi in ('dinasti', 'self_made', 'teknokrat', 'militer')),
  backstory text,
  portrait_description text,
  is_running_mate_candidate boolean not null default true
);

-- Karakter pemain
create table polsim.player_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  umur int not null check (umur between 25 and 75),
  pendidikan text not null,
  profesi text not null,
  uang bigint not null default 0,                 -- Ʀupa
  kepercayaan_publik int not null default 50 check (kepercayaan_publik between 0 and 100),
  koneksi_politik int not null default 10 check (koneksi_politik between 0 and 100),
  has_oligarch_trait boolean not null default false,
  has_vip_trait boolean not null default false,   -- trait premium tanpa debuff (VIP)
  utang_politik_level int not null default 0 check (utang_politik_level between 0 and 10),
  created_at timestamptz not null default now()
);
create index player_characters_user_idx on polsim.player_characters(user_id);

-- State kampanye / jabatan per playthrough
create table polsim.campaign_state (
  id uuid primary key default gen_random_uuid(),
  player_character_id uuid not null references polsim.player_characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_stage text not null default 'cari_tiket' check (current_stage in (
    'cari_tiket', 'meminang_wakil', 'perang_elektabilitas', 'hari_pemilihan',
    'menjabat', 'selesai', 'game_over'
  )),
  region_id uuid references polsim.regions(id),
  party_id uuid references polsim.parties(id),
  running_mate_id uuid references polsim.politicians(id),
  elektabilitas numeric not null default 5 check (elektabilitas >= 0 and elektabilitas <= 100),
  political_power int not null default 40 check (political_power between 0 and 100),
  dana_kampanye bigint not null default 0,
  -- standing faksi PERSONAL pemain (world baseline ada di region_faction_satisfaction)
  faction_standing jsonb not null default '{"buruh_tani":50,"menengah_urban":50,"tokoh_agama":50,"konsorsium_bisnis":50}'::jsonb,
  term_day int not null default 0,
  pembangunan_score int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index campaign_state_user_idx on polsim.campaign_state(user_id);
create index campaign_state_pc_idx on polsim.campaign_state(player_character_id);

-- Pool krisis (hand-authored + turunan berita)
create table polsim.crisis_events (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  options jsonb not null,   -- [{key,label,effects:{elektabilitas,dana_kampanye,kepercayaan_publik,faksi:{code:delta}}}]
  trigger_stage text not null default 'perang_elektabilitas',
  source text not null default 'hand_authored' check (source in ('hand_authored', 'news_derived')),
  created_at timestamptz not null default now()
);

-- Log pilihan pemain
create table polsim.player_choices_log (
  id bigint generated always as identity primary key,
  campaign_state_id uuid not null references polsim.campaign_state(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  crisis_event_id uuid references polsim.crisis_events(id),
  world_event_id uuid,      -- tanpa FK keras: log historis
  choice_key text,
  effects jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index player_choices_log_campaign_idx on polsim.player_choices_log(campaign_state_id);
