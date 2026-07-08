-- ============================================================
-- PolSim Arcapada — Migration 0005: RPC functions
-- Semua mutasi sensitif (wallet, proyek, audit, pemilu, review)
-- berjalan server-side sebagai fungsi SECURITY DEFINER yang
-- memvalidasi auth.uid(). Formula dispesifikasikan juga di
-- /lib/formula (TypeScript) untuk unit test — keduanya harus sinkron.
-- ============================================================
set search_path to polsim;

-- ---------- Helpers ----------

create or replace function polsim.cfg(p_key text)
returns jsonb language sql stable security definer
set search_path = polsim
as $$ select value from polsim.game_config where key = p_key; $$;
revoke execute on function polsim.cfg(text) from public, anon;
grant execute on function polsim.cfg(text) to authenticated, service_role;

create or replace function polsim.clamp_num(v numeric, lo numeric, hi numeric)
returns numeric language sql immutable
as $$ select greatest(lo, least(hi, v)); $$;

-- Pastikan wallet ada (dipanggil internal oleh fungsi lain)
create or replace function polsim.ensure_wallet(p_user uuid)
returns void language plpgsql security definer
set search_path = polsim
as $$
declare v_bonus int := coalesce((polsim.cfg('signup_bonus')->>'amount')::int, 20);
begin
  insert into polsim.user_wallets(user_id, token_balance)
  values (p_user, v_bonus)
  on conflict (user_id) do nothing;
  if found then
    insert into polsim.token_transactions(user_id, amount, type, meta)
    values (p_user, v_bonus, 'signup_bonus', '{"note":"bonus pendaftaran"}'::jsonb);
  end if;
end $$;
revoke execute on function polsim.ensure_wallet(uuid) from public, anon, authenticated;
grant execute on function polsim.ensure_wallet(uuid) to service_role;

-- ---------- Wallet (atomic, anti double-spend) ----------

create or replace function polsim.claim_daily_grant()
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_amount int := coalesce((polsim.cfg('daily_grant')->>'amount')::int, 10);
  v_balance int;
  v_granted boolean := false;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  perform polsim.ensure_wallet(v_uid);
  -- atomic: hanya satu grant per hari (race-safe lewat kondisi WHERE)
  update polsim.user_wallets
     set token_balance = token_balance + v_amount,
         last_daily_grant = current_date,
         updated_at = now()
   where user_id = v_uid
     and (last_daily_grant is null or last_daily_grant < current_date)
   returning token_balance into v_balance;
  if found then
    v_granted := true;
    insert into polsim.token_transactions(user_id, amount, type)
    values (v_uid, v_amount, 'daily_grant');
  else
    select token_balance into v_balance from polsim.user_wallets where user_id = v_uid;
  end if;
  return jsonb_build_object('granted', v_granted, 'amount', case when v_granted then v_amount else 0 end, 'balance', v_balance);
end $$;
revoke execute on function polsim.claim_daily_grant() from public, anon;
grant execute on function polsim.claim_daily_grant() to authenticated;

create or replace function polsim.spend_tokens(p_amount int, p_reason text, p_meta jsonb default '{}'::jsonb)
returns int language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_balance int;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'JUMLAH_TIDAK_VALID'; end if;
  perform polsim.ensure_wallet(v_uid);
  -- atomic conditional update: gagal jika saldo kurang (anti race/double-spend)
  update polsim.user_wallets
     set token_balance = token_balance - p_amount, updated_at = now()
   where user_id = v_uid and token_balance >= p_amount
   returning token_balance into v_balance;
  if not found then raise exception 'TOKEN_TIDAK_CUKUP'; end if;
  insert into polsim.token_transactions(user_id, amount, type, reference, meta)
  values (v_uid, -p_amount, 'spend', p_reason, p_meta);
  return v_balance;
end $$;
revoke execute on function polsim.spend_tokens(int, text, jsonb) from public, anon;
grant execute on function polsim.spend_tokens(int, text, jsonb) to authenticated;

-- Kredit token: HANYA service role (dipanggil webhook Midtrans terverifikasi).
-- Idempoten per reference (order_id) — retry webhook tidak menggandakan saldo.
create or replace function polsim.credit_tokens(p_user_id uuid, p_amount int, p_type text, p_reference text default null)
returns int language plpgsql security definer
set search_path = polsim
as $$
declare v_balance int;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'JUMLAH_TIDAK_VALID'; end if;
  perform polsim.ensure_wallet(p_user_id);
  if p_reference is not null and exists (
    select 1 from polsim.token_transactions
    where user_id = p_user_id and reference = p_reference and type = p_type
  ) then
    select token_balance into v_balance from polsim.user_wallets where user_id = p_user_id;
    return v_balance; -- sudah pernah dikredit
  end if;
  update polsim.user_wallets
     set token_balance = token_balance + p_amount, updated_at = now()
   where user_id = p_user_id
   returning token_balance into v_balance;
  insert into polsim.token_transactions(user_id, amount, type, reference)
  values (p_user_id, p_amount, p_type, p_reference);
  return v_balance;
