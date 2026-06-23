import {
  activeSessions,
  buildPersonIndex,
  compareSessionsByTime,
  dayKey,
  localTimeParts,
} from './schedule'
import { getTopicOrder } from './topicOrder'
import type { Person, Session } from './types'

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'] as const

function weekdayShort(dayKeyStr: string): string {
  const [y, m, d] = dayKeyStr.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()
  return WEEKDAY_SHORT[dow]
}

function formatDayHeader(dayKeyStr: string): string {
  const [, month, day] = dayKeyStr.split('-')
  return `${day}/${month} (${weekdayShort(dayKeyStr)})`
}

function formatHour(iso: string): string {
  const { hour, minute } = localTimeParts(iso)
  return minute === 0 ? `${hour}h` : `${hour}h${String(minute).padStart(2, '0')}`
}

function encerraSuffix(
  session: Session,
  person: Person,
  personSessions: Session[],
): string {
  const notes = session.notes?.trim() ?? ''
  const encerraMatch = notes.match(/^encerra\s+(.+)$/i)
  if (encerraMatch) return ` [encerra ${encerraMatch[1].trim()}]`

  const order = getTopicOrder(person)
  const lastLetter = order[order.length - 1]
  if (!lastLetter || session.topicLetter !== lastLetter) return ''

  const lastOfTopic = personSessions
    .filter((s) => s.topicLetter === lastLetter)
    .sort(compareSessionsByTime)
  if (lastOfTopic[lastOfTopic.length - 1]?.id !== session.id) return ''

  return ` [encerra ${person.name}]`
}

/** Formato texto do cronograma (como enviado originalmente no Discord). */
export function formatScheduleAsText(people: Person[], sessions: Session[]): string {
  const personIndex = buildPersonIndex(people)
  const active = activeSessions(sessions).sort(compareSessionsByTime)

  const byDay = new Map<string, Session[]>()
  for (const s of active) {
    const key = dayKey(s.scheduledAt)
    const list = byDay.get(key) ?? []
    list.push(s)
    byDay.set(key, list)
  }

  const lines: string[] = ['# Cronograma atual', '']

  for (const key of [...byDay.keys()].sort()) {
    lines.push(formatDayHeader(key))
    const daySessions = byDay.get(key)!.sort(compareSessionsByTime)
    for (const s of daySessions) {
      const person = personIndex.get(s.personId)
      const name = person?.name ?? s.personId
      const hour = formatHour(s.scheduledAt)
      const personSessions = active.filter((x) => x.personId === s.personId)
      const suffix = person ? encerraSuffix(s, person, personSessions) : ''
      lines.push(`- ${hour} — ${name} (${s.topicLetter})${suffix}`)
    }
    lines.push('')
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  return lines.join('\n')
}

export async function copyScheduleToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function downloadScheduleText(text: string, filename = 'cronograma.txt'): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
