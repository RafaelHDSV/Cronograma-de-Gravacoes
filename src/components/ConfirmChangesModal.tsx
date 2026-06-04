import type { PendingRow } from '../lib/pending'
import { describeSessionSnapshot } from '../lib/pending'
import { findTopic } from '../lib/schedule'
import type { Person } from '../lib/types'

interface Props {
  open: boolean
  rows: PendingRow[]
  personIndex: Map<string, Person>
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmChangesModal({
  open,
  rows,
  personIndex,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-panel">
        <h2 id="confirm-title" className="modal-title">
          Confirmar alterações
        </h2>
        <p className="modal-desc">
          {rows.length} sessão(ões) serão atualizadas no banco. Revise antes de confirmar.
        </p>
        {rows.length === 0 ? (
          <p className="empty">Nenhuma alteração pendente.</p>
        ) : (
          <ul className="confirm-list">
            {rows.map((row) => {
              const person = personIndex.get(row.before.personId)
              const topic = findTopic(person, row.before.topicLetter)
              const name = person?.name ?? row.before.personId
              const title = topic?.title ?? row.before.topicLetter
              return (
                <li key={row.sessionId} className="confirm-item">
                  <div className="confirm-labels">
                    {row.labels.map((l, i) => (
                      <span key={i} className="confirm-tag">
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="confirm-diff">
                    <span className="confirm-before">
                      {describeSessionSnapshot(row.before, name, title)}
                    </span>
                    <span className="confirm-arrow">→</span>
                    <span className="confirm-after">
                      {describeSessionSnapshot(row.after, name, title)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel} disabled={loading}>
            Voltar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={onConfirm}
            disabled={loading || rows.length === 0}
          >
            {loading ? 'Salvando…' : 'Confirmar e salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
