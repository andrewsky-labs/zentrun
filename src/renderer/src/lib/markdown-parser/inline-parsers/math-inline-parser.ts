import { MarkdownToken, MathInlineNode } from '../types'

// Parse a math_inline token (inline math expressions)
export function parseMathInlineToken(token: MarkdownToken): MathInlineNode {
  return {
    type: 'math_inline',
    content: token.content || '',
    raw: token.markup === '\\(\\)' ? `\\(${token.content}\\)` : `$$${token.content}$$`
  }
}
