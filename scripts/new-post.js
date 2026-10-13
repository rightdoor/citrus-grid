import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const args = process.argv.slice(2)
const unknownFlags = args.filter((arg) => arg.startsWith('--') && arg !== '--mdx')
const mdx = args.includes('--mdx')
const slug = args.find((arg) => !arg.startsWith('--')) || `post-${new Date().toISOString().slice(0, 10)}`
const dir = path.resolve('src/content/posts')
const file = path.join(dir, `${slug}${mdx ? '.mdx' : '.md'}`)

if (unknownFlags.length) {
  // 未知参数：
  console.warn(`ignored unknown flag(s): ${unknownFlags.join(' ')}`)
}

if (existsSync(file)) {
  // 已存在：
  console.error(`already exists: ${file}`)
  process.exit(1)
}

mkdirSync(path.dirname(file), { recursive: true })

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const datetime =
  `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ` +
  `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`

const frontmatter = `---
title: "${slug}"
slug:
index: 0
description: "一句话摘要"
category: "未分类"
tags: []
published: ${datetime}
---
`

function calloutImport() {
  const target = path.resolve('src/components/mdx/Callout.astro')
  let rel = path.relative(path.dirname(file), target).split(path.sep).join('/')
  if (!rel.startsWith('.')) rel = `./${rel}`
  return `import Callout from '${rel}'`
}

const template = mdx
  ? `${frontmatter}
${calloutImport()}

从这里开始写作。

<Callout type="tip" title="提示">
支持 Markdown 的提示框，type 可取 info / tip / warning / danger。
</Callout>
`
  : `${frontmatter}
从这里开始写作。
`

writeFileSync(file, template, 'utf-8')
// 已创建：
console.log(`created: ${file}`)
