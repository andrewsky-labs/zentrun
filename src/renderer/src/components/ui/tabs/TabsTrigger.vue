<template>
  <button
    type="button"
    role="tab"
    :data-state="isSelected ? 'active' : 'inactive'"
    :aria-selected="isSelected"
    :disabled="disabled"
    @click="handleClick"
    class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { inject, computed, ref } from 'vue'

const props = defineProps<{
  value: string
  disabled?: boolean
}>()

// Get the current selected value and update function from parent
const selectedValue = inject('selectedValue', ref(''))
const updateSelectedValue = inject('updateSelectedValue', (value: string) => {
  console.log('updateSelectedValue', value)
})

const isSelected = computed(() => selectedValue.value === props.value)

// Handle tab click
const handleClick = () => {
  if (!props.disabled) {
    updateSelectedValue(props.value)
  }
}
</script>
