// ============================================================
// 统计插件：visitor-stats（Cloudflare Worker 统计服务示例实现）
// 接口契约详见同目录《使用规则.md》
// 启用方式：config.yaml 中 statsScript: 'visitor-stats'
// ====================================================

interface SiteTotalResponse {
  siteTotal: number
  siteUnique: number
  siteLastUpdated: number
}

interface PageStatsResponse {
  path: string
  articleTotal: number
  articleUnique: number
  articleLastUpdated: number
  siteTotal: number
  siteUnique: number
  siteLastUpdated: number
}

const STATS_BASE = ''

// 统计服务 API 密钥，不用担心泄露， worker 增加域名识别，仅在当前域名下有效
const STATS_API_KEY = ''

interface RealtimeStatsResponse {
  total: number
  unique: number
  period: 'today'
  path?: string
}

async function fetchStats<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`请求失败 (${res.status}): ${(data as { error?: string }).error ?? 'unknown'}`)
  }
  return data as T
}

export function trackVisit(path: string = location.pathname): void {
  fetch(`${STATS_BASE}/log?path=${encodeURIComponent(path)}`, {
    keepalive: true,
    referrerPolicy: 'no-referrer-when-downgrade',
  }).catch(() => {
    /* 埋点失败静默，不影响页面 */
  })
}

export function getSiteTotal(): Promise<SiteTotalResponse> {
  return fetchStats<SiteTotalResponse>(`${STATS_BASE}/total`)
}

export function getArticleStats(path: string): Promise<PageStatsResponse> {
  const params = new URLSearchParams({ path })
  return fetchStats<PageStatsResponse>(`${STATS_BASE}/page-stats?${params}`)
}

export async function getRealtimeStats(
  opts: { path?: string; period?: 'today' | 'all' } = {},
): Promise<RealtimeStatsResponse> {
  if (!STATS_API_KEY) {
    throw new Error('未配置 STATS_API_KEY，/stats 接口需要 Authorization: Bearer <API_KEY> 鉴权')
  }
  const params = new URLSearchParams({ period: opts.period ?? 'today' })
  if (opts.path) params.set('path', opts.path)
  const res = await fetch(`${STATS_BASE}/stats?${params}`, {
    headers: { Authorization: `Bearer ${STATS_API_KEY}` },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`请求失败 (${res.status}): ${(data as { error?: string }).error ?? 'unknown'}`)
  }
  return data as RealtimeStatsResponse
}
