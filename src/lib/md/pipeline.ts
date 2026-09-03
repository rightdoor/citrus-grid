import { pathToFileURL } from 'node:url'
import type { Options as AutolinkOptions } from 'rehype-autolink-headings'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkBreaks from 'remark-breaks'
import remarkEmoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { rehypeCodeBlock } from './rehypeCodeBlock'
import { rehypeExternalLinks } from './rehypeExternalLinks'
import { rehypeImages } from './rehypeImages'
import { rehypeTableWrap } from './rehypeTableWrap'
import { remarkContainers } from './remarkContainers'

export interface RenderOptions {
  filePath?: string
  site: string
}

export async function renderMarkdownHtml(source: string, options: RenderOptions): Promise<string> {
  const proc = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkEmoji)
    .use(remarkMath)
    .use(remarkContainers)
    .use(remarkRehype, { allowDangerousHtml: true, footnoteLabel: '脚注' })
    .use(rehypeKatex)
    .use(rehypeCodeBlock)
    .use(rehypeImages)
    .use(rehypeTableWrap)
    .use(rehypeExternalLinks, { site: options.site })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['heading-anchor'], tabIndex: -1, ariaLabel: '标题锚点' },
      content: { type: 'element', tagName: 'span', properties: {}, children: [] },
    } satisfies AutolinkOptions)
    .use(rehypeRaw)
    .use(rehypeStringify, { allowDangerousHtml: true })
  const file = options.filePath
    ? { value: source, path: pathToFileURL(options.filePath).href }
    : { value: source }
  const result = await proc.process(file as never)
  return String(result)
}
