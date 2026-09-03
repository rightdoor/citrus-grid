import type { Nodes, Root } from 'hast'

function walk(parent: { children: Nodes[] }) {
  const children = parent.children
  for (let i = 0; i < children.length; i += 1) {
    const node = children[i]
    if (node.type !== 'element') continue
    if (node.tagName === 'table') {
      children[i] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrapper'] },
        children: [node],
      }
      continue
    }
    walk(node)
  }
}

export function rehypeTableWrap() {
  return (tree: Root) => {
    walk(tree)
  }
}
