import { FootnoteNode, MarkdownToken, ParsedNode } from '../types'
import { parseInlineTokens } from '../inline-parsers'

export function parseFootnote(tokens: MarkdownToken[], index: number): [FootnoteNode, number] {
  const token = tokens[index]
  const id = token.meta?.id || ''
  const footnoteChildren: ParsedNode[] = []
  let j = index + 1

  while (j < tokens.length && tokens[j].type !== 'footnote_close') {
    if (tokens[j].type === 'paragraph_open') {
      const contentToken = tokens[j + 1]
      footnoteChildren.push({
        type: 'paragraph',
        children: parseInlineTokens(contentToken.children || []),
        raw: contentToken.content || ''
      })
      j += 3 // Skip paragraph_open, inline, paragraph_close
    } else {
      j++
    }
  }

  const footnoteNode: FootnoteNode = {
    type: 'footnote',
    id,
    children: footnoteChildren,
    raw: `[^${id}]: ${footnoteChildren.map((child) => child.raw).join('\n')}`
  }

  return [footnoteNode, j + 1] // Skip footnote_close
}
