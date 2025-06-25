<template>
  <div class="image-artifact">
    <img :src="props.block.content" alt="Python visualization" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  block: {
    artifact: {
      type: string
      title: string
    }
    content: string
  }
}>()
</script>

<style>
.image-artifact {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.image-artifact img {
  max-width: 100%;
  height: auto;
}
</style>
