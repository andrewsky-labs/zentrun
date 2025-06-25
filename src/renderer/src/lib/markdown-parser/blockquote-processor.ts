import { MarkdownToken, ParsedNode } from './types'

export function processNestedBlocks(
  tokens: MarkdownToken[],
  startIndex: number
): [ParsedNode | null, number] {
  // This is a simplified version to break circular dependencies
  // Nested lists are now properly handled in list-parser.ts with an enhanced parseNestedList function
  let i = startIndex
  let depth = 1

  while (i < tokens.length && depth > 0) {
    if (tokens[i].type === 'bullet_list_open' || tokens[i].type === 'ordered_list_open') {
      depth++
    } else if (tokens[i].type === 'bullet_list_close' || tokens[i].type === 'ordered_list_close') {
      depth--
    }
    i++
  }

  return [null, i]
}
