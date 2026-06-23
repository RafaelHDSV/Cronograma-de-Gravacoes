/**
 * Sincroniza public/data/sessions.yaml e Supabase a partir do cronograma esperado
 * (mesma lógica de scripts/generate-cronograma-esperado.mjs).
 *
 * Uso:
 *   node scripts/sync-cronograma-esperado.mjs           # yaml + Supabase
 *   node scripts/sync-cronograma-esperado.mjs --yaml-only
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { dump } from 'js-yaml'
import dotenv from 'dotenv'
import { buildExpectedSchedule } from './generate-cronograma-esperado.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SESSIONS_YAML = path.join(ROOT, 'public', 'data', 'sessions.yaml')
const YAML_ONLY = process.argv.includes('--yaml-only')

const JANDERSON_TOPICS = ['a', 'b', 'l', 'm', 'n', 'f', 'e', 'c', 'd', 'g', 'h', 'i', 'j', 'k']

function tableName(base) {
  const prefix = (process.env.DB_TABLE_PREFIX ?? 'cronograma').trim()
  return `${prefix}_${base}`
}

function mergeNotes(newSessions, existing) {
  const notesByKey = new Map()
  for (const s of existing) {
    if (s.notes?.trim()) notesByKey.set(`${s.personId}:${s.topicLetter}`, s.notes.trim())
  }
  return newSessions.map((s) => {
    const notes = notesByKey.get(`${s.personId}:${s.topicLetter}`)
    return notes ? { ...s, notes } : s
  })
}

function sessionToRow(session) {
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

function rowToSession(row) {
  return {
    id: row.id,
    scheduledAt: row.scheduled_at,
    personId: row.person_id,
    topicLetter: row.topic_letter,
    status: row.status,
    recordedAt: row.recorded_at ?? undefined,
    notes: row.notes?.trim() ? row.notes : undefined,
  }
}

async function syncSupabase(sessions) {
  dotenv.config({ path: path.join(ROOT, '.env') })
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const sessionsTable = tableName('sessions')
  const prefsTable = tableName('person_preferences')

  const { data: existingRows, error: loadErr } = await supabase
    .from(sessionsTable)
    .select('*')
    .order('scheduled_at', { ascending: true })

  if (loadErr) throw new Error(`Falha ao carregar sessões: ${loadErr.message}`)

  const existing = (existingRows ?? []).map(rowToSession)
  const merged = mergeNotes(sessions, existing)

  const { error: delErr } = await supabase.from(sessionsTable).delete().neq('id', '')
  if (delErr) throw new Error(`Falha ao limpar sessões: ${delErr.message}`)

  const { error: insErr } = await supabase.from(sessionsTable).insert(merged.map(sessionToRow))
  if (insErr) throw new Error(`Falha ao inserir sessões: ${insErr.message}`)

  const { error: prefErr } = await supabase.from(prefsTable).upsert(
    {
      person_id: 'janderson',
      topic_order: JANDERSON_TOPICS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'person_id' },
  )
  if (prefErr && prefErr.code !== '42P01' && prefErr.code !== 'PGRST205') {
    throw new Error(`Falha ao salvar ordem do Janderson: ${prefErr.message}`)
  }

  const done = merged.filter((s) => s.status === 'done').length
  console.log(`✅ Supabase: ${merged.length} sessões (${done} concluídas)`)
  return merged
}

async function main() {
  const { dbSessions } = buildExpectedSchedule()

  const yamlOpts = { lineWidth: 200, noRefs: true }
  fs.writeFileSync(SESSIONS_YAML, dump({ sessions: dbSessions }, yamlOpts), 'utf-8')
  console.log(`✅ ${path.relative(ROOT, SESSIONS_YAML)} (${dbSessions.length} sessões)`)

  if (YAML_ONLY) {
    console.log('Modo --yaml-only: Supabase não alterado.')
    return
  }

  await syncSupabase(dbSessions)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
