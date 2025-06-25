<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="artifactStore.isOpen"
      class="absolute right-0 top-0 bottom-0 w-[calc(60%_-_104px)] bg-background border-l shadow-lg flex flex-col"
    >
      <!-- 顶部导航栏 -->
      <div class="flex items-center justify-between px-4 h-11 border-b w-full overflow-hidden">
        <div class="flex items-center gap-2 flex-grow w-0">
          <button class="p-2 hover:bg-accent/50 rounded-md" @click="artifactStore.hideArtifact">
            <Icon icon="lucide:arrow-left" class="w-4 h-4" />
          </button>
          <h2 class="text-sm font-medium truncate">{{ artifactStore.currentArtifact?.title }}</h2>
        </div>

        <div class="flex items-center gap-2">
          <!-- 预览/代码切换按钮组 -->
          <div class="bg-muted p-0.5 rounded-lg flex items-center">
            <button
              class="px-2 py-1 text-xs rounded-md transition-colors"
              :class="
                isPreview
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50'
              "
              @click="setPreview(true)"
            >
              {{ t('artifacts.preview') }}
            </button>
            <button
              class="px-2 py-1 text-xs rounded-md transition-colors"
              :class="
                !isPreview
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50'
              "
              @click="setPreview(false)"
            >
              {{ t('artifacts.code') }}
            </button>
          </div>

          <!-- 导出按钮 -->
          <div class="flex items-center gap-1">
            <Button
              v-if="
                artifactStore.currentArtifact?.type === 'image/svg+xml' ||
                artifactStore.currentArtifact?.type === 'image/png' ||
                artifactStore.currentArtifact?.type === 'application/vnd.ant.mermaid'
              "
              variant="outline"
              size="sm"
              :title="t('artifacts.export')"
              class="text-xs h-7"
              @click="exportImage"
            >
              <Icon icon="lucide:download" class="w-4 h-4" />
            </Button>
            <Button
              v-if="isPreview && artifactStore.currentArtifact?.content"
              variant="outline"
              size="sm"
              class="text-xs h-7"
              :title="t('artifacts.copy')"
              @click="copyContent"
            >
              <Icon icon="lucide:copy" class="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="text-xs h-7"
              :title="t('artifacts.export')"
              @click="exportCode"
            >
              <Icon icon="lucide:download" class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-auto h-0">
        <template v-if="isPreview">
          <component
            :is="artifactComponent"
            v-if="artifactComponent && artifactStore.currentArtifact"
            :key="componentKey"
            :block="{
              content: artifactStore.currentArtifact.content,
              artifact: {
                type: artifactStore.currentArtifact.type,
                title: artifactStore.currentArtifact.title
              }
            }"
            :is-preview="isPreview"
          />
        </template>
        <template v-else>
          <div class="flex-1 p-4 h-0">
            <pre
              class="rounded-lg bg-muted p-4 w-full h-hull overflow-auto"
            ><code class="text-xs">{{ artifactStore.currentArtifact?.content }}</code></pre>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtifactStore } from '@/stores/artifact'
import { Icon } from '@iconify/vue'
import Button from '@/components/ui/button/Button.vue'
import CodeArtifact from './CodeArtifact.vue'
import MarkdownArtifact from './MarkdownArtifact.vue'
import HTMLArtifact from './HTMLArtifact.vue'
import SvgArtifact from './SvgArtifact.vue'
import ImageArtifact from './ImageArtifact.vue'
import MermaidArtifact from './MermaidArtifact.vue'
import mermaid from 'mermaid'
import { useI18n } from 'vue-i18n'
import ReactArtifact from './ReactArtifact.vue'

const artifactStore = useArtifactStore()
const componentKey = ref(0)
const isPreview = ref(false)
const t = useI18n().t

const setPreview = (value: boolean) => {
  isPreview.value = value
}

// 监听 artifact 变化，强制重新渲染组件
watch(
  () => artifactStore.currentArtifact,
  () => {
    componentKey.value++
  },
  {
    immediate: true
  }
)

watch(
  () => artifactStore.currentArtifact?.status,
  () => {
    console.log('artifactStore.currentArtifact?.status', artifactStore.currentArtifact?.status)
    if (artifactStore.currentArtifact?.status === 'loaded') {
      isPreview.value = true
    }
  },
  {
    immediate: true
  }
)

watch(
  () => artifactStore.isOpen,
  () => {
    if (artifactStore.isOpen) {
      if (artifactStore.currentArtifact?.status === 'loaded') {
        isPreview.value = true
      } else {
        isPreview.value = false
      }
    }
  }
)

onMounted(() => {})

const artifactComponent = computed(() => {
  if (!artifactStore.currentArtifact) return null
  switch (artifactStore.currentArtifact.type) {
    case 'application/vnd.ant.code':
      return CodeArtifact
    case 'text/markdown':
      return MarkdownArtifact
    case 'text/html':
      return HTMLArtifact
    case 'image/svg+xml':
      return SvgArtifact
    case 'image/png':
      return ImageArtifact
    case 'application/vnd.ant.mermaid':
      return MermaidArtifact
    case 'application/vnd.ant.react':
      return ReactArtifact
    default:
      return null
  }
})

const getFileExtension = (type: string) => {
  switch (type) {
    case 'application/vnd.ant.code':
      return 'txt'
    case 'text/markdown':
      return 'md'
    case 'text/html':
      return 'html'
    case 'image/svg+xml':
      return 'svg'
    case 'image/png':
      return 'png'
    case 'application/vnd.ant.mermaid':
      return 'mdm'
    case 'application/vnd.ant.react':
      return 'jsx'
    default:
      return 'txt'
  }
}

const exportImage = async () => {
  if (!artifactStore.currentArtifact?.content) return

  try {
    if (artifactStore.currentArtifact.type === 'image/svg+xml' ||
        artifactStore.currentArtifact.type === 'application/vnd.ant.mermaid') {
      let svgContent = artifactStore.currentArtifact.content

      // 如果是 Mermaid 图表，需要先渲染成 SVG
      if (artifactStore.currentArtifact.type === 'application/vnd.ant.mermaid') {
        const { svg } = await mermaid.render('export-diagram', artifactStore.currentArtifact.content)
        svgContent = svg
      }

      // 确保 SVG 内容是有效的
      if (!svgContent.trim().startsWith('<svg')) {
        throw new Error('Invalid SVG content')
      }

      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${artifactStore.currentArtifact.title || 'artifact'}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else if (artifactStore.currentArtifact.type === 'image/png') {
      // For PNG images, the content is already a data URL
      // Extract the base64 data and create a blob
      const imageData = artifactStore.currentArtifact.content

      // Create a link to download the image
      const link = document.createElement('a')
      link.href = imageData
      link.download = `${artifactStore.currentArtifact.title || 'artifact'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Failed to export image:', error)
  }
}

const exportCode = () => {
  if (artifactStore.currentArtifact?.content) {
    const extension = getFileExtension(artifactStore.currentArtifact.type)
    const blob = new Blob([artifactStore.currentArtifact.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${artifactStore.currentArtifact.title || 'artifact'}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

const copyContent = async () => {
  if (artifactStore.currentArtifact?.content) {
    try {
      await navigator.clipboard.writeText(artifactStore.currentArtifact.content)
    } catch (e) {
      console.error('复制失败', e)
    }
  }
}
</script>

<style>
.mermaid-artifact {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
