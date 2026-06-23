import { useEffect, useState } from 'react'
import type { Person } from '../lib/types'
import { getOrderedTopics } from '../lib/topicOrder'

interface Props {
  person: Person
  open: boolean
  onClose: () => void
  onSave: (topicOrder: string[]) => Promise<void>
}

export function TopicOrderModal({ person, open, onClose, onSave }: Props) {
  const [ordered, setOrdered] = useState(() => getOrderedTopics(person))
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setOrdered(getOrderedTopics(person))
      setError(null)
    }
  }, [open, person])

  if (!open) return null

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    setOrdered((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(ordered.map((t) => t.letter))
      onClose()
    } catch {
      setError('Nao foi possivel salvar a ordem. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="topic-order-title">
      <div className="modal-panel">
        <h2 id="topic-order-title" className="modal-title">
          Ordem de gravacao — {person.name}
        </h2>
        <p className="modal-desc">
          Arraste os topicos para definir a sequencia de gravacao. A ordem vale para o checklist e
          para validacoes futuras de sequencia.
        </p>
        <form onSubmit={handleSubmit}>
          <ol className="topic-order-list">
            {ordered.map((topic, index) => (
              <li
                key={topic.letter}
                className={`topic-order-item ${dragIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
              >
                <span className="topic-order-handle" aria-hidden="true">
                  ⋮⋮
                </span>
                <span className="topic-order-letter">{topic.letter}</span>
                <span className="topic-order-title-text">{topic.title}</span>
              </li>
            ))}
          </ol>
          {error && <p className="error modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar ordem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
