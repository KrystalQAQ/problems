import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = "https://epurcyqqnbrfhdyvhfrj.supabase.co"
const supabaseAnonKey = "sb_publishable_mKMab6HC3ILKr8b0BH22Yw_2ga8KZdj"
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

