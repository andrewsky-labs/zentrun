import { MarkdownToken, ImageNode } from '../types'

export function parseImageToken(token: MarkdownToken): ImageNode {
  return {
    type: 'image',
    src: token.attrs?.find((attr) => attr[0] === 'src')?.[1] || '',
    alt: token.attrs?.find((attr) => attr[0] === 'alt')?.[1] || '',
    title: token.attrs?.find((attr) => attr[0] === 'title')?.[1] || null,
    raw: token.content || ''
  }
}
