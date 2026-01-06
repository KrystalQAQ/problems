import { getSupabase } from './supabase'
import { setProblems, setProblemsMeta } from './localStore'

export async function syncProblemsFromSupabase() {
  const supabase = getSupabase()

  const pageSize = 1000
  let from = 0
  /** @type {any[]} */
  const all = []

  // Keep fetching until no more rows (small dataset, but safe).
  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('problems')
      .select('id, section, source_no, question_type, stem, options, answer')
      .order('section', { ascending: true })
      .order('source_no', { ascending: true })
      .range(from, to)

    if (error) throw error
    const rows = data ?? []
    all.push(...rows)
    if (rows.length < pageSize) break
    from += pageSize
  }

  setProblems(all)
  setProblemsMeta({ source: 'supabase', syncedAt: new Date().toISOString(), count: all.length })
  return all.length
}

