-- Cronograma: status cancelled
alter table public.cronograma_sessions
  drop constraint if exists cronograma_sessions_status_check;

alter table public.cronograma_sessions
  add constraint cronograma_sessions_status_check
  check (status in ('scheduled', 'done', 'postponed', 'cancelled'));
