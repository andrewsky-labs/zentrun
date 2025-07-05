<template>
  <div class="message-toolbar-container" :class="props.class">
   <TooltipProvider>
    <div
      class="w-full h-8 text-xs text-secondary-foreground items-center justify-between flex flex-row opacity-0 group-hover:opacity-100 transition-opacity"
      :class="[isAssistant ? '' : 'flex-row-reverse']"
    >
      <span v-show="!loading" class="flex flex-row gap-3">
        <!-- Edit mode buttons (save/cancel) -->
        <template v-if="isEditMode">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('save')"
              >
                <Icon icon="lucide:check" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.save') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('cancel')"
              >
                <Icon icon="lucide:x" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.cancel') }}</TooltipContent>
          </Tooltip>
        </template>

        <!-- Normal mode buttons -->
        <template v-else>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                v-show="isAssistant && hasVariants"
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('prev')"
              >
                <Icon icon="lucide:chevron-left" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.previousVariant') }}</TooltipContent>
          </Tooltip>
          <span v-show="isAssistant && hasVariants">
            {{ currentVariantIndex !== undefined ? currentVariantIndex + 1 : 1 }} /
            {{ totalVariants }}
          </span>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                v-show="isAssistant && hasVariants"
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('next')"
              >
                <Icon icon="lucide:chevron-right" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.nextVariant') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('copy')"
              >
                <Icon icon="lucide:copy" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.copy') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                v-show="isAssistant"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('copyImage')"
              >
                <Icon icon="lucide:images" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.copyImage') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                v-show="isAssistant"
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('retry')"
              >
                <Icon icon="lucide:refresh-cw" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.retry') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                v-show="isAssistant && !loading && !isInGeneratingThread"
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('fork')"
              >
                <Icon icon="lucide:git-branch" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.fork') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                v-show="!isAssistant && !isEditMode"
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('edit')"
              >
                <Icon icon="lucide:edit" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.edit') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="w-4 h-4 text-muted-foreground hover:text-primary hover:bg-transparent"
                @click="emit('delete')"
              >
                <Icon icon="lucide:trash-2" class="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('thread.toolbar.delete') }}</TooltipContent>
          </Tooltip>
        </template>
      </span>
      <span class="flex flex-row gap-2">
        <template v-if="usage.input_tokens > 0 || usage.output_tokens > 0">
          <span class="text-xs flex flex-row items-center">
            <Icon icon="lucide:arrow-up" class="w-3 h-3" />{{ usage.input_tokens }}
          </span>
          <span class="text-xs flex flex-row items-center">
            <Icon icon="lucide:arrow-down" class="w-3 h-3" />{{ usage.output_tokens }}
          </span>
        </template>
        <template v-if="hasTokensPerSecond">{{ usage.tokens_per_second?.toFixed(2) }}/s</template>
      </span>
    </div>
   </TooltipProvider>

<!-- Normal mode buttons -->
  <div
    v-if="isAssistant && isLastAssistantMessage"
    class="w-full h-8 text-xs text-secondary-foreground items-center justify-between flex flex-row"
    :class="[isAssistant ? '' : 'flex-row-reverse']"
  >
    <div class="flex gap-2">
      <!-- Run JavaScript Code button - only shown when JavaScript code is detected -->
      <Button
        v-if="hasJavaScriptCode"
        variant="outline"
        size="sm"
        class="text-xs text-muted-foreground justify-start gap-2 mt-2"
        :disabled="isRunningCode"
        @click="runJavaScriptCode"
      >
        <Icon icon="lucide:play" class="h-4 w-4" />
        <span>{{ t('common.run', "Run") }} </span>
      </Button>

      <!-- Run Python Code button - only shown when Python code is detected -->
      <Button
        v-if="hasPythonCode"
        variant="outline"
        size="sm"
        class="text-xs text-muted-foreground justify-start gap-2 mt-2"
        :disabled="isRunningCode"
        @click="runPythonCode"
      >
        <Icon v-if="isRunningCode" icon="lucide:loader" class="w-4 h-4 mr-2 animate-spin" />
        <Icon icon="lucide:play" class="h-4 w-4" />
        <span>{{ t('common.run', "Run") }}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        class="text-xs text-muted-foreground justify-start gap-2 mt-2"
        @click="showZentSavePanel = true;"
      >
        <Icon icon="lucide:pen-line" class="h-4 w-4" />
        <span>{{ t('common.saveZent') }}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        class="text-xs text-muted-foreground justify-start gap-2 mt-2"
        @click="showAutomationPanel = true;"
      >
        <Icon icon="lucide:clock" class="h-4 w-4" />
        <span>{{ t('common.automateZent') }}</span>
      </Button>
    </div>
  </div>

  <!-- Code execution result panel -->
  <div v-if="runCodeResult || resultImages.length > 0" class="mt-2 p-3 bg-muted rounded-md text-sm">
    <div class="flex justify-between items-center mb-2">
