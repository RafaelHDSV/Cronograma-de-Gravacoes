-- Cronograma de Gravacoes (prefix: cronograma_ — shared Supabase with Dailier)
create table if not exists public.cronograma_sessions (
  id text primary key,
  scheduled_at timestamptz not null,
  person_id text not null,
  topic_letter text not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'done', 'postponed')),
  notes text not null default '',
  recorded_at date
);

create index if not exists cronograma_sessions_person_id_idx on public.cronograma_sessions (person_id);
create index if not exists cronograma_sessions_scheduled_at_idx on public.cronograma_sessions (scheduled_at);

-- RLS off in v1 (backend uses service_role only)
