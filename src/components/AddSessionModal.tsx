import { useEffect, useMemo, useState } from 'react'
import { TimeSlotPicker } from './TimeSlotPicker'
import { DEFAULT_SLOT_HOURS, buildScheduledAt, sortPeopleByName } from '../lib/schedule'
import type { Person } from '../lib/types'
import { getOrderedTopics } from '../lib/topicOrder'

export interface AddSessionDefaults {
  personId?: string
  topicLetter?: string
  dayKey?: string
}

interface Props {
  open: boolean
  people: Person[]
  defaults?: AddSessionDefaults
  onClose: () => void
  onSubmit: (payload: {
    personId: string
    topicLetter: string
    scheduledAt: string
  }) => Promise<void>
}

export function AddSessionModal({ open, people, defaults, onClose, onSubmit }: Props) {
  const sortedPeople = useMemo(() => sortPeopleByName(people), [people])
  const [personId, setPersonId] = useState(defaults?.personId ?? sortedPeople[0]?.id ?? '')
  const [topicLetter, setTopicLetter] = useState(defaults?.topicLetter ?? '')
  const [dayKey, setDayKey] = useState(defaults?.dayKey ?? '')
  const [hour, setHour] = useState<number>(DEFAULT_SLOT_HOURS[0])
  const [minute, setMinute] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const person = useMemo(() => sortedPeople.find((p) => p.id === personId), [sortedPeople, personId])
  const topics = useMemo(() => (person ? getOrderedTopics(person) : []), [person])

  useEffect(() => {
    if (!open) return
    setPersonId(defaults?.personId ?? sortedPeople[0]?.id ?? '')
    setTopicLetter(defaults?.topicLetter ?? '')
    setDayKey(defaults?.dayKey ?? '')
    setHour(DEFAULT_SLOT_HOURS[0])
    setMinute(0)
    setError(null)
  }, [open, defaults, sortedPeople])

  useEffect(() => {
    if (!open || !person) return
    if (topicLetter && topics.some((t) => t.letter === topicLetter)) return
    setTopicLetter(topics[0]?.letter ?? '')
  }, [open, person, topics, topicLetter])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!personId || !topicLetter || !dayKey) {
      setError('Preencha pessoa, tópico e data.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        personId,
        topicLetter,
        scheduledAt: buildScheduledAt(dayKey, hour, minute),
      })
      onClose()
    } catch {
      setError('Não foi possível criar a sessão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-session-title">
      <div className="modal-panel modal-panel-sm">
        <h2 id="add-session-title" className="modal-title">
          Adicionar sessão
        </h2>
        <p className="modal-desc">
          Cria uma nova sessão de gravação para um tópico existente (ex.: continuação em outro dia).
        </p>
        <form onSubmit={handleSubmit} className="add-session-form">
          <label className="form-field">
            <span className="form-label">Pessoa</span>
            <select
              className="form-select"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              disabled={!!defaults?.personId}
            >
              {sortedPeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Tópico</span>
            <select
              className="form-select"
              value={topicLetter}
              onChange={(e) => setTopicLetter(e.target.value)}
              disabled={!!defaults?.topicLetter}
            >
              {topics.map((t) => (
                <option key={t.letter} value={t.letter}>
                  ({t.letter}) {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Data</span>
            <input
              type="date"
              className="date-input"
              value={dayKey}
              onChange={(e) => setDayKey(e.target.value)}
              required
            />
          </label>
          <div className="form-field">
            <span className="form-label">Horário</span>
            <TimeSlotPicker hour={hour} minute={minute} onChange={(h, m) => { setHour(h); setMinute(m) }} />
          </div>
          {error && <p className="error modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={saving || !dayKey}>
              {saving ? 'Criando…' : 'Adicionar sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
