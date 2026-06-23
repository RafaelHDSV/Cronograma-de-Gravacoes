import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'
import { formatSupabaseError, isMissingTableError, supabase } from './supabase.js'
import { tables } from './tables.js'
import { assertValidScheduleDate } from '../shared/scheduleDates.js'
import { computeFridayFixChanges, type FridayFixChange } from '../shared/fridayMigration.js'
import {
  computeDayCapacityFixChanges,
  type CapacityFixChange,
} from '../shared/dayCapacityMigration.js'
import { applyPersistedSnapshots } from '../shared/sessionPersistMerge.js'
import { resolveTopicOrder } from './topicOrder.js'
import { resolveProjectRoot } from './paths.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface Topic {
  letter: string
  title: string
}

export interface Person {
  id: string
  name: string
  topics: Topic[]
  topicOrder?: string[]
}

export type SessionStatus = 'scheduled' | 'done' | 'postponed'

export interface Session {
  id: string
  scheduledAt: string
  personId: string
  topicLetter: string
  status: SessionStatus
  recordedAt?: string
  notes?: string
}

interface SessionRow {
  id: string
  scheduled_at: string
  person_id: string
  topic_letter: string
  status: SessionStatus
  notes: string
  recorded_at: string | null
}

const ROOT = resolveProjectRoot(__dirname)
const PEOPLE_YAML = path.join(ROOT, 'public', 'data', 'people.yaml')
const SESSIONS_YAML = path.join(ROOT, 'public', 'data', 'sessions.yaml')

let people: Person[] = []
let sessions: Session[] = []

const TZ = 'America/Sao_Paulo'

function rowToSession(row: SessionRow): Session {
  const scheduledAt =
    typeof row.scheduled_at === 'string'
      ? row.scheduled_at
      : new Date(row.scheduled_at).toISOString()
  return {
    id: row.id,
    scheduledAt,
    personId: row.person_id,
    topicLetter: row.topic_letter,
    status: row.status,
    recordedAt: row.recorded_at ?? undefined,
    notes: row.notes?.trim() ? row.notes : undefined,
  }
}

function sessionToRow(session: Session): SessionRow {
  return {
    id: session.id,
    scheduled_at: session.scheduledAt,
    person_id: session.personId,
    topic_letter: session.topicLetter,
    status: session.status,
    notes: session.notes?.trim() ? session.notes : '',
    recorded_at: session.recordedAt?.trim() ? session.recordedAt : null,
  }
}

function sessionIdBase(scheduledAt: string, personId: string, topicLetter: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date(scheduledAt))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const hour = get('hour').padStart(2, '0')
  return `${date}-${hour}-${personId}-${topicLetter}`
}

export function generateSessionId(
  scheduledAt: string,
  personId: string,
  topicLetter: string,
  existingIds: Iterable<string>,
): string {
  const ids = new Set(existingIds)
  const base = sessionIdBase(scheduledAt, personId, topicLetter)
  if (!ids.has(base)) return base
  let n = 2
  while (ids.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

interface PreferenceRow {
  person_id: string
  topic_order: string[]
}

function loadPeopleFromYaml(): Person[] {
  const text = fs.readFileSync(PEOPLE_YAML, 'utf-8')
  const parsed = load(text) as { people: Person[] }
  return parsed.people ?? []
}

async function loadTopicOrderOverrides(): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from(tables.personPreferences)
    .select('person_id, topic_order')

  if (error) {
    if (isMissingTableError(error)) {
      console.warn(
        '[data] Tabela de preferencias ausente — rode supabase/migrations/20260623120000_person_preferences.sql',
      )
      return new Map()
    }
    throw new Error(formatSupabaseError('[data] Falha ao carregar preferencias', error))
  }

  const map = new Map<string, string[]>()
  for (const row of (data ?? []) as PreferenceRow[]) {
    if (Array.isArray(row.topic_order) && row.topic_order.length > 0) {
      map.set(row.person_id, row.topic_order)
    }
  }
  return map
}

function mergePeople(yamlPeople: Person[], overrides: Map<string, string[]>): Person[] {
  return yamlPeople.map((person) => {
    const rawOrder = overrides.get(person.id) ?? person.topicOrder
    if (!rawOrder?.length) return { ...person, topicOrder: undefined }

    const topicOrder = resolveTopicOrder(person.topics, rawOrder, `[data] ${person.id}`)
    return { ...person, topicOrder }
  })
}

async function loadPeople(): Promise<Person[]> {
  const yamlPeople = loadPeopleFromYaml()
  const overrides = await loadTopicOrderOverrides()
  return mergePeople(yamlPeople, overrides)
}

export function seedSessionsFromYaml(): Session[] {
  const text = fs.readFileSync(SESSIONS_YAML, 'utf-8')
  const parsed = load(text) as { sessions: Session[] }
  const raw = parsed.sessions ?? []
  return raw.map((s) => ({
    ...s,
    status:
      s.status === 'done' ? 'done' : s.status === 'postponed' ? 'postponed' : 'scheduled',
  }))
}

async function loadSessionsFromDb(): Promise<Session[]> {
  const { data, error } = await supabase
    .from(tables.sessions)
    .select('*')
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(formatSupabaseError('[data] Falha ao carregar sessoes', error))
  return (data as SessionRow[]).map(rowToSession)
}

async function insertSessions(rows: Session[]): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase.from(tables.sessions).insert(rows.map(sessionToRow))
  if (error) throw new Error(formatSupabaseError('[data] Falha ao inserir sessoes', error))
}

