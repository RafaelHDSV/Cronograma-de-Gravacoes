import type { Request } from 'express'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

function clientKey(req: Request, suffix: string): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  return `${ip}:${suffix}`
}

/** Retorna true se a requisicao deve ser bloqueada (limite excedido). */
export function isRateLimited(req: Request, suffix: string, max: number, windowMs: number): boolean {
  const key = clientKey(req, suffix)
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  bucket.count++
  return bucket.count > max
}
