import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { unified } from '@astrojs/markdown-remark'
import sitemap from '@astrojs/sitemap'
import swup from '@swup/astro'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { load as loadYaml } from 'js-yaml'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkBreaks from 'remark-breaks'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'
import { ensurePostSlugs } from './scripts/ensure-post-slugs.js'
import { generateLqips } from './scripts/generate-lqips.js'
import { rehypeCodeBlock } from './src/lib/md/rehypeCodeBlock.ts'
import { rehypeExternalLinks } from './src/lib/md/rehypeExternalLinks.ts'
import { rehypeImages } from './src/lib/md/rehypeImages.ts'
import { rehypeTableWrap } from './src/lib/md/rehypeTableWrap.ts'
import { remarkContainers } from './src/lib/md/remarkContainers.ts'

const configFile = readFileSync(
  fileURLToPath(new URL('./src/config.yaml', import.meta.url)),
  'utf-8',
)

let cfg
try {
  cfg = loadYaml(configFile) ?? {}
} catch (err) {
  // [CitrusGrid] config.yaml 不是合法的 YAML，无法启动：
  throw new Error(`[CitrusGrid] config.yaml invalid YAML, cannot start:\n${err.message}`)
}

const site =
  typeof cfg.url === 'string' && cfg.url.trim() !== ''
    ? cfg.url.trim()
    : 'https://citrusgrid.pages.dev'

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
    plugins: [tailwindcss(), ensurePostSlugs(), generateLqips()],
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
