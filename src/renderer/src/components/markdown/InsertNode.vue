<template>
  <ins class="insert-node">
    <component
      v-for="(child, index) in node.children"
      :key="index"
      :is="nodeComponents[child.type]"
      :node="child"
      :message-id="messageId"
    />
  </ins>
</template>

<script setup lang="ts">
import TextNode from './TextNode.vue'
import InlineCodeNode from './InlineCodeNode.vue'
import LinkNode from './LinkNode.vue'
import StrongNode from './StrongNode.vue'
import EmphasisNode from './EmphasisNode.vue'
import StrikethroughNode from './StrikethroughNode.vue'
import HighlightNode from './HighlightNode.vue'
import SubscriptNode from './SubscriptNode.vue'
import SuperscriptNode from './SuperscriptNode.vue'
import EmojiNode from './EmojiNode.vue'
import FootnoteReferenceNode from './FootnoteReferenceNode.vue'
import MathInlineNode from './MathInlineNode.vue'
import ReferenceNode from './ReferenceNode.vue'

interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'insert'
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
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  footnote_reference: FootnoteReferenceNode,
  math_inline: MathInlineNode,
  reference: ReferenceNode
}
</script>

<style scoped>
.insert-node {
  text-decoration: underline;
}
</style>
