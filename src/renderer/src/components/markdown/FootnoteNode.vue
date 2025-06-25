<template>
  <div
    :id="`footnote-${node.id}`"
    class="flex mt-2 mb-2 text-sm leading-relaxed border-t border-[#eaecef] pt-2"
  >
    <span class="font-semibold mr-2 text-[#0366d6]">[{{ node.id }}]</span>
    <div class="flex-1">
      <NodeRenderer
        :nodes="node.children"
        :message-id="messageId"
        :thread-id="threadId"
        @copy="$emit('copy', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import NodeRenderer from './NodeRenderer.vue'

// 定义脚注节点
interface FootnoteNode {
  type: 'footnote'
  id: string
  children: { type: string; raw: string }[]
  raw: string
}

// 接收props
defineProps<{
  node: FootnoteNode
  messageId?: string
  threadId?: string
}>()

// 定义事件
defineEmits(['copy'])
</script>
