import { MarkdownToken, StrongNode, ParsedNode } from '../types'
import { parseInlineTokens } from '../index'

export function parseStrongToken(
  tokens: MarkdownToken[],
  startIndex: number
): { node: StrongNode; nextIndex: number } {
  const children: ParsedNode[] = []
  let strongText = ''
  let i = startIndex + 1
  const innerTokens: MarkdownToken[] = []

  // Process tokens between strong_open and strong_close
  while (i < tokens.length && tokens[i].type !== 'strong_close') {
    strongText += tokens[i].content || ''
    innerTokens.push(tokens[i])
    i++
  }

  // Parse inner tokens to handle nested elements
  children.push(...parseInlineTokens(innerTokens))

  const node: StrongNode = {
    type: 'strong',
    children,
    raw: `**${strongText}**`
  }

  // Skip to after strong_close
  const nextIndex = i < tokens.length ? i + 1 : tokens.length

  return { node, nextIndex }
}
