import { HardBreakNode } from '../types'

export function parseHardBreak(): HardBreakNode {
  return {
    type: 'hardbreak',
    raw: '\\\n'
  }
}