<!--      <span class="font-medium">Code Execution Result</span>-->
        <div></div>
      <Button
        variant="ghost"
        size="sm"
        class="h-6 w-6 p-0"
        @click="clearResults"
      >
        <Icon icon="lucide:x" class="h-4 w-4" />
      </Button>
    </div>
    <!-- Display result images -->
    <div v-if="resultImages.length > 0" class="flex flex-col gap-3">
      <div v-for="(image, index) in resultImages" :key="index" class="border border-border rounded-md overflow-hidden">
        <div class="bg-gray-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium">
          {{ t('common.image', 'Image') }} {{ index + 1 }}
        </div>
        <img :src="`${image}`" class="max-w-full" />
      </div>
    </div>
    <p v-if="runCodeResult" class="whitespace-pre-wrap mb-3">{{ runCodeResult }}</p>
  </div>
    <ZentSavePanel
      v-show="showZentSavePanel"
      :visible="showZentSavePanel"
      :messages="messages"
      :tool-calls="currentContent?.filter(x => x.type === 'tool_call').map((x) => {return x.tool_call})"
      @close="showZentSavePanel = false"
    />
    <AutomationPanel
      v-show="showAutomationPanel"
      :visible="showAutomationPanel"
      :messages="messages"
      :tool-calls="currentContent?.filter(x => x.type === 'tool_call').map((x) => {return x.tool_call})"
      @close="showAutomationPanel = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ZentSavePanel from './ZentSavePanel.vue'
import AutomationPanel from './AutomationPanel.vue'
import { getMarkdown, parseMarkdownToStructure, CodeBlockNode } from '@/lib/markdown.helper'
import { useArtifactStore } from '@/stores/artifact'
import { useCodeBlockStore } from '@/stores/codeBlock'
import { nanoid } from 'nanoid'
import { useChatStore } from '@/stores/chat'

const artifactStore = useArtifactStore()
const codeBlockStore = useCodeBlockStore()
const showZentSavePanel = ref(false)
const showAutomationPanel = ref(false)
const showRunCodeButton = ref(false)
const runCodeResult = ref('')
const isRunningCode = ref(false)
const resultImages = ref<string[]>([])
const chatStore = useChatStore()
const threadPresenter = usePresenter('threadPresenter')

// Function to clear both text result and images
const clearResults = () => {
  runCodeResult.value = ''
  resultImages.value = []
}

// Function to extract JavaScript code blocks from message content
const extractJavaScriptCode = (content) => {
  if (!content) return null

  const md = getMarkdown()
  const parsedNodes = parseMarkdownToStructure(content, md)

  // Find all JavaScript code blocks
  const jsCodeBlocks = parsedNodes.filter(node =>
    node.type === 'code_block' &&
    (node.language === 'javascript' || node.language === 'js')
  ) as CodeBlockNode[]

  // If no code blocks found, return null
  if (jsCodeBlocks.length === 0) return null

  // Get the last JavaScript code block
  const lastCodeBlock = jsCodeBlocks[jsCodeBlocks.length - 1]

  // Check if there's an edited version of this code block
  if (props.messageId) {
    const language = lastCodeBlock.language || 'javascript'
    const originalCode = lastCodeBlock.code
    return codeBlockStore.getEditedCode(props.messageId, language, originalCode)
  }

  // Return the original code if no edited version exists
  return lastCodeBlock.code
}

