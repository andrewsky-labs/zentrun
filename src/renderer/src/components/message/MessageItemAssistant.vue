<template>
  <div
    ref="messageNode"
    :class="['flex flex-row py-4 pl-4 pr-11 group gap-2 w-full', 'justify-start']"
  >
    <ModelIcon
      :model-id="message.model_id"
      custom-class="flex-shrink-0 w-5 h-5 block rounded-md bg-background"
      :alt="message.role"
    />
    <div class="flex flex-col w-full space-y-1.5">
      <MessageInfo :name="message.model_name" :timestamp="message.timestamp" />
      <div
        v-if="currentContent.length === 0"
        class="flex flex-row items-center gap-2 text-xs text-muted-foreground"
      >
        <Icon icon="lucide:loader-circle" class="w-4 h-4 animate-spin" />
        {{ t('chat.messages.thinking') }}
      </div>
      <div v-else class="flex flex-col w-full space-y-2">
        <template v-for="(block, idx) in currentContent" :key="`${message.id}-${idx}`">
          <MessageBlockContent
            v-if="block.type === 'content'"
            :block="block"
            :message-id="message.id"
            :thread-id="currentThreadId"
            :is-search-result="isSearchResult"
          />
          <MessageBlockThink
            v-else-if="block.type === 'reasoning_content'"
            :block="block"
            :usage="message.usage"
          />
          <MessageBlockSearch
            v-else-if="block.type === 'search'"
            :message-id="message.id"
            :block="block"
          />
          <MessageBlockToolCall
            v-else-if="block.type === 'tool_call'"
            :block="block"
            :message-id="message.id"
            :thread-id="currentThreadId"
          />
          <MessageBlockAction
            v-else-if="block.type === 'action'"
            :message-id="message.id"
            :conversation-id="currentThreadId"
            :block="block"
          />
          <MessageBlockImage
            v-else-if="block.type === 'image'"
            :block="block"
            :message-id="message.id"
            :thread-id="currentThreadId"
          />
          <MessageBlockError v-else-if="block.type === 'error'" :block="block" />
        </template>
      </div>
      <MessageToolbar
        :loading="message.status === 'pending'"
        :usage="message.usage"
        :messages="messages"
        :current-content="currentContent"
        :is-assistant="true"
        :is-last-assistant-message="isLastAssistantMessage"
        :current-variant-index="currentVariantIndex"
        :total-variants="totalVariants"
        :is-in-generating-thread="chatStore.generatingThreadIds.has(currentThreadId)"
        :message-id="message.id"
        :thread-id="currentThreadId"
        @retry="handleAction('retry')"
        @delete="handleAction('delete')"
        @copy="handleAction('copy')"
        @copyImage="handleAction('copyImage')"
        @prev="handleAction('prev')"
        @next="handleAction('next')"
        @fork="handleAction('fork')"
      />
    </div>
  </div>

  <!-- 分支会话确认对话框 -->
  <Dialog v-model:open="isForkDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialog.fork.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialog.fork.description') }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="cancelFork">
          {{ t('dialog.cancel') }}
        </Button>
        <Button variant="default" @click="confirmFork">
          {{ t('dialog.fork.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, useTemplateRef } from 'vue'
import { AssistantMessage, AssistantMessageBlock } from '@shared/chat'
import MessageBlockContent from './MessageBlockContent.vue'
import MessageBlockThink from './MessageBlockThink.vue'
import MessageBlockSearch from './MessageBlockSearch.vue'
import MessageBlockToolCall from './MessageBlockToolCall.vue'
import MessageBlockError from './MessageBlockError.vue'
import MessageToolbar from './MessageToolbar.vue'
import MessageInfo from './MessageInfo.vue'
import { useChatStore } from '@/stores/chat'
import ModelIcon from '@/components/icons/ModelIcon.vue'
import { Icon } from '@iconify/vue'
import { toCanvas } from 'html-to-image'
import MessageBlockAction from './MessageBlockAction.vue'
import { useI18n } from 'vue-i18n'
import { addWatermark } from '@/lib/watermark'
import MessageBlockImage from './MessageBlockImage.vue'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { usePresenter } from '@/composables/usePresenter'

const devicePresenter = usePresenter('devicePresenter')

const appVersion = ref('')

const props = defineProps<{
  message: AssistantMessage
  messages: { type: Array<AssistantMessage>, default: () => [] }
  isDark: boolean
}>()

const chatStore = useChatStore()
const currentVariantIndex = ref(0)
const { t } = useI18n()

const messageNode = useTemplateRef('messageNode')

// 获取当前会话ID
const currentThreadId = computed(() => chatStore.activeThreadId || '')

// 计算当前消息的所有变体（包括缓存中的）
const allVariants = computed(() => {
  const messageVariants = props.message.variants || []
  const combinedVariants = messageVariants.map((variant) => {
    const cachedVariant = Array.from(chatStore.generatingMessagesCache.values()).find((cached) => {
      const msg = cached.message as AssistantMessage
      return msg.is_variant && msg.id === variant.id
    })
    return cachedVariant ? cachedVariant.message : variant
  })
  return combinedVariants
})

// 计算变体总数
const totalVariants = computed(() => allVariants.value.length + 1)

// 获取当前显示的内容
const currentContent = computed(() => {
  if (currentVariantIndex.value === 0) {
    return props.message.content as AssistantMessageBlock[]
  }

  const variant = allVariants.value[currentVariantIndex.value - 1]
  return (variant?.content || props.message.content) as AssistantMessageBlock[]
})

// 监听变体变化
watch(
  () => allVariants.value.length,
  (newLength, oldLength) => {
    // 如果当前没有选中任何变体，或者当前选中的是最后一个变体
    // 则自动跟随最新的变体
    if (currentVariantIndex.value === 0 || newLength > oldLength) {
      currentVariantIndex.value = newLength
    }
    // 如果当前选中的变体超出范围，调整到最后一个变体
    else if (currentVariantIndex.value > newLength) {
      currentVariantIndex.value = newLength
    }
  }
)

const isSearchResult = computed(() => {
  return Boolean(
    currentContent.value?.some((block) => block.type === 'search' && block.status === 'success')
  )
})

// Determine if this is the last assistant message in the conversation
const isLastAssistantMessage = computed(() => {
  if (!props.messages || props.messages.length === 0) return false

  // Filter to get only assistant messages
  const assistantMessages = props.messages.filter(msg => msg.role === 'assistant')

  // If there are no assistant messages, return false
  if (assistantMessages.length === 0) return false

  // Get the last assistant message
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]

  // Check if the current message is the last assistant message
  return lastAssistantMessage.id === props.message.id
})

onMounted(async () => {
  currentVariantIndex.value = allVariants.value.length
  appVersion.value = await devicePresenter.getAppVersion()
})

const filterDom = (node: HTMLElement) => {
  return !node.classList?.contains('message-toolbar')
}

// 分支会话对话框
const isForkDialogOpen = ref(false)

// 显示分支对话框
const showForkDialog = () => {
  isForkDialogOpen.value = true
}

// 取消分支
const cancelFork = () => {
  isForkDialogOpen.value = false
}

// 确认分支
const confirmFork = async () => {
  try {
    // 执行fork操作
    await chatStore.forkThread(props.message.id, t('dialog.fork.tag'))
    isForkDialogOpen.value = false
  } catch (error) {
    console.error('创建对话分支失败:', error)
  }
}

const handleAction = (
  action: 'retry' | 'delete' | 'copy' | 'prev' | 'next' | 'copyImage' | 'fork'
) => {
  if (action === 'retry') {
    chatStore.retryMessage(props.message.id)
  } else if (action === 'delete') {
    chatStore.deleteMessage(props.message.id)
  } else if (action === 'copy') {
    window.api.copyText(
      currentContent.value
        .map((block) => {
          if (block.type === 'reasoning_content' || block.type === 'artifact-thinking') {
            return `<think>${block.content}</think>`
          }
          return block.content
        })
        .join('\n')
    )
  } else if (action === 'prev') {
    if (currentVariantIndex.value > 0) {
      currentVariantIndex.value--
    }
  } else if (action === 'next') {
    if (currentVariantIndex.value < totalVariants.value - 1) {
      currentVariantIndex.value++
    }
  } else if (action === 'copyImage') {
    if (messageNode.value) {
      toCanvas(messageNode.value, {
        backgroundColor: props.isDark ? '#000000' : '#FFFFFF',
        filter: filterDom
      }).then((canvas) => {
        // 添加水印
        const canvasWithWatermark = addWatermark(
          canvas,
          props.isDark,
          appVersion.value, // 添加版本号水印
          t
        )
        // 转换为Blob
        canvasWithWatermark.toBlob(
          (blob) => {
            if (blob) {
              const rd = new FileReader()
              rd.onloadend = () => {
                const url = rd.result as string
                window.api.copyImage(url)
              }
              rd.readAsDataURL(blob)
            }
          },
          'image/png',
          1
        )
      })
    }
  } else if (action === 'fork') {
    showForkDialog()
  }
}

// Expose the handleAction method to parent components
defineExpose({
  handleAction
})
</script>
