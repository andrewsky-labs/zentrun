import { ParsedNode, MarkdownToken } from './types'
import { parseHeading } from './node-parsers/heading-parser'
import { parseParagraph } from './node-parsers/paragraph-parser'
import { parseCodeBlock, parseFence } from './node-parsers/code-block-parser'
import { parseList } from './node-parsers/list-parser'
import { parseThematicBreak } from './node-parsers/thematic-break-parser'
import { parseBlockquote } from './node-parsers/blockquote-parser'
import { parseTable } from './node-parsers/table-parser'
import { parseDefinitionList } from './node-parsers/definition-list-parser'
import { parseFootnote } from './node-parsers/footnote-parser'
import { parseAdmonition } from './node-parsers/admonition-parser'
import { parseHardBreak } from './node-parsers/hardbreak-parser'
import { parseInlineTokens } from './inline-parsers'
import { parseMathBlock } from './node-parsers/math-block-parser'
import MarkdownIt from 'markdown-it'

// Function to parse markdown into a structured representation
export function parseMarkdownToStructure(markdown: string, md: MarkdownIt): ParsedNode[] {
  // Get tokens from markdown-it
  const tokens = md.parse(markdown, {}) as MarkdownToken[]
  // Process the tokens into our structured format
  const result = processTokens(tokens)
  return result
}

// Process markdown-it tokens into our structured format
export function processTokens(tokens: MarkdownToken[]): ParsedNode[] {
  const result: ParsedNode[] = []
  let i = 0

  while (i < tokens.length) {
    const token = tokens[i]

    switch (token.type) {
      case 'heading_open':
        result.push(parseHeading(tokens, i))
        i += 3 // Skip heading_open, inline, heading_close
        break

      case 'paragraph_open':
        result.push(parseParagraph(tokens, i))
        i += 3 // Skip paragraph_open, inline, paragraph_close
        break

      case 'code_block':
        result.push(parseCodeBlock(tokens[i]))
        i += 1
        break

      case 'fence':
        result.push(parseFence(tokens[i]))
        i += 1
        break

      case 'bullet_list_open':
      case 'ordered_list_open': {
        const [listNode, newIndex] = parseList(tokens, i)
        result.push(listNode)
        i = newIndex
        break
      }

      case 'hr':
        result.push(parseThematicBreak())
        i += 1
        break

      case 'blockquote_open': {
        const [blockquoteNode, newIndex] = parseBlockquote(tokens, i)
        result.push(blockquoteNode)
        i = newIndex
        break
      }

      case 'table_open': {
        const [tableNode, newIndex] = parseTable(tokens, i)
        result.push(tableNode)
        i = newIndex
        break
      }

      case 'dl_open': {
        const [definitionListNode, newIndex] = parseDefinitionList(tokens, i)
        result.push(definitionListNode)
        i = newIndex
        break
      }

      case 'footnote_open': {
        const [footnoteNode, newIndex] = parseFootnote(tokens, i)
        result.push(footnoteNode)
        i = newIndex
        break
      }

      case 'container_open': {
        const match = /^::: ?(warning|info|note|tip|danger|caution) ?(.*)$/.exec(token.info || '')
        if (match) {
          const [admonitionNode, newIndex] = parseAdmonition(tokens, i, match)
          result.push(admonitionNode)
          i = newIndex
        } else {
          i += 1 // Not a container type we handle, skip
        }
        break
      }

      case 'hardbreak':
        result.push(parseHardBreak())
        i++
        break

      case 'math_block':
        result.push(parseMathBlock(tokens[i]))
        i += 1
        break

      default:
        // Handle other token types or skip them
        i += 1
        break
    }
  }

  return result
}

export { parseInlineTokens }
