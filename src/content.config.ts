import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

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

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .nullish(),
    index: z.number().int().min(0).default(0),
    description: z.string().min(1),
    category: z
      .union([z.string(), z.array(z.string())])
      .default('未分类')
      .transform((v) => normalizeList(v)[0] ?? '未分类'),
    tags: z
      .union([z.string(), z.array(z.string())])
      .default('')
      .transform((v) => normalizeList(v)),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
})

export const collections = { posts }
