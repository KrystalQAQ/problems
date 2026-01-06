import { watch } from 'vue'
import { settings } from './settings'

export function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.theme = t
}

export function initTheme() {
  applyTheme(settings.value.theme)
  watch(
    () => settings.value.theme,
    (t) => applyTheme(t),
  )
}

