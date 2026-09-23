// 站点配置兜底校验：只做告警 / 报错，绝不改写传入的配置对象。
// 校验逻辑独立于 site.config.ts，配置文件里只保留 import + 调用。

const SUPPORTED_LANGS = ['zh', 'ja', 'en'] as const

// 播放列表条目的必需字段
const REQUIRED_TRACK_FIELDS = ['title', 'src'] as const

// 宽松的结构化入参：字段被临时删除 / 写错类型时仍能通过编译
export interface ValidatableSiteConfig {
  nav?: unknown
  defaultLang?: unknown
  musicPlayer?: { enabled?: unknown; playlist?: unknown } | null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * 站点配置兜底校验（纯告警 / 报错，不修改配置）。
 * Site config guard: warn / throw only, never mutate the config object.
 */
export function validateSiteConfig(config: ValidatableSiteConfig): void {
  // nav：缺失或非字符串数组都视为无效配置（消费方回退为空数组，顶栏仅剩「首页」）
  if (!isStringArray(config.nav)) {
    // 中文：`nav` 必须是字符串数组，当前取值已被忽略，顶栏将回退为仅「首页」一项。
    console.warn(
      '[site.config] `nav` must be an array of strings; the value was ignored and the header falls back to the home item only.',
    )
  }

  // defaultLang：非法值直接抛错，避免路由与词条错位
  if (!SUPPORTED_LANGS.includes(config.defaultLang as (typeof SUPPORTED_LANGS)[number])) {
    // 中文：`defaultLang` 只能是 "zh" / "ja" / "en" 之一。
    throw new Error(
      `[site.config] \`defaultLang\` must be one of "zh" / "ja" / "en", received ${JSON.stringify(config.defaultLang)}.`,
    )
  }

  // musicPlayer：仅在启用时校验必需字段完整性
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
