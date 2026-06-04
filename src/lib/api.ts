import type { ScheduleData, Session, SessionStatus } from './types'
import { getEditorToken } from './authStorage'

const BASE = import.meta.env.VITE_API_URL ?? ''

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

export async function fetchSchedule(): Promise<ScheduleData> {
  return request<ScheduleData>('/api/schedule')
}

export async function fetchAuthMe(): Promise<{ editor: boolean; authDisabled?: boolean }> {
  return request<{ editor: boolean; authDisabled?: boolean }>('/api/auth/me')
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
