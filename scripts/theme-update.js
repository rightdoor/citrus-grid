import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'

// 主题升级脚本：把上游（GitHub 仓库的 main 分支）的新版本合并进当前站点仓库。
//
// 冲突自动处理规则（契约详见仓库根目录 UPGRADING.md）：
// - 用户层（site.config / content / public / comments / stats / styles / i18n）
//   发生冲突时一律保留用户版本，并在报告中列出上游改动供人工过目；
// - 只读层（components / layouts / lib / pages / 等主题代码）用户也改过时，
//   保留冲突交由人工合并，脚本不擅自取舍。
//
// 用法：
//   pnpm theme:update            # 预演（默认）：只输出报告，不动工作区
//   pnpm theme:update --apply    # 实际执行合并并自动解决用户层冲突
//   pnpm theme:update --remote <name> --branch <name>

const DEFAULT_REMOTE = 'origin'
const DEFAULT_BRANCH = 'main'
const SITE_CONFIG = 'src/site.config.ts'
const LIST_CAP = 40

// 用户层白名单：冲突时保留用户版本。其余路径都是只读层（主题代码）。
const USER_LAYER_GLOBS = [
  'src/site.config.ts',
  'src/content/posts/**',
  'public/**',
  'src/comments/**',
  'src/stats/**',
  'src/styles/**',
  'src/i18n/**',
]

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const help = args.includes('--help') || args.includes('-h')
const remoteIdx = args.indexOf('--remote')
const branchIdx = args.indexOf('--branch')
const remote = remoteIdx !== -1 ? args[remoteIdx + 1] : DEFAULT_REMOTE
const branch = branchIdx !== -1 ? args[branchIdx + 1] : DEFAULT_BRANCH

const PREFIX = '[theme:update]'

function fail(message, code = 1) {
  console.error(`${PREFIX} ${message}`)
  process.exit(code)
}

function git(repoArgs, options = {}) {
  // core.quotepath=off：非 ASCII 文件名（中文文档等）按原样输出，保证路径分类与冲突解决可用
  return execFileSync('git', ['-c', 'core.quotepath=off', ...repoArgs], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  })
}

function gitOk(repoArgs) {
  try {
    git(repoArgs)
    return true
  } catch {
    return false
  }
}

function globToRegExp(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\0')
    .replace(/\*/g, '[^/]*')
    .replace(/\0/g, '.*')
  return new RegExp(`^${escaped}$`)
}

const USER_LAYER_RE = USER_LAYER_GLOBS.map(globToRegExp)

function isUserLayer(path) {
  const normalized = path.replaceAll('\\', '/')
  return USER_LAYER_RE.some((re) => re.test(normalized))
}

// 解析 `git diff --name-status` 输出：R/C 重命名行带两个路径，旧路径记删除、新路径记新增
function parseNameStatus(output) {
  const changes = new Map()
  for (const line of output.split('\n')) {
    if (!line.trim()) continue
    const [status, ...paths] = line.split('\t')
    if (status.startsWith('R') || status.startsWith('C')) {
      changes.set(paths[0], 'D')
      changes.set(paths[1], 'A')
    } else {
      changes.set(paths[0], status)
    }
  }
  return changes
}

// 从 site.config.ts 源码中提取 siteConfig 对象的顶层字段名（深度扫描，忽略整行注释）
function extractConfigKeys(source) {
  const keys = new Set()
  const marker = 'export const siteConfig'
  const start = source.indexOf(marker)
  if (start === -1) return keys
  let depth = 0
  for (const line of source.slice(start).split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue
    if (depth === 1) {
      const match = line.match(/^ {2}([A-Za-z_$][\w$]*)\s*:/)
      if (match) keys.add(match[1])
    }
    for (const ch of line) {
      if (ch === '{') depth += 1
      if (ch === '}') depth -= 1
    }
    if (start !== -1 && depth === 0 && line.includes('}')) break
  }
  return keys
}

function configKeysAt(rev) {
  try {
    return extractConfigKeys(git(['show', `${rev}:${SITE_CONFIG}`]))
  } catch {
    return new Set()
  }
}

