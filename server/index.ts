import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initData, getPeople, getSessions, updateSession, swapSessionTimes, resetSessionsFromYaml } from './data'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT ?? 3334)

const app = express()
app.use(cors())
app.use(express.json())

initData()

app.get('/api/schedule', (_req, res) => {
  res.json({ people: getPeople(), sessions: getSessions() })
})

app.patch('/api/sessions/:id', (req, res) => {
  const { id } = req.params
  const { status, scheduledAt, recordedAt } = req.body

  const session = updateSession(id, { status, scheduledAt, recordedAt })
  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }
  res.json({ session })
})

app.post('/api/sessions/swap-time', (req, res) => {
  const { sessionIdA, sessionIdB } = req.body
  if (!sessionIdA || !sessionIdB) {
    return res.status(400).json({ error: 'sessionIdA and sessionIdB are required' })
  }

  const result = swapSessionTimes(sessionIdA, sessionIdB)
  if (!result) {
    return res.status(404).json({ error: 'One or both sessions not found' })
  }
  res.json({ sessions: result })
})

app.post('/api/schedule/reset', (_req, res) => {
  const sessions = resetSessionsFromYaml()
  res.json({ people: getPeople(), sessions })
})

// In production, serve the built frontend
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] Running on http://127.0.0.1:${PORT}`)
})
