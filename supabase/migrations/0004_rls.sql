-- ============================================================
-- PolSim Arcapada — Migration 0004: Row Level Security
-- Prinsip:
--  * Referensi dunia  : SELECT authenticated, tulis service role
--  * Data personal    : hanya auth.uid() pemilik
--  * Pipeline/audit   : service role only (+ admin utk review pending_events)
--  * Wallet & payment : SELECT pemilik; mutasi hanya via RPC/webhook
-- ============================================================
set search_path to polsim;

-- helper: apakah user sekarang admin?
create or replace function polsim.is_admin()
returns boolean
language sql stable security definer
set search_path = polsim
as $$
  select exists (select 1 from polsim.admin_users where user_id = auth.uid());
$$;
revoke execute on function polsim.is_admin() from public, anon;
grant execute on function polsim.is_admin() to authenticated, service_role;

-- enable RLS di semua tabel polsim
alter table polsim.regions enable row level security;
alter table polsim.bps_raw_cache enable row level security;
alter table polsim.factions enable row level security;
alter table polsim.region_faction_satisfaction enable row level security;
alter table polsim.parties enable row level security;
alter table polsim.politicians enable row level security;
alter table polsim.player_characters enable row level security;
alter table polsim.campaign_state enable row level security;
alter table polsim.crisis_events enable row level security;
alter table polsim.player_choices_log enable row level security;
alter table polsim.vendors enable row level security;
alter table polsim.government_projects enable row level security;
alter table polsim.sponsor_demand_templates enable row level security;
alter table polsim.sponsor_demands enable row level security;
alter table polsim.audit_flags enable row level security;
alter table polsim.ipk_scores enable row level security;
alter table polsim.game_over_log enable row level security;
alter table polsim.leaderboard_entries enable row level security;
alter table polsim.admin_users enable row level security;
alter table polsim.news_raw enable row level security;
alter table polsim.pending_events enable row level security;
alter table polsim.world_events enable row level security;
alter table polsim.game_config enable row level security;
alter table polsim.user_wallets enable row level security;
alter table polsim.token_transactions enable row level security;
alter table polsim.subscriptions enable row level security;
alter table polsim.cosmetic_items enable row level security;
alter table polsim.user_cosmetics enable row level security;
alter table polsim.payment_orders enable row level security;

-- ---------- Referensi dunia: read authenticated ----------
create policy "read regions" on polsim.regions for select to authenticated using (true);
create policy "read factions" on polsim.factions for select to authenticated using (true);
create policy "read rfs" on polsim.region_faction_satisfaction for select to authenticated using (true);
create policy "read parties" on polsim.parties for select to authenticated using (true);
create policy "read politicians" on polsim.politicians for select to authenticated using (true);
create policy "read crisis_events" on polsim.crisis_events for select to authenticated using (true);
create policy "read vendors" on polsim.vendors for select to authenticated using (true);
create policy "read cosmetic_items" on polsim.cosmetic_items for select to authenticated using (true);
create policy "read world_events" on polsim.world_events for select to authenticated using (true);
create policy "read game_config" on polsim.game_config for select to authenticated using (true);
create policy "read leaderboard" on polsim.leaderboard_entries for select to authenticated using (true);

-- ---------- Data personal ----------
create policy "own pc select" on polsim.player_characters for select to authenticated using (user_id = auth.uid());
create policy "own pc insert" on polsim.player_characters for insert to authenticated with check (user_id = auth.uid());
create policy "own pc update" on polsim.player_characters for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own cs select" on polsim.campaign_state for select to authenticated using (user_id = auth.uid());
create policy "own cs insert" on polsim.campaign_state for insert to authenticated with check (user_id = auth.uid());
create policy "own cs update" on polsim.campaign_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own log select" on polsim.player_choices_log for select to authenticated using (user_id = auth.uid());
create policy "own log insert" on polsim.player_choices_log for insert to authenticated with check (user_id = auth.uid());

create policy "own gp select" on polsim.government_projects for select to authenticated using (user_id = auth.uid());
create policy "own gp insert" on polsim.government_projects for insert to authenticated with check (user_id = auth.uid());
create policy "own gp update" on polsim.government_projects for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own sd select" on polsim.sponsor_demands for select to authenticated using (user_id = auth.uid());
-- sponsor_demands dibuat & diresolusi via RPC (security definer) — tanpa policy insert/update client

create policy "own gol select" on polsim.game_over_log for select to authenticated
  using (exists (select 1 from polsim.campaign_state cs where cs.id = campaign_state_id and cs.user_id = auth.uid()));

-- ---------- Wallet & payment: SELECT pemilik saja ----------
create policy "own wallet select" on polsim.user_wallets for select to authenticated using (user_id = auth.uid());
create policy "own tx select" on polsim.token_transactions for select to authenticated using (user_id = auth.uid());
create policy "own subs select" on polsim.subscriptions for select to authenticated using (user_id = auth.uid());
create policy "own cosmetics select" on polsim.user_cosmetics for select to authenticated using (user_id = auth.uid());
create policy "own orders select" on polsim.payment_orders for select to authenticated using (user_id = auth.uid());

-- ---------- Admin & pipeline ----------
-- admin_users: user boleh cek dirinya sendiri (untuk menampilkan menu admin)
create policy "self admin check" on polsim.admin_users for select to authenticated using (user_id = auth.uid());

-- pending_events & news_raw: admin boleh baca untuk review; tulis tetap service role
create policy "admin read pending" on polsim.pending_events for select to authenticated using (polsim.is_admin());
create policy "admin read news" on polsim.news_raw for select to authenticated using (polsim.is_admin());

-- bps_raw_cache, audit_flags, ipk_scores: TIDAK ada policy utk authenticated → service role only.
-- (pemain melihat agregat risiko via RPC get_my_ipk yang security definer)
