export type SessionStatus = 'scheduled' | 'done' | 'postponed'

export interface MergeableSession {
  id: string
  personId: string
  topicLetter: string
  scheduledAt: string
  status: SessionStatus
  recordedAt?: string
  notes?: string
}

export type PersistedSessionSnapshot = {
  status: SessionStatus
  recordedAt?: string
  notes?: string
}

function personTopicKey(personId: string, topicLetter: string): string {
  return `${personId}:${topicLetter}`
}

function isPersistedStatus(status: SessionStatus): boolean {
  return status === 'done' || status === 'postponed'
}

/** Agrupa gravações concluídas/adiadas do banco por pessoa+tópico (ordem de scheduledAt). */
export function collectPersistedSnapshots(
  sessions: MergeableSession[],
): Map<string, PersistedSessionSnapshot[]> {
  const byPersonTopic = new Map<string, PersistedSessionSnapshot[]>()

  const persisted = sessions
    .filter((s) => isPersistedStatus(s.status))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  for (const session of persisted) {
    const key = personTopicKey(session.personId, session.topicLetter)
    const queue = byPersonTopic.get(key) ?? []
    queue.push({
      status: session.status,
      recordedAt: session.recordedAt,
      notes: session.notes,
    })
    byPersonTopic.set(key, queue)
  }

  return byPersonTopic
}

/** Aplica estado persistido do banco sobre sessões vindas do YAML (match por id ou pessoa+tópico). */
export function applyPersistedSnapshots<T extends MergeableSession>(
  yamlSessions: T[],
  existingSessions: MergeableSession[],
): { sessions: T[]; preservedCount: number } {
  const byId = new Map<string, PersistedSessionSnapshot>()
  for (const session of existingSessions) {
    if (!isPersistedStatus(session.status)) continue
    byId.set(session.id, {
      status: session.status,
      recordedAt: session.recordedAt,
      notes: session.notes,
    })
  }

  const byPersonTopic = collectPersistedSnapshots(existingSessions)
  const queues = new Map<string, PersistedSessionSnapshot[]>()
  for (const [key, queue] of byPersonTopic) {
    queues.set(key, [...queue])
  }

  let preservedCount = 0

  const sessions = yamlSessions.map((session) => {
    let snapshot = byId.get(session.id)
    const key = personTopicKey(session.personId, session.topicLetter)

    if (snapshot) {
      const queue = queues.get(key)
      if (queue?.length) queue.shift()
    } else {
      const queue = queues.get(key)
      snapshot = queue?.shift()
    }

    if (!snapshot) return session

    preservedCount++
    return {
      ...session,
      status: snapshot.status,
      recordedAt: snapshot.recordedAt,
      notes: snapshot.notes?.trim() ? snapshot.notes : session.notes,
    }
  })

  return { sessions, preservedCount }
}
