import { useEffect, useState } from 'react'
import { dayKey, formatDateLong } from '../lib/schedule'
import { isValidScheduleDate, localTimeParts, SCHEDULE_FRIDAY_ERROR } from '../lib/scheduleDates'
import type { Session } from '../lib/types'

interface Props {
  session: Session
  canEdit: boolean
  onMoveSession: (id: string, targetDayKey: string) => void
  onReschedule: (id: string, targetDayKey: string, hour: number, minute: number) => void
  onInvalidScheduleDate?: () => void
}

export function SessionDateEditor({
  session,
  canEdit,
  onMoveSession,
  onReschedule,
  onInvalidScheduleDate,
}: Props) {
  const currentDay = dayKey(session.scheduledAt)
  const { hour, minute } = localTimeParts(session.scheduledAt)
  const [dateValue, setDateValue] = useState(currentDay)
  const [dateError, setDateError] = useState<string | null>(null)

  useEffect(() => {
    setDateValue(currentDay)
    setDateError(null)
  }, [currentDay, session.id])

  const displayLabel =
    formatDateLong(currentDay).split(',')[1]?.trim() ?? formatDateLong(currentDay)

  if (!canEdit) {
    return <span className="session-date-read">{displayLabel}</span>
  }

  const apply = () => {
    if (!dateValue || dateValue === currentDay) return
    if (!isValidScheduleDate(dateValue)) {
      setDateError(SCHEDULE_FRIDAY_ERROR)
      onInvalidScheduleDate?.()
      return
    }
    if (session.status === 'postponed') {
      onReschedule(session.id, dateValue, hour, minute)
    } else {
      onMoveSession(session.id, dateValue)
    }
    setDateError(null)
  }

  const hasPendingChange = dateValue !== currentDay

  return (
    <div className="session-date-editor">
      <input
        type="date"
        className="date-input date-input--compact"
        value={dateValue}
        aria-label={`Data da gravação — ${displayLabel}`}
        onChange={(e) => {
          const value = e.target.value
          setDateValue(value)
          if (value && !isValidScheduleDate(value)) {
            setDateError(SCHEDULE_FRIDAY_ERROR)
          } else {
            setDateError(null)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            apply()
          }
        }}
      />
      {hasPendingChange && (
        <button type="button" className="btn ghost btn-xs session-date-apply" onClick={apply}>
          Aplicar
        </button>
      )}
      {dateError && <span className="session-date-error">{dateError}</span>}
    </div>
  )
}
