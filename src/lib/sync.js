import { getSupabase } from './supabase'
import { setProblems, setProblemsMeta } from './localStore'

const SECTION_ORDER = ['单项选择题', '多项选择题', '填空题']

function makeLocalId(section, sourceNo) {
  const idx = SECTION_ORDER.indexOf(section)
  const sectionKey = (idx === -1 ? 0 : idx) + 1
  return `P${sectionKey}_${sourceNo}`
}

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
    all.push(
      ...rows.map((r) => ({
        id: makeLocalId(r.section, r.source_no),
        section: r.section,
        source_no: r.source_no,
        question_type: r.question_type,
        stem: r.stem,
        options: r.options,
        answer: r.answer,
      })),
    )
    if (rows.length < pageSize) break
    from += pageSize
  }

  setProblems(all)
  setProblemsMeta({ source: 'supabase', syncedAt: new Date().toISOString(), count: all.length })
  return all.length
}
