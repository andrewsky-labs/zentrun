import { BlockquoteNode, MarkdownToken, ParsedNode } from '../types'
import { parseInlineTokens } from '../inline-parsers'
import { parseList } from './list-parser'

export function parseBlockquote(tokens: MarkdownToken[], index: number): [BlockquoteNode, number] {
  const blockquoteChildren: ParsedNode[] = []
  let j = index + 1

  // Process blockquote content until closing tag is found
  while (j < tokens.length && tokens[j].type !== 'blockquote_close') {
    if (tokens[j].type === 'paragraph_open') {
      const contentToken = tokens[j + 1]
      blockquoteChildren.push({
        type: 'paragraph',
        children: parseInlineTokens(contentToken.children || []),
        raw: contentToken.content || ''
      })
      j += 3 // Skip paragraph_open, inline, paragraph_close
    } else if (tokens[j].type === 'bullet_list_open' || tokens[j].type === 'ordered_list_open') {
      // Handle nested lists - use parseList directly for proper nested list support
      const [listNode, newIndex] = parseList(tokens, j)
      blockquoteChildren.push(listNode)
      j = newIndex
    } else {
      j++
    }
  }

  const blockquoteNode: BlockquoteNode = {
    type: 'blockquote',
    children: blockquoteChildren,
    raw: blockquoteChildren.map((child) => child.raw).join('\n')
  }

  return [blockquoteNode, j + 1] // Skip blockquote_close
}
