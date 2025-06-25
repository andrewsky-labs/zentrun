<template>
  <a
    class="link-node"
    :href="node.href"
    :title="node.title || ''"
    target="_blank"
    rel="noopener noreferrer"
  >
    <NodeRenderer
      :nodes="node.children"
      :message-id="messageId"
      :thread-id="threadId"
      @copy="$emit('copy', $event)"
    />
  </a>
</template>

<script setup lang="ts">
import NodeRenderer from './NodeRenderer.vue'

// 定义链接节点
interface LinkNode {
  type: 'link'
  href: string
  title: string | null
  text: string
  children: { type: string; raw: string }[]
  raw: string
}

// 接收props
defineProps<{
  node: LinkNode
  messageId?: string
  threadId?: string
}>()

// 定义事件
defineEmits(['copy'])
</script>

<style scoped>
.link-node {
  color: #0366d6;
  text-decoration: none;
}

.link-node:hover {
  text-decoration: underline;
}
</style>