end $$;
revoke execute on function polsim.credit_tokens(uuid, int, text, text) from public, anon, authenticated;
grant execute on function polsim.credit_tokens(uuid, int, text, text) to service_role;

-- ---------- Kosmetik ----------

create or replace function polsim.purchase_cosmetic(p_item_code text)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_item polsim.cosmetic_items%rowtype;
  v_balance int;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_item from polsim.cosmetic_items where code = p_item_code;
  if not found then raise exception 'ITEM_TIDAK_DITEMUKAN'; end if;
  if exists (select 1 from polsim.user_cosmetics where user_id = v_uid and cosmetic_item_id = v_item.id) then
    raise exception 'SUDAH_DIMILIKI';
  end if;
  v_balance := polsim.spend_tokens(v_item.harga_token, 'cosmetic:' || p_item_code);
  insert into polsim.user_cosmetics(user_id, cosmetic_item_id) values (v_uid, v_item.id);
  return jsonb_build_object('item', p_item_code, 'balance', v_balance);
end $$;
revoke execute on function polsim.purchase_cosmetic(text) from public, anon;
grant execute on function polsim.purchase_cosmetic(text) to authenticated;

create or replace function polsim.equip_cosmetic(p_item_code text, p_equipped boolean)
returns void language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_item polsim.cosmetic_items%rowtype;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_item from polsim.cosmetic_items where code = p_item_code;
  if not found then raise exception 'ITEM_TIDAK_DITEMUKAN'; end if;
  if p_equipped and v_item.tipe = 'lencana' then
    -- hanya satu lencana terpasang
    update polsim.user_cosmetics uc set equipped = false
    from polsim.cosmetic_items ci
    where uc.user_id = v_uid and uc.cosmetic_item_id = ci.id and ci.tipe = 'lencana';
  end if;
  update polsim.user_cosmetics
     set equipped = p_equipped
   where user_id = v_uid and cosmetic_item_id = v_item.id;
  if not found then raise exception 'BELUM_DIMILIKI'; end if;
end $$;
revoke execute on function polsim.equip_cosmetic(text, boolean) from public, anon;
grant execute on function polsim.equip_cosmetic(text, boolean) to authenticated;

-- ---------- Kampanye: pilihan krisis (Babak III) ----------

create or replace function polsim.apply_choice(p_campaign uuid, p_event_id uuid, p_choice_key text)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_cs polsim.campaign_state%rowtype;
  v_opt jsonb;
  v_faksi record;
  v_standing jsonb;
  v_delta numeric;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_cs from polsim.campaign_state
   where id = p_campaign and user_id = v_uid for update;
  if not found then raise exception 'KAMPANYE_TIDAK_DITEMUKAN'; end if;
  if v_cs.current_stage <> 'perang_elektabilitas' then raise exception 'STAGE_SALAH'; end if;
  if exists (select 1 from polsim.player_choices_log
             where campaign_state_id = p_campaign and crisis_event_id = p_event_id) then
    raise exception 'SUDAH_DIJAWAB';
  end if;
  select opt into v_opt
    from polsim.crisis_events ce, jsonb_array_elements(ce.options) opt
   where ce.id = p_event_id and opt->>'key' = p_choice_key;
  if v_opt is null then raise exception 'PILIHAN_TIDAK_VALID'; end if;

  -- efek numerik
  v_standing := v_cs.faction_standing;
  for v_faksi in select key, value from jsonb_each(coalesce(v_opt->'effects'->'faksi', '{}'::jsonb)) loop
    v_delta := coalesce((v_standing->>v_faksi.key)::numeric, 50) + (v_faksi.value)::numeric;
    v_standing := jsonb_set(v_standing, array[v_faksi.key], to_jsonb(polsim.clamp_num(v_delta, 0, 100)));
  end loop;

  update polsim.campaign_state set
    elektabilitas = polsim.clamp_num(elektabilitas + coalesce((v_opt->'effects'->>'elektabilitas')::numeric, 0), 0, 100),
    dana_kampanye = greatest(0, dana_kampanye + coalesce((v_opt->'effects'->>'dana_kampanye')::bigint, 0)),
    faction_standing = v_standing,
    updated_at = now()
  where id = p_campaign;

  update polsim.player_characters set
    kepercayaan_publik = polsim.clamp_num(kepercayaan_publik + coalesce((v_opt->'effects'->>'kepercayaan_publik')::numeric, 0), 0, 100)::int
  where id = v_cs.player_character_id;

  insert into polsim.player_choices_log(campaign_state_id, user_id, crisis_event_id, choice_key, effects)
  values (p_campaign, v_uid, p_event_id, p_choice_key, coalesce(v_opt->'effects', '{}'::jsonb));

  select jsonb_build_object('elektabilitas', elektabilitas, 'dana_kampanye', dana_kampanye, 'faction_standing', faction_standing)
    into v_opt from polsim.campaign_state where id = p_campaign;
  return v_opt;
