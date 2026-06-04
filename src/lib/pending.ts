import type { Session, SessionStatus } from './types'
import { STATUS_LABEL, dayKey, formatTime, localTimeParts } from './schedule'

export type SessionPatch = {
  status?: SessionStatus
  scheduledAt?: string
  recordedAt?: string
}

export interface PendingEntry {
  patch: SessionPatch
  labels: string[]
}

export function mergePatch(base: SessionPatch, add: SessionPatch): SessionPatch {
  return { ...base, ...add }
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
    return {
      ...s,
      ...(p.status !== undefined ? { status: p.status } : {}),
      ...(p.scheduledAt !== undefined ? { scheduledAt: p.scheduledAt } : {}),
      ...(p.recordedAt !== undefined
        ? { recordedAt: p.recordedAt.trim() ? p.recordedAt : undefined }
        : {}),
    }
  })
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
    rows.push({
      sessionId,
      labels: entry.labels,
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
