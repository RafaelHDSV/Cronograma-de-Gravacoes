import { dayKeyFromIso, localTimeParts } from './scheduleDates.js'

/** Atalhos históricos 14h/16h — não limitam lotação do dia. */
export const SLOT_HOURS = [14, 16] as const

/** Legado: lotação máx. 2/dia desativada. */
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

/** Lotação máx. 2/dia desativada — mantido por compatibilidade da API/script. */
export function computeDayCapacityFixChanges(
  _sessions: CapacitySession[],
): CapacityFixChange[] {
  return []
}

/** Lotação máx. 2/dia desativada — mantido por compatibilidade de imports. */
export function hasOverfullDays(_sessions: CapacitySession[]): boolean {
  return false
}

/** Sessão agendada que já ocupa o mesmo dia + hora + minuto, se houver. */
export function findSlotConflict(
  sessions: CapacitySession[],
  scheduledAtIso: string,
  exceptId: string,
): CapacitySession | undefined {
  const day = dayKeyFromIso(scheduledAtIso)
  const { hour, minute } = localTimeParts(scheduledAtIso)
  return sessions.find((s) => {
    if (s.status !== 'scheduled' || s.id === exceptId) return false
    if (dayKeyFromIso(s.scheduledAt) !== day) return false
    const t = localTimeParts(s.scheduledAt)
    return t.hour === hour && t.minute === minute
  })
}

/** Lotação máx. 2/dia desativada — mantido por compatibilidade de imports. */
export function assertDayCapacity(
  _sessions: CapacitySession[],
  _personId: string,
  _scheduledAtIso: string,
  _exceptId?: string,
): void {}

export function countSessionsOnDay(sessions: CapacitySession[], day: string): number {
  return sessions.filter(
    (s) => s.status === 'scheduled' && dayKeyFromIso(s.scheduledAt) === day,
  ).length
}
