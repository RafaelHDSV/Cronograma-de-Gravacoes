/**
 * Backup do estado atual e correcao da ordem alfabetica das gravacoes adiadas.
 *
 * Regra: topico N so pode ser agendado apos A..N-1 (por data).
 * Vieira: A em 11/06, B na proxima vaga, C na seguinte (deslocamento +2 nos slots).
 * Davi: A na vaga de 08/06 (antes de B), demais topics em cascata.
 *
 * Uso:
 *   npx tsx scripts/fix-topic-order.ts           # aplica
 *   npx tsx scripts/fix-topic-order.ts --dry-run # so mostra o plano
 *
 * Restaurar backup:
 *   npx tsx scripts/restore-sessions-backup.ts data/backups/sessions-XXXX.json
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { supabase, formatSupabaseError } from '../server/supabase.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BACKUP_DIR = path.join(ROOT, 'data', 'backups')

const dryRun = process.argv.includes('--dry-run')

interface SessionRow {
  id: string
  scheduled_at: string
  person_id: string
  topic_letter: string
  status: string
  notes?: string
  recorded_at: string | null
}

async function loadAll(): Promise<SessionRow[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('scheduled_at', { ascending: true })
  if (error) throw new Error(formatSupabaseError('load', error))
  return data as SessionRow[]
}

function backupFilePath(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return path.join(BACKUP_DIR, `sessions-${ts}.json`)
}

/** Slots cronologicos unicos da pessoa; topics pendentes em ordem alfabetica. */
function planPersonFix(
  rows: SessionRow[],
  personId: string,
  slotOffset: number,
): Array<{ id: string; scheduled_at: string; status: string; label: string }> {
  const own = rows.filter((r) => r.person_id === personId)
  const pending = own
    .filter((r) => r.status !== 'done')
    .sort((a, b) => a.topic_letter.localeCompare(b.topic_letter))
  const slots = [...new Set(own.map((r) => r.scheduled_at))].sort()

  return pending.map((session, i) => {
    const slotIdx = i + slotOffset
    const newAt = slotIdx < slots.length ? slots[slotIdx] : session.scheduled_at
    const changed = newAt !== session.scheduled_at || session.status !== 'scheduled'
    return {
      id: session.id,
      scheduled_at: newAt,
      status: 'scheduled',
      label: `${personId} (${session.topic_letter}): ${session.status} @ ${session.scheduled_at} -> scheduled @ ${newAt}${changed ? '' : ' (sem mudanca)'}`,
    }
  })
}

async function main() {
  const rows = await loadAll()
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const backup = backupFilePath()
  fs.writeFileSync(backup, JSON.stringify(rows, null, 2), 'utf-8')
  console.log(`Backup salvo: ${backup}`)
  console.log(`Total: ${rows.length} sessoes\n`)

  const postponed = rows.filter((r) => r.status === 'postponed')
  console.log(`Adiadas antes da correcao: ${postponed.length}`)
  for (const r of postponed) {
    console.log(`  ${r.person_id} (${r.topic_letter}) ${r.id}`)
  }
  console.log('')

  const plans = [
    ...planPersonFix(rows, 'vieira', 2),
    ...planPersonFix(rows, 'davi', 1),
  ].filter((p) => {
    const row = rows.find((r) => r.id === p.id)!
    return row.scheduled_at !== p.scheduled_at || row.status !== 'scheduled'
  })

  console.log(`Alteracoes planejadas: ${plans.length}`)
  for (const p of plans) {
    console.log(`  ${p.label}`)
  }

  if (plans.length === 0) {
    console.log('\nNada a alterar.')
    return
  }

  if (dryRun) {
    console.log('\n--dry-run: nenhuma alteracao aplicada.')
    return
  }

  for (const p of plans) {
    const { error } = await supabase
      .from('sessions')
      .update({ scheduled_at: p.scheduled_at, status: p.status })
      .eq('id', p.id)
    if (error) throw new Error(formatSupabaseError(`update ${p.id}`, error))
  }

  console.log('\nCorrecao aplicada.')
  console.log(`Para reverter: npx tsx scripts/restore-sessions-backup.ts "${backup}"`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
