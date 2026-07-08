-- ============================================================
-- PolSim Arcapada — Migration 0003: Live News Layer + Monetisasi
-- ============================================================
set search_path to polsim;

-- ---------- Live News ----------

-- Admin reviewer (dicek oleh RPC & endpoint server)
create table polsim.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

-- Berita mentah dari RSS (service role only)
create table polsim.news_raw (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  source_name text,
  headline text not null,
  summary text,
  published_at timestamptz,
  scraped_at timestamptz not null default now(),
  content_hash text unique                    -- dedup antar-run
);

-- Hasil interpretasi AI menunggu approval manusia (TIDAK ada auto-publish)
create table polsim.pending_events (
  id uuid primary key default gen_random_uuid(),
  news_raw_id uuid references polsim.news_raw(id) on delete set null,
  ai_interpretation jsonb not null,           -- {sektor, efek_faksi, efek_variabel, ringkasan}
  draft_event jsonb not null,                 -- {title, narasi, effects, duration_days}
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);
create index pending_events_status_idx on polsim.pending_events(status, created_at desc);

-- Event dunia yang sudah di-approve dan aktif untuk SEMUA pemain
create table polsim.world_events (
  id uuid primary key default gen_random_uuid(),
  pending_event_id uuid references polsim.pending_events(id),
  title text not null,
  narasi text not null,                        -- narasi in-game konteks Arcapada, tanpa entitas riil
  effects jsonb not null default '{}'::jsonb,  -- {sektor, efek_faksi:{code:delta}, efek_variabel:{...}}
  duration_days int not null default 7,
  published_at timestamptz not null default now()
);
create index world_events_published_idx on polsim.world_events(published_at desc);

-- View event yang masih aktif
create view polsim.active_world_events
  with (security_invoker = true) as
  select * from polsim.world_events
  where published_at + (duration_days || ' days')::interval > now();

-- ---------- Monetisasi ----------

-- Konfigurasi game server-side (biaya token, bobot IPK, dsb — sumber: /data/config.ts)
create table polsim.game_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table polsim.user_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_balance int not null default 0 check (token_balance >= 0),
  last_daily_grant date,
  updated_at timestamptz not null default now()
);

create table polsim.token_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,                        -- +kredit / -debit
  type text not null check (type in ('topup', 'spend', 'daily_grant', 'refund', 'signup_bonus')),
  reference text,                             -- order_id Midtrans untuk topup
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index token_transactions_user_idx on polsim.token_transactions(user_id, created_at desc);

-- VIP "Intelijen Pusat": pembelian blok 30 hari yang bisa diperpanjang (bukan auto-recurring)
create table polsim.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null default 'vip',
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  midtrans_subscription_ref text
);
create index subscriptions_user_idx on polsim.subscriptions(user_id, expires_at desc);

create table polsim.cosmetic_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nama text not null,
  tipe text not null check (tipe in ('dekorasi_ruang', 'lencana')),
  harga_token int not null check (harga_token >= 0),
  asset_ref text,
  deskripsi text
);

create table polsim.user_cosmetics (
  user_id uuid not null references auth.users(id) on delete cascade,
  cosmetic_item_id uuid not null references polsim.cosmetic_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  equipped boolean not null default false,
  primary key (user_id, cosmetic_item_id)
);

-- Order pembayaran Midtrans.
-- Status HANYA diupdate oleh webhook notification bersignature valid (service role).
create table polsim.payment_orders (
  order_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  gross_amount numeric not null check (gross_amount > 0),
  item_type text not null check (item_type in ('token_topup', 'vip_30d')),
  item_meta jsonb not null default '{}'::jsonb,   -- {token_amount} / {days:30}
  status text not null default 'pending' check (status in (
    'pending', 'settlement', 'capture', 'expire', 'cancel', 'deny', 'challenge', 'refund'
  )),
  snap_token text,
  midtrans_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payment_orders_user_idx on polsim.payment_orders(user_id, created_at desc);

-- Realtime: pemain online menerima breaking news saat world_events di-publish
do $$
begin
  alter publication supabase_realtime add table polsim.world_events;
exception when duplicate_object then null;
end $$;
