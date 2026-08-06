# Design: cancelar gravação (status `cancelled`)

**Data:** 2026-08-05  
**Projeto:** Cronograma-de-Gravacoes  
**Status:** aprovado — implementado 2026-08-06

## Problema

O painel permite **adiar** (`postponed`), **excluir** (DELETE imediato) ou **marcar gravado** (`done`), mas não há forma de registrar que uma gravação **não vai acontecer** mantendo histórico visível no calendário e na aba Por pessoa. Excluir apaga o registro; adiar implica reagendamento futuro.

## Decisão (brainstorming 2026-08-05)

Adicionar status **`cancelled`**: a gravação não ocorrerá, permanece no histórico, pode ser **reativada** para `scheduled` (mesma data/hora) via fila de confirmação.

| Tema | Decisão |
|------|---------|
| Semântica | Diferente de adiar (sem expectativa de reagendar) e de excluir (mantém registro) |
| Conclusão de tópico | Tópico concluído quando **todas** as sessões estão `done` **ou** `cancelled` |
| Calendário | Sessão cancelada **permanece no dia original** (`scheduledAt`), com badge/visual distinto |
| Por pessoa | Badge **Cancelada** na linha da sessão; checkbox desabilitado |
| Origem | Cancelar a partir de `scheduled` ou `postponed` — **não** a partir de `done` |
| Reversão | `cancelled` → `scheduled` (preserva `scheduledAt`) |
| Persistência | Via fila de rascunho + `apply-batch` (como adiar) |
| Conflito de horário | Canceladas **não** ocupam slot (`findSlotConflict` só considera `scheduled`) |
| Exportar texto | Linha com sufixo `(cancelada)` |

## Escopo fora

- Status `cancelled` no seed YAML inicial (permanece `scheduled`/`done`/`postponed`).
- Autenticação individual ou auditoria de quem cancelou.
- Remover botão **Excluir sessão** (continua disponível para remoção definitiva).
- Card extra no Resumo (opcional v1.1; não bloqueia entrega).

## Modelo de dados

### TypeScript

```ts
export type SessionStatus = 'scheduled' | 'done' | 'postponed' | 'cancelled'
```

### Supabase

Migration altera `check` em `cronograma_sessions.status`:

```sql
check (status in ('scheduled', 'done', 'postponed', 'cancelled'))
```

### Helpers de domínio

- `isSessionResolved(s)`: `done` ou `cancelled`
- `isTopicComplete(sessions)`: `sessions.length > 0` e todas resolvidas
- Progresso `N/M`: `resolvedCount` = done + cancelled

## Regras de negócio

### Stats globais (`globalStats`)

- `cancelled`: contagem separada
- `remaining`: `total - done - postponed - cancelled`

### Calendário

- `sessionsForDay`: inclui `scheduled`, `done`, **`cancelled`**; exclui só `postponed`
- Chips e detalhe do dia: classe CSS `cancelled`, badge **Cancelada**
- Canceladas **não** arrastáveis (drag desabilitado)
- Detalhe do dia: botão **Cancelar gravação** para `scheduled`; **Reativar** para `cancelled`
- Seção adiadas: botão cancelar também disponível em `PostponedRow`

### Por pessoa

- Checkbox só para `scheduled` ou `done` (como hoje)
- `postponed` e `cancelled`: badge de status, sem checkbox
- Grupo multi-sessão: tópico **Gravado** quando `isComplete` (inclui canceladas resolvidas)

### Fila pendente (`pending.ts`)

Labels:

- `scheduled`/`postponed` → `cancelled`: **Cancelar gravação**
- `cancelled` → `scheduled`: **Reativar gravação**

### Exportar texto

Sessões canceladas aparecem no dia com sufixo `(cancelada)`; não entram em `[encerra …]`.

## UI / visual

| Elemento | Tratamento |
|----------|------------|
| Badge | `Cancelada` — tom vermelho acinzentado (`--cancelled`) |
| Chip calendário | Opacidade reduzida, borda `--cancelled`, texto riscado opcional leve |
| Ícone ação | Novo `IconCancel` (X ou círculo barrado), distinto de adiar |

## Arquivos principais

| Área | Arquivos |
|------|----------|
| DB | `supabase/migrations/20260805180000_cronograma_cancelled_status.sql` |
| Server | `server/data.ts` |
| Tipos/stats | `src/lib/types.ts`, `schedule.ts`, `topicSessions.ts`, `pending.ts`, `exportScheduleText.ts` |
| App | `src/App.tsx` (`onCancel`, `onReactivate`) |
| UI | `CalendarPage.tsx`, `PersonPage.tsx`, `StatusBadge.tsx`, `SessionIcons.tsx`, `index.css` |
| Docs | `docs/context.md` |

## Critérios de aceite

- [ ] Editor cancela sessão `scheduled` → fila → confirma → badge no calendário e Por pessoa
- [ ] Editor cancela sessão `postponed` → some de adiadas → aparece no dia original como cancelada
- [ ] Editor reativa `cancelled` → volta `scheduled` no mesmo horário
- [ ] Tópico com 2 done + 1 cancelled → concluído no Resumo e Por pessoa
- [ ] Cancelada não bloqueia agendar outra sessão no mesmo horário
- [ ] Exportar texto inclui `(cancelada)`
- [ ] `yarn build` passa
- [ ] Migration aplicada no Supabase de dev/staging

## Referências

- Backlog original: `docs/especificacao.md` §9 (status `cancelled`)
- Padrão de fila: `src/lib/pending.ts`, `ConfirmChangesModal.tsx`