end $$;
revoke execute on function polsim.apply_choice(uuid, uuid, text) from public, anon;
grant execute on function polsim.apply_choice(uuid, uuid, text) to authenticated;

-- ---------- Hari Pemilihan (deterministik, tanpa random) ----------
-- final = bobot_e * elektabilitas + bobot_f * komponen_faksi - (difficulty-1)*2
-- komponen_faksi = 0.5 * rata2 faction_standing pemain + 0.5 * rata2 kepuasan baseline region
create or replace function polsim.resolve_election(p_campaign uuid)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_cs polsim.campaign_state%rowtype;
  v_pc polsim.player_characters%rowtype;
  v_standing_avg numeric;
  v_baseline_avg numeric;
  v_final numeric;
  v_win boolean;
  v_difficulty int;
  v_be numeric := coalesce((polsim.cfg('election')->>'bobot_elektabilitas')::numeric, 0.6);
  v_bf numeric := coalesce((polsim.cfg('election')->>'bobot_faksi')::numeric, 0.4);
  v_ambang numeric := coalesce((polsim.cfg('election')->>'ambang_menang')::numeric, 50);
  v_power int;
  v_tmpl record;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_cs from polsim.campaign_state where id = p_campaign and user_id = v_uid for update;
  if not found then raise exception 'KAMPANYE_TIDAK_DITEMUKAN'; end if;
  if v_cs.current_stage not in ('perang_elektabilitas', 'hari_pemilihan') then raise exception 'STAGE_SALAH'; end if;
  select * into v_pc from polsim.player_characters where id = v_cs.player_character_id;

  select avg(v::numeric) into v_standing_avg from jsonb_each_text(v_cs.faction_standing) as t(k, v);
  select coalesce(avg(satisfaction_level), 50) into v_baseline_avg
    from polsim.region_faction_satisfaction where region_id = v_cs.region_id;
  select coalesce(difficulty, 1) into v_difficulty from polsim.regions where id = v_cs.region_id;

  v_final := v_be * v_cs.elektabilitas
           + v_bf * (0.5 * coalesce(v_standing_avg, 50) + 0.5 * v_baseline_avg)
           - (v_difficulty - 1) * 2;
  v_win := v_final >= v_ambang;

  if v_win then
    v_power := polsim.clamp_num(round(40 + (v_final - v_ambang) * 1.2), 0, 100)::int;
    update polsim.campaign_state
       set current_stage = 'menjabat', political_power = v_power, term_day = 1, updated_at = now()
     where id = p_campaign;
    -- sponsor menagih "proyek titipan" bila trait oligarki
    if v_pc.has_oligarch_trait then
      for v_tmpl in
        select * from polsim.sponsor_demand_templates
        order by md5(code || p_campaign::text) limit 3
      loop
        insert into polsim.sponsor_demands(player_character_id, user_id, template_code, deskripsi, vendor_code, deadline_day, efek_refuse)
        values (v_pc.id, v_uid, v_tmpl.code, v_tmpl.deskripsi, v_tmpl.vendor_code, v_tmpl.deadline_days, v_tmpl.efek_refuse);
      end loop;
    end if;
  else
    update polsim.campaign_state set current_stage = 'selesai', updated_at = now() where id = p_campaign;
    perform polsim.submit_leaderboard_internal(p_campaign, 'kalah');
  end if;

  return jsonb_build_object('win', v_win, 'final_score', round(v_final, 2), 'ambang', v_ambang,
                            'elektabilitas', v_cs.elektabilitas, 'komponen_faksi',
                            round(0.5 * coalesce(v_standing_avg, 50) + 0.5 * v_baseline_avg, 2));
