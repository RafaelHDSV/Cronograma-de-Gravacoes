export const SCHEDULE_TZ = 'America/Sao_Paulo'

export const FRIDAY_BLOCKED_MESSAGE =
  'Nao e permitido agendar gravacoes as sextas-feiras.'

const WEEKDAY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function dayKeyFromIso(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHEDULE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function weekdayInScheduleTz(dayKeyStr: string): number {
  const [y, m, d] = dayKeyStr.split('-').map(Number)
  const noon = new Date(
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00-03:00`,
  )
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHEDULE_TZ,
    weekday: 'short',
  }).format(noon)
  return WEEKDAY_SHORT[label] ?? 0
}

export function isFridayDayKey(dayKeyStr: string): boolean {
  return weekdayInScheduleTz(dayKeyStr) === 5
}

export function isFriday(scheduledAtIso: string): boolean {
  return isFridayDayKey(dayKeyFromIso(scheduledAtIso))
}

/** Novo agendamento manual: sexta bloqueada; sabado e domingo permitidos. */
export function isValidScheduleDate(dayKeyStr: string): boolean {
  return !isFridayDayKey(dayKeyStr)
}

/** Destino da cascata: segunda a quinta (dia util para gravacao). */
export function isCascadeBusinessDay(dayKeyStr: string): boolean {
  const w = weekdayInScheduleTz(dayKeyStr)
  return w >= 1 && w <= 4
}

export function addDaysToDayKey(dayKeyStr: string, days: number): string {
  const [y, m, d] = dayKeyStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days, 12))
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function nextCascadeBusinessDayKey(afterDayKey: string): string {
  let cursor = afterDayKey
  for (let i = 0; i < 366; i++) {
    cursor = addDaysToDayKey(cursor, 1)
    if (isCascadeBusinessDay(cursor)) return cursor
  }
  throw new Error('Nao foi possivel encontrar dia util para cascata')
}

export function localTimeParts(iso: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHEDULE_TZ,
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

export function assertValidScheduleDate(scheduledAtIso: string): void {
  if (isFriday(scheduledAtIso)) {
    throw new Error(FRIDAY_BLOCKED_MESSAGE)
  }
}
