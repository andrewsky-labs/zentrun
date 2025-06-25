<template>
  <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span class="flex items-center">
            <Select v-model="selectedLanguage" class="w-auto">
              <SelectTrigger class="h-7 px-2 text-xs gap-1 min-w-0 w-auto">
                <div class="flex items-center gap-1">
                  <Icon icon="lucide:languages" class="w-3.5 h-3.5" />
                  <SelectValue class="text-xs font-bold truncate" />
                </div>
              </SelectTrigger>
              <SelectContent align="end" class="w-48">
                <SelectItem v-for="lang in languageOptions" :key="lang.value" :value="lang.value">
                  {{ lang.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </span>
        </TooltipTrigger>
        <TooltipContent>{{ t('settings.common.language') }}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { Icon } from '@iconify/vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const settingsStore = useSettingsStore()
const { t } = useI18n()

// Language settings
const selectedLanguage = ref('system')
const languageOptions = [
  { value: 'system', label: t('common.languageSystem') || '跟随系统' },
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
  await settingsStore.updateLanguage(newValue)
})

// Lifecycle
onMounted(async () => {
  selectedLanguage.value = settingsStore.language
})
</script>
