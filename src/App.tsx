import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ScheduleData, Session } from './lib/types'
import { buildPersonIndex, dayKey, globalStats, rescheduleSession } from './lib/schedule'
import { fetchSchedule, patchSession, swapSessionTimes } from './lib/api'
import { SummaryPage } from './pages/SummaryPage'
import { CalendarPage } from './pages/CalendarPage'
import { PersonPage } from './pages/PersonPage'

type Tab = 'summary' | 'calendar' | 'person'

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'person', label: 'Por pessoa' },
]

export function App() {
  const [data, setData] = useState<ScheduleData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('summary')

  useEffect(() => {
    fetchSchedule()
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  const replaceSession = useCallback((updated: Session) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === updated.id ? updated : s)),
      }
    })
  }, [])

  const replaceSessions = useCallback((updated: Session[]) => {
    setData((prev) => {
      if (!prev) return prev
      const map = new Map(updated.map((s) => [s.id, s]))
      return {
        ...prev,
        sessions: prev.sessions.map((s) => map.get(s.id) ?? s),
      }
    })
  }, [])

  const onToggleDone = useCallback(
    async (id: string) => {
      const session = data?.sessions.find((s) => s.id === id)
      if (!session) return
      const newStatus = session.status === 'done' ? 'scheduled' : 'done'
      const recordedAt = newStatus === 'done' ? dayKey(new Date().toISOString()) : undefined
      const updated = await patchSession(id, {
        status: newStatus,
        recordedAt: recordedAt ?? '',
      })
      replaceSession(updated)
    },
    [data, replaceSession],
  )

  const onMoveSession = useCallback(
    async (id: string, targetDayKey: string) => {
      const session = data?.sessions.find((s) => s.id === id)
      if (!session) return
      const timeParts = session.scheduledAt.split('T')[1]
      const [y, m, d] = targetDayKey.split('-')
      const newScheduledAt = `${y}-${m}-${d}T${timeParts}`
      const updated = await patchSession(id, { scheduledAt: newScheduledAt })
      replaceSession(updated)
    },
    [data, replaceSession],
  )

  const onSwapTime = useCallback(
    async (idA: string, idB: string) => {
      const [a, b] = await swapSessionTimes(idA, idB)
      replaceSessions([a, b])
    },
    [replaceSessions],
  )

  const onPostpone = useCallback(
    async (id: string) => {
      const updated = await patchSession(id, { status: 'postponed' })
      replaceSession(updated)
    },
    [replaceSession],
  )

  const onReschedule = useCallback(
    async (id: string, targetDayKey: string) => {
      const session = data?.sessions.find((s) => s.id === id)
      if (!session) return
      const scheduledAt = rescheduleSession(session, targetDayKey)
      const updated = await patchSession(id, { status: 'scheduled', scheduledAt })
      replaceSession(updated)
    },
    [data, replaceSession],
  )

  const personIndex = useMemo(() => (data ? buildPersonIndex(data.people) : new Map()), [data])
  const stats = useMemo(() => (data ? globalStats(data.sessions) : null), [data])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="brand">
            <h1>Cronograma de Gravações</h1>
            {stats && (
              <span className="header-stats">
                {stats.done} gravadas · {stats.remaining} faltam
                {stats.postponed > 0 && ` · ${stats.postponed} adiadas`} · {stats.total} no total
              </span>
            )}
          </div>
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {error && <p className="error">Falha ao carregar os dados: {error}</p>}
        {!data && !error && <p className="empty">Carregando…</p>}
        {data && (
          <>
            {tab === 'summary' && <SummaryPage people={data.people} sessions={data.sessions} />}
            {tab === 'calendar' && (
              <CalendarPage
                sessions={data.sessions}
                personIndex={personIndex}
                onMoveSession={onMoveSession}
                onToggleDone={onToggleDone}
                onSwapTime={onSwapTime}
                onPostpone={onPostpone}
                onReschedule={onReschedule}
              />
            )}
            {tab === 'person' && (
              <PersonPage
                people={data.people}
                sessions={data.sessions}
                onToggleDone={onToggleDone}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
