import { MarkdownToken, InsertNode, ParsedNode } from '../types'
import { parseInlineTokens } from '../index'

export function parseInsertToken(
  tokens: MarkdownToken[],
  startIndex: number
): { node: InsertNode; nextIndex: number } {
  const children: ParsedNode[] = []
  let insText = ''
  let i = startIndex + 1
  const innerTokens: MarkdownToken[] = []

  // Process tokens between ins_open and ins_close
  while (i < tokens.length && tokens[i].type !== 'ins_close') {
    insText += tokens[i].content || ''
    innerTokens.push(tokens[i])
    i++
  }

  // Parse inner tokens to handle nested elements
  children.push(...parseInlineTokens(innerTokens))

  const node: InsertNode = {
    type: 'insert',
    children,
    raw: `++${insText}++`
  }

  // Skip to after ins_close
  const nextIndex = i < tokens.length ? i + 1 : tokens.length

  return { node, nextIndex }
}
