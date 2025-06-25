import { MarkdownToken, SuperscriptNode, ParsedNode } from '../types'
import { parseInlineTokens } from '../index'

export function parseSuperscriptToken(
  tokens: MarkdownToken[],
  startIndex: number
): { node: SuperscriptNode; nextIndex: number } {
  const children: ParsedNode[] = []
  let supText = ''
  let i = startIndex + 1
  const innerTokens: MarkdownToken[] = []

  // Process tokens between sup_open and sup_close (if applicable)
  while (i < tokens.length && tokens[i].type !== 'sup_close') {
    supText += tokens[i].content || ''
    innerTokens.push(tokens[i])
    i++
  }

  // Parse inner tokens to handle nested elements
  children.push(...parseInlineTokens(innerTokens))

  const node: SuperscriptNode = {
    type: 'superscript',
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
    raw: `^${supText || tokens[startIndex].content || ''}^`
  }

  // Skip to after sup_close
  const nextIndex = i < tokens.length ? i + 1 : tokens.length

  return { node, nextIndex }
}
