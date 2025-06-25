import { MarkdownToken, TextNode } from '../types'

export function parseTextToken(token: MarkdownToken): TextNode {
  return {
    type: 'text',
    content: token.content || '',
    raw: token.content || ''
  }
}
