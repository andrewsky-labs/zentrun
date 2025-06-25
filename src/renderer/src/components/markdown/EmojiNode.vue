<template>
  <span class="emoji-node">{{ node.emoji }}</span>
</template>

<script setup lang="ts">
defineProps<{
  node: {
    type: 'emoji'
    emoji: string
    raw: string
  }
  messageId: string
}>()
</script>

<style scoped>
.emoji-node {
  display: inline-block;
}
</style>
