<template>
  <div
    role="tabpanel"
    :data-state="isSelected ? 'active' : 'inactive'"
    :hidden="!isSelected"
    class="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <slot v-if="isSelected"></slot>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref } from 'vue'

const props = defineProps<{
  value: string
}>()

// Get the current selected value from parent
const selectedValue = inject('selectedValue', ref(''))

const isSelected = computed(() => selectedValue.value === props.value)
</script>
