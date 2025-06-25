<template>
  <dl class="definition-list">
    <template v-for="(item, index) in node.items" :key="index">
      <dt class="definition-term">
        <NodeRenderer
          :nodes="item.term"
          :message-id="messageId"
          :thread-id="threadId"
          @copy="$emit('copy', $event)"
        />
      </dt>
      <dd class="definition-desc">
        <NodeRenderer
          :nodes="item.definition"
          :message-id="messageId"
          :thread-id="threadId"
          @copy="$emit('copy', $event)"
        />
      </dd>
    </template>
  </dl>
</template>

<script setup lang="ts">
import NodeRenderer from './NodeRenderer.vue'

// 定义定义项节点
interface DefinitionItemNode {
  type: 'definition_item'
  term: { type: string; raw: string }[]
  definition: { type: string; raw: string }[]
  raw: string
}

// 定义定义列表节点
interface DefinitionListNode {
  type: 'definition_list'
  items: DefinitionItemNode[]
  raw: string
}

// 接收props
defineProps<{
  node: DefinitionListNode
  messageId?: string
  threadId?: string
}>()

// 定义事件
defineEmits(['copy'])
</script>

<style scoped>
.definition-list {
  margin: 0 0 1rem;
}

.definition-term {
  font-weight: 600;
  margin-top: 0.5rem;
}

.definition-desc {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}
</style>
