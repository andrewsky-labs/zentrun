<template>
  <div class="flex items-center justify-between w-full p-2">
    <div class="flex flex-row gap-2 items-center">
      <Button
        class="w-7 h-7 rounded-md hover:bg-accent"
        size="icon"
        variant="outline"
        @click="onSidebarButtonClick"
      >
        <Icon
          v-if="chatStore.isSidebarOpen"
          icon="lucide:panel-left-close"
          class="w-4 h-4 text-muted-foreground"
        />
        <Icon v-else icon="lucide:panel-left-open" class="w-4 h-4 text-muted-foreground" />
      </Button>
      <Popover v-model:open="modelSelectOpen">
        <PopoverTrigger as-child>
          <Button variant="outline" class="flex items-center gap-1.5 px-2 h-7" size="sm">
            <ModelIcon class="w-5 h-5" :model-id="model.id"></ModelIcon>
            <!-- <Icon icon="lucide:message-circle" class="w-5 h-5 text-muted-foreground" /> -->
            <h2 class="text-xs font-bold">{{ model.name }}</h2>
            <Badge
              v-for="tag in model.tags"
              :key="tag"
              variant="outline"
              class="py-0 rounded-lg"
              size="xs"
              >{{ t(`model.tags.${tag}`) }}</Badge
            >
            <Icon icon="lucide:chevron-right" class="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" class="p-0 w-80">
          <ModelSelect @update:model="handleModelUpdate" />
        </PopoverContent>
      </Popover>
      <!-- Display active agent or zpilot if available -->
      <div v-if="hasActiveAgentOrZpilot" class="flex items-center h-7 px-2 gap-1 border border-border rounded-md ml-2">
        <span class="text-xs font-bold truncate">{{ activeAgentOrZpilotName }}</span>
        <Button
          class="w-5 h-5 p-0 rounded-full hover:bg-accent"
          size="icon"
          variant="ghost"
          @click="handleClearActiveAgentOrZpilot"
        >
          <Icon icon="lucide:x" class="w-3 h-3" />
        </Button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Popover>
        <PopoverTrigger as-child>
          <Button class="w-7 h-7 rounded-md hover:bg-accent" size="icon" variant="outline">
            <Icon icon="lucide:settings-2" class="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" class="p-0 w-80">
          <ChatConfig
            v-model:system-prompt="systemPrompt"
            :temperature="temperature"
            :context-length="contextLength"
            :max-tokens="maxTokens"
            :artifacts="artifacts"
            @update:temperature="updateTemperature"
            @update:context-length="updateContextLength"
            @update:max-tokens="updateMaxTokens"
            @update:artifacts="updateArtifacts"
          />
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ChatConfig from './ChatConfig.vue'
import ModelSelect from './ModelSelect.vue'
import ModelIcon from './icons/ModelIcon.vue'
import { MODEL_META } from '@shared/presenter'
import { onMounted, ref, watch, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { usePresenter } from '@/composables/usePresenter'
const configPresenter = usePresenter('configPresenter')

const { t } = useI18n()
const chatStore = useChatStore()

// Chat configuration state
const temperature = ref(chatStore.chatConfig.temperature)
const contextLength = ref(chatStore.chatConfig.contextLength)
const maxTokens = ref(chatStore.chatConfig.maxTokens)
const systemPrompt = ref(chatStore.chatConfig.systemPrompt)
const artifacts = ref(chatStore.chatConfig.artifacts)
const contextLengthLimit = ref(chatStore.chatConfig.contextLength)
const maxTokensLimit = ref(chatStore.chatConfig.maxTokens)

// Independent update functions
const updateTemperature = (value: number) => {
  temperature.value = value
}

const updateContextLength = (value: number) => {
  contextLength.value = value
}

const updateMaxTokens = (value: number) => {
  maxTokens.value = value
}

const updateArtifacts = (value: 0 | 1) => {
  artifacts.value = value
}

const onSidebarButtonClick = () => {
  chatStore.isSidebarOpen = !chatStore.isSidebarOpen
}

// Watch for changes and update store
watch(
  [temperature, contextLength, maxTokens, systemPrompt, artifacts],
  ([newTemp, newContext, newMaxTokens, newSystemPrompt, newArtifacts]) => {
    if (
      newTemp !== chatStore.chatConfig.temperature ||
      newContext !== chatStore.chatConfig.contextLength ||
      newMaxTokens !== chatStore.chatConfig.maxTokens ||
      newSystemPrompt !== chatStore.chatConfig.systemPrompt ||
      newArtifacts !== chatStore.chatConfig.artifacts
    ) {
      chatStore.updateChatConfig({
        temperature: newTemp,
        contextLength: newContext,
        maxTokens: newMaxTokens,
        systemPrompt: newSystemPrompt,
        artifacts: newArtifacts
      })
    }
  }
)

// Watch store changes to update local state
watch(
  () => chatStore.chatConfig,
  (newConfig) => {
    temperature.value = newConfig.temperature
    contextLength.value = newConfig.contextLength
    maxTokens.value = newConfig.maxTokens
    systemPrompt.value = newConfig.systemPrompt
    artifacts.value = newConfig.artifacts
  },
  { deep: true }
)

type Model = {
  name: string
  id: string
  tags: string[]
}

const props = withDefaults(
  defineProps<{
    model?: Model
  }>(),
  {
    model: () => ({
      name: 'DeepSeek R1',
      id: 'deepseek-r1',
      tags: ['reasoning']
    })
  }
)

const modelSelectOpen = ref(false)
const handleModelUpdate = (model: MODEL_META) => {
  chatStore.updateChatConfig({
    modelId: model.id,
    providerId: model.providerId
  })
  modelSelectOpen.value = false
}

// Computed properties for active agent or zpilot
const hasActiveAgentOrZpilot = computed(() => {
  return !!chatStore.activeAgent || !!chatStore.activeZpilot
})

const activeAgentOrZpilotName = computed(() => {
  if (chatStore.activeAgent) {
    return `Agent: ${chatStore.activeAgent.name}`
  }
  if (chatStore.activeZpilot) {
    return `Zpilot: ${chatStore.activeZpilot.name}`
  }
  return ''
})

// Method to clear active agent or zpilot
const handleClearActiveAgentOrZpilot = () => {
  if (chatStore.activeAgent) {
    chatStore.clearAgent()
  }
  if (chatStore.activeZpilot) {
    chatStore.clearZpilot()
  }
}

onMounted(async () => {
  if (props.model) {
    const config = await configPresenter.getModelDefaultConfig(props.model.id)
    contextLengthLimit.value = config.contextLength
    maxTokensLimit.value = config.maxTokens
  }
})
</script>

<style scoped></style>