end $$;
revoke execute on function polsim.resolve_election(uuid) from public, anon;
grant execute on function polsim.resolve_election(uuid) to authenticated;

-- ---------- Babak IV: proyek, lobi, sponsor ----------

create or replace function polsim.lobi_dprd(p_project_id uuid, p_choice text)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_p polsim.government_projects%rowtype;
  v_cs polsim.campaign_state%rowtype;
  v_pc polsim.player_characters%rowtype;
  v_cost_token int := coalesce((polsim.cfg('token_costs')->>'lobi_dprd')::int, 3);
  v_biaya bigint;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_choice not in ('uang', 'koneksi') then raise exception 'PILIHAN_TIDAK_VALID'; end if;
  select * into v_p from polsim.government_projects where id = p_project_id and user_id = v_uid for update;
  if not found then raise exception 'PROYEK_TIDAK_DITEMUKAN'; end if;
  if v_p.status not in ('draft_kak', 'lobi_dprd') then raise exception 'STATUS_SALAH'; end if;
  select * into v_cs from polsim.campaign_state where id = v_p.campaign_state_id for update;
  select * into v_pc from polsim.player_characters where id = v_cs.player_character_id for update;

  perform polsim.spend_tokens(v_cost_token, 'lobi_dprd', jsonb_build_object('project', p_project_id));

  if p_choice = 'uang' then
    v_biaya := greatest(500, v_p.anggaran / 20); -- juta Ʀupa
    if v_pc.uang < v_biaya then raise exception 'UANG_TIDAK_CUKUP'; end if;
    update polsim.player_characters set uang = uang - v_biaya where id = v_pc.id;
  else
    if v_pc.koneksi_politik < 10 then raise exception 'KONEKSI_TIDAK_CUKUP'; end if;
    update polsim.player_characters set koneksi_politik = koneksi_politik - 10 where id = v_pc.id;
  end if;

  update polsim.government_projects set status = 'eksekusi' where id = p_project_id;
  update polsim.campaign_state
     set political_power = polsim.clamp_num(political_power + 5, 0, 100)::int, updated_at = now()
   where id = v_cs.id;
  return jsonb_build_object('status', 'eksekusi', 'token_cost', v_cost_token, 'via', p_choice);
end $$;
revoke execute on function polsim.lobi_dprd(uuid, text) from public, anon;
grant execute on function polsim.lobi_dprd(uuid, text) to authenticated;

-- p_executed_at hanya untuk pengujian rule audit "jam tidak wajar"
-- (memajukan waktu eksekusi hanya menaikkan risiko audit pemain sendiri).
create or replace function polsim.execute_project(p_project_id uuid, p_executed_at timestamptz default null)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_p polsim.government_projects%rowtype;
  v_cs polsim.campaign_state%rowtype;
  v_threshold int := coalesce((polsim.cfg('political_power_threshold')->>'value')::int, 50);
  v_costs jsonb := coalesce(polsim.cfg('token_costs'), '{}'::jsonb);
  v_besar bigint := coalesce((v_costs->>'proyek_besar_threshold')::bigint, 50000);
  v_cost int;
  v_exec_at timestamptz;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_p from polsim.government_projects where id = p_project_id and user_id = v_uid for update;
  if not found then raise exception 'PROYEK_TIDAK_DITEMUKAN'; end if;
  if v_p.status = 'selesai' then raise exception 'SUDAH_SELESAI'; end if;
  select * into v_cs from polsim.campaign_state where id = v_p.campaign_state_id for update;
  if v_cs.current_stage <> 'menjabat' then raise exception 'BELUM_MENJABAT'; end if;
  if v_p.status in ('draft_kak', 'lobi_dprd') and v_cs.political_power < v_threshold then
    update polsim.government_projects set status = 'lobi_dprd' where id = p_project_id;
    raise exception 'PERLU_LOBI_DPRD';
  end if;

  v_cost := case when v_p.anggaran >= v_besar
                 then coalesce((v_costs->>'eksekusi_proyek_besar')::int, 8)
                 else coalesce((v_costs->>'eksekusi_proyek')::int, 5) end;
  perform polsim.spend_tokens(v_cost, 'eksekusi_proyek', jsonb_build_object('project', p_project_id));

  v_exec_at := coalesce(p_executed_at, now());
  update polsim.government_projects
     set status = 'selesai', executed_at = v_exec_at
   where id = p_project_id;
  update polsim.campaign_state
     set pembangunan_score = pembangunan_score + v_p.impact,
         political_power = polsim.clamp_num(political_power - v_p.political_power_cost, 0, 100)::int,
         term_day = term_day + 1,
         updated_at = now()
   where id = v_cs.id;
  update polsim.player_characters
     set kepercayaan_publik = polsim.clamp_num(kepercayaan_publik + 2, 0, 100)::int
   where id = v_cs.player_character_id;

  return jsonb_build_object('status', 'selesai', 'token_cost', v_cost, 'executed_at', v_exec_at,
                            'impact', v_p.impact);
