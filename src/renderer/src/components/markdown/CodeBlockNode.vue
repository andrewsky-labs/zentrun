<template>
  <MermaidBlockNode v-if="isMermaid" :node="node" />
  <div v-else class="my-4 rounded-lg border border-border overflow-hidden shadow-sm">
    <div class="flex justify-between items-center p-2 bg-gray-100 dark:bg-zinc-800 text-xs">
      <span class="flex items-center space-x-2">
        <Icon :icon="languageIcon" class="w-4 h-4" />
        <span class="text-gray-600 dark:text-gray-400 font-mono font-bold">{{
          displayLanguage
        }}</span>
      </span>
      <div class="flex items-center space-x-2">
        <!-- Edit button for JavaScript and Python code blocks -->
        <button
          v-if="isEditableLanguage"
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="toggleEditMode"
        >
          {{ isEditing ? t('common.save') : t('common.edit') }}
        </button>

        <!-- Preview button for HTML/SVG -->
        <button
          v-if="isPreviewable"
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="previewCode"
        >
          {{ t('artifacts.preview') }}
        </button>

        <!-- Copy button -->
        <button
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="copyCode"
        >
          {{ copyText }}
        </button>
      </div>
    </div>
    <div
      ref="codeEditor"
      class="min-h-[30px] max-h-[500px] text-xs overflow-auto bg-gray-50 dark:bg-zinc-900 font-mono leading-relaxed"
      :data-language="node.language"
    ></div>

    <!-- Run code buttons for JavaScript and Python -->
    <div v-if="isJavaScript || isPython" class="p-2 bg-gray-50 dark:bg-zinc-900 border-t border-border">
      <button
        class="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
        @click="runCode"
        :disabled="isRunningCode"
      >
        <Icon v-if="isRunningCode" icon="lucide:loader" class="w-4 h-4 mr-2 animate-spin" />
        <Icon v-else icon="lucide:play" class="w-3 h-3" />
        <span>{{ t('common.run', 'Run') }}</span>
      </button>
    </div>

    <!-- Code execution result -->
    <div v-if="runCodeResult" class="p-3 bg-muted border-t border-border text-sm">
      <div class="flex justify-between items-center mb-2">
        <span class="font-medium">{{ t('common.codeExecutionResult', 'Code Execution Result') }}</span>
        <button
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="runCodeResult = ''"
        >
          <Icon icon="lucide:x" class="w-4 h-4" />
        </button>
      </div>
      <pre class="whitespace-pre-wrap">{{ runCodeResult }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThrottleFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import MermaidBlockNode from './MermaidBlockNode.vue'

import { anysphereThemeDark, anysphereThemeLight } from '@/lib/code.theme'

// Import stores
import { useArtifactStore } from '@/stores/artifact'
import { useCodeBlockStore } from '@/stores/codeBlock'
import { nanoid } from 'nanoid'
import { detectLanguage } from '@/lib/code.detect'
import { useThemeStore } from '@/stores/theme'
import { getLanguageExtension, getLanguageIcon, prepareLanguage } from '@/lib/code.lang'
import { usePresenter } from '@/composables/usePresenter'

const props = defineProps<{
  node: {
    type: 'code_block'
    language: string
    code: string
    raw: string
  }
  messageId?: string
  threadId?: string
}>()

prepareLanguage()

const { t } = useI18n()
const themeStore = useThemeStore()
const artifactStore = useArtifactStore()
const codeBlockStore = useCodeBlockStore()
const threadPresenter = usePresenter('threadPresenter')
const mcpPresenter = usePresenter('mcpPresenter')
const codeEditor = ref<HTMLElement | null>(null)
const copyText = ref(t('common.copy'))
const editorInstance = ref<EditorView | null>(null)
const codeLanguage = ref(props.node.language || '')
const isEditing = ref(false)
const currentCode = ref(props.node.code)
const isRunningCode = ref(false)
const runCodeResult = ref('')

// 创建节流版本的语言检测函数，1秒内最多执行一次
const throttledDetectLanguage = useThrottleFn(
  (code: string) => {
    codeLanguage.value = detectLanguage(code)
    console.log(codeLanguage.value)
  },
  1000,
  true
)

// Initialize language detection if needed, after the function is defined
if (props.node.language === '') {
  throttledDetectLanguage(props.node.code)
}

// Check if the language is previewable (HTML or SVG)
const isPreviewable = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return lang === 'html' || lang === 'svg'
})

