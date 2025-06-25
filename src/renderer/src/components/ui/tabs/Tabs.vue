<template>
  <div class="space-y-2">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

const props = defineProps<{
  defaultValue?: string
  value?: string
}>()

const emit = defineEmits<{
  'update:value': [value: string]
}>()

// Use defaultValue if provided, otherwise use value or empty string
const selectedValue = ref(props.value || props.defaultValue || '')

// Update selected value
const updateSelectedValue = (value: string) => {
  selectedValue.value = value
  emit('update:value', value)
}

// Provide tab context to child components
provide('selectedValue', selectedValue)
provide('updateSelectedValue', updateSelectedValue)
</script>
