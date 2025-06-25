<script setup lang="ts">
import { ref, provide } from 'vue'

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [index: number]
}>()

const selectedIndex = ref(props.modelValue || 0)

// Update selected index when modelValue changes
const updateSelectedIndex = (index: number) => {
  selectedIndex.value = index
  emit('update:modelValue', index)
}

// Provide tab context to child components
provide('selectedIndex', selectedIndex)
provide('updateSelectedIndex', updateSelectedIndex)
</script>

<template>
  <div class="space-y-2">
    <slot></slot>
  </div>
</template>
