<template>
  <code
    class="inline-block px-1 py-0.5 rounded text-xs font-mono bg-secondary before:content-[''] after:content-['']">{{ node.code }}</code>
</template>

<script setup lang="ts">
defineProps<{
  node: {
    type: 'inline_code'
    code: string
    raw: string
  }
  messageId: string
}>()
</script>
