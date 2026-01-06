import { addSubmission, getProblems, getSubmissions, getUserStateMap, upsertUserState } from './localStore'

const SECTION_ORDER = ['单项选择题', '多项选择题', '填空题']

function sectionIndex(section) {
  const idx = SECTION_ORDER.indexOf(section)
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

function typeLabelToEnum(section) {
  if (section.includes('多项')) return 'multiple_choice'
  if (section.includes('填空')) return 'fill_blank'
  return 'single_choice'
}

export async function fetchProblems({ section, query, page, pageSize }) {
  const all = await getProblems()
  const q = (query ?? '').trim()

  let filtered = all

  if (section && section !== 'all') filtered = filtered.filter((p) => p.section === section)
  if (q) filtered = filtered.filter((p) => (p.stem ?? '').includes(q))

  filtered = [...filtered].sort((a, b) => {
    const sa = sectionIndex(a.section)
    const sb = sectionIndex(b.section)
    if (sa !== sb) return sa - sb
    return (a.source_no ?? 0) - (b.source_no ?? 0)
  })

  const total = filtered.length
  const from = (page - 1) * pageSize
  const rows = filtered.slice(from, from + pageSize).map((p) => ({
    id: p.id,
    section: p.section,
    source_no: p.source_no,
    question_type: p.question_type ?? typeLabelToEnum(p.section),
    stem: p.stem,
  }))

  return { rows, total }
}

export async function fetchProblem(id) {
  const all = await getProblems()
  const p = all.find((x) => x.id === id)
  if (!p) throw new Error('题目不存在')
  return p
}

export async function fetchUserStates(problemIds) {
  const stateObj = getUserStateMap()
  const map = new Map()
  for (const id of problemIds) {
    if (stateObj[id]) map.set(id, stateObj[id])
  }
  return map
}

export async function submitAnswer({ problemId, answer, isCorrect }) {
  const now = new Date().toISOString()
  addSubmission({ problem_id: problemId, answer, is_correct: isCorrect, created_at: now })
  upsertUserState(problemId, {
    last_answer: answer,
    last_is_correct: isCorrect,
    last_answered_at: now,
    updated_at: now,
  })
}

export async function toggleFavorite({ problemId, nextValue }) {
  upsertUserState(problemId, { is_favorite: !!nextValue, updated_at: new Date().toISOString() })
}

export async function fetchAdjacentProblemId({ section, sourceNo, direction }) {
  const all = await getProblems()
  const ordered = [...all].sort((a, b) => {
    const sa = sectionIndex(a.section)
    const sb = sectionIndex(b.section)
    if (sa !== sb) return sa - sb
    return (a.source_no ?? 0) - (b.source_no ?? 0)
  })

  const idx = ordered.findIndex((p) => p.section === section && p.source_no === sourceNo)
  if (idx === -1) return null
  const nextIndex = direction === 'prev' ? idx - 1 : idx + 1
  return ordered[nextIndex]?.id ?? null
}

export async function fetchFavorites() {
  const all = await getProblems()
  const stateObj = getUserStateMap()
  const ids = Object.keys(stateObj).filter((id) => stateObj[id]?.is_favorite)
  const set = new Set(ids)
  const rows = all.filter((p) => set.has(p.id))
  rows.sort((a, b) => {
    const ta = stateObj[a.id]?.updated_at ?? ''
    const tb = stateObj[b.id]?.updated_at ?? ''
    return tb.localeCompare(ta)
  })
  return rows
}

export async function fetchWrong() {
  const all = await getProblems()
  const stateObj = getUserStateMap()
  const ids = Object.keys(stateObj).filter((id) => stateObj[id]?.last_is_correct === false)
  const set = new Set(ids)
  const rows = all.filter((p) => set.has(p.id))
  rows.sort((a, b) => {
    const ta = stateObj[a.id]?.last_answered_at ?? ''
    const tb = stateObj[b.id]?.last_answered_at ?? ''
    return tb.localeCompare(ta)
  })
  return rows
}

export async function fetchStats() {
  const subs = getSubmissions()
  const stateObj = getUserStateMap()

  const total = subs.length
  const correct = subs.filter((s) => s.is_correct === true).length
  const wrongActive = Object.values(stateObj).filter((s) => s?.last_is_correct === false).length
  const favorites = Object.values(stateObj).filter((s) => s?.is_favorite === true).length

  return { total, correct, wrongActive, favorites }
}

