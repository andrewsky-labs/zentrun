<template>
  <li class="list-item">
    <NodeRenderer
      :nodes="item.children"
      :message-id="messageId"
      :thread-id="threadId"
      @copy="$emit('copy', $event)"
    />
  </li>
</template>

<script setup lang="ts">
import NodeRenderer from './NodeRenderer.vue'

// 节点子元素类型
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

// 列表项类型
interface ListItem {
  type: 'list_item'
  children: NodeChild[]
  raw: string
}

defineProps<{
  item: ListItem
  messageId: string
  threadId?: string
}>()

defineEmits<{
  copy: [text: string]
}>()
</script>
