-- Cronograma: status cancelled
-- Nome legado `sessions_status_check` vem da tabela original `sessions`
-- (renomeada para cronograma_sessions); o nome atual e cronograma_sessions_status_check.
alter table public.cronograma_sessions
  drop constraint if exists sessions_status_check;

alter table public.cronograma_sessions
  drop constraint if exists cronograma_sessions_status_check;

alter table public.cronograma_sessions
  add constraint cronograma_sessions_status_check
  check (status in ('scheduled', 'done', 'postponed', 'cancelled'));
