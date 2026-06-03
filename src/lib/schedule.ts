import type { Person, Session, SessionStatus, Topic } from './types'

const TZ = 'America/Sao_Paulo'

export function buildPersonIndex(people: Person[]): Map<string, Person> {
  return new Map(people.map((p) => [p.id, p]))
}

export function findTopic(person: Person | undefined, letter: string): Topic | undefined {
  return person?.topics.find((t) => t.letter === letter)
}

export function dayKey(iso: string): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function formatDateLong(dayKeyStr: string): string {
  const [y, m, d] = dayKeyStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  const weekday = WEEKDAYS[date.getUTCDay()]
  return `${weekday}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function todayKey(): string {
  return dayKey(new Date().toISOString())
}

export function sessionsForDay(sessions: Session[], key: string): Session[] {
  return sessions
    .filter((s) => s.status !== 'postponed' && dayKey(s.scheduledAt) === key)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

export function activeSessions(sessions: Session[]): Session[] {
  return sessions.filter((s) => s.status !== 'postponed')
}

export interface GlobalStats {
  total: number
  done: number
  scheduled: number
  postponed: number
  remaining: number
}

export function globalStats(sessions: Session[]): GlobalStats {
  const done = sessions.filter((s) => s.status === 'done').length
  const postponed = sessions.filter((s) => s.status === 'postponed').length
  return {
    total: sessions.length,
    done,
    scheduled: sessions.filter((s) => s.status === 'scheduled').length,
    postponed,
    remaining: sessions.length - done - postponed,
  }
}

export interface PersonProgress {
  person: Person
  total: number
  done: number
  remaining: number
  sessions: Session[]
}

export function personProgress(people: Person[], sessions: Session[]): PersonProgress[] {
  return people.map((person) => {
    const own = sessions
      .filter((s) => s.personId === person.id)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    const done = own.filter((s) => s.status === 'done').length
    return {
      person,
      total: own.length,
      done,
      remaining: own.length - done,
      sessions: own,
    }
  })
}

export const STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: 'Agendado',
  done: 'Gravado',
  postponed: 'Adiado',
}

export function localTimeParts(iso: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return { hour: get('hour'), minute: get('minute') }
}

export function buildScheduledAt(dayKeyStr: string, hour: number, minute: number): string {
  const [y, m, d] = dayKeyStr.split('-').map(Number)
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${hh}:${mm}:00-03:00`
}

export function rescheduleSession(session: Session, targetDayKey: string): string {
  const { hour, minute } = localTimeParts(session.scheduledAt)
  return buildScheduledAt(targetDayKey, hour, minute)
}

export interface CalendarMonth {
  year: number
  month: number
  weeks: (string | null)[][]
}

export function buildCalendarMonth(year: number, month: number): CalendarMonth {
  const first = new Date(Date.UTC(year, month - 1, 1, 12))
  const startDow = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate()

  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return { year, month, weeks }
}

export function monthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1, 12))
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

export function sessionMonthRange(sessions: Session[]): { year: number; month: number }[] {
  const keys = activeSessions(sessions).map((s) => dayKey(s.scheduledAt))
  const today = todayKey()
  if (keys.length === 0) {
    const [y, m] = today.split('-').map(Number)
    return [{ year: y, month: m }]
  }
  const sorted = [...new Set([...keys, today])].sort()
  const [sy, sm] = sorted[0].split('-').map(Number)
  const [ey, em] = sorted[sorted.length - 1].split('-').map(Number)
  const months: { year: number; month: number }[] = []
  let y = sy
  let m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push({ year: y, month: m })
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return months
}
