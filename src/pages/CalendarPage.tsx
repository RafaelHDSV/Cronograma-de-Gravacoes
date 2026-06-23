import { useCallback, useMemo, useState } from 'react'
import { AddSessionModal, type AddSessionDefaults } from '../components/AddSessionModal'
import { IconEdit, IconPostpone, IconDelete } from '../components/SessionIcons'
import { StatusBadge } from '../components/StatusBadge'
import { TimeSlotPicker } from '../components/TimeSlotPicker'
import { IconButton, Tooltip } from '../components/Tooltip'
import { hasSessionNotes, sessionNotesText } from '../lib/sessionNotes'
import { isFridayDayKey, isValidScheduleDate, SCHEDULE_FRIDAY_ERROR } from '../lib/scheduleDates'
import {
  activeSessions,
  buildCalendarMonth,
  dayKey,
  compareSessionsByTime,
  findTopic,
  formatDateLong,
  formatTime,
  localTimeParts,
  monthLabel,
  sessionMonthRange,
  sessionsForDay,
  sortPeopleByName,
  todayKey,
} from '../lib/schedule'
import type { Person, Session } from '../lib/types'
import { getOrderedTopics } from '../lib/topicOrder'
import { topicGroupForSession, topicProgressLabel } from '../lib/topicSessions'

