<template>
  <div ref="mathElement" class="math-block text-center overflow-x-auto"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import katex from 'katex'

const props = defineProps<{
  node: {
    type: 'math_block'
    content: string
    raw: string
  }
}>()

const mathElement = ref<HTMLElement | null>(null)

// Function to render math using KaTeX
const renderMath = () => {
  if (!mathElement.value || !props.node.content) return

  try {
    katex.render(props.node.content, mathElement.value, {
      throwOnError: false,
      displayMode: true, // Display mode for block math
      output: 'html'
    })
  } catch (error) {
    console.error('KaTeX rendering error:', error)
    // Fallback to displaying the raw math
    mathElement.value.textContent = props.node.raw
  }
}

// Render math on component mount
onMounted(() => {
  renderMath()
})

// Re-render when content changes
watch(
  () => props.node.content,
  () => {
    renderMath()
  }
)
</script>
