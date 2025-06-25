<template>
  <div class="flex h-full bg-background">
    <!-- 左侧会话列表 -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-300 ease-in"
      enter-from-class="-translate-x-full opacity-0"
      leave-to-class="-translate-x-full opacity-0"
    >
      <ThreadsView v-show="chatStore.isSidebarOpen" class="transform" />
    </Transition>

    <!-- 主聊天区域 -->
    <div class="flex-1 flex flex-col w-0">
      <!-- 新会话 -->
      <NewThread v-if="!chatStore.activeThreadId" />
      <template v-else>
        <!-- 标题栏 -->
        <TitleView :model="activeModel" />

        <!-- 聊天内容区域 -->
        <ChatView />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useChatStore } from '@/stores/chat'
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { RENDERER_MODEL_META } from '@shared/presenter'

const ThreadsView = defineAsyncComponent(() => import('@/components/ThreadsView.vue'))
const TitleView = defineAsyncComponent(() => import('@/components/TitleView.vue'))
const ChatView = defineAsyncComponent(() => import('@/components/ChatView.vue'))
const NewThread = defineAsyncComponent(() => import('@/components/NewThread.vue'))

const settingsStore = useSettingsStore()

const chatStore = useChatStore()
const activeModel = computed(() => {
  let model: RENDERER_MODEL_META | undefined
  const modelId = chatStore.activeThread?.settings.modelId
  if (modelId) {
    for (const group of settingsStore.enabledModels) {
      const foundModel = group.models.find((m) => m.id === modelId)
      if (foundModel) {
        model = foundModel
        break
      }
    }

    if (!model) {
      for (const group of settingsStore.customModels) {
        const foundModel = group.models.find((m) => m.id === modelId)
        if (foundModel) {
          model = foundModel
          break
        }
      }
    }
  }
  if (!model) {
    model = {
      name: chatStore.activeThread?.settings.modelId || '',
      id: chatStore.activeThread?.settings.modelId || '',
      group: '',
      providerId: '',
      enabled: false,
      isCustom: false,
      contextLength: 0,
      maxTokens: 0
    }
  }
  return {
    name: model.name,
    id: model.id,
    tags: []
  }
})
</script>

<style>
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, #000 1px, transparent 1px),
    linear-gradient(to bottom, #000 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 添加全局样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db80;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af80;
}
</style>
