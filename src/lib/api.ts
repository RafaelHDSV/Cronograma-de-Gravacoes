import type { ScheduleData, Session, SessionStatus } from './types'

const BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
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

export async function patchSession(
  id: string,
  patch: { status?: SessionStatus; scheduledAt?: string; recordedAt?: string },
): Promise<Session> {
  const { session } = await request<{ session: Session }>(`/api/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return session
}

export async function swapSessionTimes(
  sessionIdA: string,
  sessionIdB: string,
): Promise<[Session, Session]> {
  const { sessions } = await request<{ sessions: [Session, Session] }>('/api/sessions/swap-time', {
    method: 'POST',
    body: JSON.stringify({ sessionIdA, sessionIdB }),
  })
  return sessions
}
