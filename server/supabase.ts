import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url?.trim() || !key?.trim()) {
  throw new Error(
    'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env (veja docs/supabase-setup.md)',
  )
}

export const supabase = createClient(url, key)
