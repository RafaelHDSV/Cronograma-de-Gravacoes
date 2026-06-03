import type { Person, Session } from './types'
import { STATUS_LABEL, findTopic, formatDateLong, formatTime } from './schedule'

const STATUS_EMOJI: Record<Session['status'], string> = {
  scheduled: '🗓️',
  done: '✅',
  postponed: '⏳',
}

export function buildDaySummary(
  dayKeyStr: string,
  daySessions: Session[],
  personIndex: Map<string, Person>,
): string {
  const lines: string[] = [`**Gravações — ${formatDateLong(dayKeyStr)}**`]
  if (daySessions.length === 0) {
    lines.push('_Sem gravações agendadas._')
    return lines.join('\n')
  }
  for (const s of daySessions) {
    const person = personIndex.get(s.personId)
    const topic = findTopic(person, s.topicLetter)
    const name = person?.name ?? s.personId
    const title = topic?.title ?? `(${s.topicLetter})`
    const tail = s.status === 'scheduled' ? '' : ` — ${STATUS_LABEL[s.status]}`
    const note = s.notes ? ` _[${s.notes}]_` : ''
    lines.push(`${STATUS_EMOJI[s.status]} ${formatTime(s.scheduledAt)} — **${name}** (${s.topicLetter}) ${title}${tail}${note}`)
  }
  const text = lines.join('\n')
  return text.length > 2000 ? text.slice(0, 1997) + '...' : text
}