// Function to extract Python code blocks from message content
const extractPythonCode = (content) => {
  if (!content) return null

  const md = getMarkdown()
  const parsedNodes = parseMarkdownToStructure(content, md)

  // Find all Python code blocks
  const pythonCodeBlocks = parsedNodes.filter(node =>
    node.type === 'code_block' &&
    (node.language === 'python' || node.language === 'py')
  ) as CodeBlockNode[]

  // If no code blocks found, return null
  if (pythonCodeBlocks.length === 0) return null

  // Get the last Python code block
  const lastCodeBlock = pythonCodeBlocks[pythonCodeBlocks.length - 1]

  // Check if there's an edited version of this code block
  if (props.messageId) {
    const language = lastCodeBlock.language || 'python'
    const originalCode = lastCodeBlock.code
    return codeBlockStore.getEditedCode(props.messageId, language, originalCode)
  }

  // Return the original code if no edited version exists
  return lastCodeBlock.code.split('```python')[lastCodeBlock.code.split('```python').length - 1]
}
// TODO: 실제 데이터로 교체 필요
// const toolCalls = [
//   {
//     order: 1,
//     id: 'call_6HR2kWPxRLKmHSUGIicpf8MD',
//     type: 'mcp',
//     mcpName: 'file-system',
//     mcpImageUrl: 'https://abc.com/def.png',
//     name: 'write_file',
//     argumentsExample: '{"path":"/home/yeo/123.txt","content":"123"}',
//     response: "错误: Error: Operation not permitted. The 'write_file' operation on server 'buildInFileSystem' requires appropriate permissions.",
//     timestamp: 1747705042153
//   },
//   {
//     order: 2,
//     id: 'call_Spc0pogDd82vHufVDgWfICwx',
//     type: 'mcp',
//     mcpName: 'file-system',
//     mcpImageUrl: 'https://abc.com/def.png',
//     name: 'list_allowed_directories',
//     arguments: '{}',
//     response: 'Allowed directories:\n/home/yeo',
//     timestamp: 1747705043928
//   },
//   {
//     order: 3,
//     id: 'call_xR99k7eyLKel3b4gtdoKIk6z',
//     type: 'mcp',
//     mcpName: 'file-system',
//     mcpImageUrl: 'https://abc.com/def.png',
//     name: 'write_file',
//     argumentsExample: '{\n  "path": "/home/yeo/123.txt",\n  "content": "123"\n}',
//     response: "错误: Error: Operation not permitted. The 'write_file' operation on server 'buildInFileSystem' requires appropriate permissions.",
//     timestamp: 1747705045803
//   },
//   {
//     order: 4,
//     type: 'mcp',
//     mcpName: 'file-system',
//     mcpImageUrl: 'https://abc.com/def.png',
//     id: 'call_xfD5K02k1U5Ofax6vgOsxmS4',
//     name: 'list_allowed_directories',
//     arguments: '{}',
//     response: 'Allowed directories:\n/home/yeo',
//     timestamp: 1747705049000
//   }
// ]

import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from 'vue-i18n'
import { usePresenter } from '@/composables/usePresenter'

const { t } = useI18n()
const mcpPresenter = usePresenter('mcpPresenter')

const props = defineProps<{
  usage: {
    tokens_per_second: number
    total_tokens: number
    reasoning_start_time: number
    reasoning_end_time: number
    input_tokens: number
    output_tokens: number
  }
  loading: boolean
  isAssistant: boolean
  isLastAssistantMessage?: boolean
  currentContent?: object
  messages?: object
  currentVariantIndex?: number
  totalVariants?: number
  isEditMode?: boolean
  isInGeneratingThread?: boolean
  class?: string
  messageId?: string
  threadId?: string
}>()
const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'delete'): void
  (e: 'copy'): void
  (e: 'copyImage'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'edit'): void
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'fork'): void
}>()

const hasTokensPerSecond = computed(() => props.usage.tokens_per_second > 0)
const hasVariants = computed(() => (props.totalVariants || 0) > 1)

// Check if there's a JavaScript code block in the current message
const hasJavaScriptCode = computed(() => {
  if (!props.isAssistant || !props.currentContent) return false

  // For each content block of type 'content', check if it contains JavaScript code
  const contentBlocks = Array.isArray(props.currentContent)
    ? props.currentContent.filter(block => block.type === 'content')
    : []

  for (const block of contentBlocks) {
    if (block.content && extractJavaScriptCode(block.content)) {
      return true
    }
  }

  return false
})

// Check if there's a Python code block in the current message
const hasPythonCode = computed(() => {
  if (!props.isAssistant || !props.currentContent) return false

  // For each content block of type 'content', check if it contains Python code
  const contentBlocks = Array.isArray(props.currentContent)
    ? props.currentContent.filter(block => block.type === 'content')
    : []

  for (const block of contentBlocks) {
    if (block.content && extractPythonCode(block.content)) {
      return true
    }
  }

  return false
})

