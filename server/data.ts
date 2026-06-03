import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'

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

const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json')
const PEOPLE_YAML = path.join(ROOT, 'public', 'data', 'people.yaml')
const SESSIONS_YAML = path.join(ROOT, 'public', 'data', 'sessions.yaml')

let people: Person[] = []
let sessions: Session[] = []

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadPeople(): Person[] {
  const text = fs.readFileSync(PEOPLE_YAML, 'utf-8')
  const parsed = load(text) as { people: Person[] }
  return parsed.people ?? []
}

function seedSessionsFromYaml(): Session[] {
  const text = fs.readFileSync(SESSIONS_YAML, 'utf-8')
  const parsed = load(text) as { sessions: Session[] }
  const raw = parsed.sessions ?? []
  return raw.map((s) => ({
    ...s,
    status:
      s.status === 'done' ? 'done' : s.status === 'postponed' ? 'postponed' : 'scheduled',
  }))
}

function persistSessions() {
  ensureDataDir()
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8')
}

export function initData() {
  people = loadPeople()

  if (fs.existsSync(SESSIONS_FILE)) {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8')
    sessions = JSON.parse(raw) as Session[]
    console.log(`[data] Loaded ${sessions.length} sessions from sessions.json`)
  } else {
    sessions = seedSessionsFromYaml()
    persistSessions()
    console.log(`[data] Seeded ${sessions.length} sessions from YAML`)
  }

  console.log(`[data] Loaded ${people.length} people from YAML`)
}

export function getPeople(): Person[] {
  return people
}

export function getSessions(): Session[] {
  return sessions
}

export function findSession(id: string): Session | undefined {
  return sessions.find((s) => s.id === id)
}

export function updateSession(id: string, patch: { status?: SessionStatus; scheduledAt?: string; recordedAt?: string }): Session | null {
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx === -1) return null

  const session = sessions[idx]
  if (patch.status !== undefined) session.status = patch.status
  if (patch.scheduledAt !== undefined) session.scheduledAt = patch.scheduledAt
  if (patch.recordedAt !== undefined) session.recordedAt = patch.recordedAt

  sessions[idx] = session
  persistSessions()
  return session
}

export function resetSessionsFromYaml(): Session[] {
  sessions = seedSessionsFromYaml()
  persistSessions()
  console.log(`[data] Reset ${sessions.length} sessions from YAML`)
  return sessions
}

export function swapSessionTimes(idA: string, idB: string): [Session, Session] | null {
  const a = sessions.find((s) => s.id === idA)
  const b = sessions.find((s) => s.id === idB)
  if (!a || !b) return null

  const tempAt = a.scheduledAt
  a.scheduledAt = b.scheduledAt
  b.scheduledAt = tempAt

  persistSessions()
  return [a, b]
}
