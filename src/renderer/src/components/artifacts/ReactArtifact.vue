<template>
  <div class="w-full h-full">
    <iframe
      ref="iframeRef"
      :srcdoc="htmlContent"
      class="w-full h-full min-h-[400px]"
      sandbox="allow-scripts allow-same-origin allow-popups"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { formatTemplate } from './ReactTemplate'

const props = defineProps<{
  block: {
    artifact: {
      type: string
      title: string
    }
    content: string
  }
  isPreview: boolean
}>()

const iframeRef = ref<HTMLIFrameElement>()

onMounted(() => {
  if (props.isPreview && iframeRef.value) {
    const iframe = iframeRef.value
    iframe.onload = () => {
      // 调整 iframe 高度以适应内容
      const height = iframe.contentWindow?.document.documentElement.scrollHeight
      if (height) {
        iframe.style.height = `${height}px`
      }
    }
  }
})
const htmlContent = computed(() => {
  return formatTemplate(props.block.artifact.title, props.block.content)
})
</script>
