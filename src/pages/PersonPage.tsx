import { useMemo, useState } from 'react'
import { AddSessionModal, type AddSessionDefaults } from '../components/AddSessionModal'
import { SessionDateEditor } from '../components/SessionDateEditor'
import { SessionNoteIndicator } from '../components/SessionNoteIndicator'
import { TopicOrderModal } from '../components/TopicOrderModal'
import type { Person, Session } from '../lib/types'
import { formatTopicSessionSummary } from '../lib/ptPlural'
import { STATUS_LABEL } from '../lib/schedule'
import { personTopicProgress, type TopicGroup } from '../lib/topicSessions'

interface Props {
  people: Person[]
  sessions: Session[]
  canEdit: boolean
  onToggleDone: (id: string) => void
  onTopicOrderSave: (personId: string, topicOrder: string[]) => Promise<void>
  onCreateSession: (payload: {
    personId: string
    topicLetter: string
    scheduledAt: string
  }) => Promise<void>
  onMoveSession: (id: string, targetDayKey: string) => void
  onReschedule: (id: string, targetDayKey: string, hour: number, minute: number) => void
  onInvalidScheduleDate?: () => void
}

export function PersonPage({
  people,
  sessions,
  canEdit,
  onToggleDone,
  onTopicOrderSave,
  onCreateSession,
  onMoveSession,
  onReschedule,
  onInvalidScheduleDate,
}: Props) {
  const progress = useMemo(() => personTopicProgress(people, sessions), [people, sessions])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [orderModalPerson, setOrderModalPerson] = useState<Person | null>(null)
  const [addSessionDefaults, setAddSessionDefaults] = useState<AddSessionDefaults | null>(null)

  return (
    <section className="person-list">
      {progress.map(({ person, totalTopics, doneTopics, remainingTopics, groups }) => {
        const pct = totalTopics === 0 ? 0 : Math.round((doneTopics / totalTopics) * 100)
        const isExpanded = expandedId === person.id
        const multiLayout = groups.some((g) => g.sessionCount > 1)

        return (
          <article key={person.id} className="person-row">
            <div
              className="person-row-header"
              onClick={() => setExpandedId(isExpanded ? null : person.id)}
            >
              <div className="person-info">
                <h3>{person.name}</h3>
                <span className="person-stats">
                  {doneTopics}/{totalTopics} tópicos · {remainingTopics} pendentes
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
                      {multiLayout ? <th>Sessões</th> : <th>Data</th>}
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <TopicGroupRows
                        key={group.topicLetter}
                        group={group}
                        multiLayout={multiLayout}
                        canEdit={canEdit}
                        onToggleDone={onToggleDone}
                        onMoveSession={onMoveSession}
                        onReschedule={onReschedule}
                        onInvalidScheduleDate={onInvalidScheduleDate}
                        onAddSession={() =>
                          setAddSessionDefaults({
                            personId: person.id,
                            topicLetter: group.topicLetter,
                          })
                        }
                      />
                    ))}
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

      {addSessionDefaults && (
        <AddSessionModal
          open={addSessionDefaults !== null}
          people={people}
          defaults={addSessionDefaults}
          onClose={() => setAddSessionDefaults(null)}
          onSubmit={onCreateSession}
        />
      )}
    </section>
  )
}

function TopicGroupRows({
  group,
  multiLayout,
  canEdit,
  onToggleDone,
  onMoveSession,
  onReschedule,
  onInvalidScheduleDate,
  onAddSession,
}: {
  group: TopicGroup
  multiLayout: boolean
  canEdit: boolean
  onToggleDone: (id: string) => void
  onMoveSession: (id: string, targetDayKey: string) => void
  onReschedule: (id: string, targetDayKey: string, hour: number, minute: number) => void
  onInvalidScheduleDate?: () => void
  onAddSession: () => void
}) {
  if (!multiLayout || group.sessionCount <= 1) {
    return (
      <SimpleTopicRow
        group={group}
        canEdit={canEdit}
        onToggleDone={onToggleDone}
        onMoveSession={onMoveSession}
        onReschedule={onReschedule}
        onInvalidScheduleDate={onInvalidScheduleDate}
        onAddSession={onAddSession}
      />
    )
  }

  const summary = formatTopicSessionSummary(group.sessionCount, group.doneCount)
  const topicStatus = group.isComplete
    ? 'done'
    : group.doneCount > 0
      ? 'partial'
      : 'scheduled'

  return (
    <>
      <tr className={`topic-row topic-row-group ${topicStatus}`}>
        <td className="col-check"></td>
        <td className="col-letter">{group.topicLetter}</td>
        <td className="col-topic">{group.topic.title}</td>
        <td className="col-sessions">
          <span className="topic-session-summary">{summary}</span>
          {canEdit && (
            <button type="button" className="btn ghost btn-xs topic-add-btn" onClick={onAddSession}>
              + sessão
            </button>
          )}
        </td>
        <td className="col-status">
          {group.isComplete ? (
            <span className="badge-inline done">Gravado</span>
          ) : group.doneCount > 0 ? (
            <span className="badge-inline partial">Parcial</span>
          ) : (
            <span className="badge-inline scheduled">Agendado</span>
          )}
        </td>
      </tr>
      {group.sessions.map((session, idx) => {
        const isDone = session.status === 'done'
        return (
          <tr key={session.id} className={`topic-row topic-row-session ${session.status}`}>
            <td className="col-check">
              {canEdit && (session.status === 'scheduled' || isDone) && (
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
            <td className="col-letter topic-session-index">{idx + 1}</td>
            <td className="col-topic topic-session-meta">
              <SessionDateEditor
                session={session}
                canEdit={canEdit}
                onMoveSession={onMoveSession}
                onReschedule={onReschedule}
                onInvalidScheduleDate={onInvalidScheduleDate}
              />
            </td>
            <td className="col-sessions"></td>
            <td className="col-status">
              <span className={`badge-inline ${session.status}`}>
                {STATUS_LABEL[session.status]}
              </span>
              <SessionNoteIndicator notes={session.notes} />
            </td>
          </tr>
        )
      })}
    </>
  )
}

function SimpleTopicRow({
  group,
  canEdit,
  onToggleDone,
  onMoveSession,
  onReschedule,
  onInvalidScheduleDate,
  onAddSession,
}: {
  group: TopicGroup
  canEdit: boolean
  onToggleDone: (id: string) => void
  onMoveSession: (id: string, targetDayKey: string) => void
  onReschedule: (id: string, targetDayKey: string, hour: number, minute: number) => void
  onInvalidScheduleDate?: () => void
  onAddSession: () => void
}) {
  const session = group.sessions[0]
  const isDone = session?.status === 'done'

  return (
    <tr className={`topic-row ${session?.status ?? 'unscheduled'}`}>
      <td className="col-check">
        {session && canEdit && (session.status === 'scheduled' || isDone) && (
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
      <td className="col-letter">{group.topicLetter}</td>
      <td className="col-topic">{group.topic.title}</td>
      <td className="col-date">
        {!session ? (
          canEdit ? (
            <button type="button" className="btn ghost btn-xs topic-add-btn" onClick={onAddSession}>
              Adicionar sessão
            </button>
          ) : (
            '—'
          )
        ) : (
          <SessionDateEditor
            session={session}
            canEdit={canEdit}
            onMoveSession={onMoveSession}
            onReschedule={onReschedule}
            onInvalidScheduleDate={onInvalidScheduleDate}
          />
        )}
      </td>
      <td className="col-status">
        {!session ? (
          <span className="badge-inline unscheduled">Sem data</span>
        ) : (
          <>
            <span className={`badge-inline ${session.status}`}>{STATUS_LABEL[session.status]}</span>
            <SessionNoteIndicator notes={session.notes} />
          </>
        )}
      </td>
    </tr>
  )
}