function packageVersionAt(rev) {
  try {
    const raw = rev ? git(['show', `${rev}:package.json`]) : readFileSync('package.json', 'utf8')
    return JSON.parse(raw).version ?? '?'
  } catch {
    return '?'
  }
}

function depNamesAt(rev) {
  try {
    const raw = rev ? git(['show', `${rev}:package.json`]) : readFileSync('package.json', 'utf8')
    const pkg = JSON.parse(raw)
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ])
  } catch {
    return new Set()
  }
}

function listSection(title, items, emptyText) {
  console.log(`\n── ${title} (${items.length})`)
  if (items.length === 0) {
    console.log(`  ${emptyText}`)
    return
  }
  for (const item of items.slice(0, LIST_CAP)) console.log(`  ${item}`)
  if (items.length > LIST_CAP) console.log(`  ... 以及另外 ${items.length - LIST_CAP} 个文件`)
}

if (help) {
  console.log(`用法：pnpm theme:update [--apply] [--remote <name>] [--branch <name>]

  默认预演（--dry-run 语义）：只输出报告，不改工作区。
  --apply    实际执行合并，自动解决用户层冲突（保留用户版本）。
  --remote   上游 remote 名，默认 ${DEFAULT_REMOTE}（GitHub）
  --branch   上游分支名，默认 ${DEFAULT_BRANCH}`)
  process.exit(0)
}

// ── 前置检查 ────────────────────────────────────────────────
try {
  git(['rev-parse', '--is-inside-work-tree'])
} catch {
  fail('not inside a git repository')
}

const dirty = git(['status', '--porcelain'])
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('??'))
if (dirty.length > 0) {
  console.error(`${PREFIX} working tree has uncommitted changes; commit or stash them first:`)
  for (const line of dirty.slice(0, 20)) console.error(`  ${line}`)
  fail('refusing to run on a dirty tree')
}

const upstreamRef = `${remote}/${branch}`
console.log(`${PREFIX} fetching ${remote} ${branch} ...`)
try {
  git(['fetch', remote, branch])
} catch {
  fail(`git fetch ${remote} ${branch} failed — check your network or the remote name`)
}

if (!gitOk(['rev-parse', '-q', '--verify', `${upstreamRef}^{commit}`])) {
  fail(`upstream ref ${upstreamRef} not found`)
}

const head = git(['rev-parse', 'HEAD']).trim()
const upstream = git(['rev-parse', upstreamRef]).trim()
const base = git(['merge-base', 'HEAD', upstreamRef]).trim()

const localVersion = packageVersionAt(null)
const upstreamVersion = packageVersionAt(upstreamRef)
console.log(`${PREFIX} theme version: local v${localVersion} / upstream v${upstreamVersion}`)

if (base === upstream) {
  console.log(`${PREFIX} already up to date with ${upstreamRef}`)
  process.exit(0)
}
console.log(`${PREFIX} upstream has new commits since last merge base`)

// ── 差异分类 ────────────────────────────────────────────────
const upstreamChanges = parseNameStatus(git(['diff', '--name-status', base, upstreamRef]))
const localChanges = parseNameStatus(git(['diff', '--name-status', base, head]))

const coreUpdates = []
const userLayerUpstream = []
const coreConflicts = []
const userLayerConflicts = []
const upstreamDeletes = []
const upstreamAdds = []

for (const [path, status] of upstreamChanges) {
  const user = isUserLayer(path)
  const locallyTouched = localChanges.has(path)
  if (locallyTouched) {
    // 本地（含删除）与上游都动过 → 冲突候选，按层预测处理方式
    if (user) userLayerConflicts.push(path)
    else coreConflicts.push(path)
  } else if (status === 'D') {
    upstreamDeletes.push(path)
  } else if (status === 'A') {
    upstreamAdds.push(path)
  } else if (user) {
    userLayerUpstream.push(path)
  } else {
    coreUpdates.push(path)
  }
}

