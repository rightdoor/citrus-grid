import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Nodes, Root } from 'hast'

import { resolveContentImage } from '../contentImages'
import { resolveFilePath, type VFileLike } from './vfile'

const LQIP_FILE = path.resolve(process.cwd(), '.generated/lqips.json')

let lqipCache: { mtimeMs: number; data: Record<string, string> } | null = null

function loadLqips(): Record<string, string> {
  try {
    const mtimeMs = statSync(LQIP_FILE).mtimeMs
    if (lqipCache && lqipCache.mtimeMs === mtimeMs) return lqipCache.data
    const data = JSON.parse(readFileSync(LQIP_FILE, 'utf-8')) as Record<string, string>
    lqipCache = { mtimeMs, data }
    return data
  } catch {
    return {}
  }
}

function lqipGradient(key: string): string {
  const compact = loadLqips()[key]
  if (compact?.length !== 18) return ''
  const c = (i: number) => `#${compact.slice(i, i + 6)}`
  return `linear-gradient(135deg, ${c(0)} 0%, ${c(6)} 50%, ${c(12)} 100%)`
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function transform(
  parent: { children: Nodes[] },
  filePath: string,
  state: { firstImgDone: boolean },
) {
  const children = parent.children
  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    if (node.type === 'element' && node.tagName === 'img') {
      const props = node.properties ?? {}
      const src = String(props.src ?? '')
      if (src && !src.startsWith('data:')) {
        const title = props.title != null ? String(props.title) : ''
        const alt = props.alt != null ? String(props.alt) : ''
        const finalSrc = resolveContentImage(src, filePath) || src
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
        const firstImg = !state.firstImgDone
        state.firstImgDone = true
        const loadingAttrs = firstImg
          ? ' loading="eager" fetchpriority="high"'
          : ' loading="lazy" decoding="async"'
        const img = `<img src="${escapeAttr(finalSrc)}" alt="${escapeAttr(alt)}"${titleAttr}${loadingAttrs} />`
        const lqip = lqipGradient(finalSrc)
        const styleAttr = lqip ? ` style="--img-lqip:${lqip}"` : ''
        children[i] = {
          type: 'raw',
          value: `<span class="img-frame"${styleAttr}><a class="img-lightbox" href="${escapeAttr(finalSrc)}"${titleAttr}>${img}</a></span>`,
        }
        continue
      }
    }
    if ('children' in node && Array.isArray((node as { children?: unknown }).children)) {
      transform(node as unknown as { children: Nodes[] }, filePath, state)
    }
  }
}

export function rehypeImages() {
  return (tree: Root, file: VFileLike) => {
    const filePath = resolveFilePath(file)
    if (!filePath) return
    transform(tree, filePath, { firstImgDone: false })
  }
}
