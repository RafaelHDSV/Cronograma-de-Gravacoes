import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: new URL('../../dailier/backend/.env', import.meta.url) })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, '../supabase/migrations')
const files = [
  '20260607120000_cronograma_sessions.sql',
  '20260607120100_rename_legacy_sessions.sql',
  '20260623120000_person_preferences.sql',
]

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Set DATABASE_URL (same Supabase as Dailier)')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: url.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
})

for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
  await pool.query(sql)
  console.log(`[cronograma] Applied: ${file}`)
}

await pool.end()
console.log('[cronograma] Migrations complete')
