import type { Person, ScheduleData, Session, SessionStatus } from './types'
import { getEditorToken } from './authStorage'

const BASE = import.meta.env.VITE_API_URL ?? ''

const RETRYABLE_STATUS = new Set([502, 503, 504])

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return true
  const status = Number(msg.match(/^API (\d{3}):/)?.[1])
  return RETRYABLE_STATUS.has(status)
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getEditorToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: buildHeaders(),
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json()
}

async function requestWithRetry<T>(
  url: string,
  options?: RequestInit,
  maxAttempts = 12,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await request<T>(url, options)
    } catch (err) {
      lastError = err
      if (!isRetryableError(err) || attempt === maxAttempts - 1) throw err
      await sleep(Math.min(8000, 1500 * (attempt + 1)))
    }
  }
  throw lastError
}

export async function fetchSchedule(): Promise<ScheduleData> {
  return requestWithRetry<ScheduleData>('/api/schedule')
}

export async function fetchAuthMe(): Promise<{ editor: boolean; authDisabled?: boolean }> {
  return requestWithRetry<{ editor: boolean; authDisabled?: boolean }>('/api/auth/me')
}

export async function loginEditor(
  password: string,
): Promise<{ token: string; expiresAt: string }> {
  return request<{ token: string; expiresAt: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export type SessionPatchPayload = {
  status?: SessionStatus
  scheduledAt?: string
  recordedAt?: string
  notes?: string
  topicLetter?: string
}

export async function applySessionBatch(
  changes: Array<{ id: string } & SessionPatchPayload>,
): Promise<Session[]> {
  const { sessions } = await request<{ sessions: Session[] }>('/api/sessions/apply-batch', {
    method: 'POST',
    body: JSON.stringify({ changes }),
  })
  return sessions
}

export async function updatePersonTopicOrder(
  personId: string,
  topicOrder: string[],
): Promise<Person> {
  const { person } = await request<{ person: Person }>(`/api/people/${personId}/topic-order`, {
    method: 'PATCH',
    body: JSON.stringify({ topicOrder }),
  })
  return person
}

export type CreateSessionPayload = {
  personId: string
  topicLetter: string
  scheduledAt: string
  status?: SessionStatus
}

export async function createSession(payload: CreateSessionPayload): Promise<Session> {
  const { session } = await request<{ session: Session }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return session
}

export async function deleteSession(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/sessions/${id}`, { method: 'DELETE' })
}
