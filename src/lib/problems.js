import { supabase } from './supabase'
import { getUser } from './session'

const SECTION_ORDER = ['单项选择题', '多项选择题', '填空题']

function sectionIndex(section) {
  const idx = SECTION_ORDER.indexOf(section)
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

export async function fetchProblems({ section, query, page, pageSize }) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = supabase
    .from('problems')
    .select('id, section, source_no, question_type, stem', { count: 'exact' })
    .order('section', { ascending: true })
    .order('source_no', { ascending: true })
    .range(from, to)

  if (section && section !== 'all') q = q.eq('section', section)
  if (query?.trim()) q = q.ilike('stem', `%${query.trim()}%`)

  const { data, error, count } = await q
  if (error) throw error

  return { rows: data ?? [], total: count ?? 0 }
}

export async function fetchProblem(id) {
  const { data, error } = await supabase
    .from('problems')
    .select('id, section, source_no, question_type, stem, options, answer')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchAdjacentProblemId({ section, sourceNo, direction }) {
  const dir = direction === 'prev' ? 'prev' : 'next'

  if (!section || !Number.isFinite(sourceNo)) return null

  const within = supabase
    .from('problems')
    .select('id, source_no')
    .eq('section', section)

  const withinQuery =
    dir === 'next'
      ? within.gt('source_no', sourceNo).order('source_no', { ascending: true }).limit(1)
      : within.lt('source_no', sourceNo).order('source_no', { ascending: false }).limit(1)

  const { data: withinData, error: withinError } = await withinQuery
  if (withinError) throw withinError
  if (withinData?.[0]?.id) return withinData[0].id

  const idx = sectionIndex(section)
  if (!Number.isFinite(idx) || idx === Number.MAX_SAFE_INTEGER) return null

  const otherSection = dir === 'next' ? SECTION_ORDER[idx + 1] : SECTION_ORDER[idx - 1]
  if (!otherSection) return null

  const otherQuery = supabase
    .from('problems')
    .select('id, source_no')
    .eq('section', otherSection)
    .order('source_no', { ascending: dir === 'next' })
    .limit(1)

  const { data: otherData, error: otherError } = await otherQuery
  if (otherError) throw otherError
  return otherData?.[0]?.id ?? null
}

export async function fetchUserStates(problemIds) {
  const user = await getUser()
  if (!user) return new Map()
  if (!problemIds.length) return new Map()

  const { data, error } = await supabase
    .from('user_problem_state')
    .select('problem_id, is_favorite, last_is_correct, last_answered_at')
    .in('problem_id', problemIds)

  if (error) throw error
  const map = new Map()
  for (const row of data ?? []) map.set(row.problem_id, row)
  return map
}

export async function submitAnswer({ problemId, answer, isCorrect }) {
  const user = await getUser()
  if (!user) throw new Error('请先登录后再提交答案')

  const now = new Date().toISOString()

  const { error: submissionError } = await supabase.from('submissions').insert({
    user_id: user.id,
    problem_id: problemId,
    answer,
    is_correct: isCorrect,
  })
  if (submissionError) throw submissionError

  const { error: stateError } = await supabase.from('user_problem_state').upsert(
    {
      user_id: user.id,
      problem_id: problemId,
      last_answer: answer,
      last_is_correct: isCorrect,
      last_answered_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id,problem_id' },
  )
  if (stateError) throw stateError
}

export async function toggleFavorite({ problemId, nextValue }) {
  const user = await getUser()
  if (!user) throw new Error('请先登录后再收藏')

  const { error } = await supabase.from('user_problem_state').upsert(
    {
      user_id: user.id,
      problem_id: problemId,
      is_favorite: !!nextValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,problem_id' },
  )
  if (error) throw error
}
