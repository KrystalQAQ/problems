import { ref, watch } from 'vue'

const STORAGE_KEY = 'practice:settings:v1'

const defaults = {
  theme: 'light',
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const parsed = JSON.parse(raw)
    return {
      ...defaults,
      ...parsed,
    }
  } catch {
    return { ...defaults }
  }
}

export const settings = ref(load())

watch(
  settings,
  (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  },
  { deep: true },
)

export function setTheme(nextTheme) {
  const theme = nextTheme === 'dark' ? 'dark' : 'light'
  settings.value = { ...settings.value, theme }
}

export function resetSettings() {
  localStorage.removeItem(STORAGE_KEY)
  settings.value = { ...defaults }
}
