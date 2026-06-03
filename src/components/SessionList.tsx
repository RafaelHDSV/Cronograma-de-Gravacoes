import type { Person, Session } from '../lib/types'
import { findTopic, formatTime } from '../lib/schedule'
import { StatusBadge } from './StatusBadge'

interface Props {
  sessions: Session[]
  personIndex: Map<string, Person>
  showTime?: boolean
}

export function SessionList({ sessions, personIndex, showTime = true }: Props) {
  if (sessions.length === 0) {
    return <p className="empty">Sem gravações.</p>
  }
  return (
    <ul className="session-list">
      {sessions.map((s) => {
        const person = personIndex.get(s.personId)
        const topic = findTopic(person, s.topicLetter)
        return (
          <li key={s.id} className={`session-row ${s.status}`}>
            {showTime && <span className="time">{formatTime(s.scheduledAt)}</span>}
            <span className="who">
              <strong>{person?.name ?? s.personId}</strong>
              <span className="letter">({s.topicLetter})</span>
            </span>
            <span className="topic">{topic?.title ?? '—'}</span>
            <span className="meta">
              <StatusBadge status={s.status} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
