/** Supabase table names — shared project with Dailier (prefix: cronograma_). */
const prefix = validatePrefix(process.env.DB_TABLE_PREFIX ?? 'cronograma')

function validatePrefix(value: string): string {
  if (!/^[a-z][a-z0-9_]{0,31}$/.test(value)) {
    throw new Error(`Invalid DB_TABLE_PREFIX: ${value}`)
  }
  return value
}

export const tables = {
  sessions: `${prefix}_sessions`,
} as const
