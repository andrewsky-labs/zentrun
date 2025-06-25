<template>
  <ScrollArea class="w-full h-full p-2">
    <div class="w-full h-full flex flex-col gap-1.5">
      <!-- 快捷键列表 -->
      <div class="flex flex-col gap-2">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.id"
          class="flex flex-row p-2 items-center gap-2 px-2"
        >
          <span class="flex flex-row items-center gap-2 flex-grow w-full">
            <Icon :icon="shortcut.icon" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{ t(shortcut.label) }}</span>
          </span>
          <div class="flex-shrink-0 min-w-32">
            <Button variant="outline" class="w-full justify-between">
              <span class="text-sm">{{ formatShortcut(shortcut.key) }}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const { t } = useI18n()

const shortcuts = ref([
  {
    id: 'new_chat',
    icon: 'lucide:plus',
    label: 'common.newChat',
    key: 'CommandOrControl+N'
  },
  {
    id: 'zoom_in',
    icon: 'lucide:zoom-in',
    label: 'settings.shortcuts.zoomIn',
    key: 'CommandOrControl++'
  },
  {
    id: 'zoom_out',
    icon: 'lucide:zoom-out',
    label: 'settings.shortcuts.zoomOut',
    key: 'CommandOrControl+-'
  },
  {
    id: 'zoom_reset',
    icon: 'lucide:rotate-ccw',
    label: 'settings.shortcuts.zoomReset',
    key: 'CommandOrControl+0'
  },
  {
    id: 'go_settings',
    icon: 'lucide:settings',
    label: 'settings.shortcuts.goSettings',
    key: 'CommandOrControl+,'
  },
  {
    id: 'clean_history',
    icon: 'lucide:trash-2',
    label: 'settings.shortcuts.cleanHistory',
    key: 'CommandOrControl+L'
  },
  {
    id: 'hide_window',
    icon: 'lucide:minimize-2',
    label: 'settings.shortcuts.hideWindow',
    key: 'CommandOrControl+W'
  },
  {
    id: 'quit_app',
    icon: 'lucide:log-out',
    label: 'settings.shortcuts.quitApp',
    key: 'CommandOrControl+Q'
  }
])

const formatShortcut = (shortcut: string) => {
  return shortcut
    .replace(
      'CommandOrControl',
      /Mac|iPod|iPhone|iPad/.test(window.navigator.platform) ? '⌘' : 'Ctrl'
    )
    .replace('Command', '⌘')
    .replace('Control', 'Ctrl')
    .replace('Alt', '⌥')
    .replace('Shift', '⇧')
    .replace(/\+/g, ' + ')
}
</script>