// ── 配置字段与依赖差异 ──────────────────────────────────────
const baseConfigKeys = configKeysAt(base)
const upstreamConfigKeys = configKeysAt(upstreamRef)
const headConfigKeys = configKeysAt(head)
const newConfigFields = [...upstreamConfigKeys].filter(
  (k) => !baseConfigKeys.has(k) && !headConfigKeys.has(k),
)

const baseDeps = depNamesAt(base)
const upstreamDeps = depNamesAt(upstreamRef)
const newDeps = [...upstreamDeps].filter((d) => !baseDeps.has(d))

// ── 报告 ────────────────────────────────────────────────────
listSection('只读层更新（自动合并）', coreUpdates, '无')
listSection('用户层上游改动（自动合并）', userLayerUpstream, '无')
listSection('上游新增文件', upstreamAdds, '无')
listSection('上游删除文件', upstreamDeletes, '无')
listSection('预测冲突：只读层你本地也改过（需人工合并）', coreConflicts, '无 — 只读层无冲突')
listSection('用户层双方都改过（无冲突自动合并，冲突处保留你的版本）', userLayerConflicts, '无')

if (newConfigFields.length > 0) {
  console.log(
    `\n── site.config.ts 上游新增字段（缺省时构建会兜底并告警，可按需补配）: ${newConfigFields.join(', ')}`,
  )
}
if (newDeps.length > 0) {
  console.log(`\n── package.json 上游新增依赖（合并后请运行 pnpm install）: ${newDeps.join(', ')}`)
}

if (!apply) {
  console.log(`\n${PREFIX} 预演结束，未改动任何文件。确认无误后执行：pnpm theme:update --apply`)
  if (coreConflicts.length > 0) process.exit(3)
  process.exit(0)
}

// ── 执行合并 ────────────────────────────────────────────────
console.log(`\n${PREFIX} merging ${upstreamRef} ...`)
let mergeFailed = false
try {
  git(['merge', '--no-commit', upstreamRef])
} catch {
  mergeFailed = true
}

const unmerged = git(['diff', '--name-only', '--diff-filter=U'])
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)

const manual = []
for (const path of unmerged) {
  if (isUserLayer(path)) {
    // 用户层：保留用户版本。UA（用户已删、上游改了）同样尊重删除意图。
    // stage 2 = 本地版本，stage 3 = 上游版本；本地已删时只剩 stage 3。
    const stages = git(['ls-files', '-u', '--', path])
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split('\t')[0].trim().split(' ')[2])
    if (!stages.includes('2') && stages.includes('3')) git(['rm', '--', path])
    else {
      git(['checkout', '--ours', '--', path])
      git(['add', '--', path])
    }
  } else {
    manual.push(path)
  }
}

if (manual.length > 0) {
  console.error(`\n${PREFIX} 以下只读层文件你本地也改过，已保留冲突供人工合并：`)
  for (const path of manual) console.error(`  ${path}`)
  console.error(
    `\n处理方式：\n  1. 逐个编辑上述文件解决冲突标记\n  2. git add <文件> 后执行 git commit --no-edit 完成合并\n  放弃本次同步可执行：git merge --abort`,
  )
  process.exit(3)
}

if (mergeFailed) {
  git([
    'commit',
    '-m',
    `chore(theme): 同步上游 ${upstreamRef}（v${localVersion} → v${upstreamVersion}）`,
  ])
} else if (gitOk(['rev-parse', '-q', '--verify', 'MERGE_HEAD'])) {
  git([
    'commit',
    '-m',
    `chore(theme): 同步上游 ${upstreamRef}（v${localVersion} → v${upstreamVersion}）`,
  ])
}

console.log(`\n${PREFIX} 合并完成：${upstreamRef}（v${localVersion} → v${upstreamVersion}）`)
if (userLayerConflicts.length > 0) {
  console.log(
    `用户层双方都改过的文件已合并（冲突处保留你的版本，建议过目）：\n  ${userLayerConflicts.join('\n  ')}`,
  )
}
if (newDeps.length > 0) console.log('建议下一步：pnpm install && pnpm verify && pnpm build')
else console.log('建议下一步：pnpm verify && pnpm build')
