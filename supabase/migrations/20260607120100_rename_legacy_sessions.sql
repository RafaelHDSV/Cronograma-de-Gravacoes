-- Rename legacy unprefixed table -> cronograma_sessions (one-time)
do $$
begin
  if to_regclass('public.sessions') is not null
     and to_regclass('public.cronograma_sessions') is null then
    alter table public.sessions rename to cronograma_sessions;
  end if;
end $$;

do $$
begin
  if to_regclass('public.sessions_person_id_idx') is not null
     and to_regclass('public.cronograma_sessions_person_id_idx') is null then
    alter index public.sessions_person_id_idx rename to cronograma_sessions_person_id_idx;
  end if;
  if to_regclass('public.sessions_scheduled_at_idx') is not null
     and to_regclass('public.cronograma_sessions_scheduled_at_idx') is null then
    alter index public.sessions_scheduled_at_idx rename to cronograma_sessions_scheduled_at_idx;
  end if;
end $$;