end $$;
revoke execute on function polsim.execute_project(uuid, timestamptz) from public, anon;
grant execute on function polsim.execute_project(uuid, timestamptz) to authenticated;

create or replace function polsim.resolve_sponsor_demand(p_demand_id uuid, p_action text)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_d polsim.sponsor_demands%rowtype;
  v_tmpl polsim.sponsor_demand_templates%rowtype;
  v_vendor polsim.vendors%rowtype;
  v_cs polsim.campaign_state%rowtype;
  v_project_id uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_action not in ('comply', 'refuse') then raise exception 'AKSI_TIDAK_VALID'; end if;
  select * into v_d from polsim.sponsor_demands where id = p_demand_id and user_id = v_uid for update;
  if not found then raise exception 'TAGIHAN_TIDAK_DITEMUKAN'; end if;
  if v_d.status <> 'pending' then raise exception 'SUDAH_DIRESOLUSI'; end if;
  select * into v_cs from polsim.campaign_state
   where player_character_id = v_d.player_character_id and is_active order by created_at desc limit 1 for update;

  if p_action = 'refuse' then
    update polsim.sponsor_demands set status = 'refused', resolved_at = now() where id = p_demand_id;
    update polsim.player_characters set
      uang = greatest(0, uang + coalesce((v_d.efek_refuse->>'uang')::bigint, 0)),
      kepercayaan_publik = polsim.clamp_num(kepercayaan_publik + coalesce((v_d.efek_refuse->>'kepercayaan_publik')::numeric, 0), 0, 100)::int
    where id = v_d.player_character_id;
    if v_cs.id is not null then
      update polsim.campaign_state set
        political_power = polsim.clamp_num(political_power + coalesce((v_d.efek_refuse->>'political_power')::numeric, 0), 0, 100)::int,
        dana_kampanye = greatest(0, dana_kampanye + coalesce((v_d.efek_refuse->>'dana_kampanye')::bigint, 0)),
        updated_at = now()
      where id = v_cs.id;
    end if;
    return jsonb_build_object('status', 'refused', 'efek', v_d.efek_refuse);
  end if;

  -- comply: buat proyek titipan siap-eksekusi dengan vendor sponsor & markup paksa
  select * into v_tmpl from polsim.sponsor_demand_templates where code = v_d.template_code;
  if not found then raise exception 'TEMPLATE_TIDAK_DITEMUKAN'; end if;
  select * into v_vendor from polsim.vendors where code = v_tmpl.vendor_code;
  if not found then raise exception 'VENDOR_TIDAK_DITEMUKAN'; end if;
  if v_cs.id is null then raise exception 'KAMPANYE_TIDAK_AKTIF'; end if;

  insert into polsim.government_projects
    (campaign_state_id, user_id, nama_proyek, isu_target, base_cost, anggaran, vendor_id,
     status, political_power_cost, sponsor_demand_id, impact)
  values
    (v_cs.id, v_uid, v_tmpl.nama_proyek, 'titipan_sponsor', v_tmpl.base_cost,
     round(v_tmpl.base_cost * (1 + v_tmpl.markup_paksa))::bigint, v_vendor.id,
     'eksekusi', 5, p_demand_id, 6)
  returning id into v_project_id;

  update polsim.sponsor_demands set status = 'complied', resolved_at = now() where id = p_demand_id;
  return jsonb_build_object('status', 'complied', 'project_id', v_project_id);
end $$;
revoke execute on function polsim.resolve_sponsor_demand(uuid, text) from public, anon;
grant execute on function polsim.resolve_sponsor_demand(uuid, text) to authenticated;

-- ---------- Skor akhir & leaderboard ----------

create or replace function polsim.compute_final_score(p_campaign uuid)
returns jsonb language plpgsql stable security definer
set search_path = polsim
as $$
declare
  v_cs polsim.campaign_state%rowtype;
  v_w jsonb := coalesce(polsim.cfg('score_weights'), '{"pembangunan":0.4,"faksi":0.3,"integritas":0.3}'::jsonb);
  v_pemb numeric; v_faksi numeric; v_ipk numeric; v_score numeric;
