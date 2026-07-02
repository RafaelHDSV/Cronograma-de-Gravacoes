import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  initData,
  getPeople,
  reloadSessionsFromDb,
  updateSession,
  swapSessionTimes,
  resetSessionsFromYaml,
  applySessionPatches,
  updatePersonTopicOrder,
  createSession,
  deleteSession,
  applyFridayFix,
  applyDayCapacityFix,
  type CreateSessionInput,
  type SessionPatch,
} from './data.js'
import { handleAuthMe, handleLogin, requireEditor } from './auth.js'
import { startKeepAlive } from '@rafaelhdsv/keep-alive'
import { isRateLimited } from './rateLimit.js'
import { FRIDAY_BLOCKED_MESSAGE, DAY_CAPACITY_MESSAGE } from '../shared/scheduleDates.js'

const BATCH_LIMIT = { max: 60, windowMs: 60 * 1000 }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT ?? 3334)
const HOST = process.env.RENDER === 'true' ? '0.0.0.0' : '127.0.0.1'

const app = express()
app.use(cors())
app.use(express.json())

let dataReady = false

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, ready: dataReady })
})

app.get('/api/auth/me', handleAuthMe)
app.post('/api/auth/login', handleLogin)

app.get('/api/schedule', async (_req, res) => {
  try {
    const sessions = await reloadSessionsFromDb()
    res.json({ people: getPeople(), sessions })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

function scheduleRuleErrorResponse(e: unknown, res: express.Response): boolean {
  const msg = String(e)
  if (msg.includes(DAY_CAPACITY_MESSAGE) || msg === DAY_CAPACITY_MESSAGE) {
    res.status(400).json({ error: DAY_CAPACITY_MESSAGE })
    return true
  }
  if (msg.includes(FRIDAY_BLOCKED_MESSAGE) || msg === FRIDAY_BLOCKED_MESSAGE) {
    res.status(400).json({ error: FRIDAY_BLOCKED_MESSAGE })
    return true
  }
  return false
}

app.patch('/api/sessions/:id', requireEditor, async (req, res) => {
  try {
    const id = String(req.params.id)
    const { status, scheduledAt, recordedAt, notes, topicLetter } = req.body as SessionPatch
    const session = await updateSession(id, { status, scheduledAt, recordedAt, notes, topicLetter })
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    res.json({ session })
  } catch (e) {
    console.error(e)
    if (scheduleRuleErrorResponse(e, res)) return
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/sessions', requireEditor, async (req, res) => {
  try {
    const { personId, topicLetter, scheduledAt, status } = req.body as CreateSessionInput
    if (!personId || !topicLetter || !scheduledAt) {
      return res.status(400).json({ error: 'personId, topicLetter e scheduledAt sao obrigatorios' })
    }
    const session = await createSession({ personId, topicLetter, scheduledAt, status })
    res.status(201).json({ session })
  } catch (e) {
    console.error(e)
    const msg = String(e)
    if (scheduleRuleErrorResponse(e, res)) return
    if (msg.includes('nao encontrada') || msg.includes('invalido')) {
      return res.status(400).json({ error: msg })
    }
    res.status(500).json({ error: msg })
  }
})

app.delete('/api/sessions/:id', requireEditor, async (req, res) => {
  try {
    const id = String(req.params.id)
    const removed = await deleteSession(id)
    if (!removed) {
      return res.status(404).json({ error: 'Session not found' })
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/sessions/apply-batch', requireEditor, async (req, res) => {
  if (isRateLimited(req, 'apply-batch', BATCH_LIMIT.max, BATCH_LIMIT.windowMs)) {
    return res.status(429).json({ error: 'Muitas alteracoes em pouco tempo. Aguarde um momento.' })
  }
  try {
    const { changes } = req.body as {
      changes?: Array<{ id: string } & SessionPatch>
    }
    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'changes array is required' })
    }
    const sessions = await applySessionPatches(changes)
    res.json({ sessions })
  } catch (e) {
    console.error(e)
    if (scheduleRuleErrorResponse(e, res)) return
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/sessions/swap-time', requireEditor, async (req, res) => {
  try {
    const { sessionIdA, sessionIdB } = req.body
    if (!sessionIdA || !sessionIdB) {
      return res.status(400).json({ error: 'sessionIdA and sessionIdB are required' })
    }
    const result = await swapSessionTimes(sessionIdA, sessionIdB)
    if (!result) {
      return res.status(404).json({ error: 'One or both sessions not found' })
    }
    res.json({ sessions: result })
  } catch (e) {
    console.error(e)
    if (scheduleRuleErrorResponse(e, res)) return
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/schedule/fix-day-capacity', requireEditor, async (req, res) => {
  try {
    const dryRun = req.body?.dryRun !== false
    const result = await applyDayCapacityFix(dryRun)
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/schedule/fix-fridays', requireEditor, async (req, res) => {
  try {
    const dryRun = req.body?.dryRun !== false
    const result = await applyFridayFix(dryRun)
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/schedule/reset', requireEditor, async (_req, res) => {
  try {
    const { sessions, preservedCount } = await resetSessionsFromYaml()
    res.json({ people: getPeople(), sessions, preservedCount })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

app.patch('/api/people/:personId/topic-order', requireEditor, async (req, res) => {
  try {
    const personId = String(req.params.personId)
    const { topicOrder } = req.body as { topicOrder?: string[] }
    if (!Array.isArray(topicOrder) || topicOrder.length === 0) {
      return res.status(400).json({ error: 'topicOrder array is required' })
    }
    const person = await updatePersonTopicOrder(personId, topicOrder)
    if (!person) {
      return res.status(404).json({ error: 'Person not found' })
    }
    res.json({ person })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

const distPath = path.join(process.cwd(), 'dist')
app.use(express.static(distPath))
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

async function main() {
  app.listen(PORT, HOST, () => {
    console.log(`[server] Running on http://${HOST}:${PORT}`)
    startKeepAlive()
  })

  try {
    await initData()
    dataReady = true
  } catch (e) {
    console.error('[server] Falha ao inicializar dados:', e)
    process.exit(1)
  }
}

main()
