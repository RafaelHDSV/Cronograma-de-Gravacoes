import { useCallback, useMemo, useState } from 'react'
import { IconEdit, IconPostpone, IconSwapOrder } from '../components/SessionIcons'
import { StatusBadge } from '../components/StatusBadge'
import { TimeSlotPicker } from '../components/TimeSlotPicker'
import { IconButton, Tooltip } from '../components/Tooltip'
import {
  activeSessions,
  buildCalendarMonth,
  dayKey,
  findTopic,
  formatDateLong,
  formatTime,
  localTimeParts,
  monthLabel,
  sessionMonthRange,
  sessionsForDay,
  todayKey,
} from '../lib/schedule'
import type { Person, Session } from '../lib/types'

interface Props {
  sessions: Session[]
  personIndex: Map<string, Person>
  canEdit: boolean
  onMoveSession: (id: string, targetDayKey: string) => void
  onToggleDone: (id: string) => void
  onSwapTime: (idA: string, idB: string) => void
  onPostpone: (id: string) => void
  onReschedule: (id: string, targetDayKey: string, hour: number, minute: number) => void
  onChangeTime: (id: string, hour: number, minute: number) => void
}

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarPage({
  sessions,
  personIndex,
  canEdit,
  onMoveSession,
  onToggleDone,
  onSwapTime,
  onPostpone,
  onReschedule,
  onChangeTime,
}: Props) {
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null)
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

      <p className="calendar-hint">
        {canEdit
          ? 'Arraste um chip na grade para outro dia (mantém o horário). No detalhe, use o ícone ao lado do horário para editar a faixa.'
          : 'Modo leitura — ative o modo editor para alterar o cronograma.'}
      </p>

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
                if (!canEdit) return
                e.preventDefault()
                setDragOverDay(day)
              }}
              onDragLeave={() => setDragOverDay((d) => (d === day ? null : d))}
              onDrop={(e) => canEdit && handleDrop(e, day)}
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
                      draggable={canEdit}
                      onDragStart={(e) => canEdit && handleDragStart(e, s.id)}
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
                const { hour, minute } = localTimeParts(s.scheduledAt)
                const showTimeEdit = editingTimeId === s.id
                return (
                  <li key={s.id} className={`calendar-detail-row ${s.status}`}>
                    <Tooltip label={isDone ? 'Desmarcar gravação' : 'Marcar como gravada'}>
                      <label className="session-check">
                        <input
                          type="checkbox"
                          checked={isDone}
                          disabled={!canEdit || (!isDone && !isScheduled)}
                          onChange={() => onToggleDone(s.id)}
                        />
                        <span className="checkmark" />
                      </label>
                    </Tooltip>
                    <div className="detail-body">
                      <div className="detail-time-group">
                        <span className="detail-time">{formatTime(s.scheduledAt)}</span>
                        {canEdit && isScheduled && (
                          <IconButton
                            label="Alterar horário"
                            className="time-edit-btn"
                            active={showTimeEdit}
                            aria-expanded={showTimeEdit}
                            onClick={() => setEditingTimeId(showTimeEdit ? null : s.id)}
                          >
                            <IconEdit />
                          </IconButton>
                        )}
                      </div>
                      <span className="detail-dot" aria-hidden="true">
                        ·
                      </span>
                      <span className="detail-person">
                        <strong>{person?.name ?? s.personId}</strong>
                        <span className="letter">({s.topicLetter})</span>
                      </span>
                      <span className="detail-dot" aria-hidden="true">
                        ·
                      </span>
                      <span className="detail-topic">{topic?.title ?? '—'}</span>
                      {isDone && <StatusBadge status={s.status} />}
                    </div>
                    {canEdit && (isScheduled || canSwapDown) && (
                      <div className="detail-actions">
                        {isScheduled && (
                          <IconButton
                            label="Adiar gravação"
                            className="postpone-btn"
                            onClick={() => onPostpone(s.id)}
                          >
                            <IconPostpone />
                          </IconButton>
                        )}
                        {canSwapDown && (
                          <IconButton
                            label="Trocar horário com a gravação de baixo"
                            className="swap-btn"
                            onClick={() => handleSwap(idx)}
                          >
                            <IconSwapOrder />
                          </IconButton>
                        )}
                      </div>
                    )}
                    {showTimeEdit && canEdit && (
                      <div className="detail-time-edit">
                        <TimeSlotPicker
                          hour={hour}
                          minute={minute}
                          onChange={(h, m) => onChangeTime(s.id, h, m)}
                        />
                      </div>
                    )}
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
                canEdit={canEdit}
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
  canEdit,
  onReschedule,
}: {
  session: Session
  personIndex: Map<string, Person>
  canEdit: boolean
  onReschedule: (id: string, targetDayKey: string, hour: number, minute: number) => void
}) {
  const person = personIndex.get(session.personId)
  const topic = findTopic(person, session.topicLetter)
  const [newDate, setNewDate] = useState('')
  const { hour, minute } = localTimeParts(session.scheduledAt)
  const [slotHour, setSlotHour] = useState(hour)
  const [slotMinute, setSlotMinute] = useState(minute)
  const originalDay = dayKey(session.scheduledAt)

  const handleSchedule = () => {
    if (!newDate) return
    onReschedule(session.id, newDate, slotHour, slotMinute)
    setNewDate('')
  }

  const wasDate =
    formatDateLong(originalDay).split(',')[1]?.trim() ?? formatDateLong(originalDay)

  return (
    <li className="postponed-row">
      <div className="postponed-summary">
        <span className="postponed-time">{formatTime(session.scheduledAt)}</span>
        <span className="postponed-dot" aria-hidden="true">
          ·
        </span>
        <span className="postponed-who">
          <strong>{person?.name ?? session.personId}</strong>
          <span className="letter">({session.topicLetter})</span>
        </span>
        <span className="postponed-dot" aria-hidden="true">
          ·
        </span>
        <span className="postponed-topic">{topic?.title ?? '—'}</span>
        <span className="postponed-was">Era {wasDate}</span>
      </div>
      {canEdit && (
        <div className="postponed-reschedule">
          <label className="reschedule-field">
            <span className="reschedule-label">Nova data</span>
            <input
              type="date"
              className="date-input"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </label>
          <div className="reschedule-field reschedule-field--time">
            <span className="reschedule-label">Horário</span>
            <TimeSlotPicker
              hour={slotHour}
              minute={slotMinute}
              onChange={(h, m) => {
                setSlotHour(h)
                setSlotMinute(m)
              }}
            />
          </div>
          <Tooltip label={newDate ? 'Reagendar nesta data' : 'Escolha uma data'}>
            <button
              type="button"
              className="btn primary sm reschedule-submit"
              onClick={handleSchedule}
              disabled={!newDate}
            >
              Agendar
            </button>
          </Tooltip>
        </div>
      )}
    </li>
  )
}
