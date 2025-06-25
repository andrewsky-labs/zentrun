<template>
  <figure class="text-center my-4">
    <img
      class="max-w-96 h-auto rounded-lg"
      :src="node.src"
      :alt="node.alt"
      :title="node.title || node.alt"
      @error="handleImageError"
      @load="handleImageLoad"
    />
    <figcaption v-if="node.alt" class="mt-2 text-sm text-gray-500 italic">
      {{ node.alt }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 定义图片节点
interface ImageNode {
  type: 'image'
  src: string
  alt: string
  title: string | null
  raw: string
}

// 图片加载状态
const imageLoaded = ref(false)
const hasError = ref(false)

// 处理图片加载错误
const handleImageError = () => {
  hasError.value = true
}

// 处理图片加载完成
const handleImageLoad = () => {
  imageLoaded.value = true
}

// 接收props
defineProps<{
  node: ImageNode
}>()
</script>
