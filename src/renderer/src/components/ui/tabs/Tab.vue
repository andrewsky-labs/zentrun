<script setup lang="ts">
import { inject, computed, ref } from 'vue'

const props = defineProps<{
  value?: number
  disabled?: boolean
}>()

// Get the current selected tab index and update function from parent
const selectedIndex = inject('selectedIndex', ref(0))
const updateSelectedIndex = inject('updateSelectedIndex', (index: number) => {
  console.log('updateSelectedIndex', index)
})

// For simplicity in this component, we'll rely on the provided value
// or just use the parent's selectedIndex state
const index = computed(() => (props.value !== undefined ? props.value : 0))
const isSelected = computed(() => selectedIndex.value === index.value)

// Handle tab click
const handleClick = () => {
  if (!props.disabled) {
    updateSelectedIndex(index.value)
  }
}
</script>

<template>
  <button
    type="button"
    data-tab
    :aria-selected="isSelected"
    :disabled="disabled"
    @click="handleClick"
    class="focus:outline-none"
  >
    <slot></slot>
  </button>
</template>
