import { useMemo, useState } from 'react'
import { TopicOrderModal } from '../components/TopicOrderModal'
import type { Person, Session } from '../lib/types'
import { getOrderedTopics } from '../lib/topicOrder'
import { formatDateLong, dayKey, personProgress, STATUS_LABEL } from '../lib/schedule'

interface Props {
  people: Person[]
  sessions: Session[]
  canEdit: boolean
  onToggleDone: (id: string) => void
  onTopicOrderSave: (personId: string, topicOrder: string[]) => Promise<void>
}

export function PersonPage({ people, sessions, canEdit, onToggleDone, onTopicOrderSave }: Props) {
  const progress = useMemo(() => personProgress(people, sessions), [people, sessions])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [orderModalPerson, setOrderModalPerson] = useState<Person | null>(null)

  return (
    <section className="person-list">
      {progress.map(({ person, total, done, remaining, sessions: own }) => {
        const pct = total === 0 ? 0 : Math.round((done / total) * 100)
        const isExpanded = expandedId === person.id
        const scheduledLetters = new Set(own.map((s) => s.topicLetter))
        const orderedTopics = getOrderedTopics(person)

        return (
          <article key={person.id} className="person-row">
            <div
              className="person-row-header"
              onClick={() => setExpandedId(isExpanded ? null : person.id)}
            >
              <div className="person-info">
                <h3>{person.name}</h3>
                <span className="person-stats">
                  {done}/{total} gravados · {remaining} restantes
                </span>
              </div>
              <div className="person-progress-wrap">
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="person-pct">{pct}%</span>
              </div>
              <span className={`expand-icon ${isExpanded ? 'open' : ''}`}>›</span>
            </div>

            {isExpanded && (
              <div className="person-row-detail">
                {canEdit && (
                  <div className="person-detail-toolbar">
                    <button
                      type="button"
                      className="btn ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOrderModalPerson(person)
                      }}
                    >
                      Configurar ordem
                    </button>
                  </div>
                )}
                <table className="topic-table">
                  <thead>
                    <tr>
                      <th className="col-check"></th>
                      <th className="col-letter"></th>
                      <th>Tópico</th>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedTopics.map((t) => {
                      const session = own.find((s) => s.topicLetter === t.letter)
                      const status = session?.status
                      const notScheduled = !scheduledLetters.has(t.letter)
                      const isDone = status === 'done'
                      return (
                        <tr key={t.letter} className={`topic-row ${status ?? 'unscheduled'}`}>
                          <td className="col-check">
                            {session && canEdit && (
                              <label className="session-check">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => onToggleDone(session.id)}
                                />
                                <span className="checkmark" />
                              </label>
                            )}
                          </td>
                          <td className="col-letter">{t.letter}</td>
                          <td className="col-topic">{t.title}</td>
                          <td className="col-date">
                            {notScheduled
                              ? '—'
                              : formatDateLong(dayKey(session!.scheduledAt)).split(',')[1]?.trim()}
                          </td>
                          <td className="col-status">
                            {notScheduled ? (
                              <span className="badge-inline unscheduled">Sem data</span>
                            ) : (
                              <span className={`badge-inline ${status}`}>
                                {STATUS_LABEL[status!]}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        )
      })}

      {orderModalPerson && (
        <TopicOrderModal
          person={orderModalPerson}
          open={orderModalPerson !== null}
          onClose={() => setOrderModalPerson(null)}
          onSave={(topicOrder) => onTopicOrderSave(orderModalPerson.id, topicOrder)}
        />
      )}
    </section>
  )
}
