import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
console.log(import.meta.env)
let client = null

export function hasSupabaseConfig() {
  return !!(supabaseUrl && supabaseAnonKey)
}

export function getSupabase() {
  if (!hasSupabaseConfig()) {
    throw new Error('未配置 Supabase：请设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY')
  }
  if (!client) client = createClient(supabaseUrl, supabaseAnonKey)
  return client
}

