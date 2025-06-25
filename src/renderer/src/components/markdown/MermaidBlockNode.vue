<template>
  <div class="my-4 rounded-lg border border-border overflow-hidden shadow-sm">
    <div class="flex justify-between items-center p-2 bg-gray-100 dark:bg-zinc-800 text-xs">
      <span class="text-gray-600 dark:text-gray-400 font-mono font-bold">Mermaid</span>
      <div class="flex items-center space-x-2">
        <button
          class="px-2 py-1 rounded-md transition-colors"
          :class="[
            !showSource
              ? 'bg-white dark:bg-zinc-700 text-foreground shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
          ]"
          @click="showSource = false"
        >
          <div class="flex items-center space-x-1">
            <Icon icon="lucide:eye" class="w-4 h-4" />
            <span>Preview</span>
          </div>
        </button>
        <button
          class="px-2 py-1 rounded-md transition-colors"
          :class="[
            showSource
              ? 'bg-white dark:bg-zinc-700 text-foreground shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
          ]"
          @click="showSource = true"
        >
          <div class="flex items-center space-x-1">
            <Icon icon="lucide:code" class="w-4 h-4" />
            <span>Source</span>
          </div>
        </button>
      </div>
      <div class="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-4 h-3"
          @click="copyCode"
        >
          <Icon icon="lucide:copy" class="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-4 h-3"
          @click="exportSvg"
        >
          <Icon icon="lucide:download" class="w-3 h-3" />
        </Button>
      </div>
    </div>
    <div v-if="showSource" class="p-4 bg-gray-50 dark:bg-zinc-900">
      <pre class="text-sm font-mono whitespace-pre-wrap">{{ node.code }}</pre>
    </div>
    <div v-else class="relative">
      <div class="absolute top-2 right-2 z-10 rounded-lg">
        <div class="flex items-center gap-1 backdrop-blur rounded-lg">
          <button
            class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors"
            @click="zoomIn"
          >
            <Icon icon="lucide:zoom-in" class="w-3 h-3" />
          </button>
          <button
            class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors"
            @click="zoomOut"
          >
            <Icon icon="lucide:zoom-out" class="w-3 h-3" />
          </button>
          <button
            class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors"
            @click="resetZoom"
          >
            {{ Math.round(zoom * 100) }}%
          </button>
        </div>
      </div>
      <div
        ref="mermaidContainer"
        class="min-h-[360px] max-h-[500px] overflow-auto bg-gray-50 dark:bg-zinc-900 relative"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
        @touchstart="startDrag"
        @touchmove="onDrag"
        @touchend="stopDrag"
      >
        <div
          ref="mermaidWrapper"
          class="absolute inset-0 cursor-grab"
          :class="{ 'cursor-grabbing': isDragging }"
          :style="transformStyle"
        >
          <div
            ref="mermaidContent"
            class="mermaid w-full text-center absolute"
            style="left: 50%; top: 50%; transform: translate(-50%, -50%)"
          >
            {{ node.code }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import mermaid from 'mermaid'
import { Icon } from '@iconify/vue'
import { Button } from '../ui/button'

const props = defineProps<{
  node: {
    type: 'code_block'
    language: string
    code: string
  }
}>()

const { t } = useI18n()
const copyText = ref(t('common.copy'))
const mermaidContainer = ref<HTMLElement>()
const mermaidWrapper = ref<HTMLElement>()
const mermaidContent = ref<HTMLElement>()

// Zoom state
const zoom = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const showSource = ref(false)

const transformStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${zoom.value})`
}))

// Zoom controls
const zoomIn = () => {
  if (zoom.value < 3) {
    zoom.value += 0.1
  }
}

const zoomOut = () => {
  if (zoom.value > 0.5) {
    zoom.value -= 0.1
  }
}

const resetZoom = () => {
  zoom.value = 1
  translateX.value = 0
  translateY.value = 0
}

// Drag functionality
const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true
  if (e instanceof MouseEvent) {
    dragStart.value = { x: e.clientX - translateX.value, y: e.clientY - translateY.value }
  } else {
    dragStart.value = {
      x: e.touches[0].clientX - translateX.value,
      y: e.touches[0].clientY - translateY.value
    }
  }
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return

  let clientX: number
  let clientY: number

  if (e instanceof MouseEvent) {
    clientX = e.clientX
    clientY = e.clientY
  } else {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  }

  translateX.value = clientX - dragStart.value.x
  translateY.value = clientY - dragStart.value.y
}

const stopDrag = () => {
  isDragging.value = false
}

// Copy functionality
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.node.code)
    copyText.value = t('common.copySuccess')
    setTimeout(() => {
      copyText.value = t('common.copy')
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Export SVG
const exportSvg = async () => {
  try {
    const svgElement = mermaidContent.value?.querySelector('svg')
    if (!svgElement) {
      console.error('SVG element not found')
      return
    }

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mermaid-diagram-${Date.now()}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export SVG:', error)
  }
}

// 优化的 mermaid 渲染函数
const initMermaid = async () => {
  if (!mermaidContent.value) return

  try {
    // 生成唯一的图表ID
    const id = `mermaid-${Date.now()}`

    // 使用 render API 直接渲染新内容
    const { svg } = await mermaid.render(id, props.node.code, mermaidContent.value)

    // 更新 DOM
    if (mermaidContent.value) {
      mermaidContent.value.innerHTML = svg
    }
  } catch (error) {
    console.error('Failed to render mermaid diagram:', error)
    if (mermaidContent.value) {
      mermaidContent.value.innerHTML = `<div class="text-red-500 p-4">Failed to render diagram: ${error instanceof Error ? error.message : 'Unknown error'}</div>`
    }
  }
}

// Watch for code changes
watch(() => props.node.code, initMermaid)

// Watch for source toggle
watch(
  () => showSource.value,
  (newValue) => {
    if (!newValue) {
      // When switching back to preview mode
      nextTick(() => {
        initMermaid()
      })
    }
  }
)

// Initialize on mount
onMounted(initMermaid)
</script>

<style scoped>
.mermaid {
  font-family: inherit;
}

.mermaid :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
