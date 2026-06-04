import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { isRateLimited } from './rateLimit'

const LOGIN_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 }

const SESSION_SECRET = process.env.SESSION_SECRET?.trim() ?? ''
const EDITOR_PASSWORD = process.env.EDITOR_PASSWORD?.trim() ?? ''
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === 'true'
}

function requireAuthConfig(): void {
  if (isAuthDisabled()) return
  if (!EDITOR_PASSWORD || !SESSION_SECRET) {
    throw new Error(
      'Defina EDITOR_PASSWORD e SESSION_SECRET no .env (veja docs/seguranca.md)',
    )
  }
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function signJwt(payload: Record<string, unknown>): string {
  requireAuthConfig()
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${header}.${body}.${sig}`
}

function verifyJwt(token: string): { role: string; exp: number } | null {
  if (isAuthDisabled()) return { role: 'editor', exp: Date.now() + 1000 }
  requireAuthConfig()
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  if (sig !== expected) return null
  try {
    const padded = body.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(padded, 'base64').toString('utf8')
    const payload = JSON.parse(json) as { role?: string; exp?: number }
    if (payload.role !== 'editor' || !payload.exp || payload.exp < Date.now()) return null
    return { role: payload.role, exp: payload.exp }
  } catch {
    return null
  }
}

export function createEditorToken(): { token: string; expiresAt: string } {
  const exp = Date.now() + TOKEN_TTL_MS
  const token = signJwt({ role: 'editor', exp })
  return { token, expiresAt: new Date(exp).toISOString() }
}

export function tokenFromRequest(req: Request): string | null {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7).trim()
  return null
}

export function isEditorRequest(req: Request): boolean {
  if (isAuthDisabled()) return true
  const token = tokenFromRequest(req)
  if (!token) return false
  return verifyJwt(token) !== null
}

export function requireEditor(req: Request, res: Response, next: NextFunction): void {
  if (isEditorRequest(req)) {
    next()
    return
  }
  res.status(401).json({ error: 'Editor authentication required' })
}

export function handleLogin(req: Request, res: Response): void {
  if (isRateLimited(req, 'login', LOGIN_LIMIT.max, LOGIN_LIMIT.windowMs)) {
    res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' })
    return
  }
  try {
    requireAuthConfig()
  } catch (e) {
    res.status(500).json({ error: String(e) })
    return
  }
  const { password } = req.body as { password?: string }
  if (!password || password !== EDITOR_PASSWORD) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }
  const { token, expiresAt } = createEditorToken()
  res.json({ token, expiresAt })
}

export function handleAuthMe(req: Request, res: Response): void {
  res.json({
    editor: isEditorRequest(req),
    authDisabled: isAuthDisabled(),
  })
}
