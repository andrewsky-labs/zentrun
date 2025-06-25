import { CodeBlockNode, MarkdownToken } from '../types'

export function parseCodeBlock(token: MarkdownToken): CodeBlockNode {
  return {
    type: 'code_block',
    language: '',
    code: token.content || '',
    raw: token.content || ''
  }
}

export function parseFence(token: MarkdownToken): CodeBlockNode {
  return {
    type: 'code_block',
    language: token.info || '',
    code: token.content || '',
    raw: token.content || ''
  }
}
