import type { BacklinkMap } from './backlinks'
import type { Post } from './posts'

export interface RelatedOptions {
  limit?: number
  backlinks?: BacklinkMap
}

function scoreOf(post: Post, other: Post, backlinks: BacklinkMap): number {
  let score = 0
  if (post.data.category === other.data.category) score += 3
  const ownTags = new Set(post.data.tags.map((tag) => tag.toLowerCase()))
  for (const tag of other.data.tags) {
    if (ownTags.has(tag.toLowerCase())) score += 2
  }
  const series = (post.data.series ?? '').trim()
  if (series && series === (other.data.series ?? '').trim()) score += 2
  const incoming = backlinks[post.id]?.includes(other.id) ?? false
  const outgoing = backlinks[other.id]?.includes(post.id) ?? false
  if (incoming || outgoing) score += 4
  return score
}

export function relatedPostsOf(post: Post, posts: Post[], options: RelatedOptions = {}): Post[] {
  const { limit = 5, backlinks = {} } = options
  return posts
    .filter((other) => other.id !== post.id)
    .map((other) => ({ post: other, score: scoreOf(post, other, backlinks) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.post.data.published.valueOf() - a.post.data.published.valueOf(),
    )
    .slice(0, limit)
    .map((entry) => entry.post)
}