async function deleteAllSessions(): Promise<void> {
  const { error } = await supabase.from(tables.sessions).delete().neq('id', '')
  if (error) throw new Error(formatSupabaseError('[data] Falha ao limpar sessoes', error))
}

async function countSessions(): Promise<number> {
  const { count, error } = await supabase
    .from(tables.sessions)
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(formatSupabaseError('[data] Falha ao contar sessoes', error))
  return count ?? 0
}

export async function initData(): Promise<void> {
  people = await loadPeople()

  const total = await countSessions()
  if (total === 0) {
    sessions = seedSessionsFromYaml()
    await insertSessions(sessions)
    console.log(`[data] Seed: ${sessions.length} sessoes de sessions.yaml -> Supabase`)
  } else {
    sessions = await loadSessionsFromDb()
    console.log(`[data] Carregadas ${sessions.length} sessoes do Supabase`)
  }

  console.log(`[data] ${people.length} pessoas de people.yaml`)
}

export function getPeople(): Person[] {
  return people
}

export function getSessions(): Session[] {
  return sessions
}

/** Recarrega sessoes do Supabase e atualiza o cache em memoria (uso em GET /api/schedule). */
export async function reloadSessionsFromDb(): Promise<Session[]> {
  sessions = await loadSessionsFromDb()
  return sessions
}

export function findSession(id: string): Session | undefined {
  return sessions.find((s) => s.id === id)
}

export async function updateSession(
  id: string,
  patch: {
    status?: SessionStatus
    scheduledAt?: string
    recordedAt?: string
    notes?: string
    topicLetter?: string
  },
): Promise<Session | null> {
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx === -1) return null

  const session = { ...sessions[idx] }
  if (patch.status !== undefined) session.status = patch.status
  if (patch.scheduledAt !== undefined) {
    assertValidScheduleDate(patch.scheduledAt)
    session.scheduledAt = patch.scheduledAt
  }
  if (patch.recordedAt !== undefined) {
    session.recordedAt = patch.recordedAt.trim() ? patch.recordedAt : undefined
  }
  if (patch.notes !== undefined) {
    session.notes = patch.notes.trim() ? patch.notes : undefined
  }
  if (patch.topicLetter !== undefined) {
    const letter = patch.topicLetter.trim().toLowerCase()
    const person = people.find((p) => p.id === session.personId)
    if (!person?.topics.some((t) => t.letter === letter)) {
      throw new Error('Topico invalido para esta pessoa')
    }
    session.topicLetter = letter
  }

  const { error } = await supabase.from(tables.sessions).update(sessionToRow(session)).eq('id', id)
  if (error) throw new Error(formatSupabaseError('[data] Falha ao atualizar sessao', error))

  sessions[idx] = session
  return session
}

export async function resetSessionsFromYaml(): Promise<{ sessions: Session[]; preservedCount: number }> {
  const existing = await loadSessionsFromDb()
  const { sessions: merged, preservedCount } = applyPersistedSnapshots(
    seedSessionsFromYaml(),
    existing,
  )
  await deleteAllSessions()
  sessions = merged
  await insertSessions(sessions)
  console.log(
    `[data] Reset: ${sessions.length} sessoes de sessions.yaml -> Supabase (${preservedCount} gravacoes preservadas)`,
  )
  return { sessions, preservedCount }
}

export type SessionPatch = {
  status?: SessionStatus
  scheduledAt?: string
  recordedAt?: string
  notes?: string
  topicLetter?: string
}

export async function applySessionPatches(
  patches: Array<{ id: string } & SessionPatch>,
): Promise<Session[]> {
  const updated: Session[] = []
  for (const { id, ...patch } of patches) {
    const session = await updateSession(id, patch)
    if (session) updated.push(session)
  }
  return updated
}

