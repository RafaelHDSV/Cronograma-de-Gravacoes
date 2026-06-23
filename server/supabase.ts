import { createClient, type PostgrestError } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !key) {
  throw new Error(
    'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env (veja docs/supabase-setup.md)',
  )
}

if (!url.includes('.supabase.co')) {
  throw new Error(
    'SUPABASE_URL invalida. Use a Project URL de Settings -> API (ex.: https://xxxx.supabase.co)',
  )
}

if (!key.startsWith('eyJ') || key.length < 80) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY invalida (curta ou nao e JWT). Em Settings -> API copie a chave service_role secreta (comeca com eyJ...), nao a anon/publishable.',
  )
}

const jwtRole = readJwtRole(key)
if (jwtRole !== 'service_role') {
  throw new Error(
    `SUPABASE_SERVICE_ROLE_KEY e chave "${jwtRole ?? 'desconhecida'}", nao service_role. Em Settings -> API use a secret key "service_role", nao anon/publishable.`,
  )
}

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export function formatSupabaseError(context: string, error: PostgrestError | null): string {
  if (!error) return `${context}: erro desconhecido`
  const parts = [error.message, error.details, error.hint, error.code].filter(Boolean)
  const detail = parts.length > 0 ? parts.join(' | ') : JSON.stringify(error)
  return `${context}: ${detail}`
}

/** Tabela ausente no Postgres (42P01) ou no cache do PostgREST (PGRST205). */
export function isMissingTableError(error: PostgrestError | null): boolean {
  if (!error) return false
  const msg = error.message ?? ''
  if (error.code === '42P01' || error.code === 'PGRST205') return true
  return msg.includes('does not exist') || msg.includes('Could not find the table')
}

function readJwtRole(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(padded, 'base64').toString('utf8')
    const data = JSON.parse(json) as { role?: string }
    return data.role ?? null
  } catch {
    return null
  }
}
