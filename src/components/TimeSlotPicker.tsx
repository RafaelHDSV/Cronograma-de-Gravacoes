import { useEffect, useId, useState } from 'react'
import { DEFAULT_SLOT_HOURS } from '../lib/schedule'

interface Props {
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
  disabled?: boolean
}

export function TimeSlotPicker({ hour, minute, onChange, disabled }: Props) {
  const id = useId()
  const isDefault = DEFAULT_SLOT_HOURS.some((h) => h === hour && minute === 0)
  const [custom, setCustom] = useState(!isDefault)

  useEffect(() => {
    if (isDefault) setCustom(false)
  }, [isDefault])

  const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  const selectSlot = (h: number) => {
    setCustom(false)
    onChange(h, 0)
  }

  const selectCustomTime = (value: string) => {
    if (!value) return
    const [h, m] = value.split(':').map(Number)
    onChange(h, m ?? 0)
  }

  return (
    <div className={`time-slot-picker ${disabled ? 'disabled' : ''}`}>
      <div className="time-slot-row">
        {DEFAULT_SLOT_HOURS.map((h) => (
          <button
            key={h}
            type="button"
            className={`btn sm slot-btn ${!custom && hour === h && minute === 0 ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => selectSlot(h)}
          >
            {String(h).padStart(2, '0')}:00
          </button>
        ))}
        <button
          type="button"
          className={`btn sm slot-btn ${custom ? 'active' : ''}`}
          disabled={disabled}
          onClick={() => setCustom(true)}
        >
          Outro
        </button>
      </div>
      {custom && (
        <input
          id={id}
          type="time"
          className="time-input"
          value={timeValue}
          disabled={disabled}
          onChange={(e) => selectCustomTime(e.target.value)}
          aria-label="Horário personalizado"
        />
      )}
    </div>
  )
}
