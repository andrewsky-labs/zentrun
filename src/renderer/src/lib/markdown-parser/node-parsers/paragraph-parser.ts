import { ParagraphNode, MarkdownToken } from '../types'
import { parseInlineTokens } from '../inline-parsers'

export function parseParagraph(tokens: MarkdownToken[], index: number): ParagraphNode {
  const paragraphContentToken = tokens[index + 1]
  const paragraphContent = paragraphContentToken.content || ''

  return {
    type: 'paragraph',
    children: parseInlineTokens(paragraphContentToken.children || []),
    raw: paragraphContent
  }
}
