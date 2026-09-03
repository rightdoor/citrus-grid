import { iconSvg } from '@/lib/icons'

export type ThemeMode = 'light' | 'dark' | 'system'

function defaultMode(): ThemeMode {
  const configured = document.documentElement.dataset.defaultTheme
  return configured === 'light' || configured === 'dark' ? configured : 'system'
}

const media =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : undefined

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode
  return media?.matches ? 'dark' : 'light'
}

export const themeMode = {
  get(): ThemeMode {
    if (typeof localStorage === 'undefined') return defaultMode()
    const stored = localStorage.getItem('themeMode')
    return stored === 'light' || stored === 'dark' ? stored : defaultMode()
  },
  set(mode: ThemeMode) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('themeMode', mode)
    applyTheme(resolve(mode))
  },
}

export const resolvedTheme = { get: () => resolve(themeMode.get()) }

let transitionTimer = 0

function applyTheme(mode: 'light' | 'dark', animate = true) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const changed = root.classList.contains('dark') !== (mode === 'dark')
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
  if (animate && changed) {
    root.classList.add('is-theme-transitioning')
    clearTimeout(transitionTimer)
    transitionTimer = window.setTimeout(() => root.classList.remove('is-theme-transitioning'), 300)
  }
  syncThemeButtons(mode)
  document.dispatchEvent(new CustomEvent('theme-change', { detail: mode }))
}

function syncThemeButtons(mode: 'light' | 'dark') {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    const icon = btn.querySelector('svg')
    if (icon) {
      icon.outerHTML = iconSvg(mode === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night')
    }
  })
}

export function toggleTheme() {
  themeMode.set(resolvedTheme.get() === 'dark' ? 'light' : 'dark')
}

let initialized = false

export function initTheme() {
  if (initialized || typeof document === 'undefined') return
  initialized = true

  applyTheme(resolvedTheme.get(), false)

  media?.addEventListener('change', () => {
    if (themeMode.get() === 'system') applyTheme(media.matches ? 'dark' : 'light')
  })

  document.addEventListener('astro:after-swap', () => applyTheme(resolvedTheme.get(), false))

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-theme-toggle]')) {
      e.preventDefault()
      toggleTheme()
    }
  })
}
