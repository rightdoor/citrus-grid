import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

function normalizeList(v: string | string[]): string[] {
  const items = typeof v === 'string' ? v.split(',') : v
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const t = raw.trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

// 使用 zod 校验 frontmatter 格式
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    // 必填：文章标题
    title: z.string().min(1),
    // 文章 URL 标识：构建启动时按标题拼音自动生成并补写（title 下方），重复自动 -N
    // 空值/缺失时 schema 放行，由 ensure-post-slugs 插件补写
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .nullish(),
    // 首页置顶索引，0 为不置顶，越大越靠前
    index: z.number().int().min(0).default(0),
    // 必填：摘要
    description: z.string().min(1),
    // 分类：字符串或数组，只取首个有效项，空值默认「未分类」
    category: z
      .union([z.string(), z.array(z.string())])
      .default('未分类')
      .transform((v) => normalizeList(v)[0] ?? '未分类'),
    // 标签：逗号分隔，字符串或数组，去空格、去空项、大小写不区分，按首次出现去重
    tags: z
      .union([z.string(), z.array(z.string())])
      .default('')
      .transform((v) => normalizeList(v)),
    // 发布时间，YYYY-MM-DD HH:mm:ss 格式，脚本生成时自动填写
    published: z.coerce.date(),
    // 可选：修改时间，与发布时间格式相同
    updated: z.coerce.date().optional(),
    // 作为草稿不参与构建
    draft: z.boolean().default(false),
  }),
})

export const collections = { posts }
