<template>
  <div class="bg-gray-50 border rounded p-2 text-xs text-gray-700">
    <div v-if="isCollapsed && hasMultipleLines" class="whitespace-pre-wrap">
      {{ truncatedText }}
      <button @click="isCollapsed = false" class="ml-2 text-blue-500 hover:underline">Expand</button>
    </div>
    <div v-else class="whitespace-pre-wrap">
      {{ text }}
      <button
        v-if="hasMultipleLines"
        @click="isCollapsed = true"
        class="ml-2 text-blue-500 hover:underline"
      >
        Collapse
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  }
})

const isCollapsed = ref(true)

const hasMultipleLines = computed(() => {
  if (!props.text) return false
  const lineCount = (props.text.match(/\n/g) || []).length + 1
  return lineCount > 3
})

const truncatedText = computed(() => {
  if (!props.text) return ''
  const lines = props.text.split('\n')
  if (lines.length <= 3) return props.text

  return lines.slice(0, 3).join('\n') + '\n...'
})
</script>
