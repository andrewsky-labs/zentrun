import { AdmonitionNode, MarkdownToken, ParsedNode } from '../types'
import { parseInlineTokens } from '../inline-parsers'
import { parseList } from './list-parser'

export function parseAdmonition(
  tokens: MarkdownToken[],
  index: number,
  match: RegExpExecArray
): [AdmonitionNode, number] {
  const kind = match[1] || 'note'
  const title = match[2] || kind.charAt(0).toUpperCase() + kind.slice(1)
  const admonitionChildren: ParsedNode[] = []
  let j = index + 1

  while (j < tokens.length && tokens[j].type !== 'container_close') {
    if (tokens[j].type === 'paragraph_open') {
      const contentToken = tokens[j + 1]
      admonitionChildren.push({
        type: 'paragraph',
        children: parseInlineTokens(contentToken.children || []),
        raw: contentToken.content || ''
      })
      j += 3 // Skip paragraph_open, inline, paragraph_close
    } else if (tokens[j].type === 'bullet_list_open' || tokens[j].type === 'ordered_list_open') {
      // Handle nested lists - use parseList directly for proper nested list support
      const [listNode, newIndex] = parseList(tokens, j)
      admonitionChildren.push(listNode)
      j = newIndex
    } else {
      j++
    }
  }

  const admonitionNode: AdmonitionNode = {
    type: 'admonition',
    kind,
    title,
    children: admonitionChildren,
    raw: `:::${kind} ${title}\n${admonitionChildren.map((child) => child.raw).join('\n')}\n:::`
  }

  return [admonitionNode, j + 1] // Skip container_close
}
