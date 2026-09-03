import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const slug = process.argv[2] || `post-${new Date().toISOString().slice(0, 10)}`
const dir = path.resolve('src/content/posts')
const file = path.join(dir, `${slug}.md`)

if (existsSync(file)) {
  // 已存在：
  console.error(`already exists: ${file}`)
  process.exit(1)
}

mkdirSync(dir, { recursive: true })

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const datetime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

const template = `---
title: "${slug}"
slug:
index: 0
description: "一句话摘要"
category: "未分类"
tags: []
published: ${datetime}
---

从这里开始写作。
`

writeFileSync(file, template, 'utf-8')
// 已创建：
console.log(`created: ${file}`)
