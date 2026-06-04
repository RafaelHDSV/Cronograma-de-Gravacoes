import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'
import { formatSupabaseError, supabase } from './supabase'

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
}

export type SessionStatus = 'scheduled' | 'done' | 'postponed'

export interface Session {
  id: string
  scheduledAt: string
  personId: string
  topicLetter: string
  status: SessionStatus
  notes?: string
  recordedAt?: string
}

interface SessionRow {
  id: string
  scheduled_at: string
  person_id: string
  topic_letter: string
  status: SessionStatus
  notes: string | null
  recorded_at: string | null
}

const ROOT = path.resolve(__dirname, '..')
const PEOPLE_YAML = path.join(ROOT, 'public', 'data', 'people.yaml')
const SESSIONS_YAML = path.join(ROOT, 'public', 'data', 'sessions.yaml')

let people: Person[] = []
let sessions: Session[] = []

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
    notes: row.notes ?? undefined,
    recordedAt: row.recorded_at ?? undefined,
  }
}

function sessionToRow(session: Session): SessionRow {
  return {
    id: session.id,
    scheduled_at: session.scheduledAt,
    person_id: session.personId,
    topic_letter: session.topicLetter,
    status: session.status,
    notes: session.notes ?? '',
    recorded_at: session.recordedAt?.trim() ? session.recordedAt : null,
  }
}

function loadPeople(): Person[] {
  const text = fs.readFileSync(PEOPLE_YAML, 'utf-8')
  const parsed = load(text) as { people: Person[] }
  return parsed.people ?? []
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
    .from('sessions')
    .select('*')
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(formatSupabaseError('[data] Falha ao carregar sessoes', error))
  return (data as SessionRow[]).map(rowToSession)
}

async function insertSessions(rows: Session[]): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase.from('sessions').insert(rows.map(sessionToRow))
  if (error) throw new Error(formatSupabaseError('[data] Falha ao inserir sessoes', error))
}

async function deleteAllSessions(): Promise<void> {
  const { error } = await supabase.from('sessions').delete().neq('id', '')
  if (error) throw new Error(formatSupabaseError('[data] Falha ao limpar sessoes', error))
}

async function countSessions(): Promise<number> {
  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(formatSupabaseError('[data] Falha ao contar sessoes', error))
  return count ?? 0
}

export async function initData(): Promise<void> {
  people = loadPeople()

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
  patch: { status?: SessionStatus; scheduledAt?: string; recordedAt?: string },
): Promise<Session | null> {
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx === -1) return null

  const session = { ...sessions[idx] }
  if (patch.status !== undefined) session.status = patch.status
  if (patch.scheduledAt !== undefined) session.scheduledAt = patch.scheduledAt
  if (patch.recordedAt !== undefined) {
    session.recordedAt = patch.recordedAt.trim() ? patch.recordedAt : undefined
  }

  const { error } = await supabase.from('sessions').update(sessionToRow(session)).eq('id', id)
  if (error) throw new Error(formatSupabaseError('[data] Falha ao atualizar sessao', error))

  sessions[idx] = session
  return session
}

export async function resetSessionsFromYaml(): Promise<Session[]> {
  await deleteAllSessions()
  sessions = seedSessionsFromYaml()
  await insertSessions(sessions)
  console.log(`[data] Reset: ${sessions.length} sessoes de sessions.yaml -> Supabase`)
  return sessions
}

export type SessionPatch = {
  status?: SessionStatus
  scheduledAt?: string
  recordedAt?: string
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
  const tempAt = a.scheduledAt
  a.scheduledAt = b.scheduledAt
  b.scheduledAt = tempAt

  const { error: errA } = await supabase.from('sessions').update(sessionToRow(a)).eq('id', idA)
  if (errA) throw new Error(formatSupabaseError('[data] Falha ao trocar horario', errA))

  const { error: errB } = await supabase.from('sessions').update(sessionToRow(b)).eq('id', idB)
  if (errB) throw new Error(formatSupabaseError('[data] Falha ao trocar horario', errB))

  sessions[idxA] = a
  sessions[idxB] = b
  return [a, b]
}
