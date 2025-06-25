<template>
  <div class="admonition" :class="`admonition-${node.kind}`">
    <div class="admonition-header">
      <span class="admonition-icon" v-if="iconMap[node.kind]">{{ iconMap[node.kind] }}</span>
      <span class="admonition-title">{{ node.title }}</span>
    </div>
    <div class="admonition-content">
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

// 定义警告块节点
interface AdmonitionNode {
  type: 'admonition'
  kind: string
  title: string
  children: { type: string; raw: string }[]
  raw: string
}

// 接收props
defineProps<{
  node: AdmonitionNode
  messageId?: string
  threadId?: string
}>()

// 定义事件
defineEmits(['copy'])

// 不同类型的警告块图标
const iconMap = {
  note: 'ℹ️',
  info: 'ℹ️',
  tip: '💡',
  warning: '⚠️',
  danger: '❗',
  caution: '⚠️'
}
</script>

<style scoped>
.admonition {
  margin: 1rem 0;
  padding: 0;
  border-radius: 4px;
  border-left: 4px solid #eaecef;
  background-color: #f8f8f8;
  overflow: hidden;
}

.admonition-header {
  padding: 0.5rem 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.admonition-icon {
  margin-right: 0.5rem;
}

.admonition-content {
  padding: 0.5rem 1rem 1rem;
}

/* 不同类型的警告块样式 */
.admonition-note {
  border-left-color: #448aff;
}
.admonition-note .admonition-header {
  background-color: rgba(68, 138, 255, 0.1);
  color: #448aff;
}

.admonition-info {
  border-left-color: #448aff;
}
.admonition-info .admonition-header {
  background-color: rgba(68, 138, 255, 0.1);
  color: #448aff;
}

.admonition-tip {
  border-left-color: #00bfa5;
}
.admonition-tip .admonition-header {
  background-color: rgba(0, 191, 165, 0.1);
  color: #00bfa5;
}

.admonition-warning {
  border-left-color: #ff9100;
}
.admonition-warning .admonition-header {
  background-color: rgba(255, 145, 0, 0.1);
  color: #ff9100;
}

.admonition-danger {
  border-left-color: #ff5252;
}
.admonition-danger .admonition-header {
  background-color: rgba(255, 82, 82, 0.1);
  color: #ff5252;
}

.admonition-caution {
  border-left-color: #ff9100;
}
.admonition-caution .admonition-header {
  background-color: rgba(255, 145, 0, 0.1);
  color: #ff9100;
}
</style>
