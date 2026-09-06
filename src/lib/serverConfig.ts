import { readFileSync } from 'node:fs'
import path from 'node:path'
import { load as loadYaml } from 'js-yaml'

export interface RawConfig {
  url?: string
  title?: string
  subtitle?: string
  description?: string
  avatar?: string
  logo?: string
  author?: string
  defaultLang?: string
  defaultTheme?: string
  postsPerPage?: number
  socials?: Array<{ platform: string; url: string }>
  statsScript?: string
  friends?: Array<{ url: string; name?: string; desc?: string; icon?: string }>
  commentScript?: string
  [key: string]: unknown
}

const configFile = path.resolve(process.cwd(), 'src/config.yaml')

let cached: RawConfig | null = null

export function loadConfig(): RawConfig {
  if (!cached) {
    cached = (loadYaml(readFileSync(configFile, 'utf-8')) ?? {}) as RawConfig
  }
  return cached
}
