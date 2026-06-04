import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmChangesModal } from './components/ConfirmChangesModal'
import { EditorLoginModal } from './components/EditorLoginModal'
import { applySessionBatch, fetchAuthMe, fetchSchedule } from './lib/api'
import { clearEditorToken, getEditorToken } from './lib/authStorage'
import {
  applyPendingPatches,
  buildPendingRows,
  mergePatch,
  mergeSessionsFromServer,
  type PendingEntry,
  type SessionPatch,
} from './lib/pending'
import { buildPersonIndex, buildScheduledAt, dayKey, globalStats } from './lib/schedule'
import type { ScheduleData } from './lib/types'
import { CalendarPage } from './pages/CalendarPage'
import { PersonPage } from './pages/PersonPage'
import { SummaryPage } from './pages/SummaryPage'

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
  const [isEditor, setIsEditor] = useState(false)
  const [authDisabled, setAuthDisabled] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pending, setPending] = useState<Map<string, PendingEntry>>(new Map())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSchedule()
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  useEffect(() => {
    fetchAuthMe()
      .then((r) => {
        setIsEditor(r.editor)
        setAuthDisabled(r.authDisabled === true)
      })
      .catch(() => {
        if (getEditorToken()) clearEditorToken()
        setIsEditor(false)
        setAuthDisabled(false)
      })
  }, [])

  const queueChange = useCallback(
    (sessionId: string, patch: SessionPatch, label: string) => {
      if (!isEditor) return
      setPending((prev) => {
        const next = new Map(prev)
        const cur = next.get(sessionId)
        next.set(sessionId, {
          patch: mergePatch(cur?.patch ?? {}, patch),
          labels: [...(cur?.labels ?? []), label],
        })
        return next
      })
    },
    [isEditor],
  )

  const baselineSessions = data?.sessions ?? []
  const displaySessions = useMemo(
    () => applyPendingPatches(baselineSessions, pending),
    [baselineSessions, pending],
  )

  const personIndex = useMemo(
    () => (data ? buildPersonIndex(data.people) : new Map()),
    [data],
  )
  const stats = useMemo(() => globalStats(displaySessions), [displaySessions])
  const pendingCount = pending.size
  const pendingRows = useMemo(
    () => buildPendingRows(baselineSessions, pending),
    [baselineSessions, pending],
  )

  const findDisplaySession = useCallback(
    (id: string) => displaySessions.find((s) => s.id === id),
    [displaySessions],
  )

  const onToggleDone = useCallback(
    (id: string) => {
      const session = findDisplaySession(id)
      if (!session) return
      const newStatus = session.status === 'done' ? 'scheduled' : 'done'
      const recordedAt = newStatus === 'done' ? dayKey(new Date().toISOString()) : ''
      queueChange(
        id,
        { status: newStatus, recordedAt },
        newStatus === 'done' ? 'Marcar como gravada' : 'Desmarcar gravação',
      )
    },
    [findDisplaySession, queueChange],
  )

  const onMoveSession = useCallback(
    (id: string, targetDayKey: string) => {
      const session = findDisplaySession(id)
      if (!session) return
      const timeParts = session.scheduledAt.split('T')[1]
      const [y, m, d] = targetDayKey.split('-')
      const newScheduledAt = `${y}-${m}-${d}T${timeParts}`
      queueChange(id, { scheduledAt: newScheduledAt }, `Mover para ${targetDayKey}`)
    },
    [findDisplaySession, queueChange],
  )

  const onSwapTime = useCallback(
    (idA: string, idB: string) => {
      const a = findDisplaySession(idA)
      const b = findDisplaySession(idB)
      if (!a || !b) return
      queueChange(idA, { scheduledAt: b.scheduledAt }, 'Trocar horário')
      queueChange(idB, { scheduledAt: a.scheduledAt }, 'Trocar horário')
    },
    [findDisplaySession, queueChange],
  )

  const onPostpone = useCallback(
    (id: string) => {
      queueChange(id, { status: 'postponed' }, 'Adiar gravação')
    },
    [queueChange],
  )

  const onReschedule = useCallback(
    (id: string, targetDayKey: string, hour: number, minute: number) => {
      const session = findDisplaySession(id)
      if (!session) return
      const scheduledAt = buildScheduledAt(targetDayKey, hour, minute)
      queueChange(
        id,
        { status: 'scheduled', scheduledAt },
        `Reagendar para ${targetDayKey}`,
      )
    },
    [findDisplaySession, queueChange],
  )

  const onChangeTime = useCallback(
    (id: string, hour: number, minute: number) => {
      const session = findDisplaySession(id)
      if (!session) return
      const dk = dayKey(session.scheduledAt)
      const scheduledAt = buildScheduledAt(dk, hour, minute)
      queueChange(id, { scheduledAt }, 'Alterar horário')
    },
    [findDisplaySession, queueChange],
  )

  const discardPending = useCallback(() => {
    setPending(new Map())
    setShowConfirm(false)
  }, [])

  const commitPending = useCallback(async () => {
    if (pending.size === 0) return
    setSaving(true)
    try {
      const changes = Array.from(pending.entries()).map(([id, { patch }]) => ({
        id,
        ...patch,
      }))
      const updated = await applySessionBatch(changes)
      setData((prev) =>
        prev
          ? { ...prev, sessions: mergeSessionsFromServer(prev.sessions, updated) }
          : prev,
      )
      setPending(new Map())
      setShowConfirm(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }, [pending])

  const handleLogoutEditor = useCallback(() => {
    clearEditorToken()
    setIsEditor(false)
    discardPending()
  }, [discardPending])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="brand">
            <img src="./logo.svg" alt="" className="brand-logo" width={36} height={36} />
            <div>
              <h1>Cronograma de Gravações</h1>
              {stats && (
                <span className="header-stats">
                  {!isEditor && !authDisabled && 'modo leitura'}
                  {authDisabled && 'modo edição'}
                </span>
              )}
            </div>
          </div>
          <div className="header-actions">
            {pendingCount > 0 && (
              <span className="dirty-badge">{pendingCount} alteração(ões) pendente(s)</span>
            )}
            {isEditor && pendingCount > 0 && (
              <>
                <button type="button" className="btn ghost" onClick={discardPending}>
                  Descartar
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setShowConfirm(true)}
                >
                  Confirmar alterações
                </button>
              </>
            )}
            {!authDisabled &&
              (isEditor ? (
                <button type="button" className="btn ghost" onClick={handleLogoutEditor}>
                  Sair do modo editor
                </button>
              ) : (
                <button type="button" className="btn primary" onClick={() => setShowLogin(true)}>
                  Modo editor
                </button>
              ))}
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
            {tab === 'summary' && (
              <SummaryPage people={data.people} sessions={displaySessions} />
            )}
            {tab === 'calendar' && (
              <CalendarPage
                sessions={displaySessions}
                personIndex={personIndex}
                canEdit={isEditor}
                onMoveSession={onMoveSession}
                onToggleDone={onToggleDone}
                onSwapTime={onSwapTime}
                onPostpone={onPostpone}
                onReschedule={onReschedule}
                onChangeTime={onChangeTime}
              />
            )}
            {tab === 'person' && (
              <PersonPage
                people={data.people}
                sessions={displaySessions}
                canEdit={isEditor}
                onToggleDone={onToggleDone}
              />
            )}
          </>
        )}
      </main>

      <EditorLoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => setIsEditor(true)}
      />
      <ConfirmChangesModal
        open={showConfirm}
        rows={pendingRows}
        personIndex={personIndex}
        loading={saving}
        onConfirm={commitPending}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
