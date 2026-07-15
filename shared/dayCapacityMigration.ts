import {
  buildScheduledAt,
  dayKeyFromIso,
  isCascadeBusinessDay,
  localTimeParts,
  nextCascadeBusinessDayKey,
} from './scheduleDates.js'

export const SLOT_HOURS = [14, 16] as const
export const MAX_SESSIONS_PER_DAY = 2

export interface CapacitySession {
  id: string
  personId: string
  topicLetter: string
  status: string
  scheduledAt: string
}

export interface CapacityFixChange {
  sessionId: string
  personId: string
  topicLetter: string
  before: string
  after: string
}

export function snapToSlotHour(hour: number): (typeof SLOT_HOURS)[number] {
  return hour < 15 ? 14 : 16
}

function toCascadeTargetDay(dayKeyStr: string): string {
  if (isCascadeBusinessDay(dayKeyStr)) return dayKeyStr
  return nextCascadeBusinessDayKey(dayKeyStr)
}

function slotKey(scheduledAt: string): string {
  const dk = dayKeyFromIso(scheduledAt)
  const { hour } = localTimeParts(scheduledAt)
  return `${dk}|${snapToSlotHour(hour)}`
}

type ScheduleMap = Map<string, string>

function sortedSessions(sessions: CapacitySession[], schedule: ScheduleMap): CapacitySession[] {
  return [...sessions].sort((a, b) => {
    const at = schedule.get(a.id) ?? a.scheduledAt
    const bt = schedule.get(b.id) ?? b.scheduledAt
    return at.localeCompare(bt)
  })
}

function sessionsOnDay(
  sessions: CapacitySession[],
  schedule: ScheduleMap,
  day: string,
): CapacitySession[] {
  return sortedSessions(sessions, schedule).filter(
    (s) => dayKeyFromIso(schedule.get(s.id) ?? s.scheduledAt) === day,
  )
}

function personSessions(
  sessions: CapacitySession[],
  schedule: ScheduleMap,
  personId: string,
): CapacitySession[] {
  return sortedSessions(sessions, schedule).filter((s) => s.personId === personId)
}

function isDayOverfull(sessions: CapacitySession[], schedule: ScheduleMap, day: string): boolean {
  const onDay = sessionsOnDay(sessions, schedule, day)
  if (onDay.length > MAX_SESSIONS_PER_DAY) return true
  const slots = new Set(
    onDay.map((s) => snapToSlotHour(localTimeParts(schedule.get(s.id) ?? s.scheduledAt).hour)),
  )
  return slots.size < onDay.length
}

function findFirstOverfullDay(
  sessions: CapacitySession[],
  schedule: ScheduleMap,
): string | null {
  const days = new Set(
    sessions.map((s) => dayKeyFromIso(schedule.get(s.id) ?? s.scheduledAt)),
  )
  const sortedDays = [...days].sort()
  for (const day of sortedDays) {
    if (isDayOverfull(sessions, schedule, day)) return day
  }
  return null
}

function findNextFreeSlot(
  sessions: CapacitySession[],
  schedule: ScheduleMap,
  afterDay: string,
  preferHour: number,
  exceptId: string,
): string {
  const snapped = snapToSlotHour(preferHour)
  let cursor = afterDay
  for (let i = 0; i < 200; i++) {
    if (i > 0) cursor = nextCascadeBusinessDayKey(cursor)
    for (const h of [snapped, snapped === 14 ? 16 : 14]) {
      const candidate = buildScheduledAt(cursor, h, 0)
      if (isSlotFree(sessions, schedule, candidate, exceptId)) return candidate
    }
  }
  throw new Error(`Sem slot livre para sessao ${exceptId}`)
}

function personTargetDay(
  sessions: CapacitySession[],
  originals: ScheduleMap,
  sess: CapacitySession,
): string {
  const chain = personSessions(sessions, originals, sess.personId)
  const idx = chain.findIndex((s) => s.id === sess.id)
  if (idx === -1) {
    return nextCascadeBusinessDayKey(dayKeyFromIso(originals.get(sess.id) ?? sess.scheduledAt))
  }
  if (idx < chain.length - 1) {
    const next = chain[idx + 1]!
    return toCascadeTargetDay(dayKeyFromIso(originals.get(next.id) ?? next.scheduledAt))
  }
  return nextCascadeBusinessDayKey(dayKeyFromIso(originals.get(sess.id) ?? sess.scheduledAt))
}

