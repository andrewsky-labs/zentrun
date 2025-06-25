<template>
  <component :is="`h${node.level}`" class="heading-node" :class="[`heading-${node.level}`]">
    <component
      v-for="(child, index) in node.children"
      :key="index"
      :is="nodeComponents[child.type]"
      :node="child"
      :message-id="messageId"
    />
  </component>
</template>

<script setup lang="ts">
import TextNode from './TextNode.vue'
import InlineCodeNode from './InlineCodeNode.vue'
import LinkNode from './LinkNode.vue'
import ImageNode from './ImageNode.vue'
import StrongNode from './StrongNode.vue'
import EmphasisNode from './EmphasisNode.vue'
import StrikethroughNode from './StrikethroughNode.vue'
import HighlightNode from './HighlightNode.vue'
import InsertNode from './InsertNode.vue'
import SubscriptNode from './SubscriptNode.vue'
import SuperscriptNode from './SuperscriptNode.vue'
import EmojiNode from './EmojiNode.vue'
import CheckboxNode from './CheckboxNode.vue'
import FootnoteReferenceNode from './FootnoteReferenceNode.vue'
import HardBreakNode from './HardBreakNode.vue'
import MathInlineNode from './MathInlineNode.vue'
import ReferenceNode from './ReferenceNode.vue'

// Define the type for the node children
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'heading'
    level: number
    text: string
    children: NodeChild[]
    raw: string
  }
  messageId: string
}>()

const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  link: LinkNode,
  image: ImageNode,
  strong: StrongNode,
  emphasis: EmphasisNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  checkbox: CheckboxNode,
  footnote_reference: FootnoteReferenceNode,
  hardbreak: HardBreakNode,
  math_inline: MathInlineNode,
  reference: ReferenceNode
  // 添加其他内联元素组件
}
</script>

<style scoped>
.heading-node {
  @apply font-semibold leading-tight;
}

.heading-1 {
  @apply mt-6 mb-2 text-4xl;
}

.heading-2 {
  @apply mt-5 mb-2 text-2xl;
}

.heading-3 {
  @apply mt-4 mb-2 text-xl;
}

.heading-4 {
  @apply mt-4 mb-2 text-base;
}

.heading-5 {
  @apply mt-3.5 mb-2 text-sm;
}

.heading-6 {
  @apply mt-3.5 mb-2 text-sm text-gray-600;
}
</style>
