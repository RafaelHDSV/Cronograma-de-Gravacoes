import {
  buildScheduledAt,
  dayKeyFromIso,
  isFriday,
  isFridayDayKey,
  isCascadeBusinessDay,
  localTimeParts,
  nextCascadeBusinessDayKey,
} from './scheduleDates.js'

function toCascadeTargetDay(dayKeyStr: string): string {
  if (isCascadeBusinessDay(dayKeyStr)) return dayKeyStr
  return nextCascadeBusinessDayKey(dayKeyStr)
}

export interface FridayFixSession {
  id: string
  personId: string
  topicLetter: string
  status: string
  scheduledAt: string
}

export interface FridayFixChange {
  sessionId: string
  personId: string
  topicLetter: string
  before: string
  after: string
}

const DEFAULT_HOURS = [14, 16] as const

function firstScheduledFridayIndex(sessions: FridayFixSession[]): number {
  return sessions.findIndex((s) => s.status === 'scheduled' && isFriday(s.scheduledAt))
}

function computeCascadeDates(sessions: FridayFixSession[]): Map<string, string> {
  const result = new Map<string, string>()
  const f = firstScheduledFridayIndex(sessions)
  if (f === -1) return result

  for (let k = 0; k < sessions.length - f; k++) {
    const session = sessions[f + k]
    const { hour, minute } = localTimeParts(session.scheduledAt)
    let targetDay: string
    if (k < sessions.length - 1 - f) {
      targetDay = toCascadeTargetDay(dayKeyFromIso(sessions[f + k + 1].scheduledAt))
    } else {
      targetDay = nextCascadeBusinessDayKey(dayKeyFromIso(session.scheduledAt))
    }
    const after = buildScheduledAt(targetDay, hour, minute)
    if (after !== session.scheduledAt) {
      result.set(session.id, after)
    }
  }
  return result
}

function slotKey(personId: string, scheduledAt: string): string {
  const dk = dayKeyFromIso(scheduledAt)
  const { hour, minute } = localTimeParts(scheduledAt)
  return `${personId}|${dk}|${hour}:${minute}`
}

function resolveCollisions(
  sessions: FridayFixSession[],
  proposed: Map<string, string>,
): Map<string, string> {
  const final = new Map<string, string>()
  for (const s of sessions) {
    final.set(s.id, proposed.get(s.id) ?? s.scheduledAt)
  }

  for (let pass = 0; pass < 100; pass++) {
    let changed = false
    const bySlot = new Map<string, string[]>()
    for (const s of sessions) {
      const at = final.get(s.id)!
      const key = slotKey(s.personId, at)
      const arr = bySlot.get(key) ?? []
      arr.push(s.id)
      bySlot.set(key, arr)
    }

    for (const ids of bySlot.values()) {
      if (ids.length <= 1) continue
      for (let i = 1; i < ids.length; i++) {
        const id = ids[i]!
        final.set(id, findNextFreeSlot(sessions, final, id))
        changed = true
      }
    }
    if (!changed) break
  }
  return final
}

function isSlotFree(
  sessions: FridayFixSession[],
  final: Map<string, string>,
  personId: string,
  scheduledAt: string,
  exceptId: string,
): boolean {
  const key = slotKey(personId, scheduledAt)
  for (const s of sessions) {
    if (s.id === exceptId) continue
    const at = final.get(s.id) ?? s.scheduledAt
    if (slotKey(s.personId, at) === key) return false
  }
  return true
}

function findNextFreeSlot(
  sessions: FridayFixSession[],
  final: Map<string, string>,
  sessionId: string,
): string {
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) throw new Error(`Sessao ${sessionId} nao encontrada`)

  const current = final.get(sessionId) ?? session.scheduledAt
  const { hour, minute } = localTimeParts(current)
  const day = dayKeyFromIso(current)
  const altHour = DEFAULT_HOURS.find((h) => h !== hour)
  if (altHour !== undefined) {
    const alt = buildScheduledAt(day, altHour, minute)
    if (isSlotFree(sessions, final, session.personId, alt, sessionId)) return alt
  }

  let cursor = day
  for (let i = 0; i < 120; i++) {
    cursor = nextCascadeBusinessDayKey(cursor)
    for (const h of DEFAULT_HOURS) {
      const candidate = buildScheduledAt(cursor, h, 0)
      if (isSlotFree(sessions, final, session.personId, candidate, sessionId)) {
        return candidate
      }
    }
  }
  throw new Error(`Colisao nao resolvida para sessao ${sessionId}`)
}

export function computeFridayFixChanges(sessions: FridayFixSession[]): FridayFixChange[] {
  const byPerson = new Map<string, FridayFixSession[]>()
  for (const s of sessions) {
    const list = byPerson.get(s.personId) ?? []
    list.push(s)
    byPerson.set(s.personId, list)
  }

  const changes: FridayFixChange[] = []

  for (const [, personSessions] of byPerson) {
    const sorted = [...personSessions].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    if (firstScheduledFridayIndex(sorted) === -1) continue

    const proposed = computeCascadeDates(sorted)
    if (proposed.size === 0) continue

    const resolved = resolveCollisions(sorted, proposed)
    for (const [sessionId, after] of resolved) {
      const before = sorted.find((s) => s.id === sessionId)?.scheduledAt
      if (!before || before === after) continue
      const session = sorted.find((s) => s.id === sessionId)!
      changes.push({
        sessionId,
        personId: session.personId,
        topicLetter: session.topicLetter,
        before,
        after,
      })
    }
  }

  return changes.sort((a, b) => a.before.localeCompare(b.before))
}

export function hasScheduledFridaySessions(sessions: FridayFixSession[]): boolean {
  return sessions.some((s) => s.status === 'scheduled' && isFriday(s.scheduledAt))
}

export function isFridayDayKeyForSchedule(dayKeyStr: string): boolean {
  return isFridayDayKey(dayKeyStr)
}
