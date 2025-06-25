<template>
  <div class="flex flex-col overflow-hidden h-0 flex-1">
    <!-- 消息列表区域 -->
    <MessageList
      :key="chatStore.activeThreadId ?? 'default'"
      ref="messageList"
      :messages="chatStore.messages"
      @scroll-bottom="scrollToBottom"
    />

    <!-- 输入框区域 -->
    <div class="flex-none p-2">
      <ChatInput
        :disabled="!chatStore.activeThreadId || isGenerating"
        @send="handleSend"
        @file-upload="handleFileUpload"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import MessageList from './message/MessageList.vue'
import ChatInput from './ChatInput.vue'
import { useRoute } from 'vue-router'
import { UserMessageContent } from '@shared/chat'
import { STREAM_EVENTS } from '@/events'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from "vue-i18n";
const { t } = useI18n()

const route = useRoute()
const settingsStore = useSettingsStore()

const messageList = ref()

import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

const scrollToBottom = (smooth = true) => {
  messageList.value?.scrollToBottom(smooth)
}
const isGenerating = computed(() => {
  if (!chatStore.activeThreadId) return false
  return chatStore.generatingThreadIds.has(chatStore.activeThreadId)
})
const handleSend = async (msg: UserMessageContent) => {
  if (messageList.value) {
    // 在发送消息前将aboveThreshold设置为false，确保消息发送过程中总是滚动到底部
    messageList.value.aboveThreshold = false
  }
  scrollToBottom()
  await chatStore.sendMessage(msg)
  // 只有当用户在底部时才自动滚动
  if (!messageList.value?.aboveThreshold) {
    scrollToBottom()
  }
}

const handleFileUpload = () => {
  scrollToBottom()
}

// 监听流式响应
onMounted(async () => {
  window.electron.ipcRenderer.on(STREAM_EVENTS.RESPONSE, (_, msg) => {
    // console.log('stream-response', msg)
    chatStore.handleStreamResponse(msg)
  })

  window.electron.ipcRenderer.on(STREAM_EVENTS.END, (_, msg) => {
    chatStore.handleStreamEnd(msg)
  })

  window.electron.ipcRenderer.on(STREAM_EVENTS.ERROR, (_, msg) => {
    chatStore.handleStreamError(msg)
  })

  if (route.query.modelId && route.query.providerId) {
    const threadId = await chatStore.createThread(t('new-thread'), {
      modelId: route.query.modelId as string,
      providerId: route.query.providerId as string,
      artifacts: settingsStore.artifactsEffectEnabled ? 1 : 0
    })
    chatStore.setActiveThread(threadId)
  }
})

// 监听路由变化，创建新线程
watch(
  () => route.query,
  async () => {
    if (route.query.modelId && route.query.providerId) {
      const threadId = await chatStore.createThread(t('new-thread'), {
        modelId: route.query.modelId as string,
        providerId: route.query.providerId as string,
        artifacts: settingsStore.artifactsEffectEnabled ? 1 : 0
      })
      chatStore.setActiveThread(threadId)
    }
  }
)

// 清理事件监听
onUnmounted(async () => {
  window.electron.ipcRenderer.removeAllListeners(STREAM_EVENTS.RESPONSE)
  window.electron.ipcRenderer.removeAllListeners(STREAM_EVENTS.END)
  window.electron.ipcRenderer.removeAllListeners(STREAM_EVENTS.ERROR)
})
</script>
