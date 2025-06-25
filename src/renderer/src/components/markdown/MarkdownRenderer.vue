<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="prose prose-sm dark:prose-invert w-full max-w-none break-all">
    <pre v-if="debug">{{ JSON.stringify(parsedNodes, null, 2) }}</pre>

    <!-- 使用结构化节点渲染 -->
    <NodeRenderer
      :nodes="parsedNodes"
      :message-id="messageId"
      :thread-id="threadId"
      @copy="$emit('copy', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getMarkdown, ParsedNode, parseMarkdownToStructure } from '@/lib/markdown.helper'
import NodeRenderer from './NodeRenderer.vue'

const props = defineProps<{
  content: string
  messageId: string
  threadId?: string
  debug?: boolean
}>()

defineEmits(['copy'])

const md = getMarkdown()

// Parse markdown into structured nodes
const parsedNodes = computed<ParsedNode[]>(() => {
  return parseMarkdownToStructure(props.content, md)
})
</script>
