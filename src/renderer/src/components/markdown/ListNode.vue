<template>
  <component :is="node.ordered ? 'ol' : 'ul'" class="list-node">
    <ListItemNode
      v-for="(item, index) in node.items"
      :key="index"
      :item="item"
      :message-id="messageId"
      :thread-id="threadId"
      @copy="$emit('copy', $event)"
    />
  </component>
</template>

<script setup lang="ts">
import ListItemNode from './ListItemNode.vue'

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
  node: {
    type: 'list'
    ordered: boolean
    items: ListItem[]
    raw: string
  }
  messageId: string
  threadId?: string
}>()

defineEmits<{
  copy: [text: string]
}>()
</script>
