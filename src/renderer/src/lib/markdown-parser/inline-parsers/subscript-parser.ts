import { MarkdownToken, SubscriptNode, ParsedNode } from '../types'
import { parseInlineTokens } from '../index'

export function parseSubscriptToken(
  tokens: MarkdownToken[],
  startIndex: number
): { node: SubscriptNode; nextIndex: number } {
  const children: ParsedNode[] = []
  let subText = ''
  let i = startIndex + 1
  const innerTokens: MarkdownToken[] = []

  // Process tokens between sub_open and sub_close (if applicable)
  while (i < tokens.length && tokens[i].type !== 'sub_close') {
    subText += tokens[i].content || ''
    innerTokens.push(tokens[i])
    i++
  }

  // Parse inner tokens to handle nested elements
  children.push(...parseInlineTokens(innerTokens))

  const node: SubscriptNode = {
    type: 'subscript',
    children:
      children.length > 0
        ? children
        : [
            {
              type: 'text',
              content: tokens[startIndex].content || '',
              raw: tokens[startIndex].content || ''
            }
          ],
    raw: `~${subText || tokens[startIndex].content || ''}~`
  }

  // Skip to after sub_close
  const nextIndex = i < tokens.length ? i + 1 : tokens.length

  return { node, nextIndex }
}
