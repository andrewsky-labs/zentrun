import { MarkdownToken, FootnoteReferenceNode } from '../types'

export function parseFootnoteRefToken(token: MarkdownToken): FootnoteReferenceNode {
  return {
    type: 'footnote_reference',
    id: token.meta?.id || '',
    raw: `[^${token.meta?.id || ''}]`
  }
}
