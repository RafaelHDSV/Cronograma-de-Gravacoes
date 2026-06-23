import type { Person, Session } from './types'
import { groupPersonTopics } from './topicSessions'

/** Todos os topicos da pessoa concluidos (cada um com >=1 sessao e todas done). */
export function isPersonFullyRecorded(
  people: Person[],
  sessions: Session[],
  personId: string,
): boolean {
  const person = people.find((p) => p.id === personId)
  if (!person) return false
  const groups = groupPersonTopics(person, sessions)
  if (groups.length === 0) return false
  return groups.every((g) => g.isComplete)
}

/** Marcar esta sessao como done deixa a pessoa 100% gravada (todos os topicos)? */
export function willCompletePersonOnMarkDone(
  people: Person[],
  sessions: Session[],
  sessionId: string,
): { complete: boolean; personId: string } | null {
  const target = sessions.find((s) => s.id === sessionId)
  if (!target || target.status === 'done') return null
  const simulated = sessions.map((s) =>
    s.id === sessionId ? { ...s, status: 'done' as const } : s,
  )
  if (!isPersonFullyRecorded(people, simulated, target.personId)) return null
  return { complete: true, personId: target.personId }
}
