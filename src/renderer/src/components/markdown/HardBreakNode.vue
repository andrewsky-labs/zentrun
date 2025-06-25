<template>
  <br class="hard-break" />
</template>

<script setup lang="ts">
// 定义硬换行节点
interface HardBreakNode {
  type: 'hardbreak'
  raw: string
}

// 接收props
defineProps<{
  node: HardBreakNode
}>()
</script>

<style scoped>
.hard-break {
  display: block;
}
</style>
