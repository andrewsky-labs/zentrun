import { ParsedNode, MarkdownToken, TextNode } from '../types'
import { parseTextToken } from './text-parser'
import { parseInlineCodeToken } from './inline-code-parser'
import { parseLinkToken } from './link-parser'
import { parseImageToken } from './image-parser'
import { parseStrongToken } from './strong-parser'
import { parseEmphasisToken } from './emphasis-parser'
import { parseStrikethroughToken } from './strikethrough-parser'
import { parseHighlightToken } from './highlight-parser'
import { parseInsertToken } from './insert-parser'
import { parseSubscriptToken } from './subscript-parser'
import { parseSuperscriptToken } from './superscript-parser'
import { parseEmojiToken } from './emoji-parser'
import { parseCheckboxToken } from './checkbox-parser'
import { parseFootnoteRefToken } from './footnote-ref-parser'
import { parseHardbreakToken } from './hardbreak-parser'
import { parseFenceToken } from './fence-parser'
import { parseMathInlineToken } from './math-inline-parser'
import { parseReferenceToken } from './reference-parser'

// Process inline tokens (for text inside paragraphs, headings, etc.)
export function parseInlineTokens(tokens: MarkdownToken[]): ParsedNode[] {
  if (!tokens || tokens.length === 0) return []

  const result: ParsedNode[] = []
  let currentTextNode: TextNode | null = null

  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]

    switch (token.type) {
      case 'text': {
        const textNode = parseTextToken(token)
        if (currentTextNode) {
          // Merge with the previous text node
          currentTextNode.content += textNode.content
          currentTextNode.raw += textNode.raw
        } else {
          // Start a new text node
          currentTextNode = textNode
          result.push(currentTextNode)
        }
        i++
        break
      }

      case 'softbreak':
        if (currentTextNode) {
          // Append newline to the current text node
          currentTextNode.content += '\n'
          currentTextNode.raw += '\n' // Assuming raw should also reflect the newline
        }
        // Don't create a node for softbreak itself, just modify text
        i++
        break

      case 'code_inline':
        currentTextNode = null // Reset current text node
        result.push(parseInlineCodeToken(token))
        i++
        break

      case 'link_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseLinkToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'image':
        currentTextNode = null // Reset current text node
        result.push(parseImageToken(token))
        i++
        break

      case 'strong_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseStrongToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'em_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseEmphasisToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 's_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseStrikethroughToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'mark_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseHighlightToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'ins_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseInsertToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'sub_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseSubscriptToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'sup_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseSuperscriptToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'sub':
        currentTextNode = null // Reset current text node
        result.push({
          type: 'subscript',
          children: [{ type: 'text', content: token.content || '', raw: token.content || '' }],
          raw: `~${token.content || ''}~`
        })
        i++
        break

      case 'sup':
        currentTextNode = null // Reset current text node
        result.push({
          type: 'superscript',
          children: [{ type: 'text', content: token.content || '', raw: token.content || '' }],
          raw: `^${token.content || ''}^`
        })
        i++
        break

      case 'emoji':
        currentTextNode = null // Reset current text node
        result.push(parseEmojiToken(token))
        i++
        break

      case 'checkbox':
        currentTextNode = null // Reset current text node
        result.push(parseCheckboxToken(token))
        i++
        break

      case 'footnote_ref':
        currentTextNode = null // Reset current text node
        result.push(parseFootnoteRefToken(token))
        i++
        break

      case 'hardbreak':
        currentTextNode = null // Reset current text node
        result.push(parseHardbreakToken())
        i++
        break

      case 'fence': {
        currentTextNode = null // Reset current text node
        // Handle fenced code blocks with language specifications
        result.push(parseFenceToken(tokens[i]))
        i++
        break
      }

      case 'math_inline': {
        currentTextNode = null // Reset current text node
        result.push(parseMathInlineToken(token))
        i++
        break
      }

      case 'reference': {
        currentTextNode = null // Reset current text node
        result.push(parseReferenceToken(token))
        i++
        break
      }

      default:
        // Skip unknown token types, ensure text merging stops
        currentTextNode = null // Reset current text node
        i++
        break
    }
  }

  return result
}
