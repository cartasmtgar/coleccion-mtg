import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase] Variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no configuradas. Usando modo mock local.',
    )
    return null
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()

export const isSupabaseConfigured = supabase !== null
