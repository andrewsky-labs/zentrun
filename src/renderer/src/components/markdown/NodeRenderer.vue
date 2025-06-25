<template>
  <component
    v-for="(node, index) in nodes"
    :key="index"
    :is="nodeComponents[node.type] || fallbackComponent"
    :node="node"
    :message-id="messageId"
    :thread-id="threadId"
    @copy="$emit('copy', $event)"
  />
</template>

<script setup lang="ts">
import TextNode from './TextNode.vue'
import ParagraphNode from './ParagraphNode.vue'
import HeadingNode from './HeadingNode.vue'
import CodeBlockNode from './CodeBlockNode.vue'
import ListNode from './ListNode.vue'
import BlockquoteNode from './BlockquoteNode.vue'
import TableNode from './TableNode.vue'
import { BaseNode } from '@/lib/markdown.helper'
import DefinitionListNode from './DefinitionListNode.vue'
import FootnoteNode from './FootnoteNode.vue'
import FootnoteReferenceNode from './FootnoteReferenceNode.vue'
import AdmonitionNode from './AdmonitionNode.vue'
import HardBreakNode from './HardBreakNode.vue'
import LinkNode from './LinkNode.vue'
import ImageNode from './ImageNode.vue'
import ThematicBreakNode from './ThematicBreakNode.vue'
import MathInlineNode from './MathInlineNode.vue'
import MathBlockNode from './MathBlockNode.vue'
import ReferenceNode from './ReferenceNode.vue'
import StrongNode from './StrongNode.vue'
import EmphasisNode from './EmphasisNode.vue'
import StrikethroughNode from './StrikethroughNode.vue'
import HighlightNode from './HighlightNode.vue'
import InsertNode from './InsertNode.vue'
import SubscriptNode from './SubscriptNode.vue'
import SuperscriptNode from './SuperscriptNode.vue'
import EmojiNode from './EmojiNode.vue'
import CheckboxNode from './CheckboxNode.vue'
import InlineCodeNode from './InlineCodeNode.vue'

// 组件接收的 props
defineProps<{
  nodes: BaseNode[]
  messageId?: string
  threadId?: string
}>()

// 定义事件
defineEmits(['copy'])

// 组件映射表
const nodeComponents = {
  text: TextNode,
  paragraph: ParagraphNode,
  heading: HeadingNode,
  code_block: CodeBlockNode,
  list: ListNode,
  blockquote: BlockquoteNode,
  table: TableNode,
  definition_list: DefinitionListNode,
  footnote: FootnoteNode,
  footnote_reference: FootnoteReferenceNode,
  admonition: AdmonitionNode,
  hardbreak: HardBreakNode,
  link: LinkNode,
  image: ImageNode,
  thematic_break: ThematicBreakNode,
  math_inline: MathInlineNode,
  math_block: MathBlockNode,
  reference: ReferenceNode,
  strong: StrongNode,
  emphasis: EmphasisNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  checkbox: CheckboxNode,
  inline_code: InlineCodeNode
  // 可以添加更多节点类型
}

// 备用组件用于处理未知节点类型
const fallbackComponent = {
  props: ['node'],
  template: `<div class="unknown-node">{{ node.raw }}</div>`
}
</script>

<style scoped>
.unknown-node {
  color: #6a737d;
  font-style: italic;
  margin: 1rem 0;
}
</style>
