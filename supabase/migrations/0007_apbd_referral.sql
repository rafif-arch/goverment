-- ============================================================
-- PolSim Arcapada — Migration 0007: APBD + Referral + markup "dana taktis"
-- * APBD: alokasi belanja modal saat menjabat = pendapatan_daerah × 1000 × porsi (juta Ʀ)
-- * execute_project: potong APBD; SISA MARKUP masuk dana_kampanye (godaan korupsi)
-- * Referral: ajak teman → dua-duanya dapat token
-- ============================================================
set search_path to polsim;

alter table polsim.campaign_state add column if not exists apbd_total bigint not null default 0;
alter table polsim.campaign_state add column if not exists apbd_sisa bigint not null default 0;

alter table polsim.user_wallets add column if not exists referral_code text unique;

create table if not exists polsim.referrals (
  referee_user_id uuid primary key references auth.users(id) on delete cascade,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table polsim.referrals enable row level security;
create policy "own referrals" on polsim.referrals for select to authenticated
  using (referee_user_id = auth.uid() or referrer_user_id = auth.uid());

alter table polsim.token_transactions drop constraint token_transactions_type_check;
alter table polsim.token_transactions add constraint token_transactions_type_check
  check (type in ('topup', 'spend', 'daily_grant', 'refund', 'signup_bonus', 'referral'));

insert into polsim.game_config(key, value) values ('referral', '{"bonus":15}'::jsonb)
on conflict (key) do nothing;
insert into polsim.game_config(key, value) values ('apbd', '{"porsi_belanja_modal":0.1}'::jsonb)
on conflict (key) do nothing;

create or replace function polsim.ensure_wallet(p_user uuid)
returns void language plpgsql security definer
set search_path = polsim
as $$
declare v_bonus int := coalesce((polsim.cfg('signup_bonus')->>'amount')::int, 20);
begin
  insert into polsim.user_wallets(user_id, token_balance, referral_code)
  values (p_user, v_bonus, substr(md5(gen_random_uuid()::text), 1, 8))
  on conflict (user_id) do nothing;
  if found then
    insert into polsim.token_transactions(user_id, amount, type, meta)
    values (p_user, v_bonus, 'signup_bonus', '{"note":"bonus pendaftaran"}'::jsonb);
  else
    update polsim.user_wallets
       set referral_code = substr(md5(gen_random_uuid()::text), 1, 8)
     where user_id = p_user and referral_code is null;
  end if;
end $$;

create or replace function polsim.get_my_referral()
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_code text; v_count int; v_redeemed boolean;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  perform polsim.ensure_wallet(v_uid);
  select referral_code into v_code from polsim.user_wallets where user_id = v_uid;
  select count(*) into v_count from polsim.referrals where referrer_user_id = v_uid;
  select exists(select 1 from polsim.referrals where referee_user_id = v_uid) into v_redeemed;
  return jsonb_build_object('code', v_code, 'invited', v_count, 'already_redeemed', v_redeemed,
                            'bonus', coalesce((polsim.cfg('referral')->>'bonus')::int, 15));
end $$;
revoke execute on function polsim.get_my_referral() from public, anon;
grant execute on function polsim.get_my_referral() to authenticated;

create or replace function polsim.redeem_referral(p_code text)
returns jsonb language plpgsql security definer
set search_path = polsim
as $$
declare
  v_uid uuid := auth.uid();
  v_referrer uuid;
  v_bonus int := coalesce((polsim.cfg('referral')->>'bonus')::int, 15);
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  perform polsim.ensure_wallet(v_uid);
  if exists (select 1 from polsim.referrals where referee_user_id = v_uid) then
    raise exception 'SUDAH_PERNAH';
  end if;
  select user_id into v_referrer from polsim.user_wallets
   where referral_code = lower(trim(p_code));
  if not found then raise exception 'KODE_TIDAK_DITEMUKAN'; end if;
  if v_referrer = v_uid then raise exception 'KODE_SENDIRI'; end if;

  insert into polsim.referrals(referee_user_id, referrer_user_id) values (v_uid, v_referrer);
  update polsim.user_wallets set token_balance = token_balance + v_bonus, updated_at = now()
   where user_id in (v_uid, v_referrer);
  insert into polsim.token_transactions(user_id, amount, type, reference)
  values (v_uid, v_bonus, 'referral', 'ref-in:' || v_referrer),
         (v_referrer, v_bonus, 'referral', 'ref-out:' || v_uid);
  return jsonb_build_object('bonus', v_bonus);
end $$;
revoke execute on function polsim.redeem_referral(text) from public, anon;
grant execute on function polsim.redeem_referral(text) to authenticated;

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
  v_pendapatan numeric;
  v_apbd bigint;
  v_porsi numeric := coalesce((polsim.cfg('apbd')->>'porsi_belanja_modal')::numeric, 0.1);
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
  select coalesce(difficulty, 1), coalesce(pendapatan_daerah, 1000)
    into v_difficulty, v_pendapatan from polsim.regions where id = v_cs.region_id;

  v_final := v_be * v_cs.elektabilitas
           + v_bf * (0.5 * coalesce(v_standing_avg, 50) + 0.5 * v_baseline_avg)
           - (v_difficulty - 1) * 2;
  v_win := v_final >= v_ambang;

  if v_win then
    v_power := polsim.clamp_num(round(40 + (v_final - v_ambang) * 1.2), 0, 100)::int;
    v_apbd := round(v_pendapatan * 1000 * v_porsi)::bigint;
    update polsim.campaign_state
       set current_stage = 'menjabat', political_power = v_power, term_day = 1,
           apbd_total = v_apbd, apbd_sisa = v_apbd, updated_at = now()
     where id = p_campaign;
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
                            'apbd', coalesce(v_apbd, 0),
                            'elektabilitas', v_cs.elektabilitas, 'komponen_faksi',
                            round(0.5 * coalesce(v_standing_avg, 50) + 0.5 * v_baseline_avg, 2));