export async function swapSessionTimes(idA: string, idB: string): Promise<[Session, Session] | null> {
  const idxA = sessions.findIndex((s) => s.id === idA)
  const idxB = sessions.findIndex((s) => s.id === idB)
  if (idxA === -1 || idxB === -1) return null

  const a = { ...sessions[idxA] }
  const b = { ...sessions[idxB] }
  const newAtA = sessions[idxB].scheduledAt
  const newAtB = sessions[idxA].scheduledAt
  assertValidScheduleDate(newAtA)
  assertValidScheduleDate(newAtB)
  a.scheduledAt = newAtA
  b.scheduledAt = newAtB

  const { error: errA } = await supabase.from(tables.sessions).update(sessionToRow(a)).eq('id', idA)
  if (errA) throw new Error(formatSupabaseError('[data] Falha ao trocar horario', errA))

  const { error: errB } = await supabase.from(tables.sessions).update(sessionToRow(b)).eq('id', idB)
  if (errB) throw new Error(formatSupabaseError('[data] Falha ao trocar horario', errB))

  sessions[idxA] = a
  sessions[idxB] = b
  return [a, b]
}

export async function updatePersonTopicOrder(
  personId: string,
  topicOrder: string[],
): Promise<Person | null> {
  const idx = people.findIndex((p) => p.id === personId)
  if (idx === -1) return null

  const person = people[idx]
  const resolved = resolveTopicOrder(person.topics, topicOrder, `[data] ${personId}`)
  if (resolved.length === 0) {
    throw new Error('topicOrder invalido: nenhuma letra valida')
  }

  const { error } = await supabase.from(tables.personPreferences).upsert(
    {
      person_id: personId,
      topic_order: resolved,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'person_id' },
  )

  if (error) {
    throw new Error(formatSupabaseError('[data] Falha ao salvar ordem de topicos', error))
  }

  const updated: Person = { ...person, topicOrder: resolved }
  people[idx] = updated
  return updated
}

export async function deleteSession(id: string): Promise<boolean> {
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx === -1) return false

  const { error } = await supabase.from(tables.sessions).delete().eq('id', id)
  if (error) throw new Error(formatSupabaseError('[data] Falha ao remover sessao', error))

  sessions.splice(idx, 1)
  console.log(`[data] Sessao removida: ${id}`)
  return true
}

export interface CreateSessionInput {
  personId: string
  topicLetter: string
  scheduledAt: string
  status?: SessionStatus
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const person = people.find((p) => p.id === input.personId)
  if (!person) throw new Error('Pessoa nao encontrada')

  const letter = input.topicLetter.trim().toLowerCase()
  if (!person.topics.some((t) => t.letter === letter)) {
    throw new Error('Topico invalido para esta pessoa')
  }

  const scheduledAt = input.scheduledAt?.trim()
  if (!scheduledAt) throw new Error('scheduledAt e obrigatorio')
  assertValidScheduleDate(scheduledAt)

  const status: SessionStatus =
    input.status === 'done' || input.status === 'postponed' ? input.status : 'scheduled'

  const id = generateSessionId(
    scheduledAt,
    input.personId,
    letter,
    sessions.map((s) => s.id),
  )

  const session: Session = {
    id,
    scheduledAt,
    personId: input.personId,
    topicLetter: letter,
    status,
  }

  const { error } = await supabase.from(tables.sessions).insert(sessionToRow(session))
  if (error) throw new Error(formatSupabaseError('[data] Falha ao criar sessao', error))

  sessions.push(session)
  sessions.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  console.log(`[data] Sessao criada: ${id} (${input.personId}/${letter})`)
  return session
}

async function applyBulkScheduleChanges(
  changes: Array<{ sessionId: string; after: string }>,
): Promise<void> {
  for (const change of changes) {
    const idx = sessions.findIndex((s) => s.id === change.sessionId)
    if (idx === -1) continue
    assertValidScheduleDate(change.after)
    const session = { ...sessions[idx], scheduledAt: change.after }
    const { error } = await supabase
      .from(tables.sessions)
      .update(sessionToRow(session))
      .eq('id', change.sessionId)
    if (error) {
      throw new Error(formatSupabaseError('[data] Falha ao atualizar sessao', error))
    }
    sessions[idx] = session
  }
}

export async function applyFridayFix(
  dryRun: boolean,
): Promise<{ changes: FridayFixChange[]; sessions?: Session[] }> {
  const changes = computeFridayFixChanges(sessions)
  if (dryRun || changes.length === 0) {
    return { changes }
  }

  await applyBulkScheduleChanges(
    changes.map((c) => ({ sessionId: c.sessionId, after: c.after })),
  )
  console.log(`[data] fix-fridays: ${changes.length} sessoes movidas`)
  return { changes, sessions: await reloadSessionsFromDb() }
}

export async function applyDayCapacityFix(
  dryRun: boolean,
): Promise<{ changes: CapacityFixChange[]; sessions?: Session[] }> {
  const changes = computeDayCapacityFixChanges(sessions)
  if (dryRun || changes.length === 0) {
    return { changes }
  }

  await applyBulkScheduleChanges(
    changes.map((c) => ({ sessionId: c.sessionId, after: c.after })),
  )
  console.log(`[data] fix-day-capacity: ${changes.length} sessoes movidas`)
  return { changes, sessions: await reloadSessionsFromDb() }
}
