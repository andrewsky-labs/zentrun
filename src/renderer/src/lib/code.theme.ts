import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'

export const anysphereThemeDark = createTheme({
  theme: 'dark',
  settings: {
    background: '#181818',
    foreground: '#D6D6DD',
    caret: '#D6D6DD',
    selection: '#163761',
    selectionMatch: '#163761',
    lineHighlight: 'rgba(50, 50, 100, 0.05)',
    gutterBackground: '#181818',
    gutterForeground: '#535353'
  },
  styles: [
    { tag: [t.comment, t.lineComment, t.blockComment], color: '#6D6D6D', fontStyle: 'italic' },
    { tag: t.docComment, color: '#6D6D6D', fontStyle: 'italic', fontWeight: 'bold' },
    { tag: t.variableName, color: '#D1D1D1' },
    { tag: [t.propertyName, t.labelName], color: '#AA9BF5' },
    { tag: [t.string, t.character, t.docString], color: '#E394DC' },
    { tag: [t.number, t.integer, t.float], color: '#EBC88D' },
    { tag: [t.bool, t.null, t.atom], color: '#82D2CE' },
    { tag: [t.keyword, t.modifier, t.operatorKeyword], color: '#82D2CE' },
    { tag: [t.controlKeyword, t.controlOperator], color: '#83D6C5' },
    { tag: t.definitionKeyword, color: '#83D6C5', fontWeight: 'bold' },
    { tag: t.moduleKeyword, color: '#83D6C5', fontStyle: 'italic' },
    { tag: t.self, color: '#83D6C5', fontStyle: 'italic' },
    {
      tag: [
        t.operator,
        t.arithmeticOperator,
        t.logicOperator,
        t.bitwiseOperator,
        t.compareOperator,
        t.updateOperator
      ],
      color: '#D6D6DD'
    },
    { tag: t.definitionOperator, color: '#83D6C5' },
    { tag: [t.className, t.definition(t.typeName), t.typeName], color: '#87C3FF' },
    { tag: t.namespace, color: '#87C3FF' },
    { tag: t.typeOperator, color: '#EFB080' },
    { tag: t.tagName, color: '#87C3FF', fontWeight: 'bold' },
    { tag: t.angleBracket, color: '#898989' },
    { tag: t.attributeName, color: '#AAA0FA' },
    { tag: t.attributeValue, color: '#E394DC' },
    { tag: t.function(t.variableName), color: '#EFB080' },
    { tag: t.macroName, color: '#A8CC7C' },
    { tag: [t.bracket, t.paren, t.brace], color: '#E394DC' },
    { tag: t.punctuation, color: '#D6D6DD' },
    { tag: t.invalid, color: '#ff0000', fontStyle: 'italic' },
    { tag: [t.meta, t.documentMeta, t.annotation], color: '#6D6D6D' },
    { tag: t.url, color: '#83D6C5', textDecoration: 'underline' },
    { tag: t.color, color: '#EBC88D' }
  ]
})

export const anysphereThemeLight = createTheme({
  theme: 'light',
  settings: {
    background: '#ffffff',
    foreground: '#24292e',
    caret: '#24292e',
    selection: '#b3d4fc',
    selectionMatch: '#b3d4fc',
    lineHighlight: 'rgba(50, 50, 100, 0.05)',
    gutterBackground: '#ffffff',
    gutterForeground: '#6e7781'
  },
  styles: [
    { tag: [t.comment, t.lineComment, t.blockComment], color: '#6a737d', fontStyle: 'italic' },
    { tag: t.docComment, color: '#6a737d', fontStyle: 'italic', fontWeight: 'bold' },
    { tag: t.variableName, color: '#24292e' },
    { tag: [t.propertyName, t.labelName], color: '#6f42c1' },
    { tag: [t.string, t.character, t.docString], color: '#032f62' },
    { tag: [t.number, t.integer, t.float], color: '#005cc5' },
    { tag: [t.bool, t.null, t.atom], color: '#005cc5' },
    { tag: [t.keyword, t.modifier, t.operatorKeyword], color: '#d73a49' },
    { tag: [t.controlKeyword, t.controlOperator], color: '#d73a49' },
    { tag: t.definitionKeyword, color: '#d73a49', fontWeight: 'bold' },
    { tag: t.moduleKeyword, color: '#d73a49', fontStyle: 'italic' },
    { tag: t.self, color: '#d73a49', fontStyle: 'italic' },
    {
      tag: [
        t.operator,
        t.arithmeticOperator,
        t.logicOperator,
        t.bitwiseOperator,
        t.compareOperator,
        t.updateOperator
      ],
      color: '#24292e'
    },
    { tag: t.definitionOperator, color: '#d73a49' },
    { tag: [t.className, t.definition(t.typeName), t.typeName], color: '#6f42c1' },
    { tag: t.namespace, color: '#6f42c1' },
    { tag: t.typeOperator, color: '#005cc5' },
    { tag: t.tagName, color: '#22863a', fontWeight: 'bold' },
    { tag: t.angleBracket, color: '#24292e' },
    { tag: t.attributeName, color: '#6f42c1' },
    { tag: t.attributeValue, color: '#032f62' },
    { tag: t.function(t.variableName), color: '#6f42c1' },
    { tag: t.macroName, color: '#22863a' },
    { tag: [t.bracket, t.paren, t.brace], color: '#24292e' },
    { tag: t.punctuation, color: '#24292e' },
    { tag: t.invalid, color: '#cb2431', fontStyle: 'italic' },
    { tag: [t.meta, t.documentMeta, t.annotation], color: '#6a737d' },
    { tag: t.url, color: '#032f62', textDecoration: 'underline' },
    { tag: t.color, color: '#005cc5' }
  ]
})

// For backward compatibility
export const anysphereTheme = anysphereThemeDark