// Check if the code block is a Mermaid diagram
const isMermaid = computed(() => codeLanguage.value.trim().toLowerCase() === 'mermaid')

// Check if the language is editable (JavaScript or Python)
const isEditableLanguage = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return lang === 'javascript' || lang === 'js' || lang === 'python' || lang === 'py'
})

// Check if the language is JavaScript
const isJavaScript = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return lang === 'javascript' || lang === 'js'
})

// Check if the language is Python
const isPython = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  console.log("isPython lang")
  console.log(lang)
  return lang === 'python' || lang === 'py'
})

// Toggle edit mode
const toggleEditMode = async () => {
  if (isEditing.value) {
    // Get the latest code directly from the editor view
    const latestCode = editorInstance.value ? editorInstance.value.state.doc.toString() : currentCode.value
    // Save the edited code
    if (props.messageId) {
      // Store in codeBlockStore for immediate UI update
      codeBlockStore.setEditedCode(
        props.messageId,
        codeLanguage.value,
        props.node.code,
        latestCode
      )

      try {
        // Get the current message to update its content
        const message = await threadPresenter.getMessage(props.messageId)
          console.log('Original message content:', message.content)
        if (message) {

          // Check if message.content is already an object or a string that needs parsing
          let content;
          if (typeof message.content === 'string') {
            // Parse the message content if it's a string
            content = JSON.parse(message.content);
          } else {
            // Use the content directly if it's already an object
            content = message.content;
          }
          console.log('Content structure:', content)

          let blockUpdated = false

          // Check if content is an array with "content" type objects
          if (Array.isArray(content)) {
            console.log('Found content array structure')

            // Iterate through all content blocks to find the one with our code
            for (let i = 0; i < content.length; i++) {
              if (content[i].type === 'content') {
                const contentBlock = content[i]
                const contentStr = contentBlock.content

                console.log('Checking content block:', i)
                console.log('Content string:', contentStr)

                // Split the content by ``` delimiters
                const parts = contentStr.split('```');

                // If we have at least 3 parts (before code, code with language, after code)
                if (parts.length >= 3) {
                  for (let j = 1; j < parts.length; j += 2) { // Check only the language+code parts (odd indices)
                    const langAndCode = parts[j].trim();
                    const langEndIndex = langAndCode.indexOf('\n');

                    if (langEndIndex !== -1) {
                      const blockLang = langAndCode.substring(0, langEndIndex).trim();
                      const blockCode = langAndCode.substring(langEndIndex + 1).trim();

                      // Check if this is the language we're looking for
                      if (blockLang === props.node.language ||
                          (blockLang === '' && props.node.language === '')) {
                        console.log('Found matching code block with language:', blockLang);
                        console.log('Original code:', blockCode);

                        // Replace this code block with the new code
                        parts[j] = codeLanguage.value + '\n' + latestCode;
                        blockUpdated = true;
                        break;
                      }
                    }
                  }

                  // If we found and updated a block, join everything back together
                  if (blockUpdated) {
                    const updatedContentStr = parts.join('```');
                    console.log('Updated content string:', updatedContentStr);
                    contentBlock.content = updatedContentStr;
                    console.log('Updated content block:', contentBlock);
                    break; // Exit after updating the matching block
                  }
                }
              }
            }

            // If no matching code block was found in any content block,
            // fall back to updating the first content block (backward compatibility)
            if (!blockUpdated && content.length > 0 && content[0].type === 'content') {
              console.log('No matching code block found, falling back to first content block')
              const contentBlock = content[0]
              contentBlock.content = "```" + codeLanguage.value + "\n" + latestCode + "\n```"
              console.log('Updated content block:', contentBlock)
              blockUpdated = true
            }
          }
          // Also try the previous approach for backward compatibility
          else {
            // Find and update the code block in the message content
            for (const block of content) {
              if (block.type === 'code_block' &&
                  block.language === props.node.language) {
                console.log('Found matching code block:', block)

                // Update the code in the block
                block.code = latestCode

                // Also update the raw content if it exists
                if (block.raw) {
                  console.log('Original raw content:', block.raw)

                  // Create a safer regex pattern based on the language
                  const langPattern = props.node.language ? props.node.language : '';
                  const codeBlockPattern = new RegExp('```' + langPattern + '[\\s\\S]*?```', 'g');
                  block.raw = block.raw.replace(codeBlockPattern, '```' + langPattern + '\n' + latestCode + '\n```');

                  console.log('Updated raw content:', block.raw)
                }

                blockUpdated = true
                console.log('Updated code block:', block)
                break; // Exit after updating the first matching block
              }
            }
          }

          if (!blockUpdated) {
            console.warn('No matching code block found to update')
          }

          // Save the updated message content back to the database
          // Always stringify the content to ensure it's saved properly
          const contentToSave = JSON.stringify(content)
          const result = await threadPresenter.editMessage(props.messageId, contentToSave)

          // Get the updated message to verify changes
          const updatedMessage = await threadPresenter.getMessage(props.messageId)
          console.log('Updated message content:', updatedMessage.content)
          console.log('Message update result:', result)

          // Create an artifact to ensure the changes are reflected in the UI
          if (props.threadId && blockUpdated) {
            // Create an artifact for the edited code block
            const artifactId = `code-edit-${nanoid(6)}`
            artifactStore.showArtifact(
              {
                id: artifactId,
                type: 'application/vnd.ant.code',
                title: `${displayLanguage.value} Code Updated`,
                content: latestCode,
                status: 'loaded'
              },
              props.messageId,
              props.threadId
            )
          }
        }
      } catch (error) {
        console.error('Failed to update message content:', error)
      }
    }
    isEditing.value = false
    // Recreate the editor with the updated code
    createEditor()
  } else {
    isEditing.value = true

    // Check if we have edited code for this block before entering edit mode
    if (props.messageId) {
      currentCode.value = codeBlockStore.getEditedCode(
        props.messageId,
        codeLanguage.value,
        props.node.code
      )
    }

    // Recreate the editor in editable mode
    createEditor()
  }
}

