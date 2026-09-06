import { siteConfig } from '@/site.config'

export interface FriendLink {
  url: string
  name: string
  desc: string
  icon: string
}

export function getFriendLinks(): FriendLink[] {
  const list = siteConfig.friends
  return list.map((f) => {
    const rawUrl = (f.url || '').trim()
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    let host = url
    try {
      host = new URL(url).hostname.replace(/^www\./, '')
    } catch {}
    return {
      url,
      name: (f.name || '').trim() || host,
      desc: (f.desc || '').trim() || host,
      icon: (f.icon || '').trim(),
    }
  })
}
