import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pinyin } from 'pinyin-pro'

const POSTS_DIR = fileURLToPath(new URL('../src/content/posts', import.meta.url))

export function titleToSlug(title) {
  const parts = pinyin(String(title), {
    toneType: 'none',
    type: 'array',
    nonZh: 'consecutive',
    v: true,
  })
  const slug = parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'post'
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function collectMdFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectMdFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full)
  }
  return files
}

export function ensurePostSlugs() {
  return {
    name: 'ensure-post-slugs',
    buildStart() {
      const used = new Set()
      const missing = []
      for (const full of collectMdFiles(POSTS_DIR)) {
        const raw = readFileSync(full, 'utf-8')
        const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
        const slug = fm.match(/^slug:\s*['"]?([a-z0-9-]+)['"]?\s*$/m)?.[1]
        if (slug) used.add(slug)
        else missing.push(full)
      }
      for (const full of missing) {
        const raw = readFileSync(full, 'utf-8')
        const title = raw.match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1] ?? ''
        const base = titleToSlug(title)
        let slug = base
        for (let n = 1; used.has(slug); n += 1) slug = `${base}-${n}`
        if (!SLUG_RE.test(slug)) slug = 'post'
        used.add(slug)
        const eol = raw.includes('\r\n') ? '\r\n' : '\n'
        let updated
        if (/^slug:.*$/m.test(raw)) {
          updated = raw.replace(/^slug:.*$/m, `slug: ${slug}`)
        } else {
          updated = /^title:.*(?:\r?\n)/m.test(raw)
            ? raw.replace(/^title:.*(?:\r?\n)/m, (m) => `${m}slug: ${slug}${eol}`)
            : raw.replace(/^---\r?\n/, (m) => `${m}slug: ${slug}${eol}`)
        }
        writeFileSync(full, updated, 'utf-8')
        // 已补充 slug:
        console.log(`[post-slug] slug filled: ${path.relative(POSTS_DIR, full)} -> ${slug}`)
      }
    },
  }
}
