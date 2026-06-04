import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  initData,
  getPeople,
  getSessions,
  updateSession,
  swapSessionTimes,
  resetSessionsFromYaml,
  applySessionPatches,
} from './data'
import { handleAuthMe, handleLogin, requireEditor } from './auth'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT ?? 3334)
const HOST = process.env.RENDER === 'true' ? '0.0.0.0' : '127.0.0.1'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/auth/me', handleAuthMe)
app.post('/api/auth/login', handleLogin)

app.get('/api/schedule', (_req, res) => {
  res.json({ people: getPeople(), sessions: getSessions() })
})

app.patch('/api/sessions/:id', requireEditor, async (req, res) => {
  try {
    const { id } = req.params
    const { status, scheduledAt, recordedAt } = req.body
    const session = await updateSession(id, { status, scheduledAt, recordedAt })
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    res.json({ session })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/sessions/apply-batch', requireEditor, async (req, res) => {
  try {
    const { changes } = req.body as {
      changes?: Array<{ id: string; status?: string; scheduledAt?: string; recordedAt?: string }>
    }
    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'changes array is required' })
    }
    const sessions = await applySessionPatches(changes)
    res.json({ sessions })
  } catch (e) {
    console.error(e)
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
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/schedule/reset', requireEditor, async (_req, res) => {
  try {
    const sessions = await resetSessionsFromYaml()
    res.json({ people: getPeople(), sessions })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

async function main() {
  try {
    await initData()
  } catch (e) {
    console.error('[server] Falha ao inicializar dados:', e)
    process.exit(1)
  }

  app.listen(PORT, HOST, () => {
    console.log(`[server] Running on http://${HOST}:${PORT}`)
  })
}

main()
