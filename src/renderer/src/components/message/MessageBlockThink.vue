<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="text-xs text-muted-foreground bg-muted rounded-lg border flex flex-col gap-2 px-2 py-2"
  >
    <div class="flex flex-row gap-2 items-center cursor-pointer" @click="collapse = !collapse">
      <Button variant="ghost" size="icon" class="w-4 h-4 text-muted-foreground">
        <Icon icon="lucide:chevrons-up-down" class="w-4 h-4" />
      </Button>
      <span class="flex-grow"
        >{{
          block.status === 'loading'
            ? t('chat.features.deepThinkingProgress')
            : t('chat.features.deepThinking')
        }}
        <span>{{
          reasoningDuration > 0 ? t('chat.features.thinkingDuration', [reasoningDuration]) : ''
        }}</span>
      </span>
    </div>
    <div v-show="!collapse" ref="messageBlock" class="w-full relative">
      <div
        class="prose prose-sm dark:prose-invert w-full max-w-full leading-7 break-all"
        v-html="renderedContent"
      ></div>
    </div>

    <Icon
      v-if="block.status === 'loading'"
      icon="lucide:loader-circle"
      class="w-4 h-4 text-muted-foreground animate-spin"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { computed, onMounted, ref, watch } from 'vue'
import { usePresenter } from '@/composables/usePresenter'
import MarkdownIt from 'markdown-it'
import { AssistantMessageBlock } from '@shared/chat'

const { t } = useI18n()

const configPresenter = usePresenter('configPresenter')

const messageBlock = ref<HTMLDivElement | null>(null)

const collapse = ref(false)
const reasoningDuration = computed(() => {
  return Math.floor((props.usage.reasoning_end_time - props.usage.reasoning_start_time) / 1000)
})

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})

const renderedContent = computed(() => {
  const content = props.block.content || ''

  return md.render(content)
})

watch(
  () => collapse.value,
  () => {
    configPresenter.setSetting('think_collapse', collapse.value)
  }
)

onMounted(async () => {
  collapse.value = Boolean(await configPresenter.getSetting('think_collapse'))
})

const props = defineProps<{
  block: AssistantMessageBlock
  usage: {
    reasoning_start_time: number
    reasoning_end_time: number
  }
}>()
</script>
