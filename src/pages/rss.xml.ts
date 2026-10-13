import { render } from 'astro:content'
import mdxRenderer from '@astrojs/mdx/server.js'
import rss from '@astrojs/rss'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { defaultLang } from '@/i18n/ui'
import { renderMarkdownHtml } from '@/lib/md/pipeline'
import { getPublishedPosts, type Post } from '@/lib/posts'
import { siteConfig } from '@/site.config'

let mdxContainer: AstroContainer | null = null

async function getMdxContainer(): Promise<AstroContainer> {
  if (!mdxContainer) {
    const container = await AstroContainer.create()
    container.addServerRenderer({ name: 'astro:jsx', renderer: mdxRenderer })
    mdxContainer = container
  }
  return mdxContainer
}

async function renderContent(post: Post, site: string): Promise<string> {
  if (/\.mdx$/i.test(post.filePath ?? '')) {
    try {
      const { Content } = await render(post)
      const container = await getMdxContainer()
      return await container.renderToString(Content)
    } catch (err) {
      console.warn(`[rss] MDX 渲染失败，回退为源码直出：${post.id}`, err)
    }
  }
  return renderMarkdownHtml(post.body ?? '', { filePath: post.filePath, site })
}

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
      content: absolutize(await renderContent(post, site), post, site),
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
