<template>
  <div class="w-full h-full relative min-h-0">
    <div
      ref="messagesContainer"
      class="relative flex-1 overflow-y-auto scroll-smooth w-full h-full"
      @scroll="handleScroll"
    >
      <div
        ref="messageList"
        class="w-full max-w-full break-all xl:max-w-4xl mx-auto transition-opacity duration-300"
        :class="{ 'opacity-0': !visible }"
      >
        <template v-for="(msg, index) in messages" :key="msg.id">
          <MessageItemAssistant
            v-if="msg.role === 'assistant'"
            :key="index"
            :ref="setAssistantRef(index)"
            :is-dark="themeStore.isDark"
            :messages="messages"
            :message="msg as AssistantMessage"
          />
          <MessageItemUser
            v-if="msg.role === 'user'"
            :key="index"
            :message="msg as UserMessage"
            :messages="messages"
            @retry="handleRetry(index)"
          />
        </template>
      </div>
      <div ref="scrollAnchor" class="h-8" />
    </div>
    <div v-if="showCancelButton" class="absolute bottom-2 left-1/2 -translate-x-1/2">
      <Button variant="outline" size="sm" class="rounded-lg" @click="handleCancel">
        <Icon icon="lucide:loader" class="w-4 h-4 mr-2 animate-spin" />
        <Icon
          icon="lucide:square"
          class="w-6 h-6 bg-red-500 p-1 text-primary-foreground rounded-full"
        />
        <span class="">{{ t('common.cancel') }}</span>
      </Button>
    </div>
    <div
      v-else
      class="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center"
      :class="[aboveThreshold ? 'w-36' : ' w-24']"
      :style="{
        transition: 'width 300ms ease-in-out'
      }"
    >
      <Button variant="outline" size="sm" class="rounded-lg shrink-0" @click="createNewThread">
        <Icon icon="lucide:plus" class="w-6 h-6 text-muted-foreground" />
        <span class="">{{ t('common.newChat') }}</span>
      </Button>
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <Button
          v-if="aboveThreshold"
          variant="outline"
          size="icon"
          class="w-8 h-8 ml-2 shrink-0 rounded-lg"
          @click="scrollToBottom"
        >
          <Icon icon="lucide:arrow-down" class="w-5 h-5 text-muted-foreground" />
        </Button>
      </transition>
    </div>
    <ReferencePreview
      class="pointer-events-none"
      :show="referenceStore.showPreview"
      :content="referenceStore.currentReference"
      :rect="referenceStore.previewRect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed, reactive } from 'vue'
import MessageItemAssistant from './MessageItemAssistant.vue'
import MessageItemUser from './MessageItemUser.vue'
import { AssistantMessage, UserMessage } from '@shared/chat'
import { useElementBounding, useDebounceFn } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'
import { useChatStore } from '@/stores/chat'
import { useI18n } from 'vue-i18n'
import { useReferenceStore } from '@/stores/reference'
import ReferencePreview from './ReferencePreview.vue'
import { useThemeStore } from '@/stores/theme'
const { t } = useI18n()
const props = defineProps<{
  messages: UserMessage[] | AssistantMessage[]
}>()
const themeStore = useThemeStore()

const referenceStore = useReferenceStore()

const messagesContainer = ref<HTMLDivElement>()
const messageList = ref<HTMLDivElement>()
const scrollAnchor = ref<HTMLDivElement>()
const visible = ref(false)
const chatStore = useChatStore()
// Store refs as Record to avoid type checking issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assistantRefs = reactive<Record<number, any>>({})

// Helper function to set refs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setAssistantRef = (index: number) => (el: any) => {
  if (el) {
    assistantRefs[index] = el
  }
}
const scrollToBottom = () => {
  nextTick(() => {
    scrollAnchor.value?.scrollIntoView({
      behavior: 'instant',
      block: 'end'
    })
  })
}
onMounted(() => {
  setTimeout(() => {
    scrollToBottom()
    nextTick(() => {
      visible.value = true
    })
  }, 100)
  const { height } = useElementBounding(messageList.value)
  watch(
    () => height.value,
    () => {
      const lastMessage = props.messages[props.messages.length - 1]
      if (lastMessage?.status === 'pending' && !aboveThreshold.value) {
        scrollToBottom()
      }
    }
  )
})

const aboveThreshold = ref(false)
const SCROLL_THRESHOLD = 20
const handleScroll = useDebounceFn((event) => {
  const rect = messageList.value?.getBoundingClientRect()
  const container = event.target
  if (rect?.height) {
    const scrollBottom = container.scrollHeight - (container.scrollTop + container.clientHeight)
    aboveThreshold.value = scrollBottom > SCROLL_THRESHOLD
  }
}, 100)

const showCancelButton = computed(() => {
  return chatStore.generatingThreadIds.has(chatStore.activeThreadId ?? '')
})

const handleCancel = () => {
  if (!chatStore.activeThreadId) return
  chatStore.cancelGenerating(chatStore.activeThreadId)
}

// Handle retry event from MessageItemUser
const handleRetry = (index: number) => {
  // Find the next assistant message after this user message
  for (let i = index + 1; i < props.messages.length; i++) {
    if (props.messages[i].role === 'assistant') {
      try {
        const assistantRef = assistantRefs[i]
        if (assistantRef && typeof assistantRef.handleAction === 'function') {
          assistantRef.handleAction('retry')
          break
        }
      } catch (error) {
        console.error('Failed to trigger retry action:', error)
      }
    }
  }
}
// 创建新会话
const createNewThread = async () => {
  try {
    await chatStore.clearActiveThread()
  } catch (error) {
    console.error(t('common.error.createChatFailed'), error)
  }
}
defineExpose({
  scrollToBottom,
  aboveThreshold
})
</script>
