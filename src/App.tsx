import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmChangesModal } from './components/ConfirmChangesModal'
import { FixFridaysModal } from './components/FixFridaysModal'
import { ScheduleFixModal } from './components/ScheduleFixModal'
import { Tooltip } from './components/Tooltip'
import { EditorLoginModal } from './components/EditorLoginModal'
import { PersonCompleteCelebration } from './components/PersonCompleteCelebration'
import { applySessionBatch, createSession, deleteSession, fetchAuthMe, fetchSchedule, fixDayCapacity, fixFridays, updatePersonTopicOrder } from './lib/api'
import { clearEditorToken, getEditorToken } from './lib/authStorage'
import {
  applyPendingPatches,
  buildPendingRows,
  mergeSessionsFromServer,
  type PendingEntry,
  type SessionPatch,
  upsertPendingEntry,
} from './lib/pending'
import { willCompletePersonOnMarkDone } from './lib/personComplete'
import {
  copyScheduleToClipboard,
  downloadScheduleText,
  formatScheduleAsText,
} from './lib/exportScheduleText'
import { formatAlteracoesPendentes } from './lib/ptPlural'
import { buildPersonIndex, buildScheduledAt, dayKey } from './lib/schedule'
import {
  assertDayCapacity,
  computeFridayFixChanges,
  hasOverfullDays,
  hasScheduledFridaySessions,
  isValidScheduleDate,
  SCHEDULE_DAY_CAPACITY_ERROR,
  SCHEDULE_FRIDAY_ERROR,
  type CapacityFixChange,
  type FridayFixChange,
} from './lib/scheduleDates'
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
  const [refreshing, setRefreshing] = useState(false)
  const [celebration, setCelebration] = useState<string | null>(null)
  const [slowLoad, setSlowLoad] = useState(false)
  const [showFixFridays, setShowFixFridays] = useState(false)
  const [fixFridaysChanges, setFixFridaysChanges] = useState<FridayFixChange[]>([])
  const [fixFridaysLoading, setFixFridaysLoading] = useState(false)
  const [showFixDayCapacity, setShowFixDayCapacity] = useState(false)
  const [fixDayCapacityChanges, setFixDayCapacityChanges] = useState<CapacityFixChange[]>([])
  const [fixDayCapacityLoading, setFixDayCapacityLoading] = useState(false)
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null)

  const loadSchedule = useCallback(() => {
    return fetchSchedule()
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  useEffect(() => {
    if (data || error) {
      setSlowLoad(false)
      return
    }
    const timer = window.setTimeout(() => setSlowLoad(true), 5000)
    return () => window.clearTimeout(timer)
  }, [data, error])

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

  const baselineSessions = data?.sessions ?? []

  const queueChange = useCallback(
    (sessionId: string, patch: SessionPatch) => {
      if (!isEditor) return
      setPending((prev) => upsertPendingEntry(baselineSessions, prev, sessionId, patch))
    },
    [isEditor, baselineSessions],
  )

  const displaySessions = useMemo(
    () => applyPendingPatches(baselineSessions, pending),
    [baselineSessions, pending],
  )

  const dayCapacityError = useCallback(
    (personId: string, scheduledAt: string, exceptId?: string) => {
      try {
        assertDayCapacity(displaySessions, personId, scheduledAt, exceptId)
        return null
      } catch {
        return SCHEDULE_DAY_CAPACITY_ERROR
      }
    },
    [displaySessions],
  )

  const personIndex = useMemo(
    () => (data ? buildPersonIndex(data.people) : new Map()),
    [data],
  )
  const pendingRows = useMemo(
    () => buildPendingRows(baselineSessions, pending),
    [baselineSessions, pending],
  )
  const pendingCount = pendingRows.length
  const needsFridayFix = useMemo(
    () => hasScheduledFridaySessions(baselineSessions),
    [baselineSessions],
  )
  const needsDayCapacityFix = useMemo(
    () => hasOverfullDays(baselineSessions),
    [baselineSessions],
  )

  const openFixFridays = useCallback(async () => {
    setFixFridaysLoading(true)
    setScheduleNotice(null)
    try {
      const preview = computeFridayFixChanges(baselineSessions)
      setFixFridaysChanges(preview)
      setShowFixFridays(true)
    } finally {
      setFixFridaysLoading(false)
    }
  }, [baselineSessions])

  const commitFixFridays = useCallback(async () => {
    setFixFridaysLoading(true)
    setScheduleNotice(null)
    try {
      const result = await fixFridays(false)
      if (result.sessions) {
        setData((prev) => (prev ? { ...prev, sessions: result.sessions! } : prev))
      } else {
        await loadSchedule()
      }
      setPending(new Map())
      setShowFixFridays(false)
      setFixFridaysChanges([])
    } catch (e) {
      setScheduleNotice(String(e))
    } finally {
      setFixFridaysLoading(false)
    }
  }, [loadSchedule])

  const openFixDayCapacity = useCallback(async () => {
    setFixDayCapacityLoading(true)
    setScheduleNotice(null)
    try {
      const { changes } = await fixDayCapacity(true)
      setFixDayCapacityChanges(changes)
      setShowFixDayCapacity(true)
    } catch (e) {
      setScheduleNotice(String(e))
    } finally {
      setFixDayCapacityLoading(false)
    }
  }, [])

  const commitFixDayCapacity = useCallback(async () => {
    setFixDayCapacityLoading(true)
    setScheduleNotice(null)
    try {
      const result = await fixDayCapacity(false)
      if (result.sessions) {
        setData((prev) => (prev ? { ...prev, sessions: result.sessions! } : prev))
      } else {
        await loadSchedule()
      }
      setPending(new Map())
      setShowFixDayCapacity(false)
      setFixDayCapacityChanges([])
    } catch (e) {
      setScheduleNotice(String(e))
    } finally {
      setFixDayCapacityLoading(false)
    }
  }, [loadSchedule])

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
      if (newStatus === 'done') {
        const hit = willCompletePersonOnMarkDone(data?.people ?? [], displaySessions, id)
        if (hit) {
          const name = personIndex.get(hit.personId)?.name ?? hit.personId
          setCelebration(name)
        }
      }
      queueChange(id, { status: newStatus, recordedAt })
    },
    [findDisplaySession, queueChange, displaySessions, personIndex, data?.people],
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      await loadSchedule()
    } finally {
      setRefreshing(false)
    }
  }, [loadSchedule])

  const onTopicOrderSave = useCallback(async (personId: string, topicOrder: string[]) => {
    const person = await updatePersonTopicOrder(personId, topicOrder)
    setData((prev) =>
      prev
        ? {
            ...prev,
            people: prev.people.map((p) => (p.id === personId ? person : p)),
          }
        : prev,
    )
  }, [])

  const onCreateSession = useCallback(
    async (payload: { personId: string; topicLetter: string; scheduledAt: string }) => {
      if (!isValidScheduleDate(dayKey(payload.scheduledAt))) {
        setScheduleNotice(SCHEDULE_FRIDAY_ERROR)
        throw new Error(SCHEDULE_FRIDAY_ERROR)
      }
      const capacityErr = dayCapacityError(payload.personId, payload.scheduledAt)
      if (capacityErr) {
        setScheduleNotice(capacityErr)
        throw new Error(capacityErr)
      }
      const session = await createSession(payload)
      setData((prev) =>
        prev
          ? {
              ...prev,
              sessions: [...prev.sessions, session].sort((a, b) =>
                a.scheduledAt.localeCompare(b.scheduledAt),
              ),
            }
          : prev,
      )
    },
    [dayCapacityError],
  )

  const onDeleteSession = useCallback(async (id: string) => {
    if (!window.confirm('Excluir esta sessão? Esta ação não pode ser desfeita.')) return
    await deleteSession(id)
    setData((prev) =>
      prev ? { ...prev, sessions: prev.sessions.filter((s) => s.id !== id) } : prev,
    )
    setPending((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const onMoveSession = useCallback(
    (id: string, targetDayKey: string) => {
      if (!isValidScheduleDate(targetDayKey)) {
        setScheduleNotice(SCHEDULE_FRIDAY_ERROR)
        return
      }
      const session = findDisplaySession(id)
      if (!session) return
      const timeParts = session.scheduledAt.split('T')[1]
      const [y, m, d] = targetDayKey.split('-')
      const newScheduledAt = `${y}-${m}-${d}T${timeParts}`
      const capacityErr = dayCapacityError(session.personId, newScheduledAt, id)
      if (capacityErr) {
        setScheduleNotice(capacityErr)
        return
      }
      queueChange(id, { scheduledAt: newScheduledAt })
    },
    [findDisplaySession, queueChange, dayCapacityError],
  )

  const onPostpone = useCallback(
    (id: string) => {
      queueChange(id, { status: 'postponed' })
    },
    [queueChange],
  )

  const onReschedule = useCallback(
    (id: string, targetDayKey: string, hour: number, minute: number) => {
      if (!isValidScheduleDate(targetDayKey)) {
        setScheduleNotice(SCHEDULE_FRIDAY_ERROR)
        return
      }
      const session = findDisplaySession(id)
      if (!session) return
      const scheduledAt = buildScheduledAt(targetDayKey, hour, minute)
      const capacityErr = dayCapacityError(session.personId, scheduledAt, id)
      if (capacityErr) {
        setScheduleNotice(capacityErr)
        return
      }
      queueChange(id, { status: 'scheduled', scheduledAt })
    },
    [findDisplaySession, queueChange, dayCapacityError],
  )

  const onChangeTime = useCallback(
    (id: string, hour: number, minute: number) => {
      const session = findDisplaySession(id)
      if (!session) return
      const dk = dayKey(session.scheduledAt)
      const scheduledAt = buildScheduledAt(dk, hour, minute)
      const capacityErr = dayCapacityError(session.personId, scheduledAt, id)
      if (capacityErr) {
        setScheduleNotice(capacityErr)
        return
      }
      queueChange(id, { scheduledAt })
    },
    [findDisplaySession, queueChange, dayCapacityError],
  )

  const onChangeTopic = useCallback(
    (id: string, topicLetter: string) => {
      const session = findDisplaySession(id)
      if (!session || session.topicLetter === topicLetter) return
      queueChange(id, { topicLetter })
    },
    [findDisplaySession, queueChange],
  )

  const onChangeNotes = useCallback(
    (id: string, notes: string) => {
      queueChange(id, { notes })
    },
    [queueChange],
  )

  const onCancelSessionEdit = useCallback((sessionId: string) => {
    setPending((prev) => {
      const next = new Map(prev)
      next.delete(sessionId)
      return next
    })
  }, [])

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

  const onExportText = useCallback(() => {
    if (!data) return
    const text = formatScheduleAsText(data.people, displaySessions)
    downloadScheduleText(text)
    void copyScheduleToClipboard(text).then((ok) => {
      if (!ok) return
      setScheduleNotice('Cronograma exportado e copiado para a área de transferência.')
      window.setTimeout(() => setScheduleNotice(null), 4000)
    })
  }, [data, displaySessions])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="brand">
            <img src="./logo.svg" alt="" className="brand-logo" width={36} height={36} />
            <h1>Cronograma de Gravações</h1>
          </div>
          <div className="header-actions">
            <Tooltip label="Atualizar cronograma">
              <button
                type="button"
                className="btn ghost btn-icon"
                onClick={onRefresh}
                disabled={refreshing || !data}
                aria-label="Atualizar cronograma"
              >
                <span className={`reload-icon${refreshing ? ' spinning' : ''}`} aria-hidden="true">
                  ↻
                </span>
              </button>
            </Tooltip>
            <Tooltip label="Exportar cronograma em texto (formato Discord)">
              <button
                type="button"
                className="btn ghost"
                onClick={onExportText}
                disabled={!data}
              >
                Exportar texto
              </button>
            </Tooltip>
            {isEditor && needsDayCapacityFix && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => void openFixDayCapacity()}
                disabled={fixDayCapacityLoading}
              >
                Corrigir lotação
              </button>
            )}
            {isEditor && needsFridayFix && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => void openFixFridays()}
                disabled={fixFridaysLoading}
              >
                Corrigir sextas
              </button>
            )}
            {pendingCount > 0 && (
              <span className="dirty-badge">{formatAlteracoesPendentes(pendingCount)}</span>
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
        {scheduleNotice && <p className="schedule-notice">{scheduleNotice}</p>}
        {!data && !error && (
          <p className="empty">
            {slowLoad
              ? 'O servidor está iniciando (Render). Isso pode levar até 1 minuto na primeira vez do dia…'
              : 'Carregando…'}
          </p>
        )}
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
                onPostpone={onPostpone}
                onReschedule={onReschedule}
                onChangeTime={onChangeTime}
                onChangeTopic={onChangeTopic}
                onChangeNotes={onChangeNotes}
                onCancelSessionEdit={onCancelSessionEdit}
                onCreateSession={onCreateSession}
                onDeleteSession={onDeleteSession}
                onInvalidScheduleDate={() => setScheduleNotice(SCHEDULE_FRIDAY_ERROR)}
              />
            )}
            {tab === 'person' && (
              <PersonPage
                people={data.people}
                sessions={displaySessions}
                canEdit={isEditor}
                onToggleDone={onToggleDone}
                onTopicOrderSave={onTopicOrderSave}
                onCreateSession={onCreateSession}
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
      <FixFridaysModal
        open={showFixFridays}
        changes={fixFridaysChanges}
        personIndex={personIndex}
        loading={fixFridaysLoading}
        onConfirm={() => void commitFixFridays()}
        onCancel={() => setShowFixFridays(false)}
      />
      <ScheduleFixModal
        open={showFixDayCapacity}
        title="Corrigir lotação"
        description="Migração única: dias com mais de 2 gravações serão ajustados (14h e 16h), deslocando o excedente em cascata para os próximos dias já agendados de cada pessoa."
        emptyMessage="Nenhum dia com excesso de sessões para corrigir."
        confirmLabel="Confirmar migração"
        changes={fixDayCapacityChanges}
        personIndex={personIndex}
        loading={fixDayCapacityLoading}
        onConfirm={() => void commitFixDayCapacity()}
        onCancel={() => setShowFixDayCapacity(false)}
      />
      {celebration && (
        <PersonCompleteCelebration
          personName={celebration}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  )
}
