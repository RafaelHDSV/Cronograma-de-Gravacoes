-- Ordem de gravacao por pessoa (override editavel pelo painel; YAML e seed)
create table if not exists public.cronograma_person_preferences (
  person_id text primary key,
  topic_order text[] not null default '{}',
  updated_at timestamptz not null default now()
);
