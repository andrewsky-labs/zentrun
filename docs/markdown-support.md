# 📝 Markdown Support Specification

This document outlines the supported Markdown features that the application should implement.

---

## ✅ Core Features (CommonMark Spec)

### Block Elements

- **Paragraphs** – Basic text blocks separated by blank lines
- **Headings** – Six levels supported (`#`, `##`, ..., `######`)
- **Blockquotes** – Lines beginning with `>`
- **Lists**
  - Unordered lists – Begin with `*`, `-`, or `+`
  - Ordered lists – Begin with numbers followed by `.` (e.g., `1.`)
- **Code Blocks**
  - Indented code blocks – Indent with 4 spaces or a tab
  - Fenced code blocks – Use triple backticks (```) or tildes (`~~~`), language optional
- **Thematic Breaks** – Use `***`, `---`, or `___` on a line by itself

### Inline Elements

- **Emphasis** – Wrap text with `*` or `_` for italics
- **Strong Emphasis** – Wrap with `**` or `__` for bold
- **Code Spans** – Inline code wrapped with backticks (`` ` ``)
- **Links**
  - Inline links – `[text](URL 'optional title')`
  - Reference links – `[text][label]`
  - Autolinks – `<http://example.com>` or `<email@example.com>`
- **Images** – `![alt text](URL 'optional title')`
- **Hard Line Breaks** – Two trailing spaces or a backslash (`\`) at end of line

---

## ✨ Extended Features (GFM & Common Extensions)

### Block Extensions

- **Tables** – Created using pipes (`|`) and dashes (`-`)
- **Task Lists** – `- [ ]` for unchecked, `- [x]` for checked items
- **Enhanced Fenced Code Blocks** – Syntax highlighting and additional languages
- **Definition Lists** – Term and definition style
- **Footnotes** – `[^1]` for footnote references
- **Admonitions** – Special blocks like info, warning, note, etc.

### Inline Extensions

- **Strikethrough** – Text wrapped with `~~`
- **Highlight** – Text wrapped with `==`
- **Superscript** – Text wrapped with `^`
- **Subscript** – Text wrapped with `~`
- **Abbreviations** – Define and expand terms
- **Emoji** – `:emoji:` syntax (e.g., `:smile:`)
- **Autolink Enhancements** – Improved URL auto-detection

---

## 📐 Math & Charts

- **Math Expressions**
  - Inline: `$...$`, `\(...\)`, or `$$...$$`
  - Block-level: `$$...$$` or `\[...\]`
- **Charts**
  - Mermaid diagrams
  - PlantUML diagrams
  - Other supported syntax formats

---

## 🧠 Advanced Features

- **YAML Front Matter** – Metadata defined at the top of the document
- **Table of Contents** – Auto-generated TOC
- **Custom Containers** – User-defined blocks for special use
- **File Inclusion** – Import content from external files
- **Internal References** – Links to sections or elements within the document
- **Custom Attributes** – Add `id`, `class`, or other HTML attributes to elements

---

## ⚠️ Implementation Notes

- All **core features** should be implemented first
- **GFM extensions** are second priority
- **Math and chart support** should be added based on real usage needs
- Be mindful of **nesting rules** and **edge cases**
- Ensure **maximum compatibility** with CommonMark and GFM parsers

---

## 📈 Development Roadmap

1. Implement all CommonMark core features
2. Add GFM extensions (tables, task lists, strikethrough, etc.)
3. Add math expression support
4. Add diagram/chart rendering support
5. Implement custom containers, attributes, and enhanced UI behaviors
