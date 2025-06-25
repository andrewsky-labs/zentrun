<template>
  <div
    class="h-9 flex-shrink-0 w-full flex items-center justify-between select-none bg-background border-b"
  >
    <!-- App title/content in center -->
    <div
      :class="[
        'flex-1 text-center text-sm font-medium window-drag-region h-full',
        isMacOS ? 'px-20' : 'px-4'
      ]"
    ></div>

    <!-- Windows/Linux window controls (only shown on Windows/Linux) -->
    <div v-if="!isMacOS" class="flex h-9">
      <button
        class="inline-flex items-center justify-center h-9 w-12 hover:bg-muted"
        @click="minimizeWindow"
      >
        <MinusIcon class="h-4 w-4" />
      </button>
      <button
        class="inline-flex items-center justify-center h-9 w-12 hover:bg-muted"
        @click="toggleMaximize"
      >
        <MaximizeIcon v-if="!isMaximized" class="h-4 w-4" />
        <RestoreIcon v-else class="h-4 w-4" />
      </button>
      <button
        class="inline-flex items-center justify-center h-9 w-12 hover:bg-destructive hover:text-destructive-foreground"
        @click="closeWindow"
      >
        <XIcon class="h-4 w-4" />
      </button>
    </div>
    <!-- Spacer for macOS to maintain layout -->
    <div v-else class="px-4"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MinusIcon, XIcon } from 'lucide-vue-next'
import MaximizeIcon from './icons/MaximizeIcon.vue'
import RestoreIcon from './icons/RestoreIcon.vue'
import { usePresenter } from '@/composables/usePresenter'

const windowPresenter = usePresenter('windowPresenter')
const devicePresenter = usePresenter('devicePresenter')

const isMacOS = ref(false)
const isMaximized = ref(false)

const { ipcRenderer } = window.electron

onMounted(() => {
  // Listen for window maximize/unmaximize events
  devicePresenter.getDeviceInfo().then((deviceInfo) => {
    isMacOS.value = deviceInfo.platform === 'darwin'
  })
  ipcRenderer?.on('window:maximized', () => {
    isMaximized.value = true
  })
  ipcRenderer?.on('window:unmaximized', () => {
    isMaximized.value = false
  })
})

const minimizeWindow = () => {
  windowPresenter.minimize()
}

const toggleMaximize = () => {
  windowPresenter.maximize()
}

const closeWindow = () => {
  windowPresenter.close()
}
</script>

<style scoped>
.window-drag-region {
  -webkit-app-region: drag;
}

button {
  -webkit-app-region: no-drag;
}
</style>
