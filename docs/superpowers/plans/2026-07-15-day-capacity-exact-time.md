# Lotação sem limite — conflito horário exato

> **For agentic workers:** implementação já aplicada na sessão de 2026-07-15. Spec: `docs/superpowers/specs/2026-07-15-day-capacity-exact-time-design.md`.

**Goal:** Permitir 3+ sessões no mesmo dia; conflito só no horário exato.

**Architecture:** `findSlotConflict` compara dia+hora+minuto; `hasOverfullDays` / `computeDayCapacityFixChanges` no-op; swap no `App.tsx` troca horários das duas sessões.

**Tech Stack:** React/Vite, shared TS, Express (rota legado intacta).

## Tasks

- [x] Spec de design
- [x] `shared/dayCapacityMigration.ts` — conflito exato + no-ops
- [x] `src/App.tsx` — swap verdadeiro no remarcar
- [x] `docs/context.md` + script comment
- [x] Verificar `yarn build`
