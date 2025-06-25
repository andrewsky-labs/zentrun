<template>
  <div ref="messageBlock" class="markdown-content-wrapper relative w-full">
    <div
      :id="id"
      class="markdown-content prose prose-sm dark:prose-invert max-w-full break-all"
      v-html="renderedContent"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import { nanoid } from 'nanoid'
import { useI18n } from 'vue-i18n'
import mermaid from 'mermaid'

const { t } = useI18n()
const id = ref(`editor-${nanoid()}`)
const messageBlock = ref<HTMLDivElement>()

// 初始化 mermaid 配置
onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'sans-serif'
  })
})

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})

// 禁用默认的代码高亮
md.options.highlight = null

// 自定义段落渲染规则
// 移除空段落规则，允许正常渲染段落
// md.renderer.rules.paragraph_open = () => ''
// md.renderer.rules.paragraph_close = () => ''

// 修改代码块渲染方式，保持在Markdown内部渲染
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const info = token.info ? token.info.trim() : ''
  const str = token.content
  const lang = info || 'text'

  // 如果是 mermaid 图表，直接使用 mermaid 类
  if (lang === 'mermaid') {
    return `<div class="mermaid">${str}</div>`
  }

  const encodedCode = btoa(unescape(encodeURIComponent(str)))

  // 为代码块添加样式和语言标记
  return `<div class="markdown-code-block">
    <div class="code-header">
      <span class="code-lang">${lang.toUpperCase()}</span>
      <button class="copy-button" data-code="${encodedCode}">${t('common.copyCode')}</button>
    </div>
    <pre class="code-content"><code class="language-${lang}">${str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}</code></pre>
  </div>`
}

const props = defineProps<{
  block: {
    artifact: {
      type: string
      title: string
    }
    content: string
  }
}>()

const renderedContent = computed(() => {
  return md.render(props.block.content || '')
})

// 修改 watch 来初始化 Mermaid
watch(
  renderedContent,
  async () => {
    if (!renderedContent.value) return

    // 等待 DOM 更新
    await nextTick()

    // 初始化 Mermaid 图表
    try {
      // 重新初始化 mermaid 配置
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'sans-serif'
      })

      const mermaidDivs = document.querySelectorAll('.mermaid')

      if (mermaidDivs.length > 0) {
        // 使用 mermaid.run() 来渲染所有图表
        await mermaid.run({
          querySelector: '.mermaid',
          nodes: Array.from(mermaidDivs).filter(
            (node): node is HTMLElement => node instanceof HTMLElement
          )
        })
      }
    } catch (err) {
      console.error('初始化 Mermaid 图表时出错:', err)
    }

    // 初始化代码高亮
    try {
      const codeBlocks = document.querySelectorAll('pre code:not(.mermaid)')
      if (codeBlocks.length > 0 && window.Prism && messageBlock.value) {
        window.Prism.highlightAllUnder(messageBlock.value)
      } else if (codeBlocks.length > 0 && window.hljs) {
        codeBlocks.forEach((block) => {
          if (block instanceof HTMLElement && window.hljs) {
            window.hljs.highlightElement(block)
          }
        })
      }
    } catch (err) {
      console.error('初始化代码高亮时出错:', err)
    }
  },
  { immediate: true }
)

// 添加类型声明
declare global {
  interface Window {
    Prism?: {
      highlightAllUnder: (element: HTMLElement) => void
    }
    hljs?: {
      highlightElement: (element: HTMLElement) => void
    }
    mermaid: typeof mermaid
  }
}
</script>

<style>
.markdown-content {
  @apply leading-7 px-4 py-4;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 表格样式 */
.markdown-content table {
  @apply border-collapse w-full my-4;
}

.markdown-content table th {
  @apply bg-muted text-left p-2 border border-border;
}

.markdown-content table td {
  @apply p-2 border border-border;
}

/* 段落样式 */
.markdown-content p {
  @apply my-4;
}

/* 列表样式 */
.markdown-content ul,
.markdown-content ol {
  @apply pl-8 my-4;
}

.markdown-content li {
  @apply my-1;
}

.markdown-content ul li {
  @apply list-disc;
}

.markdown-content ol li {
  @apply list-decimal;
}

/* 标题样式 */
.markdown-content h1 {
  @apply text-2xl font-bold mt-8 mb-4;
}

.markdown-content h2 {
  @apply text-xl font-bold mt-6 mb-3;
}

.markdown-content h3 {
  @apply text-lg font-bold mt-5 mb-2;
}

.markdown-content h4 {
  @apply text-base font-bold mt-4 mb-2;
}

/* 引用块样式 */
.markdown-content blockquote {
  @apply pl-4 py-1 my-4 border-l-4 border-primary/30 bg-muted/30;
}

/* 代码块样式 */
.markdown-content .markdown-code-block {
  @apply rounded-lg overflow-hidden mt-2 mb-4 text-xs;
  background-color: #1e1e1e;
}

.markdown-content .code-header {
  @apply flex justify-between items-center px-4 py-2 bg-[#181818];
}

.markdown-content .code-lang {
  @apply text-xs text-gray-400;
}

.markdown-content .copy-button {
  @apply text-xs text-gray-400 hover:text-white cursor-pointer;
}

.markdown-content .code-content {
  @apply overflow-auto p-4 m-0;
  min-height: 10px;
  background-color: #1e1e1e;
  @apply text-white;
}

.markdown-content code {
  @apply font-mono text-xs;
  @apply dark:text-white text-black;
}
.markdown-content .code-content code {
  @apply text-white;
}
/* Mermaid容器样式 */
.mermaid-container {
  @apply my-4 mx-auto max-w-full overflow-auto bg-transparent;
}

.mermaid-container svg {
  @apply mx-auto;
}

.error-message {
  @apply p-4 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-md;
}

/* 水平线样式 */
.markdown-content hr {
  @apply my-6 border-t border-border;
}

/* 添加适当的图片样式 */
.markdown-content img {
  @apply max-w-full h-auto my-4 mx-auto;
}

/* 链接样式 */
.markdown-content a {
  @apply text-primary hover:underline;
}
</style>