interface Props {
  sessions: Session[]
  personIndex: Map<string, Person>
  canEdit: boolean
  onMoveSession: (id: string, targetDayKey: string) => void
  onToggleDone: (id: string) => void
  onPostpone: (id: string) => void
  onReschedule: (id: string, targetDayKey: string, hour: number, minute: number) => void
  onChangeTime: (id: string, hour: number, minute: number) => void
  onChangeTopic: (id: string, topicLetter: string) => void
  onChangeNotes: (id: string, notes: string) => void
  onCancelSessionEdit: (id: string) => void
  onCreateSession: (payload: {
    personId: string
    topicLetter: string
    scheduledAt: string
  }) => Promise<void>
  onDeleteSession: (id: string) => Promise<void>
  onInvalidScheduleDate?: () => void
}

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarPage({
  sessions,
  personIndex,
  canEdit,
  onMoveSession,
  onToggleDone,
  onPostpone,
  onReschedule,
  onChangeTime,
  onChangeTopic,
  onChangeNotes,
  onCancelSessionEdit,
  onCreateSession,
  onDeleteSession,
  onInvalidScheduleDate,
}: Props) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [addSessionDefaults, setAddSessionDefaults] = useState<AddSessionDefaults | null>(null)
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
      list.sort(compareSessionsByTime)
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
        if (!isValidScheduleDate(targetDay)) {
          onInvalidScheduleDate?.()
          return
        }
        onMoveSession(sessionId, targetDay)
        setSelectedDay(targetDay)
      }
    },
    [onMoveSession, onInvalidScheduleDate],
  )

  const goToToday = useCallback(() => {
    const idx = monthRange.findIndex((mo) => mo.year === ty && mo.month === tm)
    if (idx >= 0) {
      setMonthIndex(idx)
    }
    setSelectedDay(today)
  }, [monthRange, ty, tm, today])

  const selectedSessions = selectedDay ? sessionsForDay(sessions, selectedDay) : []
  const peopleList = useMemo(() => sortPeopleByName(Array.from(personIndex.values())), [personIndex])

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await onDeleteSession(id)
      setEditingSessionId((current) => (current === id ? null : current))
    },
    [onDeleteSession],
  )

  const handleCancelEdit = useCallback(
    (id: string) => {
      onCancelSessionEdit(id)
      setEditingSessionId((current) => (current === id ? null : current))
    },
    [onCancelSessionEdit],
  )

  return (
    <section className='calendar-page'>
      <div className='page-head'>
        <div className='calendar-nav'>
          <button
            className='btn ghost'
            onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
            disabled={monthIndex === 0}
            aria-label='Mês anterior'
          >
            ‹
          </button>
          <h2 className='calendar-title'>{monthLabel(year, month)}</h2>
          <button
            className='btn ghost'
            onClick={() =>
              setMonthIndex((i) => Math.min(monthRange.length - 1, i + 1))
            }
            disabled={monthIndex >= monthRange.length - 1}
            aria-label='Próximo mês'
          >
            ›
          </button>
        </div>
        <button className='btn ghost' onClick={goToToday}>
          Ir para hoje
        </button>
      </div>

      <p className='calendar-hint'>
        {canEdit
          ? ''
          : 'Modo leitura — ative o modo editor para alterar o cronograma.'}
      </p>

      <div className='calendar-grid'>
        {WEEKDAYS_SHORT.map((wd) => (
          <div key={wd} className='calendar-weekday'>
            {wd}
          </div>
        ))}
        {calendar.weeks.flat().map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className='calendar-cell empty' />
          }
          const daySessions = sessionsByDay.get(day) ?? []
          const isToday = day === today
          const isSelected = day === selectedDay
          const doneCount = daySessions.filter(
            (s) => s.status === 'done'
          ).length

          const isFriday = isFridayDayKey(day)

          return (
            <div
              key={day}
              className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isFriday ? 'friday-blocked' : ''} ${dragOverDay === day ? 'drag-over' : ''}`}
              onClick={() => setSelectedDay(day)}
              onDragOver={(e) => {
                if (!canEdit || isFriday) return
                e.preventDefault()
                setDragOverDay(day)
              }}
              onDragLeave={() => setDragOverDay((d) => (d === day ? null : d))}
              onDrop={(e) => canEdit && !isFriday && handleDrop(e, day)}
            >
              <div className='cell-header'>
                <span className='cell-day'>{Number(day.split('-')[2])}</span>
                {daySessions.length > 0 && (
                  <span className='cell-count'>
                    {doneCount}/{daySessions.length}
                  </span>
                )}
              </div>
              <div className='cell-sessions'>
                {daySessions.slice(0, 3).map((s) => {
                  const person = personIndex.get(s.personId)
                  const topic = findTopic(person, s.topicLetter)
                  const group = topicGroupForSession(person, sessions, s)
                  const progressLabel = group ? topicProgressLabel(group) : null
                  return (
                    <div
                      key={s.id}
                      className={`session-chip ${s.status}`}
                      draggable={canEdit}
                      onDragStart={(e) => canEdit && handleDragStart(e, s.id)}
                      onClick={(e) => e.stopPropagation()}
                      title={`${person?.name} — ${topic?.title ?? s.topicLetter}${progressLabel ? ` (${progressLabel})` : ''} · ${formatTime(s.scheduledAt)}`}
                    >
                      <span className='chip-time'>
                        {formatTime(s.scheduledAt)}
                      </span>
                      <span className='chip-name'>
                        {person?.name?.split(' ')[0] ?? s.personId}
                      </span>
                      {progressLabel && (
                        <span className='chip-topic-progress'>{progressLabel}</span>
                      )}
                    </div>
                  )
                })}
                {daySessions.length > 3 && (
                  <span className='cell-more'>
                    +{daySessions.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <div className='calendar-detail'>
          <div className="calendar-detail-head">
            <h3 className='section-title calendar-detail-title'>
              {new Intl.DateTimeFormat('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              }).format(
                new Date(
                  Date.UTC(
                    Number(selectedDay.split('-')[0]),
                    Number(selectedDay.split('-')[1]) - 1,
                    Number(selectedDay.split('-')[2]),
                    12
                  )
                )
              )}
            </h3>
            {canEdit && (
              <button
                type="button"
                className="btn ghost btn-sm"
                onClick={() => setAddSessionDefaults({ dayKey: selectedDay })}
              >
                Adicionar sessão
              </button>
            )}
          </div>
          {selectedSessions.length === 0 ? (
            <p className='empty'>
              Nenhuma gravação neste dia. Arraste uma sessão para cá.
            </p>
          ) : (
            <ul className='calendar-detail-list'>
              {selectedSessions.map((s) => {
                const person = personIndex.get(s.personId)
                const topic = findTopic(person, s.topicLetter)
                const group = topicGroupForSession(person, sessions, s)
                const progressLabel = group ? topicProgressLabel(group) : null
                const isDone = s.status === 'done'
                const isScheduled = s.status === 'scheduled'
                const { hour, minute } = localTimeParts(s.scheduledAt)
                const isEditing = editingSessionId === s.id
                const personTopics = person ? getOrderedTopics(person) : []
                return (
                  <li key={s.id} className={`calendar-detail-row ${s.status}`}>
                    <div className="detail-main">
                      <Tooltip
                        label={
                          isDone ? 'Desmarcar gravação' : 'Marcar como gravada'
                        }
                      >
                        <label className='session-check'>
                          <input
                            type='checkbox'
                            checked={isDone}
                            disabled={!canEdit || (!isDone && !isScheduled)}
                            onChange={() => onToggleDone(s.id)}
                          />
                          <span className='checkmark' />
                        </label>
                      </Tooltip>
                      <div className='detail-body'>
                        <span className='detail-time'>{formatTime(s.scheduledAt)}</span>
                        <span className='detail-dot' aria-hidden='true'>
                          ·
                        </span>
                        <span className='detail-person'>
                          <strong>{person?.name ?? s.personId}</strong>
                          <span className='letter'>({s.topicLetter})</span>
                          {progressLabel && (
                            <span className="topic-progress-badge">{progressLabel}</span>
                          )}
                        </span>
                        <span className='detail-dot' aria-hidden='true'>
                          ·
                        </span>
                        <span className='detail-topic'>{topic?.title ?? '—'}</span>
                        {isDone && <StatusBadge status={s.status} />}
                      </div>
                      {canEdit && (isScheduled || isDone) && (
                        <div className='detail-actions'>
                          <IconButton
                            label='Alterar sessão'
                            className='session-edit-btn'
                            active={isEditing}
                            aria-expanded={isEditing}
                            onClick={() => setEditingSessionId(isEditing ? null : s.id)}
                          >
                            <IconEdit />
                          </IconButton>
                          <IconButton
                            label='Excluir sessão'
                            className='session-delete-btn'
                            onClick={() => void handleDeleteSession(s.id)}
                          >
                            <IconDelete />
                          </IconButton>
                          {isScheduled && (
                            <>
                              <IconButton
                                label='Adiar gravação'
                                className='postpone-btn'
                                onClick={() => onPostpone(s.id)}
                              >
                                <IconPostpone />
                              </IconButton>
                              <IconButton
                                label="Nova sessão deste tópico"
                                className="add-session-btn"
                                onClick={() =>
                                  setAddSessionDefaults({
                                    personId: s.personId,
                                    topicLetter: s.topicLetter,
                                    dayKey: selectedDay ?? undefined,
                                  })
                                }
                              >
                                +
                              </IconButton>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {hasSessionNotes(s.notes) && !isEditing && (
                      <div className="session-notes-read">
                        <span className="session-notes-label">Observação</span>
                        <p className="session-notes-text">{sessionNotesText(s.notes)}</p>
                      </div>
                    )}
                    {isEditing && canEdit && (
                      <div className='detail-session-edit'>
                        <div className="session-edit-field">
                          <span className="session-edit-label">Horário</span>
                          <TimeSlotPicker
                            hour={hour}
                            minute={minute}
                            onChange={(h, m) => onChangeTime(s.id, h, m)}
                          />
                        </div>
                        <label className="session-edit-field">
                          <span className="session-edit-label">Tópico</span>
                          <select
                            className="topic-edit-select session-edit-topic"
                            value={s.topicLetter}
                            onChange={(e) => onChangeTopic(s.id, e.target.value)}
                          >
                            {personTopics.map((t) => (
                              <option key={t.letter} value={t.letter}>
                                ({t.letter}) {t.title}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="session-edit-field session-edit-field--notes">
                          <span className="session-edit-label">Observações</span>
                          <textarea
                            className="session-notes-input"
                            rows={3}
                            value={s.notes ?? ''}
                            onChange={(e) => onChangeNotes(s.id, e.target.value)}
                            placeholder="Ex.: Gravei só a parte 1 — continuar na próxima sessão"
                          />
                        </label>
                        <div className="session-edit-actions">
                          <button
                            type="button"
                            className="btn ghost btn-sm"
                            onClick={() => handleCancelEdit(s.id)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {addSessionDefaults && (
        <AddSessionModal
          open={addSessionDefaults !== null}
          people={peopleList}
          defaults={addSessionDefaults}
          onClose={() => setAddSessionDefaults(null)}
          onSubmit={onCreateSession}
        />
      )}

      <div className='postponed-section'>
        <h3 className='section-title'>
          Adiadas
          {postponedSessions.length > 0 && (
            <span className='postponed-count'>{postponedSessions.length}</span>
          )}
        </h3>
        {postponedSessions.length === 0 ? (
          <p className='empty postponed-empty'>Nenhuma gravação adiada.</p>
        ) : (
          <ul className='postponed-list'>
            {postponedSessions.map((s) => (
              <PostponedRow
                key={s.id}
                session={s}
                personIndex={personIndex}
                canEdit={canEdit}
                onReschedule={onReschedule}
                onDelete={handleDeleteSession}
                onInvalidScheduleDate={onInvalidScheduleDate}
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
  onDelete,
  onInvalidScheduleDate,
}: {
  session: Session
  personIndex: Map<string, Person>
  canEdit: boolean
  onReschedule: (id: string, targetDayKey: string, hour: number, minute: number) => void
  onDelete: (id: string) => Promise<void>
  onInvalidScheduleDate?: () => void
}) {
  const person = personIndex.get(session.personId)
  const topic = findTopic(person, session.topicLetter)
  const [newDate, setNewDate] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const { hour, minute } = localTimeParts(session.scheduledAt)
  const [slotHour, setSlotHour] = useState(hour)
  const [slotMinute, setSlotMinute] = useState(minute)
  const originalDay = dayKey(session.scheduledAt)

  const handleSchedule = () => {
    if (!newDate) return
    if (!isValidScheduleDate(newDate)) {
      setDateError(SCHEDULE_FRIDAY_ERROR)
      onInvalidScheduleDate?.()
      return
    }
    onReschedule(session.id, newDate, slotHour, slotMinute)
    setNewDate('')
    setDateError(null)
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
      {hasSessionNotes(session.notes) && (
        <div className="session-notes-read session-notes-read--postponed">
          <span className="session-notes-label">Observação</span>
          <p className="session-notes-text">{sessionNotesText(session.notes)}</p>
        </div>
      )}
      {canEdit && (
        <div className="postponed-reschedule">
          <label className="reschedule-field">
            <span className="reschedule-label">Nova data</span>
            <input
              type="date"
              className="date-input"
              value={newDate}
              onChange={(e) => {
                const value = e.target.value
                setNewDate(value)
                if (value && !isValidScheduleDate(value)) {
                  setDateError(SCHEDULE_FRIDAY_ERROR)
                } else {
                  setDateError(null)
                }
              }}
            />
          </label>
          {dateError && <p className="error modal-error">{dateError}</p>}
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
          <IconButton
            label="Excluir sessão"
            className="session-delete-btn"
            onClick={() => void onDelete(session.id)}
          >
            <IconDelete />
          </IconButton>
        </div>
      )}
    </li>
  )
}
