/**
 * Backup do cronograma inicial (git HEAD) + progresso de gravações do banco.
 *
 * - sessions-git-head.yaml: agenda original versionada (antes do rebuild)
 * - gravacoes-concluidas.json: só sessões done/postponed (estado operacional)
 * - sessions.initial-backup.yaml: agenda original com gravações aplicadas no slot correto
 * - sessions-db-snapshot.json: dump completo atual do Supabase (referência)
 *
 * Uso:
 *   node scripts/backup-initial-schedule.mjs          # API local/produção, senão snapshot
 *   node scripts/backup-initial-schedule.mjs --offline # só arquivos em docs/backups/
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dump, load } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BACKUP_DIR = path.join(ROOT, 'docs', 'backups')
const GIT_HEAD_YAML = path.join(BACKUP_DIR, 'sessions-git-head.yaml')
const DB_SNAPSHOT_LATEST = path.join(BACKUP_DIR, 'sessions-db-snapshot.json')
const PROGRESS_LATEST = path.join(BACKUP_DIR, 'gravacoes-concluidas.json')
const OFFLINE = process.argv.includes('--offline')

function readEnvUrl(name) {
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath)) return null
  const match = fs.readFileSync(envPath, 'utf-8').match(new RegExp(`^${name}=(.+)$`, 'm'))
  const value = match?.[1]?.trim()
  return value && !value.includes('SEU_') ? value.replace(/\/$/, '') : null
}

function apiCandidates() {
  const urls = new Set()
  if (process.env.SCHEDULE_API_URL) urls.add(process.env.SCHEDULE_API_URL.replace(/\/$/, ''))
  urls.add('http://127.0.0.1:3334')
  const render = readEnvUrl('RENDER_APP_URL')
  if (render) urls.add(render)
  urls.add('https://gravacoes-agx.onrender.com')
  return [...urls]
}

function personTopicKey(personId, topicLetter) {
  return `${personId}:${topicLetter}`
}

function collectProgress(sessions) {
  const byPersonTopic = new Map()
  const list = []

  for (const s of sessions) {
    if (s.status !== 'done' && s.status !== 'postponed') continue
    const snap = {
      id: s.id,
      personId: s.personId,
      topicLetter: s.topicLetter,
      scheduledAt: s.scheduledAt,
      status: s.status,
      recordedAt: s.recordedAt,
      notes: s.notes,
    }
    list.push(snap)
    const key = personTopicKey(s.personId, s.topicLetter)
    const queue = byPersonTopic.get(key) ?? []
    queue.push(snap)
    byPersonTopic.set(key, queue)
  }

  for (const queue of byPersonTopic.values()) {
    queue.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  }

  return { byPersonTopic, list }
}

function applyProgressToOriginal(originalSessions, progress) {
  const queues = new Map()
  for (const [key, queue] of progress.byPersonTopic) {
    queues.set(key, [...queue])
  }

  let applied = 0
  const merged = originalSessions.map((session) => {
    const key = personTopicKey(session.personId, session.topicLetter)
    const snap = queues.get(key)?.shift()
    if (!snap) return { ...session }

    applied++
    return {
      ...session,
      status: snap.status,
      recordedAt: snap.recordedAt,
      notes: snap.notes?.trim() ? snap.notes : session.notes,
    }
  })

  return { sessions: merged, applied }
}

async function fetchFromApi(base) {
  const res = await fetch(`${base}/api/schedule`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  return { sessions: data.sessions ?? [], source: `${base}/api/schedule` }
}

async function loadSessionsWithFallback() {
  if (!OFFLINE) {
    for (const base of apiCandidates()) {
      try {
        const result = await fetchFromApi(base)
        console.log(`Fonte: API (${result.source})`)
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`API indisponível em ${base}: ${msg}`)
      }
    }
  }

  if (fs.existsSync(DB_SNAPSHOT_LATEST)) {
    const parsed = JSON.parse(fs.readFileSync(DB_SNAPSHOT_LATEST, 'utf-8'))
    console.log(`Fonte: snapshot local (${path.relative(ROOT, DB_SNAPSHOT_LATEST)})`)
    return { sessions: parsed.sessions ?? [], source: DB_SNAPSHOT_LATEST }
  }

  if (fs.existsSync(PROGRESS_LATEST)) {
    const parsed = JSON.parse(fs.readFileSync(PROGRESS_LATEST, 'utf-8'))
    console.log(`Fonte: progresso salvo (${path.relative(ROOT, PROGRESS_LATEST)})`)
    return { sessions: parsed.sessions ?? [], source: PROGRESS_LATEST }
  }

  throw new Error(
    'Nenhuma fonte disponível. Inicie o servidor (yarn dev) ou rode antes com API online para gerar docs/backups/sessions-db-snapshot.json',
  )
}

function ensureGitHeadYaml() {
  if (fs.existsSync(GIT_HEAD_YAML)) return
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  try {
    const yaml = execSync('git show HEAD:public/data/sessions.yaml', { cwd: ROOT, encoding: 'utf-8' })
    fs.writeFileSync(GIT_HEAD_YAML, yaml, 'utf-8')
    console.log(`Gerado ${path.relative(ROOT, GIT_HEAD_YAML)} a partir do git HEAD`)
  } catch {
    throw new Error(
      `Arquivo ${GIT_HEAD_YAML} ausente. Rode: git show HEAD:public/data/sessions.yaml > docs/backups/sessions-git-head.yaml`,
    )
  }
}

function stripEmptyFields(session) {
  const row = { ...session }
  if (!row.notes) delete row.notes
  if (!row.recordedAt) delete row.recordedAt
  return row
}

async function main() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  ensureGitHeadYaml()

  const originalText = fs.readFileSync(GIT_HEAD_YAML, 'utf-8')
  const original = load(originalText)?.sessions ?? []

  const { sessions: live, source } = await loadSessionsWithFallback()
  const fromApi = typeof source === 'string' && source.includes('/api/schedule')
  const progress = collectProgress(live)
  const { sessions: merged, applied } = applyProgressToOriginal(original, progress)

  const stamp = new Date().toISOString().slice(0, 10)
  const progressPath = path.join(BACKUP_DIR, 'gravacoes-concluidas.json')
  const mergedPath = path.join(BACKUP_DIR, `sessions.initial-backup-${stamp}.yaml`)
  const latestPath = path.join(BACKUP_DIR, 'sessions.initial-backup.yaml')
  const dbSnapshotPath = path.join(BACKUP_DIR, `sessions-db-snapshot-${stamp}.json`)
  const dbLatestPath = path.join(BACKUP_DIR, 'sessions-db-snapshot.json')

  fs.writeFileSync(
    progressPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        source: String(source),
        count: progress.list.length,
        sessions: progress.list,
      },
      null,
      2,
    ),
    'utf-8',
  )

  if (fromApi) {
    fs.writeFileSync(
      dbSnapshotPath,
      JSON.stringify({ exportedAt: new Date().toISOString(), source, sessions: live }, null, 2),
      'utf-8',
    )
    fs.copyFileSync(dbSnapshotPath, dbLatestPath)
  }

  const yamlBody = dump(
    { sessions: merged.map(stripEmptyFields) },
    { lineWidth: 160, noRefs: true },
  )
  fs.writeFileSync(mergedPath, yamlBody, 'utf-8')
  fs.copyFileSync(mergedPath, latestPath)

  console.log(`Cronograma original (git HEAD): ${original.length} sessões`)
  console.log(`Gravações concluídas/adiadas: ${progress.list.length}`)
  console.log(`Aplicadas no backup inicial: ${applied}`)
  console.log('')
  console.log('Arquivos gerados:')
  console.log(`  ${path.relative(ROOT, GIT_HEAD_YAML)}`)
  console.log(`  ${path.relative(ROOT, progressPath)}`)
  console.log(`  ${path.relative(ROOT, mergedPath)}`)
  console.log(`  ${path.relative(ROOT, latestPath)}`)
  if (fromApi) console.log(`  ${path.relative(ROOT, dbSnapshotPath)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
