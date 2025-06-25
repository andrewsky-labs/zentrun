import { MarkdownToken, ReferenceNode } from '../types'

// Parse a reference token from markdown-it
export function parseReferenceToken(token: MarkdownToken): ReferenceNode {
  return {
    type: 'reference',
    id: token.content || '',
    raw: token.markup || `[${token.content}]`
  }
}