watch(
  () => props.node.language,
  (newLanguage) => {
    if (newLanguage === '') {
      throttledDetectLanguage(props.node.code)
    } else {
      codeLanguage.value = newLanguage
    }
  }
)

// 计算用于显示的语言名称
const displayLanguage = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()

  // 映射一些常见语言的显示名称
  const languageMap = {
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'JSX',
    tsx: 'TSX',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    py: 'Python',
    python: 'Python',
    rb: 'Ruby',
    go: 'Go',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    cs: 'C#',
    php: 'PHP',
    sh: 'Shell',
    bash: 'Bash',
    sql: 'SQL',
    yaml: 'YAML',
    md: 'Markdown',
    '': 'Plain Text',
    plain: 'Plain Text'
  }

  return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
})

// Computed property for language icon
const languageIcon = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return getLanguageIcon(lang)
})

// 获取语言扩展

// 复制代码
const copyCode = async () => {
  try {
    // Get the latest code from the editor if in edit mode
    const codeToCopy = isEditing.value && editorInstance.value
      ? editorInstance.value.state.doc.toString()
      : props.node.code

    await navigator.clipboard.writeText(codeToCopy)
    copyText.value = t('common.copySuccess')
    setTimeout(() => {
      copyText.value = t('common.copy')
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 预览HTML/SVG代码
const previewCode = () => {
  if (!isPreviewable.value || !props.messageId || !props.threadId) return

  // Get the latest code from the editor if in edit mode
  const codeToPreview = isEditing.value && editorInstance.value
    ? editorInstance.value.state.doc.toString()
    : props.node.code

  const lowerLang = props.node.language.toLowerCase()
  const artifactType = lowerLang === 'html' ? 'text/html' : 'image/svg+xml'
  const artifactTitle =
    lowerLang === 'html'
      ? t('artifacts.htmlPreviewTitle') || 'HTML Preview'
      : t('artifacts.svgPreviewTitle') || 'SVG Preview'

  artifactStore.showArtifact(
    {
      id: `temp-${lowerLang}-${nanoid()}`,
      type: artifactType,
      title: artifactTitle,
      content: codeToPreview,
      status: 'loaded'
    },
    props.messageId,
    props.threadId
  )
}

// 创建编辑器实例
const createEditor = () => {
  if (!codeEditor.value) return

  // Clean up existing editor if it exists
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }

  // Check if we have edited code for this block (if not already loaded in toggleEditMode)
  // We only need to check this in view mode since edit mode already loads it in toggleEditMode
  if (props.messageId && !isEditing.value) {
    currentCode.value = codeBlockStore.getEditedCode(
      props.messageId,
      codeLanguage.value,
      props.node.code
    )
  }

  // Set up CodeMirror extensions
  const extensions = [
    basicSetup,
    themeStore.isDark ? anysphereThemeDark : anysphereThemeLight,
    EditorView.lineWrapping,
    EditorState.tabSize.of(2),
    getLanguageExtension(props.node.language),
    // Only make it editable if in edit mode and it's an editable language
    EditorState.readOnly.of(!(isEditing.value && isEditableLanguage.value))
  ]

  try {
    // Create a listener for code changes when in edit mode
    let updateListener = null
    if (isEditing.value && isEditableLanguage.value) {
      updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          currentCode.value = update.state.doc.toString()
        }
      })
      extensions.push(updateListener)
    }

    const editorView = new EditorView({
      state: EditorState.create({
        doc: currentCode.value,
        extensions
      }),
      parent: codeEditor.value
    })
    editorInstance.value = editorView
    console.log(`Editor initialized for language: ${codeLanguage.value}, editable: ${isEditing.value && isEditableLanguage.value}`)
  } catch (error) {
    console.error('Failed to initialize editor:', error)
    // Fallback: use a simple pre tag
    const escapedCode = currentCode.value
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
  () => props.node.code,
  (newCode) => {
    if (!newCode) return

    // If it's a mermaid diagram, re-render it
    if (props.node.language.toLowerCase() === 'mermaid' && codeEditor.value) {
      return
    }

    // Check if we need to detect language
    if (props.node.language === '') {
      throttledDetectLanguage(newCode)
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
  () => props.node.language,
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

// Run code function for JavaScript and Python
const runCode = async () => {
  if (!props.messageId || !props.threadId) return

  isRunningCode.value = true
  runCodeResult.value = ''

  try {
    // Always get the latest code from the editor if it exists, otherwise use currentCode
    let codeToRun = ''

    if (editorInstance.value && editorInstance.value.state) {
      // Get code directly from editor instance
      codeToRun = editorInstance.value.state.doc.toString().trim()
    } else {
      // Fallback to currentCode if editor instance is not available
      codeToRun = currentCode.value.trim()
    }

    // Remove markdown code block syntax if present
    if (codeToRun.includes('```python')) {
      const parts = codeToRun.split('```python')
      codeToRun = parts[parts.length - 1].split('```')[0].trim()
    } else if (codeToRun.includes('```js') || codeToRun.includes('```javascript')) {
      const parts = codeToRun.split(/```(js|javascript)/)
      codeToRun = parts[parts.length - 1].split('```')[0].trim()
    }

    console.log("codeToRun:", codeToRun);
    let result = ''

    if (isJavaScript.value) {
      // Execute JavaScript code
      result = await mcpPresenter.runJavaScriptCode(codeToRun)
    } else if (isPython.value) {
      // Execute Python code
      result = await mcpPresenter.runPythonCode(codeToRun)

      // Check if the result contains an image
      const imageMarkerIndex = result.indexOf('__IMAGE_DATA__:')

      if (imageMarkerIndex !== -1) {
        // Split the result into text and image parts
        const textResult = result.substring(0, imageMarkerIndex).trim()
        const imageData = result.substring(imageMarkerIndex + '__IMAGE_DATA__:'.length)

        // Set the text result for display
        result = textResult || 'Figure generated successfully'

        // Create an artifact for the image
        const artifactId = `py-execution-${nanoid(6)}`
        artifactStore.showArtifact(
          {
            id: artifactId,
            type: 'image/png',
            title: 'Python Visualization Result',
            content: imageData,
            status: 'loaded'
          },
          props.messageId,
          props.threadId
        )
      }
    }

    // Display the result
    runCodeResult.value = result

    // Create an artifact for the code execution result
    const artifactId = `code-execution-${nanoid(6)}`
    artifactStore.showArtifact(
      {
        id: artifactId,
        type: 'application/vnd.ant.code',
        title: isJavaScript.value
          ? 'JavaScript Execution Result'
          : 'Python Execution Result',
        content: result,
        status: 'loaded'
      },
      props.messageId,
      props.threadId
    )
  } catch (error) {
    runCodeResult.value = `Error: ${error.message}`
  } finally {
    isRunningCode.value = false
  }
}

// 清理资源
onUnmounted(() => {
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }
})
</script>

<style>
/* Ensure CodeMirror inherits the right font in the editor */
.cm-editor .cm-content {
  font-family:
    ui-monospace,
    SFMono-Regular,
    SF Mono,
    Menlo,
    Consolas,
    Liberation Mono,
    monospace !important;
}
</style>
