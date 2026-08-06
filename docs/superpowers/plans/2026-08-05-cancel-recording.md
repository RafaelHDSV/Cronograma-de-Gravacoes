# Cancelar gravação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir cancelar gravações com status `cancelled`, histórico visível no calendário e Por pessoa, reativável via fila de confirmação.

**Architecture:** Novo valor em TypeScript + migration Supabase; helpers `isSessionResolved` / `isTopicComplete` atualizados; ações `onCancel`/`onReactivate` no `App.tsx` enfileiram patch `{ status }`; UI espelha padrão de adiar com badge permanente no dia.

**Tech Stack:** React 18, Vite 5, TypeScript, Express 5, Supabase PostgreSQL, Yarn.

## Global Constraints

- Status permitidos: `scheduled`, `done`, `postponed`, **`cancelled`**
- Fuso: `America/Sao_Paulo`
- Escrita só em modo editor; mutações via fila + `apply-batch` (exceto DELETE existente)
- Copy pt-BR: badge **Cancelada**, botão **Cancelar gravação**, tag **Reativar gravação**
- Não cancelar sessões `done`
- Tópico concluído quando todas sessões `done` ou `cancelled`
- Canceladas não ocupam slot de horário
- Seguir estilo CSS existente (`--postponed`, `--done`, variáveis em `index.css`)

---

## File map

| File | Responsibility |
|------|----------------|
| `supabase/migrations/20260805180000_cronograma_cancelled_status.sql` | Expand DB check constraint |
| `server/data.ts` | Server `SessionStatus`, seed/parse/createSession |
| `src/lib/types.ts` | Front `SessionStatus` |
| `src/lib/topicSessions.ts` | `isSessionResolved`, `isTopicComplete`, stats, `resolvedCount` |
| `src/lib/schedule.ts` | `STATUS_LABEL`, `globalStats`, `sessionsForDay` unchanged filter logic |
| `src/lib/pending.ts` | Labels cancel/reactivate |
| `src/lib/exportScheduleText.ts` | Suffix `(cancelada)` |
| `src/App.tsx` | `onCancel`, `onReactivate`, wire props |
| `src/pages/CalendarPage.tsx` | Buttons, chip/detail styling, postponed cancel |
| `src/pages/PersonPage.tsx` | Badge + disabled checkbox for cancelled |
| `src/components/SessionIcons.tsx` | `IconCancel` |
| `src/index.css` | `--cancelled`, `.badge-cancelled`, `.session-chip.cancelled` |
| `docs/context.md` | Status list + decisão documentada |

---

### Task 1: Schema e tipos

**Files:**
- Create: `supabase/migrations/20260805180000_cronograma_cancelled_status.sql`
- Modify: `server/data.ts` (type + parsers)
- Modify: `src/lib/types.ts`

**Interfaces:**
- Produces: `SessionStatus` including `'cancelled'` on front and server

- [ ] **Step 1: Migration SQL**

```sql
-- Cronograma: status cancelled
alter table public.cronograma_sessions
  drop constraint if exists cronograma_sessions_status_check;

alter table public.cronograma_sessions
  add constraint cronograma_sessions_status_check
  check (status in ('scheduled', 'done', 'postponed', 'cancelled'));
```

- [ ] **Step 2: Atualizar tipos**

`src/lib/types.ts`:

```ts
export type SessionStatus = 'scheduled' | 'done' | 'postponed' | 'cancelled'
```

`server/data.ts` — mesmo union; em `seedSessionsFromYaml`:

```ts
status:
  s.status === 'done'
    ? 'done'
    : s.status === 'postponed'
      ? 'postponed'
      : s.status === 'cancelled'
        ? 'cancelled'
        : 'scheduled',
```

Em `createSession`:

```ts
const status: SessionStatus =
  input.status === 'done' ||
  input.status === 'postponed' ||
  input.status === 'cancelled'
    ? input.status
    : 'scheduled'
```

