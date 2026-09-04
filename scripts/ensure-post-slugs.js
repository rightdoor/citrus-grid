import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pinyin } from 'pinyin-pro'

const THIS_FILE = fileURLToPath(import.meta.url)
const CONTENT_ROOT = path.join(path.dirname(THIS_FILE), '..', 'src', 'content')
const POSTS_DIR = path.join(CONTENT_ROOT, 'posts')
const INDEX_FILE = path.join(path.dirname(THIS_FILE), '..', '.generated', 'post-index.json')
mkdirSync(path.dirname(INDEX_FILE), { recursive: true })

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

function parseFrontmatter(raw) {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  return {
    title: fm.match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1] ?? '',
    slug: fm.match(/^slug:\s*['"]?([a-z0-9-]+)['"]?\s*$/m)?.[1],
    draft: /^draft:\s*true\s*$/m.test(fm),
  }
}

export function ensurePostSlugs() {
  return {
    name: 'ensure-post-slugs',
    buildStart() {
      const records = []
      const used = new Set()
      for (const full of collectMdFiles(POSTS_DIR)) {
        const raw = readFileSync(full, 'utf-8')
        const fm = parseFrontmatter(raw)
        records.push({
          full,
          rel: path.relative(CONTENT_ROOT, full).split(path.sep).join('/'),
          raw,
          title: fm.title,
          slug: fm.slug,
          draft: fm.draft,
        })
        if (fm.slug) used.add(fm.slug)
      }

      for (const rec of records) {
        if (rec.slug) continue
        const base = titleToSlug(rec.title)
        let slug = base
        for (let n = 1; used.has(slug); n += 1) slug = `${base}-${n}`
        if (!SLUG_RE.test(slug)) slug = 'post'
        while (used.has(slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`
        used.add(slug)
        rec.slug = slug

        const raw = rec.raw
        const eol = raw.includes('\r\n') ? '\r\n' : '\n'
        let updated
        if (/^slug:.*$/m.test(raw)) {
          updated = raw.replace(/^slug:.*$/m, `slug: ${slug}`)
        } else {
          updated = /^title:.*(?:\r?\n)/m.test(raw)
            ? raw.replace(/^title:.*(?:\r?\n)/m, (m) => `${m}slug: ${slug}${eol}`)
            : raw.replace(/^---\r?\n/, (m) => `${m}slug: ${slug}${eol}`)
        }
        writeFileSync(rec.full, updated, 'utf-8')
        console.log(`[post-slug] slug filled: ${path.relative(POSTS_DIR, rec.full)} -> ${slug}`)
      }

      const index = records
        .map(({ rel, slug, draft }) => ({ file: rel, slug, draft }))
        .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
      const next = `${JSON.stringify(index, null, 2)}\n`
      if (!existsSync(INDEX_FILE) || readFileSync(INDEX_FILE, 'utf-8') !== next) {
        writeFileSync(INDEX_FILE, next, 'utf-8')
        console.log(`[post-slug] post-index written: ${index.length} entries`)
      }
    },
  }
}
