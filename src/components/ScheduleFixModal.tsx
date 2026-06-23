import type { Person } from '../lib/types'
import { dayKey, formatDateLong, formatTime } from '../lib/schedule'

export interface ScheduleFixChange {
  sessionId: string
  personId: string
  topicLetter: string
  before: string
  after: string
}

interface Props {
  open: boolean
  title: string
  description: string
  emptyMessage: string
  confirmLabel: string
  changes: ScheduleFixChange[]
  personIndex: Map<string, Person>
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ScheduleFixModal({
  open,
  title,
  description,
  emptyMessage,
  confirmLabel,
  changes,
  personIndex,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="schedule-fix-title">
      <div className="modal-panel">
        <h2 id="schedule-fix-title" className="modal-title">
          {title}
        </h2>
        <p className="modal-desc">{description}</p>
        {changes.length === 0 ? (
          <p className="empty">{emptyMessage}</p>
        ) : (
          <ul className="confirm-list fix-fridays-list">
            {changes.map((change) => {
              const person = personIndex.get(change.personId)
              const name = person?.name ?? change.personId
              const beforeDay = formatDateLong(dayKey(change.before))
              const afterDay = formatDateLong(dayKey(change.after))
              return (
                <li key={change.sessionId} className="confirm-item">
                  <div className="confirm-labels">
                    <span className="confirm-tag">{name}</span>
                    <span className="confirm-tag">({change.topicLetter})</span>
                  </div>
                  <div className="confirm-diff">
                    <span className="confirm-before">
                      {beforeDay} {formatTime(change.before)}
                    </span>
                    <span className="confirm-arrow">→</span>
                    <span className="confirm-after">
                      {afterDay} {formatTime(change.after)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={onConfirm}
            disabled={loading || changes.length === 0}
          >
            {loading ? 'Aplicando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
