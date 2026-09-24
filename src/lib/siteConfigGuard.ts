const SUPPORTED_LANGS = ['zh', 'ja', 'en'] as const

const REQUIRED_TRACK_FIELDS = ['title', 'src'] as const

export interface ValidatableSiteConfig {
  nav?: unknown
  defaultLang?: unknown
  musicPlayer?: { enabled?: unknown; playlist?: unknown } | null
  pet?: { enabled?: unknown } | null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function validateSiteConfig(config: ValidatableSiteConfig): void {
  if (!isStringArray(config.nav)) {
    // 中文：`nav` 必须是字符串数组，当前取值已被忽略，顶栏将回退为仅「首页」一项。
    console.warn(
      '[site.config] `nav` must be an array of strings; the value was ignored and the header falls back to the home item only.',
    )
  }

  if (!SUPPORTED_LANGS.includes(config.defaultLang as (typeof SUPPORTED_LANGS)[number])) {
    // 中文：`defaultLang` 只能是 "zh" / "ja" / "en" 之一。
    throw new Error(
      `[site.config] \`defaultLang\` must be one of "zh" / "ja" / "en", received ${JSON.stringify(config.defaultLang)}.`,
    )
  }

  validatePet(config)
  validateMusicPlayer(config)
}

function validatePet(config: ValidatableSiteConfig): void {
  const pet = config.pet
  if (pet && typeof pet.enabled === 'boolean') return
  // 中文：`pet.enabled` 必须是布尔值，缺失或其它取值会让左下角宠物按关闭处理。
  console.warn(
    '[site.config] `pet.enabled` must be a boolean; the pet widget is treated as disabled.',
  )
}

function validateMusicPlayer(config: ValidatableSiteConfig): void {
  const player = config.musicPlayer
  if (!player?.enabled) return

  if (!Array.isArray(player.playlist)) {
    // 中文：`musicPlayer.playlist` 必须是数组。
    console.warn('[site.config] `musicPlayer.playlist` must be an array.')
    return
  }

  const playlist = player.playlist as unknown[]
  playlist.forEach((track, i) => {
    const record = track as Record<string, unknown> | null
    const missing = REQUIRED_TRACK_FIELDS.filter((key) => !record?.[key])
    if (missing.length === 0) return
    // 中文：`musicPlayer.playlist[i]` 缺少必需字段：title / src。
    console.warn(
      `[site.config] \`musicPlayer.playlist[${i}]\` is missing required field(s): ${missing.join(' / ')}.`,
    )
  })
}
