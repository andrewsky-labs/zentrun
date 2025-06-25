<template>
  <div
    class="flex flex-col w-[360px] break-all shadow-sm my-2 items-start p-2 gap-2 rounded-lg border bg-card text-card-foreground"
  >
    <div v-if="block.extra?.needContinue" class="flex flex-row items-center gap-2 w-full">
      <div class="flex flex-row gap-2 items-center cursor-pointer">
        <Icon icon="lucide:info" class="w-4 h-4 text-red-500/80" />
      </div>
      <div
        class="prose prose-sm max-w-full break-all whitespace-pre-wrap leading-7 text-left text-card-foreground"
      >
        {{ t(block.content || '') }}
      </div>
    </div>

    <Button
      v-if="block.extra?.needContinue"
      class="bg-primary rounded-lg hover:bg-indigo-600/50 h-8"
      size="sm"
      @click="handleClick"
    >
      <Icon icon="lucide:check" class="w-4 h-4" />
      {{ t('components.messageBlockAction.continue') }}
    </Button>
    <div
      v-if="!block.extra?.needContinue"
      class="text-xs text-gray-500 flex flex-row gap-2 items-center"
    >
      <Icon icon="lucide:check" class="w-4 h-4" />{{ t('components.messageBlockAction.continued') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chat'
import { AssistantMessageBlock } from '@shared/chat'

const { t } = useI18n()
const chatStore = useChatStore()

const props = defineProps<{
  messageId: string
  conversationId: string
  block: AssistantMessageBlock
}>()

const handleClick = () => {
  console.log('handleClick')
  chatStore.continueStream(props.conversationId, props.messageId)
}
</script>