end $$;

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
  v_markup_gain bigint;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_p from polsim.government_projects where id = p_project_id and user_id = v_uid for update;
  if not found then raise exception 'PROYEK_TIDAK_DITEMUKAN'; end if;
  if v_p.status = 'selesai' then raise exception 'SUDAH_SELESAI'; end if;
  select * into v_cs from polsim.campaign_state where id = v_p.campaign_state_id for update;
  if v_cs.current_stage <> 'menjabat' then raise exception 'BELUM_MENJABAT'; end if;
  if v_cs.apbd_sisa < v_p.anggaran then raise exception 'APBD_TIDAK_CUKUP'; end if;
  if v_p.status in ('draft_kak', 'lobi_dprd') and v_cs.political_power < v_threshold then
    update polsim.government_projects set status = 'lobi_dprd' where id = p_project_id;
    raise exception 'PERLU_LOBI_DPRD';
  end if;

  v_cost := case when v_p.anggaran >= v_besar
                 then coalesce((v_costs->>'eksekusi_proyek_besar')::int, 8)
                 else coalesce((v_costs->>'eksekusi_proyek')::int, 5) end;
  perform polsim.spend_tokens(v_cost, 'eksekusi_proyek', jsonb_build_object('project', p_project_id));

  v_exec_at := coalesce(p_executed_at, now());
  v_markup_gain := greatest(0, v_p.anggaran - v_p.base_cost);
  update polsim.government_projects
     set status = 'selesai', executed_at = v_exec_at
   where id = p_project_id;
  update polsim.campaign_state
     set pembangunan_score = pembangunan_score + v_p.impact,
         political_power = polsim.clamp_num(political_power - v_p.political_power_cost, 0, 100)::int,
         apbd_sisa = apbd_sisa - v_p.anggaran,
         dana_kampanye = dana_kampanye + v_markup_gain,
         term_day = term_day + 1,
         updated_at = now()
   where id = v_cs.id;
  update polsim.player_characters
     set kepercayaan_publik = polsim.clamp_num(kepercayaan_publik + 2, 0, 100)::int
   where id = v_cs.player_character_id;

  return jsonb_build_object('status', 'selesai', 'token_cost', v_cost, 'executed_at', v_exec_at,
                            'impact', v_p.impact, 'markup_gain', v_markup_gain,
                            'apbd_sisa', v_cs.apbd_sisa - v_p.anggaran);
end $$;
