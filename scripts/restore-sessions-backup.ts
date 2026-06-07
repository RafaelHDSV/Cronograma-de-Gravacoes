/**
 * Restaura sessoes a partir de um backup JSON (gerado por fix-topic-order.ts).
 * Uso: npx tsx scripts/restore-sessions-backup.ts data/backups/sessions-XXXX.json
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { supabase, formatSupabaseError } from '../server/supabase.js'

const backupArg = process.argv[2]
if (!backupArg) {
  console.error('Informe o caminho do backup: npx tsx scripts/restore-sessions-backup.ts data/backups/sessions-....json')
  process.exit(1)
}

const backupPath = path.resolve(process.cwd(), backupArg)
if (!fs.existsSync(backupPath)) {
  console.error(`Arquivo nao encontrado: ${backupPath}`)
  process.exit(1)
}

interface SessionRow {
  id: string
  scheduled_at: string
  person_id: string
  topic_letter: string
  status: string
  notes?: string
  recorded_at: string | null
}

async function main() {
  const rows = JSON.parse(fs.readFileSync(backupPath, 'utf-8')) as SessionRow[]
  console.log(`Restaurando ${rows.length} sessoes de ${backupPath}`)

  const { error: delErr } = await supabase.from('sessions').delete().neq('id', '')
  if (delErr) throw new Error(formatSupabaseError('delete', delErr))

  const { error: insErr } = await supabase.from('sessions').insert(rows)
  if (insErr) throw new Error(formatSupabaseError('insert', insErr))

  console.log('Restauracao concluida.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
