<template>
  <p>
    <component
      v-for="(child, index) in node.children"
      :key="index"
      :is="nodeComponents[child.type]"
      :node="child"
      :message-id="messageId"
      :thread-id="threadId"
    />
  </p>
</template>

<script setup lang="ts">
import TextNode from './TextNode.vue'
import InlineCodeNode from './InlineCodeNode.vue'
import ImageNode from './ImageNode.vue'
import LinkNode from './LinkNode.vue'
import HardBreakNode from './HardBreakNode.vue'
import EmphasisNode from './EmphasisNode.vue'
import StrongNode from './StrongNode.vue'
import StrikethroughNode from './StrikethroughNode.vue'
import HighlightNode from './HighlightNode.vue'
import InsertNode from './InsertNode.vue'
import SubscriptNode from './SubscriptNode.vue'
import SuperscriptNode from './SuperscriptNode.vue'
import EmojiNode from './EmojiNode.vue'
import CheckboxNode from './CheckboxNode.vue'
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
    type: 'paragraph'
    children: NodeChild[]
    raw: string
  }
  messageId: string
  threadId?: string
}>()

const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  image: ImageNode,
  link: LinkNode,
  hardbreak: HardBreakNode,
  emphasis: EmphasisNode,
  strong: StrongNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  checkbox: CheckboxNode,
  math_inline: MathInlineNode,
  reference: ReferenceNode
  // 添加其他内联元素组件
}
</script>
