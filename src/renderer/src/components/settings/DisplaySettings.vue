<template>
  <ScrollArea class="w-full h-full p-2">
    <div class="w-full h-full flex flex-col gap-1.5">
      <!-- 语言选择 -->
      <div class="flex flex-row p-2 items-center gap-2 px-2">
        <span class="flex flex-row items-center gap-2 flex-grow w-full">
          <Icon icon="lucide:languages" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ t('settings.common.language') }}</span>
        </span>
        <div class="flex-shrink-0 min-w-64 max-w-96">
          <Select v-model="selectedLanguage" class="">
            <SelectTrigger>
              <SelectValue :placeholder="t('settings.common.languageSelect')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="lang in languageOptions" :key="lang.value" :value="lang.value">
                {{ lang.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- 系统通知设置 -->
      <div class="flex flex-col p-2 gap-2 px-2">
        <div class="flex flex-row items-center gap-2">
          <span class="flex flex-row items-center gap-2 flex-grow w-full">
            <Icon icon="lucide:bell" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{
              t('settings.common.notifications') || '系统通知'
            }}</span>
          </span>
          <div class="flex-shrink-0">
            <Switch
              id="notifications-switch"
              :checked="notificationsEnabled"
              @update:checked="handleNotificationsChange"
            />
          </div>
        </div>
        <div class="pl-6 text-xs text-muted-foreground">
          {{ t('settings.common.notificationsDesc') }}
        </div>
      </div>

      <!-- 字体大小设置 -->
      <div class="flex flex-col p-2 gap-2 px-2">
        <span class="flex flex-row items-center gap-2 flex-grow w-full mb-1">
          <Icon icon="lucide:a-large-small" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ t('settings.display.fontSize') }}</span>
        </span>
        <div class="flex flex-row items-center gap-2 pl-6">
          <Slider
            :default-value="[fontSizeLevel]"
            :model-value="[fontSizeLevel]"
            @update:model-value="(val) => (fontSizeLevel = val?.[0] ?? 1)"
            :min="0"
            :max="4"
            :step="1"
            class="w-full max-w-sm"
          />
          <span class="text-xs w-16 text-center">{{
            t('settings.display.' + fontSizeClass.toLowerCase())
          }}</span>
        </div>
      </div>

      <!-- 投屏保护开关 -->
      <div class="flex flex-row p-2 items-center gap-2 px-2">
        <span class="flex flex-row items-center gap-2 flex-grow w-full">
          <Icon icon="lucide:monitor" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{
            t('settings.common.contentProtection') || '投屏保护'
          }}</span>
        </span>
        <div class="flex-shrink-0">
          <Switch
            id="content-protection-switch"
            :checked="contentProtectionEnabled"
            @update:checked="handleContentProtectionChange"
          />
        </div>
      </div>
    </div>
  </ScrollArea>

  <!-- 投屏保护切换确认对话框 -->
  <Dialog v-model:open="isContentProtectionDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{
          t('settings.common.contentProtectionDialogTitle') || '确认切换投屏保护'
        }}</DialogTitle>
        <DialogDescription>
          <template v-if="newContentProtectionValue">
            {{ t('settings.common.contentProtectionEnableDesc') }}
          </template>
          <template v-else>
            {{ t('settings.common.contentProtectionDisableDesc') }}
          </template>
          <div class="mt-2 font-medium">
            {{ t('settings.common.contentProtectionRestartNotice') }}
          </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="cancelContentProtectionChange">
          {{ t('common.cancel') }}
        </Button>
        <Button
          :variant="newContentProtectionValue ? 'default' : 'destructive'"
          @click="confirmContentProtectionChange"
        >
          {{ t('common.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ref, onMounted, watch, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'

const settingsStore = useSettingsStore()
const { t } = useI18n()

// --- Language Settings ---
const selectedLanguage = ref('system')
const languageOptions = [
  { value: 'system', label: t('common.languageSystem') || '跟随系统' }, // 使用i18n key 或 默认值
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'zh-TW', label: '繁體中文（台灣）' },
  { value: 'zh-HK', label: '繁體中文（香港）' },
  { value: 'ko-KR', label: '한국어' },
  { value: 'ru-RU', label: 'Русский' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'fr-FR', label: 'Français' }
]

watch(selectedLanguage, async (newValue) => {
  console.log('selectedLanguage', newValue)
  await settingsStore.updateLanguage(newValue)
})

// --- Font Size Settings ---
const fontSizeLevel = computed({
  get: () => settingsStore.fontSizeLevel,
  set: (value) => settingsStore.updateFontSizeLevel(value)
})
const fontSizeClass = computed(() => settingsStore.fontSizeClass)

// --- Content Protection Settings ---
const contentProtectionEnabled = computed({
  get: () => {
    return settingsStore.contentProtectionEnabled
  },
  set: () => {
    // Setter handled by handleContentProtectionChange
  }
})
const isContentProtectionDialogOpen = ref(false)
const newContentProtectionValue = ref(false)

const handleContentProtectionChange = (value: boolean) => {
  console.log('准备切换投屏保护状态:', value)
  newContentProtectionValue.value = value
  isContentProtectionDialogOpen.value = true
}

const cancelContentProtectionChange = () => {
  isContentProtectionDialogOpen.value = false
}

const confirmContentProtectionChange = () => {
  settingsStore.setContentProtectionEnabled(newContentProtectionValue.value)
  isContentProtectionDialogOpen.value = false
}

// --- Notifications Settings ---
const notificationsEnabled = computed({
  get: () => settingsStore.notificationsEnabled,
  set: (value) => settingsStore.setNotificationsEnabled(value)
})

const handleNotificationsChange = (value: boolean) => {
  settingsStore.setNotificationsEnabled(value)
}

// --- Lifecycle ---
onMounted(async () => {
  selectedLanguage.value = settingsStore.language
})
</script>
