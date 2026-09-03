import rss from '@astrojs/rss'
import { defaultLang } from '@/i18n/ui'
import { renderMarkdownHtml } from '@/lib/md/pipeline'
import { getPublishedPosts, type Post } from '@/lib/posts'
import { siteConfig } from '@/lib/siteConfig'

function absolutize(html: string, post: Post, site: string): string {
  const base = `${site.replace(/\/+$/, '')}/posts/${post.id}/`
  return html.replace(/\b(src|href)="([^"]*)"/g, (match, attr: string, url: string) => {
    if (!url || /^(?:https?:|data:|#|mailto:|\/\/)/i.test(url)) return match
    try {
      return `${attr}="${new URL(url, base).href}"`
    } catch {
      return match
    }
  })
}

export async function GET() {
  const posts = await getPublishedPosts()
  const site = siteConfig.url
  const items = await Promise.all(
    posts.map(async (post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: `/posts/${post.id}/`,
      categories: [post.data.category, ...post.data.tags],
      content: absolutize(
        await renderMarkdownHtml(post.body ?? '', { filePath: post.filePath, site }),
        post,
        site,
      ),
    })),
  )
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site,
    items,
    customData: `<language>${defaultLang}</language>`,
  })
}