function fixOverfullDay(
  sessions: CapacitySession[],
  schedule: ScheduleMap,
  originals: ScheduleMap,
  day: string,
): void {
  const onDay = sessionsOnDay(sessions, schedule, day)
  if (!isDayOverfull(sessions, schedule, day)) return

  const keep = onDay.slice(0, MAX_SESSIONS_PER_DAY)
  const excess = onDay.slice(MAX_SESSIONS_PER_DAY)

  schedule.set(keep[0]!.id, buildScheduledAt(day, SLOT_HOURS[0], 0))
  if (keep[1]) {
    schedule.set(keep[1].id, buildScheduledAt(day, SLOT_HOURS[1], 0))
  }

  const sorted = sortedSessions(sessions, schedule)
  const lastOnDay = onDay[onDay.length - 1]!
  const lastOnDayIdx = sorted.findIndex((s) => s.id === lastOnDay.id)
  const afterDay = sorted.slice(lastOnDayIdx + 1)
  const cascadeList = [...excess, ...afterDay]

  for (let k = 0; k < cascadeList.length; k++) {
    const sess = cascadeList[k]!
    const hour = snapToSlotHour(localTimeParts(originals.get(sess.id) ?? sess.scheduledAt).hour)
    let targetDay: string
    if (excess.some((s) => s.id === sess.id)) {
      targetDay = personTargetDay(sessions, originals, sess)
    } else if (k < cascadeList.length - 1) {
      targetDay = toCascadeTargetDay(
        dayKeyFromIso(originals.get(cascadeList[k + 1]!.id) ?? cascadeList[k + 1]!.scheduledAt),
      )
    } else {
      targetDay = personTargetDay(sessions, originals, sess)
    }

    let candidate = buildScheduledAt(targetDay, hour, 0)
    if (!isSlotFree(sessions, schedule, candidate, sess.id)) {
      candidate = findNextFreeSlot(sessions, schedule, targetDay, hour, sess.id)
    }
    schedule.set(sess.id, candidate)
  }
}

function isSlotFree(
  sessions: CapacitySession[],
  schedule: ScheduleMap,
  scheduledAt: string,
  exceptId: string,
): boolean {
  const key = slotKey(scheduledAt)
  return !sessions.some((s) => {
    if (s.id === exceptId) return false
    const at = schedule.get(s.id) ?? s.scheduledAt
    return slotKey(at) === key
  })
}

function normalizeSchedule(sessions: CapacitySession[]): ScheduleMap {
  const schedule = new Map<string, string>()
  for (const s of sessions) schedule.set(s.id, s.scheduledAt)

  for (let pass = 0; pass < 200; pass++) {
    const originals = new Map(schedule)
    const day = findFirstOverfullDay(sessions, schedule)
    if (!day) break
    fixOverfullDay(sessions, schedule, originals, day)
  }

  return schedule
}

export function computeDayCapacityFixChanges(sessions: CapacitySession[]): CapacityFixChange[] {
  const active = sessions.filter((s) => s.status === 'scheduled')
  const schedule = normalizeSchedule(active)
  const changes: CapacityFixChange[] = []

  for (const s of active) {
    const after = schedule.get(s.id)!
    if (after !== s.scheduledAt) {
      changes.push({
        sessionId: s.id,
        personId: s.personId,
        topicLetter: s.topicLetter,
        before: s.scheduledAt,
        after,
      })
    }
  }

  return changes.sort((a, b) => a.before.localeCompare(b.before))
}

export function hasOverfullDays(sessions: CapacitySession[]): boolean {
  const byDay = new Map<string, { count: number; slots: Set<number> }>()
  for (const s of sessions) {
    if (s.status !== 'scheduled') continue
    const day = dayKeyFromIso(s.scheduledAt)
    let entry = byDay.get(day)
    if (!entry) {
      entry = { count: 0, slots: new Set() }
      byDay.set(day, entry)
    }
    entry.count += 1
    entry.slots.add(snapToSlotHour(localTimeParts(s.scheduledAt).hour))
    if (entry.count > MAX_SESSIONS_PER_DAY || entry.slots.size < entry.count) {
      return true
    }
  }
  return false
}

/** Sessao agendada que ja ocupa o mesmo slot (14h ou 16h) no dia, se houver. */
export function findSlotConflict(
  sessions: CapacitySession[],
  scheduledAtIso: string,
  exceptId: string,
): CapacitySession | undefined {
  const day = dayKeyFromIso(scheduledAtIso)
  const hour = snapToSlotHour(localTimeParts(scheduledAtIso).hour)
  return sessions.find(
    (s) =>
      s.status === 'scheduled' &&
      s.id !== exceptId &&
      dayKeyFromIso(s.scheduledAt) === day &&
      snapToSlotHour(localTimeParts(s.scheduledAt).hour) === hour,
  )
}

/** Lotação máx. 2/dia desativada — mantido por compatibilidade de imports. */
export function assertDayCapacity(
  _sessions: CapacitySession[],
  _personId: string,
  _scheduledAtIso: string,
  _exceptId?: string,
): void {}

export function countSessionsOnDay(
  sessions: CapacitySession[],
  day: string,
): number {
  return sessions.filter(
    (s) => s.status === 'scheduled' && dayKeyFromIso(s.scheduledAt) === day,
  ).length
}
