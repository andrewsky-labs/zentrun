import { MarkdownToken, EmphasisNode, ParsedNode } from '../types'
import { parseInlineTokens } from '../index'

export function parseEmphasisToken(
  tokens: MarkdownToken[],
  startIndex: number
): { node: EmphasisNode; nextIndex: number } {
  const children: ParsedNode[] = []
  let emText = ''
  let i = startIndex + 1
  const innerTokens: MarkdownToken[] = []

  // Process tokens between em_open and em_close
  while (i < tokens.length && tokens[i].type !== 'em_close') {
    emText += tokens[i].content || ''
    innerTokens.push(tokens[i])
    i++
  }

  // Parse inner tokens to handle nested elements
  children.push(...parseInlineTokens(innerTokens))

  const node: EmphasisNode = {
    type: 'emphasis',
    children,
    raw: `*${emText}*`
  }

  // Skip to after em_close
  const nextIndex = i < tokens.length ? i + 1 : tokens.length

  return { node, nextIndex }
}
