import type { Session, SessionStatus } from './types'
import {
  STATUS_LABEL,
  dayKey,
  formatTime,
  localTimeParts,
  scheduledAtEqual,
} from './schedule'

export type SessionPatch = {
  status?: SessionStatus
  scheduledAt?: string
  recordedAt?: string
}

export interface PendingEntry {
  patch: SessionPatch
}

export function mergePatch(base: SessionPatch, add: SessionPatch): SessionPatch {
  return { ...base, ...add }
}

function normalizeSession(session: Session): Session {
  const recordedAt = session.recordedAt?.trim()
  return {
    ...session,
    recordedAt: recordedAt ? recordedAt : undefined,
  }
}

export function sessionsEqual(a: Session, b: Session): boolean {
  const x = normalizeSession(a)
  const y = normalizeSession(b)
  return (
    x.status === y.status &&
    scheduledAtEqual(x.scheduledAt, y.scheduledAt) &&
    x.recordedAt === y.recordedAt
  )
}

export function deriveChangeLabels(before: Session, after: Session): string[] {
  const labels: string[] = []
  if (before.status !== after.status) {
    if (after.status === 'done') labels.push('Marcar como gravada')
    else if (before.status === 'done' && after.status === 'scheduled') {
      labels.push('Desmarcar gravação')
    } else if (after.status === 'postponed') labels.push('Adiar gravação')
    else if (before.status === 'postponed' && after.status === 'scheduled') {
      labels.push('Reagendar')
    } else labels.push('Alterar status')
  }
  if (!scheduledAtEqual(before.scheduledAt, after.scheduledAt)) {
    const dayBefore = dayKey(before.scheduledAt)
    const dayAfter = dayKey(after.scheduledAt)
    if (dayBefore !== dayAfter) {
      labels.push(`Mover para ${dayAfter}`)
    } else {
      labels.push('Alterar horário')
    }
  }
  const recBefore = before.recordedAt?.trim() ?? ''
  const recAfter = after.recordedAt?.trim() ?? ''
  if (recBefore !== recAfter && !labels.some((l) => l.includes('gravada'))) {
    if (recAfter) labels.push('Registrar data de gravação')
    else if (recBefore) labels.push('Limpar data de gravação')
  }
  return labels.length > 0 ? labels : ['Alterar sessão']
}

export function applyPendingPatches(
  sessions: Session[],
  pending: Map<string, PendingEntry>,
): Session[] {
  if (pending.size === 0) return sessions
  return sessions.map((s) => {
    const entry = pending.get(s.id)
    if (!entry) return s
    const p = entry.patch
    return normalizeSession({
      ...s,
      ...(p.status !== undefined ? { status: p.status } : {}),
      ...(p.scheduledAt !== undefined ? { scheduledAt: p.scheduledAt } : {}),
      ...(p.recordedAt !== undefined
        ? { recordedAt: p.recordedAt.trim() ? p.recordedAt : undefined }
        : {}),
    })
  })
}

export function pruneNoopPending(
  baseline: Session[],
  pending: Map<string, PendingEntry>,
): Map<string, PendingEntry> {
  const next = new Map<string, PendingEntry>()
  for (const [sessionId, entry] of pending) {
    const before = baseline.find((s) => s.id === sessionId)
    if (!before) continue
    const after = applyPendingPatches([before], new Map([[sessionId, entry]]))[0]
    if (!sessionsEqual(before, after)) {
      next.set(sessionId, entry)
    }
  }
  return next
}

export function upsertPendingEntry(
  baseline: Session[],
  pending: Map<string, PendingEntry>,
  sessionId: string,
  patch: SessionPatch,
): Map<string, PendingEntry> {
  const before = baseline.find((s) => s.id === sessionId)
  if (!before) return pending

  const next = new Map(pending)
  const cur = next.get(sessionId)
  const mergedPatch = mergePatch(cur?.patch ?? {}, patch)
  const after = applyPendingPatches(
    [before],
    new Map([[sessionId, { patch: mergedPatch }]]),
  )[0]

  if (sessionsEqual(before, after)) {
    next.delete(sessionId)
  } else {
    next.set(sessionId, { patch: mergedPatch })
  }
  return pruneNoopPending(baseline, next)
}

export function applyPendingPatchesBatch(
  baseline: Session[],
  pending: Map<string, PendingEntry>,
  changes: Array<{ sessionId: string; patch: SessionPatch }>,
): Map<string, PendingEntry> {
  let next = pending
  for (const { sessionId, patch } of changes) {
    next = upsertPendingEntry(baseline, next, sessionId, patch)
  }
  return next
}

export function mergeSessionsFromServer(
  current: Session[],
  updated: Session[],
): Session[] {
  const map = new Map(updated.map((s) => [s.id, s]))
  return current.map((s) => map.get(s.id) ?? s)
}

export interface PendingRow {
  sessionId: string
  labels: string[]
  before: Session
  after: Session
  patch: SessionPatch
}

export function buildPendingRows(
  baseline: Session[],
  pending: Map<string, PendingEntry>,
): PendingRow[] {
  const rows: PendingRow[] = []
  for (const [sessionId, entry] of pending) {
    const before = baseline.find((s) => s.id === sessionId)
    if (!before) continue
    const after = applyPendingPatches([before], new Map([[sessionId, entry]]))[0]
    if (sessionsEqual(before, after)) continue
    rows.push({
      sessionId,
      labels: deriveChangeLabels(before, after),
      before,
      after,
      patch: entry.patch,
    })
  }
  return rows.sort((a, b) => a.before.scheduledAt.localeCompare(b.before.scheduledAt))
}

export function describeSessionSnapshot(
  session: Session,
  personName: string,
  topicTitle: string,
): string {
  const date = dayKey(session.scheduledAt)
  const time = formatTime(session.scheduledAt)
  const status = STATUS_LABEL[session.status]
  return `${personName} (${session.topicLetter}) — ${topicTitle} · ${date} ${time} · ${status}`
}

export function patchFromTimeChange(
  session: Session,
  hour: number,
  minute: number,
  buildAt: (day: string, h: number, m: number) => string,
): SessionPatch {
  const dk = dayKey(session.scheduledAt)
  return { scheduledAt: buildAt(dk, hour, minute) }
}

export function timeFromSession(session: Session): { hour: number; minute: number } {
  return localTimeParts(session.scheduledAt)
}
