import { loadConfig } from '@/lib/serverConfig'
import en from './en.json'
import ja from './ja.json'
import zh from './zh.json'

export type Lang = 'zh' | 'ja' | 'en'

export const langs: Lang[] = ['zh', 'ja', 'en']
export const defaultLang: Lang = (loadConfig().defaultLang as Lang) || 'zh'

const messages: Record<Lang, Record<string, unknown>> = { zh, ja, en }

export function getLangFromUrl(url: URL): Lang {
  const [, seg] = url.pathname.split('/')
  if (langs.includes(seg as Lang) && seg !== defaultLang) return seg as Lang
  if (langs.includes(seg as Lang)) return seg as Lang
  return defaultLang
}

export function localePath(lang: Lang, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const last = p.slice(p.lastIndexOf('/') + 1)
  const isFile = last.includes('.')
  const withSlash = p.length > 1 && !p.endsWith('/') && !isFile ? `${p}/` : p
  return lang === defaultLang ? withSlash : `/${lang}${withSlash === '/' ? '' : withSlash}`
}

export function useTranslations(lang: Lang) {
  return function t(key: string, params?: Record<string, string | number>): string {
    const value = key
      .split('.')
      .reduce<unknown>(
        (acc, k) =>
          acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined,
        messages[lang],
      )
    let text = typeof value === 'string' ? value : key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v))
      }
    }
    return text
  }
}
