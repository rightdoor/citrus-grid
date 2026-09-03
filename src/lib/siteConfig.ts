import { loadConfig } from './serverConfig'

// 站点配置 config.yaml 必填项的兜底预设
const config = loadConfig()
export const siteConfig = {
  ...config,
  url: config.url || 'https://citrusgrid.pages.dev',
  title: config.title || 'CitrusGrid',
  subtitle: config.subtitle || 'A pure static Astro blog theme',
  description: config.description || '这是一个基于 Astro 架构和 CitrusGrid主题 的轻量级静态博客。',
  author: config.author || 'RightDoor',
  avatar: config.avatar || '/avatar.webp',
  logo: config.logo || '/logo.webp',
  defaultTheme: config.defaultTheme || 'auto',
  defaultLang: (config.defaultLang as 'zh' | 'ja' | 'en') || 'zh',
  postsPerPage: Number(config.postsPerPage) || 10,
  socials: config.socials ?? [],
  statsScript: String(config.statsScript || '').trim(),
  utterances: config.utterances ?? { repo: '' },
}
export type SiteConfig = typeof siteConfig
