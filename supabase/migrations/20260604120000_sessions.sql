-- Tabela de sessoes do cronograma de gravacoes
-- Aplicar no SQL Editor do Supabase ou via CLI

create table if not exists public.sessions (
  id text primary key,
  scheduled_at timestamptz not null,
  person_id text not null,
  topic_letter text not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'done', 'postponed')),
  notes text not null default '',
  recorded_at date
);

create index if not exists sessions_person_id_idx on public.sessions (person_id);
create index if not exists sessions_scheduled_at_idx on public.sessions (scheduled_at);

-- Opcional: RLS ligado sem policies para anon = somente service_role (backend) acessa
alter table public.sessions enable row level security;
