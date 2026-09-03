import { type CollectionEntry, getCollection } from 'astro:content'
import dayjs from 'dayjs'
import readingTime from 'reading-time'

export type Post = CollectionEntry<'posts'>

export interface YearGroup {
  year: string
  items: Post[]
}

export interface NameCount {
  name: string
  count: number
}

// 全部文章，生产环境排除 'draft: true' ，顺序置顶顺序再到时间倒叙排列
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => {
    return import.meta.env.PROD ? !data.draft : true
  })
  return posts.sort(
    (a, b) =>
      b.data.index - a.data.index || b.data.published.valueOf() - a.data.published.valueOf(),
  )
}

// 字数统计（reading-time 词边界统计：CJK 逐字计入、英文按词计入，Markdown 语法符号不计）
export function wordCount(post: Post): number {
  return readingTime(post.body ?? '').words
}

// 阅读时长：400 字/分钟，最少 1 分钟
export function readMinutes(post: Post): number {
  return Math.max(1, Math.ceil(wordCount(post) / 400))
}

// 日期格式化 YYYY-MM-DD HH:mm
export function formatDate(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 摘要：description 优先，否则从正文顺序提取 120 字
export function excerptOf(post: Post): string {
  if (post.data.description) return post.data.description
  const stripped = (post.body ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`>]/g, '')
    .trim()
  return stripped.length > 120 ? `${stripped.slice(0, 120)}...` : stripped
}

// 全站字数
export function totalWords(posts: Post[]): number {
  return posts.reduce((sum, p) => sum + wordCount(p), 0)
}

// 全站阅读时长
export function totalMinutes(posts: Post[]): number {
  return posts.reduce((sum, p) => sum + readMinutes(p), 0)
}

// 分类（默认按数量降序）
export function groupByCategory(posts: Post[]): NameCount[] {
  const map = new Map<string, number>()
  for (const p of posts) {
    map.set(p.data.category, (map.get(p.data.category) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// 标签（默认按数量降序）
export function groupByTags(posts: Post[]): NameCount[] {
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const tag of p.data.tags) {
      map.set(tag, (map.get(tag) || 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// 归档，按年分组，固定为倒序
export function groupByYear(posts: Post[]): YearGroup[] {
  const map = new Map<string, Post[]>()
  for (const p of posts) {
    const year = String(dayjs(p.data.published).year())
    let items = map.get(year)
    if (!items) {
      items = []
      map.set(year, items)
    }
    items.push(p)
  }
  return [...map.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, items]) => ({ year, items }))
}

// 归档日期格式：MM-DD
export function monthDay(date: Date): string {
  return dayjs(date).format('MM-DD')
}
