-- ============================================================
-- PolSim Arcapada — Migration 0006: review event via service_role
-- Izinkan n8n (WhatsApp approval) memanggil admin_review_pending_event
-- dengan service role key, selain admin yang login di UI.
-- ============================================================
set search_path to polsim;

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
  if not polsim.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'BUKAN_ADMIN';
  end if;
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
grant execute on function polsim.admin_review_pending_event(uuid, boolean) to authenticated, service_role;
