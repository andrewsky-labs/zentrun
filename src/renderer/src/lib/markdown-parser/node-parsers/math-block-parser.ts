import { MarkdownToken, MathBlockNode } from '../types'

// Parse a math_block token (block/display math expressions)
export function parseMathBlock(token: MarkdownToken): MathBlockNode {
  return {
    type: 'math_block',
    content: token.content || '',
    raw: token.markup === '\\[\\]' ? `\\[${token.content}\\]` : `$$${token.content}$$`
  }
}