begin
  select * into v_cs from polsim.campaign_state where id = p_campaign;
  if not found then raise exception 'KAMPANYE_TIDAK_DITEMUKAN'; end if;
  v_pemb := least(100, v_cs.pembangunan_score);
  select coalesce(avg(v::numeric), 50) into v_faksi from jsonb_each_text(v_cs.faction_standing) as t(k, v);
  select coalesce((select score from polsim.ipk_scores where campaign_state_id = p_campaign
                   order by computed_at desc limit 1), 0) into v_ipk;
  v_score := round(
      (v_w->>'pembangunan')::numeric * v_pemb
    + (v_w->>'faksi')::numeric * v_faksi
    + (v_w->>'integritas')::numeric * (100 - v_ipk), 1);
  return jsonb_build_object('score', v_score, 'pembangunan', v_pemb, 'faksi', round(v_faksi, 1),
                            'integritas', 100 - v_ipk, 'ipk', v_ipk);
end $$;
revoke execute on function polsim.compute_final_score(uuid) from public, anon;
grant execute on function polsim.compute_final_score(uuid) to authenticated, service_role;

-- internal: dipakai resolve_election (kalah) & audit engine (OTT)
create or replace function polsim.submit_leaderboard_internal(p_campaign uuid, p_outcome text)
returns uuid language plpgsql security definer
set search_path = polsim
as $$
declare
  v_cs polsim.campaign_state%rowtype;
  v_pc polsim.player_characters%rowtype;
  v_breakdown jsonb;
  v_badge text;
  v_id uuid;
begin
  select * into v_cs from polsim.campaign_state where id = p_campaign;
  select * into v_pc from polsim.player_characters where id = v_cs.player_character_id;
  v_breakdown := polsim.compute_final_score(p_campaign);
  select ci.code into v_badge
    from polsim.user_cosmetics uc join polsim.cosmetic_items ci on ci.id = uc.cosmetic_item_id
   where uc.user_id = v_cs.user_id and uc.equipped and ci.tipe = 'lencana' limit 1;
  insert into polsim.leaderboard_entries(user_id, campaign_state_id, display_name, score, breakdown, badge_code, outcome)
  values (v_cs.user_id, p_campaign, v_pc.nama, (v_breakdown->>'score')::numeric, v_breakdown, v_badge, p_outcome)
  on conflict (campaign_state_id) do update
    set score = excluded.score, breakdown = excluded.breakdown,
        badge_code = excluded.badge_code, outcome = excluded.outcome
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function polsim.submit_leaderboard_internal(uuid, text) from public, anon, authenticated;
grant execute on function polsim.submit_leaderboard_internal(uuid, text) to service_role;

-- publik: pemain mengakhiri masa jabatan & submit skor
create or replace function polsim.submit_leaderboard(p_campaign uuid)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_cs polsim.campaign_state%rowtype;
  v_outcome text;
  v_id uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_cs from polsim.campaign_state where id = p_campaign and user_id = v_uid for update;
  if not found then raise exception 'KAMPANYE_TIDAK_DITEMUKAN'; end if;
  if v_cs.current_stage = 'game_over' then v_outcome := 'ott';
  elsif v_cs.current_stage in ('menjabat', 'selesai') then v_outcome := 'selesai';
  else raise exception 'STAGE_SALAH';
  end if;
  if v_cs.current_stage = 'menjabat' then
    update polsim.campaign_state set current_stage = 'selesai', updated_at = now() where id = p_campaign;
  end if;
  v_id := polsim.submit_leaderboard_internal(p_campaign, v_outcome);
  return jsonb_build_object('entry_id', v_id) || polsim.compute_final_score(p_campaign);
end $$;
revoke execute on function polsim.submit_leaderboard(uuid) from public, anon;
grant execute on function polsim.submit_leaderboard(uuid) to authenticated;

-- ---------- Meter risiko pemain (agregat, tanpa detail flag) ----------

create or replace function polsim.get_my_ipk(p_campaign uuid)
returns jsonb language plpgsql stable security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_score numeric;
  v_counts jsonb;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from polsim.campaign_state where id = p_campaign and user_id = v_uid) then
    raise exception 'KAMPANYE_TIDAK_DITEMUKAN';
  end if;
  select score into v_score from polsim.ipk_scores
   where campaign_state_id = p_campaign order by computed_at desc limit 1;
  select coalesce(jsonb_object_agg(flag_type, cnt), '{}'::jsonb) into v_counts
    from (select flag_type, count(*) cnt from polsim.audit_flags
           where campaign_state_id = p_campaign group by flag_type) t;
  return jsonb_build_object('score', coalesce(v_score, 0), 'flag_counts', v_counts);
