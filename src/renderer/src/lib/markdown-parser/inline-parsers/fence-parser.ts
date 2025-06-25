import { MarkdownToken, CodeBlockNode } from '../types'

export function parseFenceToken(token: MarkdownToken): CodeBlockNode {
  return {
    type: 'code_block',
    language: token.info || '',
    code: token.content || '',
    raw: token.content || ''
  }
}
