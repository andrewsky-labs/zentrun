<template>
  <blockquote class="blockquote">
    <NodeRenderer
      :nodes="node.children"
      :message-id="messageId"
      :thread-id="threadId"
      @copy="$emit('copy', $event)"
    />
  </blockquote>
</template>

<script setup lang="ts">
import NodeRenderer from './NodeRenderer.vue'

// 定义组件接收的引用块节点
interface BlockquoteNode {
  type: 'blockquote'
  children: { type: string; raw: string }[]
  raw: string
}

// 接收 props
defineProps<{
  node: BlockquoteNode
  messageId?: string
  threadId?: string
}>()

// 定义事件
defineEmits(['copy'])
</script>

<style scoped>
.blockquote {
  margin: 0 0 1rem;
  padding: 0 1rem;
  color: #6a737d;
  border-left: 0.25rem solid #dfe2e5;
}
</style>
