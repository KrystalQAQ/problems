const KEY = 'practice:nav_session:v1'

export function setNavSession({ ids, label }) {
  if (!Array.isArray(ids) || ids.length === 0) {
    localStorage.removeItem(KEY)
    return
  }
  const payload = {
    ids,
    label: label ?? null,
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(KEY, JSON.stringify(payload))
}

export function getNavSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.ids)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearNavSession() {
  localStorage.removeItem(KEY)
}

export function getPrevNextFromSession(currentId) {
  const session = getNavSession()
  if (!session?.ids?.length) return { prevId: null, nextId: null, label: null, inSession: false }

  const idx = session.ids.indexOf(currentId)
  if (idx === -1) return { prevId: null, nextId: null, label: session.label ?? null, inSession: false }

  return {
    prevId: session.ids[idx - 1] ?? null,
    nextId: session.ids[idx + 1] ?? null,
    label: session.label ?? null,
    inSession: true,
  }
}
