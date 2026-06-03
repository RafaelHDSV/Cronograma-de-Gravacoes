import { useCallback, useMemo, useState } from 'react'
import type { Person, Session } from '../lib/types'
import {
  activeSessions,
  buildCalendarMonth,
  dayKey,
  findTopic,
  formatDateLong,
  formatTime,
  monthLabel,
  sessionMonthRange,
  sessionsForDay,
  todayKey,
} from '../lib/schedule'
import { StatusBadge } from '../components/StatusBadge'

interface Props {
  sessions: Session[]
  personIndex: Map<string, Person>
  onMoveSession: (id: string, targetDayKey: string) => void
  onToggleDone: (id: string) => void
  onSwapTime: (idA: string, idB: string) => void
  onPostpone: (id: string) => void
  onReschedule: (id: string, targetDayKey: string) => void
}

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarPage({
  sessions,
  personIndex,
  onMoveSession,
  onToggleDone,
  onSwapTime,
  onPostpone,
  onReschedule,
}: Props) {
  const calendarSessions = useMemo(() => activeSessions(sessions), [sessions])
  const postponedSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'postponed')
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [sessions],
  )

  const monthRange = useMemo(() => sessionMonthRange(sessions), [sessions])
  const today = todayKey()
  const [ty, tm] = today.split('-').map(Number)
  const todayMonthIdx = monthRange.findIndex((mo) => mo.year === ty && mo.month === tm)
  const [monthIndex, setMonthIndex] = useState(Math.max(0, todayMonthIdx))

  const { year, month } = monthRange[monthIndex] ?? monthRange[0] ?? { year: ty, month: tm }
  const calendar = useMemo(() => buildCalendarMonth(year, month), [year, month])
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(today)

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const s of calendarSessions) {
      const key = dayKey(s.scheduledAt)
      const arr = map.get(key) ?? []
      arr.push(s)
      map.set(key, arr)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    }
    return map
  }, [calendarSessions])

  const handleDragStart = useCallback((e: React.DragEvent, sessionId: string) => {
    e.dataTransfer.setData('text/session-id', sessionId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetDay: string) => {
      e.preventDefault()
      setDragOverDay(null)
      const sessionId = e.dataTransfer.getData('text/session-id')
      if (sessionId) {
        onMoveSession(sessionId, targetDay)
        setSelectedDay(targetDay)
      }
    },
    [onMoveSession],
  )

  const goToToday = useCallback(() => {
    const idx = monthRange.findIndex((mo) => mo.year === ty && mo.month === tm)
    if (idx >= 0) {
      setMonthIndex(idx)
    }
    setSelectedDay(today)
  }, [monthRange, ty, tm, today])

  const selectedSessions = selectedDay ? sessionsForDay(sessions, selectedDay) : []

  const handleSwap = useCallback(
    (idx: number) => {
      if (idx >= selectedSessions.length - 1) return
      const a = selectedSessions[idx]
      const b = selectedSessions[idx + 1]
      onSwapTime(a.id, b.id)
    },
    [selectedSessions, onSwapTime],
  )

  return (
    <section className="calendar-page">
      <div className="page-head">
        <div className="calendar-nav">
          <button
            className="btn ghost"
            onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
            disabled={monthIndex === 0}
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <h2 className="calendar-title">{monthLabel(year, month)}</h2>
          <button
            className="btn ghost"
            onClick={() => setMonthIndex((i) => Math.min(monthRange.length - 1, i + 1))}
            disabled={monthIndex >= monthRange.length - 1}
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>
        <button className="btn ghost" onClick={goToToday}>
          Ir para hoje
        </button>
      </div>

      <p className="calendar-hint">Arraste uma gravação para outro dia para remarcar.</p>

      <div className="calendar-grid">
        {WEEKDAYS_SHORT.map((wd) => (
          <div key={wd} className="calendar-weekday">
            {wd}
          </div>
        ))}
        {calendar.weeks.flat().map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="calendar-cell empty" />
          }
          const daySessions = sessionsByDay.get(day) ?? []
          const isToday = day === today
          const isSelected = day === selectedDay
          const doneCount = daySessions.filter((s) => s.status === 'done').length

          return (
            <div
              key={day}
              className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dragOverDay === day ? 'drag-over' : ''}`}
              onClick={() => setSelectedDay(day)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverDay(day)
              }}
              onDragLeave={() => setDragOverDay((d) => (d === day ? null : d))}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="cell-header">
                <span className="cell-day">{Number(day.split('-')[2])}</span>
                {daySessions.length > 0 && (
                  <span className="cell-count">
                    {doneCount}/{daySessions.length}
                  </span>
                )}
              </div>
              <div className="cell-sessions">
                {daySessions.slice(0, 3).map((s) => {
                  const person = personIndex.get(s.personId)
                  const topic = findTopic(person, s.topicLetter)
                  return (
                    <div
                      key={s.id}
                      className={`session-chip ${s.status}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, s.id)}
                      onClick={(e) => e.stopPropagation()}
                      title={`${person?.name} — ${topic?.title ?? s.topicLetter} · ${formatTime(s.scheduledAt)}`}
                    >
                      <span className="chip-time">{formatTime(s.scheduledAt)}</span>
                      <span className="chip-name">{person?.name?.split(' ')[0] ?? s.personId}</span>
                    </div>
                  )
                })}
                {daySessions.length > 3 && (
                  <span className="cell-more">+{daySessions.length - 3} mais</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <div className="calendar-detail">
          <h3 className="section-title">
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(
              new Date(
                Date.UTC(
                  Number(selectedDay.split('-')[0]),
                  Number(selectedDay.split('-')[1]) - 1,
                  Number(selectedDay.split('-')[2]),
                  12,
                ),
              ),
            )}
          </h3>
          {selectedSessions.length === 0 ? (
            <p className="empty">Nenhuma gravação neste dia. Arraste uma sessão para cá.</p>
          ) : (
            <ul className="calendar-detail-list">
              {selectedSessions.map((s, idx) => {
                const person = personIndex.get(s.personId)
                const topic = findTopic(person, s.topicLetter)
                const isDone = s.status === 'done'
                const isScheduled = s.status === 'scheduled'
                const canSwapDown = idx < selectedSessions.length - 1
                return (
                  <li key={s.id} className={`calendar-detail-row ${s.status}`}>
                    <label className="session-check" title={isDone ? 'Desmarcar' : 'Marcar como gravada'}>
                      <input
                        type="checkbox"
                        checked={isDone}
                        disabled={!isDone && !isScheduled}
                        onChange={() => onToggleDone(s.id)}
                      />
                      <span className="checkmark" />
                    </label>
                    <span className="detail-time">{formatTime(s.scheduledAt)}</span>
                    <span className="detail-who">
                      <strong>{person?.name ?? s.personId}</strong>
                      <span className="letter">({s.topicLetter})</span>
                    </span>
                    <span className="detail-topic">{topic?.title ?? '—'}</span>
                    <span className="detail-meta">
                      <StatusBadge status={s.status} />
                    </span>
                    {isScheduled && (
                      <button
                        className="btn ghost postpone-btn"
                        onClick={() => onPostpone(s.id)}
                        title="Adiar gravação"
                      >
                        Adiar
                      </button>
                    )}
                    {!isScheduled && <span className="postpone-placeholder" />}
                    {canSwapDown && (
                      <button
                        className="btn ghost swap-btn"
                        onClick={() => handleSwap(idx)}
                        title="Trocar horário com a gravação de baixo"
                        aria-label="Trocar horário"
                      >
                        ↕
                      </button>
                    )}
                    {!canSwapDown && <span className="swap-placeholder" />}
                    <div
                      className="drag-handle"
                      draggable
                      onDragStart={(e) => handleDragStart(e, s.id)}
                      title="Arraste para mover de dia"
                    >
                      ⠿
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <div className="postponed-section">
        <h3 className="section-title">
          Adiadas
          {postponedSessions.length > 0 && (
            <span className="postponed-count">{postponedSessions.length}</span>
          )}
        </h3>
        {postponedSessions.length === 0 ? (
          <p className="empty postponed-empty">Nenhuma gravação adiada.</p>
        ) : (
          <ul className="postponed-list">
            {postponedSessions.map((s) => (
              <PostponedRow
                key={s.id}
                session={s}
                personIndex={personIndex}
                onReschedule={onReschedule}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function PostponedRow({
  session,
  personIndex,
  onReschedule,
}: {
  session: Session
  personIndex: Map<string, Person>
  onReschedule: (id: string, targetDayKey: string) => void
}) {
  const person = personIndex.get(session.personId)
  const topic = findTopic(person, session.topicLetter)
  const [newDate, setNewDate] = useState('')
  const originalDay = dayKey(session.scheduledAt)

  const handleSchedule = () => {
    if (!newDate) return
    onReschedule(session.id, newDate)
    setNewDate('')
  }

  return (
    <li className="postponed-row">
      <div className="postponed-info">
        <span className="postponed-time">{formatTime(session.scheduledAt)}</span>
        <span className="postponed-who">
          <strong>{person?.name ?? session.personId}</strong>
          <span className="letter">({session.topicLetter})</span>
        </span>
        <span className="postponed-topic">{topic?.title ?? '—'}</span>
        <span className="postponed-was">Era {formatDateLong(originalDay).split(',')[1]?.trim()}</span>
      </div>
      <div className="postponed-actions">
        <input
          type="date"
          className="date-input"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          aria-label="Nova data da gravação"
        />
        <button className="btn sm" onClick={handleSchedule} disabled={!newDate}>
          Agendar
        </button>
      </div>
    </li>
  )
}
