import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL as string | undefined
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