end $$;
revoke execute on function polsim.get_my_ipk(uuid) from public, anon;
grant execute on function polsim.get_my_ipk(uuid) to authenticated;

-- ---------- Audit Engine (deterministik — service role / n8n) ----------
-- Aturan:
--  1. vendor_relational : proyek selesai dgn vendor is_sponsor_linked
--       severity 3 bila proyek titipan sponsor, selain itu 2
--  2. jam_tidak_wajar   : executed_at jam 00:00-04:00 UTC → severity 2
--  3. anggaran_janggal  : markup=(anggaran-base_cost)/base_cost
--       > markup_high → 3, > markup_med → 2, > markup_warn → 1
-- IPK = clamp( Σ bobot[tipe]×severity + complied×w_sponsor − clean×w_clean , 0..100 )
-- IPK ≥ 80 → OTT oleh Komisi Integritas Arcapada → game over + leaderboard.
create or replace function polsim.run_audit_engine(p_campaign_state_id uuid default null)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_cs record;
  v_th jsonb := coalesce(polsim.cfg('audit_thresholds'),
    '{"markup_warn":0.2,"markup_med":0.35,"markup_high":0.5,"night_start":0,"night_end":4}'::jsonb);
  v_w jsonb := coalesce(polsim.cfg('ipk_weights'),
    '{"vendor_relational":12,"jam_tidak_wajar":8,"anggaran_janggal":10,"sponsor_complied":5,"clean_project_credit":4}'::jsonb);
  v_ott_threshold numeric := coalesce((polsim.cfg('ipk_ott_threshold')->>'value')::numeric, 80);
  v_flags_added int := 0;
  v_campaigns int := 0;
  v_game_overs int := 0;
  v_n int;
  v_sum numeric; v_complied int; v_clean int; v_score numeric;
  v_breakdown jsonb;
begin
  for v_cs in
    select cs.* from polsim.campaign_state cs
    where cs.current_stage = 'menjabat'
      and (p_campaign_state_id is null or cs.id = p_campaign_state_id)
  loop
    v_campaigns := v_campaigns + 1;

    -- Rule 1: vendor relational
    insert into polsim.audit_flags(campaign_state_id, flag_type, severity, detail, project_id)
    select v_cs.id, 'vendor_relational',
           case when p.sponsor_demand_id is not null then 3 else 2 end,
           jsonb_build_object('vendor', v.code, 'proyek', p.nama_proyek, 'titipan', p.sponsor_demand_id is not null),
           p.id
      from polsim.government_projects p
      join polsim.vendors v on v.id = p.vendor_id
     where p.campaign_state_id = v_cs.id and p.status = 'selesai' and v.is_sponsor_linked
    on conflict (project_id, flag_type) where project_id is not null do nothing;
    get diagnostics v_n = row_count; v_flags_added := v_flags_added + v_n;

    -- Rule 2: jam tidak wajar (00:00-04:00 UTC)
    insert into polsim.audit_flags(campaign_state_id, flag_type, severity, detail, project_id)
    select v_cs.id, 'jam_tidak_wajar', 2,
           jsonb_build_object('jam_utc', extract(hour from p.executed_at at time zone 'UTC'), 'proyek', p.nama_proyek),
           p.id
      from polsim.government_projects p
     where p.campaign_state_id = v_cs.id and p.status = 'selesai' and p.executed_at is not null
       and extract(hour from p.executed_at at time zone 'UTC')
             between (v_th->>'night_start')::int and (v_th->>'night_end')::int - 1
    on conflict (project_id, flag_type) where project_id is not null do nothing;
    get diagnostics v_n = row_count; v_flags_added := v_flags_added + v_n;

    -- Rule 3: anggaran janggal (markup RAB vs HPS)
    insert into polsim.audit_flags(campaign_state_id, flag_type, severity, detail, project_id)
    select v_cs.id, 'anggaran_janggal',
           case
             when markup > (v_th->>'markup_high')::numeric then 3
             when markup > (v_th->>'markup_med')::numeric then 2
             else 1
           end,
           jsonb_build_object('markup', round(markup, 3), 'proyek', nama_proyek),
           pid
      from (
        select p.id as pid, p.nama_proyek,
               (p.anggaran - p.base_cost)::numeric / p.base_cost as markup
          from polsim.government_projects p
         where p.campaign_state_id = v_cs.id and p.status = 'selesai'
      ) t
     where markup > (v_th->>'markup_warn')::numeric
    on conflict (project_id, flag_type) where project_id is not null do nothing;
    get diagnostics v_n = row_count; v_flags_added := v_flags_added + v_n;

    -- Hitung IPK
    select coalesce(sum((v_w->>flag_type)::numeric * severity), 0) into v_sum
      from polsim.audit_flags where campaign_state_id = v_cs.id;
    select count(*) into v_complied from polsim.sponsor_demands sd
     where sd.player_character_id = v_cs.player_character_id and sd.status = 'complied';
    select count(*) into v_clean
      from polsim.government_projects p
     where p.campaign_state_id = v_cs.id and p.status = 'selesai'
       and not exists (select 1 from polsim.audit_flags f where f.project_id = p.id);

    v_score := polsim.clamp_num(
      v_sum + v_complied * (v_w->>'sponsor_complied')::numeric
            - v_clean * (v_w->>'clean_project_credit')::numeric, 0, 100);
    v_breakdown := jsonb_build_object(
      'sum_flags', v_sum, 'complied_demands', v_complied, 'clean_projects', v_clean,
      'weights', v_w);
    insert into polsim.ipk_scores(campaign_state_id, score, breakdown)
    values (v_cs.id, v_score, v_breakdown);

    -- OTT
    if v_score >= v_ott_threshold then
      update polsim.campaign_state set current_stage = 'game_over', updated_at = now() where id = v_cs.id;
      insert into polsim.game_over_log(campaign_state_id, reason, final_stats)
      values (v_cs.id,
              'Operasi Tangkap Tangan oleh Komisi Integritas Arcapada — IPK ' || v_score,
              polsim.compute_final_score(v_cs.id) || jsonb_build_object('ipk', v_score));
      perform polsim.submit_leaderboard_internal(v_cs.id, 'ott');
      v_game_overs := v_game_overs + 1;
    end if;
  end loop;

  return jsonb_build_object('campaigns_audited', v_campaigns, 'flags_added', v_flags_added,
                            'game_overs', v_game_overs);
