<template>
  <span
    ref="referenceNode"
    class="cursor-pointer bg-accent text-xs rounded-md px-1.5 mx-0.5 hover:bg-secondary"
    role="button"
    tabindex="0"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    {{ node.id }}
  </span>
</template>

<script setup lang="ts">
import { useReferenceStore } from '@/stores/reference'
import { usePresenter } from '@/composables/usePresenter'
import { ref } from 'vue'

const referenceStore = useReferenceStore()
const threadPresenter = usePresenter('threadPresenter')
const referenceNode = ref<HTMLElement | null>(null)
const props = defineProps<{
  node: {
    type: 'reference'
    id: string
    raw: string
  }
  messageId?: string
  threadId?: string
}>()

// Click handler for references - can be implemented to scroll to references or show a tooltip
const handleClick = () => {
  // You can implement reference click behavior here
  // For example, scroll to the reference section, or show a tooltip with the reference content
  console.log('Reference clicked:', props.node.id)
  threadPresenter.getSearchResults(props.messageId ?? '').then((results) => {
    const index = parseInt(props.node.id)
    if (index < results.length) {
      window.open(results[index - 1].url, '_blank', 'noopener,noreferrer')
    }
  })
}
const handleMouseEnter = () => {
  console.log('Mouse entered')
  referenceStore.hideReference()
  threadPresenter.getSearchResults(props.messageId ?? '').then((results) => {
    const index = parseInt(props.node.id)
    if (index - 1 < results.length && referenceNode.value) {
      referenceStore.showReference(results[index - 1], referenceNode.value.getBoundingClientRect())
    }
  })
}
const handleMouseLeave = () => {
  console.log('Mouse left')
  referenceStore.hideReference()
}
</script>

<style scoped></style>
