<script setup lang="ts">
import { inject, computed, ref } from 'vue'

const props = defineProps<{
  value?: number
}>()

// Get the current selected tab index from parent
const selectedIndex = inject('selectedIndex', ref(0))

// For simplicity, we'll rely on the provided value
const index = computed(() => (props.value !== undefined ? props.value : 0))
const isSelected = computed(() => selectedIndex.value === index.value)
</script>

<template>
  <div data-tab-panel role="tabpanel" :hidden="!isSelected">
    <slot v-if="isSelected"></slot>
  </div>
</template>
