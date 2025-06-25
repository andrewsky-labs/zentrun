import { ThematicBreakNode } from '../types'

export function parseThematicBreak(): ThematicBreakNode {
  return {
    type: 'thematic_break',
    raw: '---'
  }
}
