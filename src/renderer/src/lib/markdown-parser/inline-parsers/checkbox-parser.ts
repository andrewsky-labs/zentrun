import { MarkdownToken, CheckboxNode } from '../types'

export function parseCheckboxToken(token: MarkdownToken): CheckboxNode {
  return {
    type: 'checkbox',
    checked: token.meta?.checked === true,
    raw: token.meta?.checked ? '[x]' : '[ ]'
  }
}
