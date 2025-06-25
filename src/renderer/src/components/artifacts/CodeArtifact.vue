<template>
  <div class="m-4 rounded-lg border border-border overflow-hidden shadow-sm">
    <div class="flex justify-between items-center p-2 bg-gray-100 dark:bg-zinc-800 text-xs">
      <span class="flex items-center space-x-2">
        <Icon :icon="languageIcon" class="w-4 h-4" />
        <span class="text-gray-600 dark:text-gray-400 font-mono font-bold">{{
          displayLanguage
        }}</span>
      </span>

      <button
        class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        @click="handleCopy"
      >
        {{ copied ? t('common.copySuccess') : t('common.copy') }}
      </button>
    </div>
    <div
      ref="codeEditor"
      class="min-h-[30px] text-xs overflow-auto bg-gray-50 dark:bg-zinc-900 font-mono leading-relaxed"
      :data-language="props.block.artifact?.language"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { getLanguageExtension, getLanguageIcon, prepareLanguage } from '@/lib/code.lang'
import { useThemeStore } from '@/stores/theme'
import { anysphereThemeDark, anysphereThemeLight } from '@/lib/code.theme'

const themeStore = useThemeStore()
const languageIcon = computed(() => {
  const lang = props.block.artifact?.language?.trim().toLowerCase() ?? ''
  return getLanguageIcon(lang)
})

prepareLanguage()

const { t } = useI18n()
const copied = ref(false)
const codeEditor = ref<HTMLElement>()
const editorInstance = ref<EditorView | null>(null)

const props = defineProps<{
  block: {
    artifact: {
      type: string
      title: string
      language?: string
    }
    content: string
  }
  isPreview: boolean
}>()

// 获取显示用的语言名称
const displayLanguage = computed(() => {
  const lang = props.block.artifact?.language?.toLowerCase() || 'text'
  const displayNames: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sql: 'SQL',
    json: 'JSON',
    yaml: 'YAML',
    markdown: 'Markdown',
    bash: 'Bash',
    shell: 'Shell',
    dockerfile: 'Dockerfile',
    vue: 'Vue',
    react: 'React',
    xml: 'XML',
    text: 'Plain Text'
  }
  return displayNames[lang] || lang.toUpperCase()
})

const handleCopy = async () => {
  try {
    window.api.copyText(props.block.content)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 创建编辑器实例
const createEditor = () => {
  if (!codeEditor.value) return

  // Clean up existing editor if it exists
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }

  // Set up CodeMirror extensions
  const extensions = [
    basicSetup,
    themeStore.isDark ? anysphereThemeDark : anysphereThemeLight,
    EditorView.lineWrapping,
    EditorState.tabSize.of(2),
    getLanguageExtension(props.block.artifact?.language ?? ''),
    EditorState.readOnly.of(true)
  ]

  try {
    const editorView = new EditorView({
      state: EditorState.create({
        doc: props.block.content,
        extensions
      }),
      parent: codeEditor.value
    })
    editorInstance.value = editorView
    console.log(`Editor initialized for language: ${props.block.artifact?.language}`)
  } catch (error) {
    console.error('Failed to initialize editor:', error)
    // Fallback: use a simple pre tag
    const escapedCode = props.block.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
    codeEditor.value.innerHTML = `<pre class="whitespace-pre-wrap text-gray-800 dark:text-gray-200 m-0">${escapedCode}</pre>`
  }
}

// 监听主题变化
watch(
  () => themeStore.isDark,
  () => {
    createEditor()
  }
)

// 监听代码变化
watch(
  () => props.block.content,
  (newCode) => {
    if (!newCode) return

    // If it's a mermaid diagram, re-render it
    if (props.block.artifact?.language?.toLowerCase() === 'mermaid' && codeEditor.value) {
      return
    }

    // For normal code blocks, update the editor content
    if (editorInstance.value) {
      const state = editorInstance.value.state

      editorInstance.value.dispatch({
        changes: { from: 0, to: state.doc.length, insert: newCode }
      })
    } else {
      // If editor not yet initialized, create it
      createEditor()
    }
  },
  { immediate: true }
)

// 监听语言变化
watch(
  () => props.block.artifact?.language,
  () => {
    // If the language changes, we need to recreate the editor with the new language
    createEditor()
  }
)

// 初始化代码编辑器
onMounted(() => {
  // Initial language setup is now handled above definitions
  createEditor()
})

// 清理资源
onUnmounted(() => {
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }
})
</script>
