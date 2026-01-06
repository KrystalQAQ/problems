import { computed, ref } from 'vue'
import { getSupabase, hasSupabaseConfig } from './supabase'

const sessionRef = ref(null)
const initedRef = ref(false)

export const session = computed(() => sessionRef.value)
export const user = computed(() => sessionRef.value?.user ?? null)

export async function initSession() {
  if (initedRef.value) return
  initedRef.value = true

  if (!hasSupabaseConfig()) {
    sessionRef.value = null
    return
  }

  const supabase = getSupabase()
  const { data } = await supabase.auth.getSession()
  sessionRef.value = data.session

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    sessionRef.value = nextSession
  })
}

export async function getUser() {
  if (!initedRef.value) await initSession()
  if (!hasSupabaseConfig()) return null
  const supabase = getSupabase()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function signInWithPassword({ email, password }) {
  await initSession()
  const supabase = getSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp({ email, password }) {
  await initSession()
  const supabase = getSupabase()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function signOut() {
  await initSession()
  if (!hasSupabaseConfig()) return
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
