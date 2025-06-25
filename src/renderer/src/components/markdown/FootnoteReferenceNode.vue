<template>
  <sup class="footnote-reference">
    <a :href="`#footnote-${node.id}`" :title="`查看脚注 ${node.id}`" class="footnote-link"
      >[{{ node.id }}]</a
    >
  </sup>
</template>

<script setup lang="ts">
// 定义脚注引用节点
interface FootnoteReferenceNode {
  type: 'footnote_reference'
  id: string
  raw: string
}

// 接收props
defineProps<{
  node: FootnoteReferenceNode
}>()
</script>

<style scoped>
.footnote-reference {
  font-size: 0.75em;
  line-height: 0;
}

.footnote-link {
  color: #0366d6;
  text-decoration: none;
}

.footnote-link:hover {
  text-decoration: underline;
}
</style>
