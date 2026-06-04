import type { Session } from './types'

/** Todas as sessoes da pessoa estao com status done (inclui rascunho ja aplicado na lista). */
export function isPersonFullyRecorded(sessions: Session[], personId: string): boolean {
  const own = sessions.filter((s) => s.personId === personId)
  if (own.length === 0) return false
  return own.every((s) => s.status === 'done')
}

/** Marcar esta sessao como done deixa a pessoa 100% gravada? */
export function willCompletePersonOnMarkDone(
  sessions: Session[],
  sessionId: string,
): { complete: boolean; personId: string } | null {
  const target = sessions.find((s) => s.id === sessionId)
  if (!target || target.status === 'done') return null
  const simulated = sessions.map((s) =>
    s.id === sessionId ? { ...s, status: 'done' as const } : s,
  )
  if (!isPersonFullyRecorded(simulated, target.personId)) return null
  return { complete: true, personId: target.personId }
}
