import { unified } from '@astrojs/markdown-remark'
import sitemap from '@astrojs/sitemap'
import swup from '@swup/astro'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkBreaks from 'remark-breaks'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'
import { ensurePostSlugs } from './scripts/ensure-post-slugs.js'
import { generateLqips } from './scripts/generate-lqips.js'
import { updatePostUpdated } from './scripts/update-post-updated.js'
import { rehypeCodeBlock } from './src/lib/md/rehypeCodeBlock.ts'
import { rehypeExternalLinks } from './src/lib/md/rehypeExternalLinks.ts'
import { rehypeImages } from './src/lib/md/rehypeImages.ts'
import { rehypeRelativeLinks } from './src/lib/md/rehypeRelativeLinks.ts'
import { rehypeTableWrap } from './src/lib/md/rehypeTableWrap.ts'
import { remarkContainers } from './src/lib/md/remarkContainers.ts'
import { siteConfig } from './src/site.config.ts'

const site = siteConfig.url

export default defineConfig({
  site,
  server: { host: '::' },
  preview: { host: '::' },
  build: {
    inlineStylesheets: 'always',
  },
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      gfm: true,
      smartypants: false,
      remarkRehype: { footnoteLabel: 'Footnote' },
      remarkPlugins: [remarkBreaks, remarkEmoji, remarkMath, remarkContainers],
      rehypePlugins: [
        rehypeKatex,
        rehypeCodeBlock,
        rehypeImages,
        rehypeRelativeLinks,
        rehypeTableWrap,
        [rehypeExternalLinks, { site }],
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: {
              className: ['heading-anchor'],
              tabIndex: -1,
              ariaLabel: 'Heading anchor',
            },
            content: { type: 'element', tagName: 'span', properties: {}, children: [] },
          },
        ],
      ],
    }),
  },
  integrations: [
    swup({
      theme: false,
      animationClass: 'transition-swup-',
      containers: ['#swup-container'],
      smoothScrolling: false,
      cache: true,
      preload: { hover: true, visible: true },
      accessibility: true,
      progress: true,
      updateHead: true,
      updateBodyClass: false,
      globalInstance: true,
      ignore: (url) => {
        if (url.includes('#')) return true
        const path = new URL(url, 'https://example.com').pathname
        if (/\.(xml|txt|json|pdf|zip|png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|eot)$/i.test(path))
          return true
        if (/^\/(pagefind|fonts|images)\//.test(path)) return true
        return false
      },
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss(), ensurePostSlugs(), generateLqips(), updatePostUpdated({ enabled: siteConfig.autoUpdatePostUpdated })],
    optimizeDeps: {
      include: ['photoswipe', 'photoswipe/lightbox', 'astro/virtual-modules/transitions-*.js'],
    },
    build: {
      minify: 'esbuild',
      esbuildOptions: {
        minify: true,
        drop: ['debugger'],
        pure: ['console.log', 'console.debug'],
      },
      cssCodeSplit: true,
      cssMinify: 'lightningcss',
      assetsInlineLimit: 4096,
    },
  },
})