// Function to execute JavaScript code using vm2
const runJavaScriptCode = async () => {
  if (!props.isAssistant || !props.currentContent || !props.messageId || !props.threadId) return

  isRunningCode.value = true
  runCodeResult.value = ''
  resultImages.value = [] // Clear previous images

  try {
    // For each content block of type 'content', extract and run JavaScript code
    const contentBlocks = Array.isArray(props.currentContent)
      ? props.currentContent.filter(block => block.type === 'content')
      : []

    let jsCode = null

    // Find the last JavaScript code block
    for (const block of contentBlocks) {
      if (block.content) {
        const extractedCode = extractJavaScriptCode(block.content)
        if (extractedCode) {
          jsCode = extractedCode
        }
      }
    }

    if (jsCode) {
      // Execute the code using mcpPresenter
      const result = await mcpPresenter.runJavaScriptCode(jsCode)

      // Check if the result contains images
      const imageMarkerIndex = result.indexOf('__IMAGE_DATA__:')

      console.log("imageMarkerIndex2", imageMarkerIndex);
      if (imageMarkerIndex !== -1) {
        // Handle multiple images in the result
        let currentResult = result;
        let currentImageMarkerIndex = currentResult.indexOf('__IMAGE_DATA__:');

        // Extract all images from the result
        while (currentImageMarkerIndex !== -1) {
          // Get the text before the image marker
          const textBeforeImage = currentResult.substring(0, currentImageMarkerIndex).trim();

          // Find the end of the image data (next marker or end of string)
          const nextMarkerIndex = currentResult.indexOf('__IMAGE_DATA__:', currentImageMarkerIndex + 1);
          const imageDataEnd = nextMarkerIndex !== -1 ? nextMarkerIndex : currentResult.length;

          // Extract the image data
          const imageData = currentResult.substring(currentImageMarkerIndex + '__IMAGE_DATA__:'.length, imageDataEnd);

          // Add the image to the resultImages array
          resultImages.value.push(imageData);

          // Update the current result to continue searching
          if (nextMarkerIndex !== -1) {
            currentResult = textBeforeImage + currentResult.substring(imageDataEnd);
            currentImageMarkerIndex = currentResult.indexOf('__IMAGE_DATA__:');
          } else {
            currentResult = textBeforeImage;
            currentImageMarkerIndex = -1;
          }
        }

        // Set the text result for display in the message
        runCodeResult.value = currentResult || 'Figures generated successfully'
      } else {
        runCodeResult.value = result
      }
    }
  } catch (error) {
    runCodeResult.value = `Error: ${error.message}`
  } finally {
    isRunningCode.value = false
  }
}

// Function to execute Python code
const runPythonCode = async () => {
  if (!props.isAssistant || !props.currentContent || !props.messageId || !props.threadId) return

  isRunningCode.value = true
  runCodeResult.value = ''
  resultImages.value = [] // Clear previous images

  try {
    // For each content block of type 'content', extract and run Python code
    const contentBlocks = Array.isArray(props.currentContent)
      ? props.currentContent.filter(block => block.type === 'content')
      : []

    let pythonCode = null

    // Find the last Python code block
    for (const block of contentBlocks) {
      if (block.content) {
        const extractedCode = extractPythonCode(block.content)
        if (extractedCode) {
          pythonCode = extractedCode
        }
      }
    }

    if (pythonCode) {
      // Execute the code using mcpPresenter
      const result = await mcpPresenter.runPythonCode(pythonCode.split('</antArtifact>')[0])

      // Check if the result contains images
      const imageMarkerIndex = result.indexOf('__IMAGE_DATA__:')

      if (imageMarkerIndex !== -1) {
        // Handle multiple images in the result
        let currentResult = result;
        let currentImageMarkerIndex = currentResult.indexOf('__IMAGE_DATA__:');

        // Extract all images from the result
        while (currentImageMarkerIndex !== -1) {
          // Get the text before the image marker
          const textBeforeImage = currentResult.substring(0, currentImageMarkerIndex).trim();

          // Find the end of the image data (next marker or end of string)
          const nextMarkerIndex = currentResult.indexOf('__IMAGE_DATA__:', currentImageMarkerIndex + 1);
          const imageDataEnd = nextMarkerIndex !== -1 ? nextMarkerIndex : currentResult.length;

          // Extract the image data
          const imageData = currentResult.substring(currentImageMarkerIndex + '__IMAGE_DATA__:'.length, imageDataEnd);

          // Add the image to the resultImages array
          resultImages.value.push(imageData);

          // Update the current result to continue searching
          if (nextMarkerIndex !== -1) {
            currentResult = textBeforeImage + currentResult.substring(imageDataEnd);
            currentImageMarkerIndex = currentResult.indexOf('__IMAGE_DATA__:');
          } else {
            currentResult = textBeforeImage;
            currentImageMarkerIndex = -1;
          }
        }

        // Set the text result for display in the message
        runCodeResult.value = currentResult || 'Figures generated successfully'
      } else {
        // No image, just text output
        runCodeResult.value = result
      }
    }
  } catch (error) {
    runCodeResult.value = `Error: ${error.message}`
  } finally {
    isRunningCode.value = false
  }
}
</script>