- [ ] **Step 3: Verificar build TypeScript**

Run: `cd Cronograma-de-Gravacoes && yarn build`  
Expected: erros apenas onde `STATUS_LABEL` / switches faltam `'cancelled'` — corrigidos na Task 2.

---

### Task 2: Lógica de domínio

**Files:**
- Modify: `src/lib/topicSessions.ts`
- Modify: `src/lib/schedule.ts`
- Modify: `src/lib/pending.ts`
- Modify: `src/lib/exportScheduleText.ts`

**Interfaces:**
- Consumes: `SessionStatus` from Task 1
- Produces:
  - `isSessionResolved(s: Session): boolean`
  - `isTopicComplete` usa resolved
  - `TopicGroup.resolvedCount` (ou recalcular `doneCount` → renomear para `resolvedCount` nos badges)
  - `STATUS_LABEL.cancelled = 'Cancelada'`
  - `globalStats.cancelled`
  - `deriveChangeLabels` tags cancel/reactivate

- [ ] **Step 1: Helper resolved**

`src/lib/topicSessions.ts`:

```ts
export function isSessionResolved(session: Session): boolean {
  return session.status === 'done' || session.status === 'cancelled'
}

export function isTopicComplete(topicSessions: Session[]): boolean {
  if (topicSessions.length === 0) return false
  return topicSessions.every(isSessionResolved)
}
```

Atualizar `groupPersonTopics`:

```ts
const resolvedCount = topicSessions.filter(isSessionResolved).length
// retornar resolvedCount no TopicGroup (substituir doneCount ou manter ambos)
```

Atualizar `topicProgressLabel`:

```ts
return `${group.topicLetter} · ${group.resolvedCount}/${group.sessionCount}`
```

`globalTopicStats`: adicionar `cancelledSessions` counter.

- [ ] **Step 2: schedule.ts stats**

```ts
export const STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: 'Agendado',
  done: 'Gravado',
  postponed: 'Adiado',
  cancelled: 'Cancelada',
}

export function globalStats(sessions: Session[]): GlobalStats {
  const done = sessions.filter((s) => s.status === 'done').length
  const postponed = sessions.filter((s) => s.status === 'postponed').length
  const cancelled = sessions.filter((s) => s.status === 'cancelled').length
  return {
    total: sessions.length,
    done,
    scheduled: sessions.filter((s) => s.status === 'scheduled').length,
    postponed,
    cancelled,
    remaining: sessions.length - done - postponed - cancelled,
  }
}
```

Estender interface `GlobalStats` com `cancelled: number`.

- [ ] **Step 3: pending labels**

`src/lib/pending.ts` em `deriveChangeLabels`:

```ts
} else if (after.status === 'cancelled') {
  labels.push('Cancelar gravação')
} else if (before.status === 'cancelled' && after.status === 'scheduled') {
  labels.push('Reativar gravação')
```

- [ ] **Step 4: export text**

Em `formatScheduleAsText`, na linha do dia:

```ts
const cancelled = s.status === 'cancelled' ? ' (cancelada)' : ''
lines.push(`- ${hour} — ${name} (${s.topicLetter})${suffix}${cancelled}`)
```

- [ ] **Step 5: Verificar compilação**

Run: `yarn build` (pode falhar em UI até Task 3 — OK se só faltam props)

---

### Task 3: Handlers no App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/CalendarPage.tsx` (props only neste step)

**Interfaces:**
- Produces: `onCancel(id: string)`, `onReactivate(id: string)` passed to CalendarPage

- [ ] **Step 1: Callbacks**

`src/App.tsx`:

```ts
const onCancel = useCallback(
  (id: string) => {
    const session = findDisplaySession(id)
    if (!session || session.status === 'done') return
    queueChange(id, { status: 'cancelled' })
  },
  [findDisplaySession, queueChange],
)

const onReactivate = useCallback(
  (id: string) => {
    queueChange(id, { status: 'scheduled' })
  },
  [queueChange],
)
```

