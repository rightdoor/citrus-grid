import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Nodes, Root } from 'hast'

import {
  isContentImageFile,
  isInContentDir,
  isRelativeSrc,
  resolveContentImage,
  resolveContentPath,
} from '../contentImages'
import { resolveFilePath, type VFileLike } from './vfile'

const INDEX_FILE = path.resolve(process.cwd(), '.generated/post-index.json')
const MD_EXT = /\.(md|markdown)$/i
const RAW_HREF_RE = /\bhref=(["'])(.*?)\1/g

interface PostIndexEntry {
  file: string
  slug: string
  draft: boolean
}

let indexCache: { mtimeMs: number; map: Map<string, PostIndexEntry> } | null = null

function loadPostIndex(): Map<string, PostIndexEntry> {
  try {
    const mtimeMs = statSync(INDEX_FILE).mtimeMs
    if (indexCache && indexCache.mtimeMs === mtimeMs) return indexCache.map
    const data = JSON.parse(readFileSync(INDEX_FILE, 'utf-8')) as PostIndexEntry[]
    const map = new Map<string, PostIndexEntry>()
    for (const entry of data) {
      if (entry?.file && entry.slug) map.set(entry.file, entry)
    }
    indexCache = { mtimeMs, map }
    return map
  } catch {
    return new Map()
  }
}

function readSlugFromFile(contentRel: string): string | null {
  try {
    const raw = readFileSync(path.join(process.cwd(), 'src', 'content', contentRel), 'utf-8')
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
    return fm.match(/^slug:\s*['"]?([a-z0-9-]+)['"]?\s*$/m)?.[1] ?? null
  } catch {
    return null
  }
}

function warn(message: string, filePath: string, href: string) {
  const rel = filePath.split(path.sep).join('/')
  const at = rel.includes('src/content/') ? rel.slice(rel.indexOf('src/content/')) : rel
  console.warn(`[rel-link] ${message}: "${href}" (${at})`)
}

function resolveHref(href: string, filePath: string): string | null {
  if (!href || !isRelativeSrc(href)) return null

  const suffixMatch = href.match(/[?#]/)
  let pathPart = href
  let suffix = ''
  if (suffixMatch && suffixMatch.index != null) {
    pathPart = href.slice(0, suffixMatch.index)
    suffix = href.slice(suffixMatch.index)
  }

  const contentRel = resolveContentPath(pathPart, filePath)
  if (!contentRel) {
    warn('relative link escapes src/content/, kept as-is', filePath, href)
    return null
  }

  const index = loadPostIndex()
  const entry = index.get(contentRel)
  if (entry || MD_EXT.test(contentRel)) {
    const slug = entry?.slug ?? readSlugFromFile(contentRel)
    if (slug) {
      if (entry?.draft && process.env.NODE_ENV === 'production') {
        warn('links to a draft post which is not built in production', filePath, href)
      }
      return `/posts/${slug}/${suffix}`
    }
    warn('target post not found, kept as-is', filePath, href)
    return null
  }

  if (isContentImageFile(contentRel)) {
    const image = resolveContentImage(pathPart, filePath)
    if (image) return `${image}${suffix}`
  }

  warn('unsupported relative link target, kept as-is', filePath, href)
  return null
}

function transform(parent: { children: Nodes[] }, filePath: string) {
  for (const node of parent.children) {
    if (node.type === 'element' && node.tagName === 'a') {
      const href = String(node.properties?.href ?? '')
      const resolved = resolveHref(href, filePath)
      if (resolved) node.properties.href = resolved
    } else if (
      node.type === 'raw' &&
      typeof node.value === 'string' &&
      node.value.includes('href=')
    ) {
      node.value = node.value.replace(RAW_HREF_RE, (whole, quote: string, url: string) => {
        const resolved = resolveHref(url, filePath)
        return resolved ? `href=${quote}${resolved}${quote}` : whole
      })
    }
    if ('children' in node && Array.isArray((node as { children?: unknown }).children)) {
      transform(node as unknown as { children: Nodes[] }, filePath)
    }
  }
}

export function rehypeRelativeLinks() {
  return (tree: Root, file: VFileLike) => {
    const filePath = resolveFilePath(file)
    if (!filePath || !isInContentDir(filePath)) return
    transform(tree, filePath)
  }
}