end $$;
revoke execute on function polsim.run_audit_engine(uuid) from public, anon, authenticated;
grant execute on function polsim.run_audit_engine(uuid) to service_role;

-- ---------- Review admin: pending_events → world_events ----------

create or replace function polsim.admin_review_pending_event(p_pending_id uuid, p_approve boolean)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_pe polsim.pending_events%rowtype;
  v_we_id uuid;
  v_faksi record;
  v_faction_id uuid;
begin
  if v_uid is null or not polsim.is_admin() then raise exception 'BUKAN_ADMIN'; end if;
  select * into v_pe from polsim.pending_events where id = p_pending_id for update;
  if not found then raise exception 'EVENT_TIDAK_DITEMUKAN'; end if;
  if v_pe.status <> 'pending' then raise exception 'SUDAH_DIREVIEW'; end if;

  update polsim.pending_events
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_at = now(), reviewed_by = v_uid
   where id = p_pending_id;

  if not p_approve then
    return jsonb_build_object('status', 'rejected');
  end if;

  insert into polsim.world_events(pending_event_id, title, narasi, effects, duration_days)
  values (p_pending_id,
          coalesce(v_pe.draft_event->>'title', 'Kabar Arcapada'),
          coalesce(v_pe.draft_event->>'narasi', ''),
          coalesce(v_pe.draft_event->'effects', v_pe.ai_interpretation),
          coalesce((v_pe.draft_event->>'duration_days')::int, 7))
  returning id into v_we_id;

  -- geser baseline kepuasan faksi di semua region (clamp 0..100)
  for v_faksi in
    select key, value from jsonb_each(coalesce(v_pe.draft_event->'effects'->'efek_faksi', '{}'::jsonb))
  loop
    select id into v_faction_id from polsim.factions where code = v_faksi.key;
    if v_faction_id is not null then
      update polsim.region_faction_satisfaction
         set satisfaction_level = polsim.clamp_num(satisfaction_level + (v_faksi.value)::numeric, 0, 100)::int,
             updated_at = now()
       where faction_id = v_faction_id;
    end if;
  end loop;

  return jsonb_build_object('status', 'approved', 'world_event_id', v_we_id);
end $$;
revoke execute on function polsim.admin_review_pending_event(uuid, boolean) from public, anon;
grant execute on function polsim.admin_review_pending_event(uuid, boolean) to authenticated;
