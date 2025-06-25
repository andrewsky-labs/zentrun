<template>
  <sup class="superscript-node">
    <component
      v-for="(child, index) in node.children"
      :key="index"
      :is="nodeComponents[child.type]"
      :node="child"
      :message-id="messageId"
    />
  </sup>
</template>

<script setup lang="ts">
import TextNode from './TextNode.vue'
import InlineCodeNode from './InlineCodeNode.vue'
import LinkNode from './LinkNode.vue'
import StrongNode from './StrongNode.vue'
import EmphasisNode from './EmphasisNode.vue'
import FootnoteReferenceNode from './FootnoteReferenceNode.vue'
import StrikethroughNode from './StrikethroughNode.vue'
import HighlightNode from './HighlightNode.vue'
import InsertNode from './InsertNode.vue'
import SubscriptNode from './SubscriptNode.vue'
import EmojiNode from './EmojiNode.vue'
import MathInlineNode from './MathInlineNode.vue'
import ReferenceNode from './ReferenceNode.vue'

interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'superscript'
    children: NodeChild[]
    raw: string
  }
  messageId: string
}>()

// Available node components for child rendering
const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  link: LinkNode,
  strong: StrongNode,
  emphasis: EmphasisNode,
  footnote_reference: FootnoteReferenceNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  emoji: EmojiNode,
  math_inline: MathInlineNode,
  reference: ReferenceNode
}
</script>

<style scoped>
.superscript-node {
  font-size: 0.8em;
  vertical-align: super;
}
</style>
