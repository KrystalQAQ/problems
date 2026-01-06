const PROBLEMS_KEY = 'practice:problems:v1'
const PROBLEMS_META_KEY = 'practice:problems_meta:v1'
const STATE_KEY = 'practice:user_problem_state:v1'
const SUBMISSIONS_KEY = 'practice:submissions:v1'

let problemsCache = null

export async function getProblems() {
  if (problemsCache) return problemsCache

  const cached = localStorage.getItem(PROBLEMS_KEY)
  if (cached) {
    problemsCache = JSON.parse(cached)
    return problemsCache
  }

  const res = await fetch('/problems.json', { cache: 'force-cache' })
  if (!res.ok) throw new Error(`加载本地题库失败：${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('本地题库格式错误：不是数组')

  localStorage.setItem(PROBLEMS_KEY, JSON.stringify(data))
  problemsCache = data
  return problemsCache
}

export function setProblems(problems) {
  if (!Array.isArray(problems)) throw new Error('setProblems: problems must be an array')
  localStorage.setItem(PROBLEMS_KEY, JSON.stringify(problems))
  problemsCache = problems
}

export function clearProblemsCache() {
  problemsCache = null
  localStorage.removeItem(PROBLEMS_KEY)
}

export function getProblemsMeta() {
  try {
    const raw = localStorage.getItem(PROBLEMS_META_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setProblemsMeta(meta) {
  localStorage.setItem(PROBLEMS_META_KEY, JSON.stringify(meta))
}

export function clearAllLocalData() {
  clearProblemsCache()
  localStorage.removeItem(PROBLEMS_META_KEY)
  localStorage.removeItem(STATE_KEY)
  localStorage.removeItem(SUBMISSIONS_KEY)
}

function loadObject(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function loadArray(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getUserStateMap() {
  const obj = loadObject(STATE_KEY)
  return obj
}

export function upsertUserState(problemId, patch) {
  const obj = loadObject(STATE_KEY)
  obj[problemId] = {
    ...(obj[problemId] ?? {}),
    ...patch,
    problem_id: problemId,
  }
  saveObject(STATE_KEY, obj)
  return obj[problemId]
}

export function getSubmissions() {
  return loadArray(SUBMISSIONS_KEY)
}

export function addSubmission(entry) {
  const arr = loadArray(SUBMISSIONS_KEY)
  arr.push(entry)
  saveArray(SUBMISSIONS_KEY, arr)
}
