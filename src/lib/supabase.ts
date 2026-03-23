import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretApiKey = process.env.SUPABASE_SECRET_API_KEY
  if (!url || !secretApiKey) {
    throw new Error('Supabase environment variables are not configured.')
  }
  return createClient(url, secretApiKey)
}
