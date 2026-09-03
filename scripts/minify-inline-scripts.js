import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { transformSync } from 'esbuild'

const DIST_DIR = path.resolve(process.cwd(), 'dist')

const SCRIPT_RE = /<script([^>]*)>([\s\S]*?)<\/script>/gi

const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module'])

function shouldMinify(attrs) {
  if (/\ssrc\s*=/i.test(attrs)) return false
  const typeMatch = attrs.match(/\stype\s*=\s*["']?([^"'\s>]*)/i)
  const type = (typeMatch?.[1] ?? '').toLowerCase()
  return JS_TYPES.has(type)
}

function minifyInline(code, file) {
  if (!code.trim()) return code
  try {
    const result = transformSync(code, {
      loader: 'js',
      target: 'es2018',
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false,
    })
    if (/<\/script/i.test(result.code)) return code
    return result.code
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // 跳过一段脚本（file）
    console.warn(`[minify-inline] skipped a script (${file}): ${message}`)
    return code
  }
}

function collectHtmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectHtmlFiles(full, out)
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

function main() {
  if (!statSync(DIST_DIR, { throwIfNoEntry: false })) {
    // dist/ 不存在，请先执行 astro build
    console.error('[minify-inline] dist/ not found, run astro build first')
    process.exitCode = 1
    return
  }

  // 压缩 dist/ 内联脚本 ...
  console.log('[minify-inline] minifying inline scripts in dist/ ...')

  const htmlFiles = collectHtmlFiles(DIST_DIR)
  let savedBytes = 0
  let touchedFiles = 0
  let scriptCount = 0

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8')
    let fileSaved = 0

    const output = html.replace(SCRIPT_RE, (whole, attrs, code) => {
      if (!shouldMinify(attrs)) return whole
      const minified = minifyInline(code, file)
      if (minified === code) return whole
      scriptCount++
      fileSaved += Buffer.byteLength(code, 'utf-8') - Buffer.byteLength(minified, 'utf-8')
      return `<script${attrs}>${minified}</script>`
    })

    if (output !== html) {
      writeFileSync(file, output)
      savedBytes += fileSaved
      touchedFiles++
    }
  }

  const savedKiB = (savedBytes / 1024).toFixed(1)
  // 已压缩 N 段内联脚本（N/M 个 HTML），节省 N KiB
  console.log(
    `[minify-inline] minified ${scriptCount} inline scripts (${touchedFiles}/${htmlFiles.length} HTML files), saved ${savedKiB} KiB`,
  )
}

main()
