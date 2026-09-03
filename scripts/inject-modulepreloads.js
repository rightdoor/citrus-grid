import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIST_DIR = path.resolve(process.cwd(), 'dist')

const DEPS_RE = /__vite__mapDeps=\(i,m=__vite__mapDeps,d=\(m\.f\|\|\(m\.f=\[([^\]]*)\]\)/

function collectHtmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectHtmlFiles(full, out)
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

const depsCache = new Map()
function readDeps(chunkUrl) {
  if (depsCache.has(chunkUrl)) return depsCache.get(chunkUrl)
  let deps = []
  try {
    const code = readFileSync(path.join(DIST_DIR, chunkUrl.replace(/^\//, '')), 'utf-8')
    const m = code.match(DEPS_RE)
    if (m) deps = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => `/${x[1]}`)
  } catch {}
  depsCache.set(chunkUrl, deps)
  return deps
}

function main() {
  if (!readdirSync(DIST_DIR, { throwIfNoEntry: false })) {
    // dist/ 不存在，请先执行 astro build
    console.error('[modulepreload] dist/ not found, run astro build first')
    process.exitCode = 1
    return
  }

  const htmlFiles = collectHtmlFiles(DIST_DIR)
  let injectedFiles = 0
  let injectedLinks = 0

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8')
    const headEnd = html.indexOf('</head>')
    if (headEnd === -1) continue
    const head = html.slice(0, headEnd)

    const links = new Set()
    for (const m of head.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)) {
      for (const dep of readDeps(m[1])) links.add(dep)
    }
    const toAdd = [...links].filter((href) => !head.includes(`rel="modulepreload" href="${href}"`))
    if (toAdd.length === 0) continue

    const tags = toAdd.map((href) => `<link rel="modulepreload" href="${href}">`).join('')
    writeFileSync(file, html.slice(0, headEnd) + tags + html.slice(headEnd))
    injectedFiles++
    injectedLinks += toAdd.length
  }

  // 已注入 N 条预加载链接到 N/M 个 HTML
  console.log(
    `[modulepreload] injected ${injectedLinks} preload links into ${injectedFiles}/${htmlFiles.length} HTML files`,
  )
}

main()
