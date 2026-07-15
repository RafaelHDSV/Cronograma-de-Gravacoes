/**
 * Legado: lotacao max. 2/dia foi desativada — computeDayCapacityFixChanges e no-op.
 * Uso: npx tsx scripts/apply-day-capacity-yaml.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dump, load } from 'js-yaml'
import { computeDayCapacityFixChanges } from '../shared/dayCapacityMigration.ts'
import { dayKeyFromIso } from '../shared/scheduleDates.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const YAML_PATH = path.join(__dirname, '..', 'public', 'data', 'sessions.yaml')

interface YamlSession {
  id: string
  scheduledAt: string
  personId: string
  topicLetter: string
  status: string
  notes?: string
}

function sessionIdBase(scheduledAt: string, personId: string, topicLetter: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
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

function main() {
  const text = fs.readFileSync(YAML_PATH, 'utf-8')
  const parsed = load(text) as { sessions: YamlSession[] }
  const sessions = parsed.sessions

  const changes = computeDayCapacityFixChanges(sessions)
  if (changes.length === 0) {
    console.log('Nenhum dia com mais de 2 sessoes por pessoa no YAML.')
    return
  }

  const changeMap = new Map(changes.map((c) => [c.sessionId, c.after]))
  const ids = new Set(sessions.map((s) => s.id))

  for (const session of sessions) {
    const after = changeMap.get(session.id)
    if (!after) continue
    session.scheduledAt = after
    const base = sessionIdBase(after, session.personId, session.topicLetter)
    if (!ids.has(base)) {
      ids.delete(session.id)
      session.id = base
      ids.add(base)
    }
  }

  sessions.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  fs.writeFileSync(
    YAML_PATH,
    dump({ sessions }, { lineWidth: 120, noRefs: true }),
    'utf-8',
  )

  console.log(`YAML atualizado: ${changes.length} sessoes movidas.`)
  for (const c of changes) {
    console.log(`  ${c.sessionId}: ${dayKeyFromIso(c.before)} -> ${dayKeyFromIso(c.after)}`)
  }
}

main()
