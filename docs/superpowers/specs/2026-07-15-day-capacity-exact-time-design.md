# Design: lotação diária sem limite (conflito só no horário exato)

**Data:** 2026-07-15  
**Projeto:** Cronograma-de-Gravacoes  
**Status:** aprovado (abordagem 1) — implementação em andamento

## Problema

O painel limitava o calendário a **2 sessões por dia**, encaixando qualquer horário nos buckets 14h/16h via `snapToSlotHour`. Com isso, um terceiro agendamento no mesmo dia (ex.: Pessoa 1 grava X; Pessoa 2 grava Y e Z) entrava em conflito artificial ou seria remanejado pela cascata de lotação.

## Decisão

- **Sem limite** de sessões por dia (pessoas iguais ou diferentes).
- **Único conflito:** duas sessões `scheduled` no **mesmo dia + mesma hora + mesmo minuto** (fuso `America/Sao_Paulo`).
- **14h e 16h** permanecem apenas como atalhos no `TimeSlotPicker` (`DEFAULT_SLOT_HOURS`).
- Endpoint/script `fix-day-capacity` **não é removido**, mas deixa de alterar sessões (retorno vazio / sem dias “lotados”).
- Swap automático no remarcar: troca os horários das duas sessões em conflito (troca verdadeira), sem empurrar para o outro bucket 14↔16.

## Escopo fora

- Apagar rota/script de lotação.
- Terceiro horário padrão no picker.
- Mudanças de schema Supabase.

## Arquivos principais

- `shared/dayCapacityMigration.ts` — `findSlotConflict`, `hasOverfullDays`, `computeDayCapacityFixChanges`
- `src/App.tsx` — swap no conflict de remarcar
- `docs/context.md` — decisão 14