Passar para `CalendarPage`:

```tsx
onCancel={onCancel}
onReactivate={onReactivate}
```

- [ ] **Step 2: Smoke manual**

Run: `yarn dev`  
Expected: app carrega; callbacks ainda sem botões visíveis até Task 4.

---

### Task 4: UI Calendário + CSS + ícone

**Files:**
- Modify: `src/pages/CalendarPage.tsx`
- Modify: `src/components/SessionIcons.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: IconCancel**

`SessionIcons.tsx` — SVG inline no estilo de `IconPostpone` (círculo com traço).

- [ ] **Step 2: CalendarPage props e ações**

Adicionar à interface Props: `onCancel`, `onReactivate`.

No detalhe do dia:

```tsx
const isCancelled = s.status === 'cancelled'

// badge sempre visível para cancelled
{isCancelled && <StatusBadge status={s.status} />}

// ações editor
{canEdit && isScheduled && (
  <IconButton label="Cancelar gravação" className="cancel-btn" onClick={() => onCancel(s.id)}>
    <IconCancel />
  </IconButton>
)}
{canEdit && isCancelled && (
  <button type="button" className="btn ghost btn-sm" onClick={() => onReactivate(s.id)}>
    Reativar
  </button>
)}
```

Chips:

```tsx
draggable={canEdit && s.status === 'scheduled'}
className={`session-chip ${s.status}`}
```

`PostponedRow`: botão cancelar chamando `onCancel(session.id)`.

- [ ] **Step 3: CSS**

`index.css`:

```css
:root {
  --cancelled: #94a3b8; /* ou tom vermelho suave #f87171 */
}
.badge-cancelled { ... }
.session-chip.cancelled { opacity: 0.65; border-left-color: var(--cancelled); }
.session-row.cancelled { border-left-color: var(--cancelled); }
.cancel-btn { color: var(--cancelled) !important; }
```

- [ ] **Step 4: Teste manual calendário**

1. Modo editor → sessão agendada → Cancelar → Confirmar  
2. Chip no dia com visual cancelada  
3. Reativar → volta agendada  
4. Adiar → cancelar na seção adiadas → aparece no dia original cancelada

---

### Task 5: Por pessoa + docs

**Files:**
- Modify: `src/pages/PersonPage.tsx`
- Modify: `docs/context.md`

- [ ] **Step 1: PersonPage**

Checkbox condição permanece `scheduled || done` only.

Grupo multi-sessão: `group.isComplete` já reflete Task 2.

Badge inline `cancelled` usa `STATUS_LABEL`.

- [ ] **Step 2: context.md**

Atualizar linha de status:

```
**Status:** `scheduled`, `done`, `postponed`, `cancelled`.
```

Remover `cancelled` de "Fora de escopo v1".

Adicionar decisão fixa #15 sobre cancelamento.

- [ ] **Step 3: Build final**

Run: `yarn build`  
Expected: PASS

- [ ] **Step 4: Checklist de aceite (manual)**

- [ ] Cancelar scheduled via fila  
- [ ] Cancelar postponed  
- [ ] Reativar cancelled  
- [ ] Tópico 2 done + 1 cancelled = concluído  
- [ ] Exportar texto com `(cancelada)`  
- [ ] Migration aplicada no Supabase

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| Status `cancelled` DB | Task 1 |
| Topic complete = done ∨ cancelled | Task 2 |
| Calendário badge no dia | Task 4 |
| Por pessoa badge | Task 5 |
| Cancel from scheduled/postponed | Task 3–4 |
| Reactivate to scheduled | Task 3–4 |
| apply-batch labels | Task 2 |
| Export suffix | Task 2 |
| No slot conflict | já OK (`findSlotConflict`) |
| docs/context.md | Task 5 |

No placeholders. Types consistent across tasks.
