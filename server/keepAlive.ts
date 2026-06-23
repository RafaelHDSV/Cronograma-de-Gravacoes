/**
 * Render free dorme apos ~15 min sem trafego.
 * Ping interno em /api/health mantem a instancia acordada enquanto o processo estiver no ar.
 */

const DEFAULT_INTERVAL_MIN = 10

function resolveBaseUrl(): string | null {
  const explicit = process.env.KEEP_ALIVE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const renderExternal = process.env.RENDER_EXTERNAL_URL?.trim()
  if (renderExternal) return renderExternal.replace(/\/$/, '')

  const renderApp = process.env.RENDER_APP_URL?.trim()
  if (renderApp) return renderApp.replace(/\/$/, '')

  return null
}

async function ping(url: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(90_000) })
  if (!res.ok) {
    console.warn(`[keep-alive] ${url} → HTTP ${res.status}`)
  }
}

export function startKeepAlive(): void {
  const base = resolveBaseUrl()
  if (!base) return

  const intervalMin = Number(process.env.KEEP_ALIVE_INTERVAL_MIN) || DEFAULT_INTERVAL_MIN
  const intervalMs = intervalMin * 60 * 1000
  const healthUrl = `${base}/api/health`

  const tick = async () => {
    try {
      await ping(healthUrl)
    } catch (err) {
      console.warn('[keep-alive] falhou', err)
    }
  }

  console.log(`[keep-alive] ativo: ${healthUrl} a cada ${intervalMin} min`)

  void tick()
  setInterval(() => void tick(), intervalMs)
}
