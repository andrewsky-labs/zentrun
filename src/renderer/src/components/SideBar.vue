<template>
  <div class="flex p-2 flex-col items-center border-r bg-background">
    <!-- Navigation Items -->
    <nav class="flex flex-1 flex-col gap-2">
      <!-- Chat Section -->
      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'chat' }"
        @click="$emit('update:modelValue', 'chat')"
      >
        <Icon
          icon="lucide:message-circle"
          :class="['h-5 w-5', modelValue === 'chat' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">{{ $t('Chat') }}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'record' }"
        @click="$emit('update:modelValue', 'record')"
      >
        <Icon
          icon="lucide:video"
          :class="['h-5 w-5', modelValue === 'record' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">{{ $t('record') }}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'market' }"
        @click="$emit('update:modelValue', 'market')"
      >
        <Icon
          icon="lucide:store"
          :class="['h-5 w-5', modelValue === 'market' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">{{ $t('market') }}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'automation' }"
        @click="$emit('update:modelValue', 'automation')"
      >
        <Icon
          icon="lucide:plug"
          :class="['h-5 w-5', modelValue === 'automation' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">{{ $t('automation') }}</span>
      </Button>

      <!-- LLM Usage Button - Only visible when zentrun-app-core is available -->
      <Button
        v-if="hasZentrunCore"
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'llm-usage' }"
        @click="$emit('update:modelValue', 'llm-usage')"
      >
        <Icon
          icon="lucide:bar-chart"
          :class="['h-5 w-5', modelValue === 'llm-usage' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">{{ $t('llm-usage') }}</span>
      </Button>

      <!-- Settings Section -->
      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'settings' }"
        @click="$emit('update:modelValue', 'settings')"
      >
        <Icon
          icon="lucide:bolt"
          :class="[
            'h-5 w-5',
            modelValue === 'settings' ? ' text-primary' : 'text-muted-foreground'
          ]"
        />
        <span class="sr-only">{{ $t('Settings') }}</span>
      </Button>
      <!-- Debug Section -->
      <!-- <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9"
        :class="{ 'bg-accent': modelValue === 'debug' }"
        @click="$emit('update:modelValue', 'debug')"
      >
        <Icon
          icon="lucide:bug"
          :class="['h-5 w-5', modelValue === 'debug' ? ' text-primary' : 'text-muted-foreground']"
        />
        <span class="sr-only">Debug</span>
      </Button> -->
    </nav>
    <!-- User Profile Section -->
    <div class="mt-auto relative flex flex-col items-center">
      <Button
        variant="ghost"
        size="icon"
        class="w-9 h-9 rounded-lg text-muted-foreground"
        @click="themeStore.toggleDark()"
      >
        <Icon :icon="themeStore.isDark ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg w-9 h-9 text-muted-foreground relative"
        @click="handleProfileClick"
      >
        <Icon icon="lucide:user" class="h-5 w-5" />
        <span
          v-if="upgrade.hasUpdate"
          class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"
        ></span>
        <span class="sr-only">{{ $t('user-profile') }}</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { onMounted, ref, watch } from 'vue'
import { useUpgradeStore } from '@/stores/upgrade'
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'

defineProps<{
  modelValue: string
}>()

const themeStore = useThemeStore()
const router = useRouter()
const hasZentrunCore = ref(false)

const emits = defineEmits<{
  'update:modelValue': [value: string]
}>()

const upgrade = useUpgradeStore()

const handleProfileClick = async () => {
  if (!upgrade.hasUpdate) {
    await upgrade.checkUpdate()
  } else {
    if (upgrade.isReadyToInstall) {
      upgrade.openUpdateDialog()
    }
  }

  emits('update:modelValue', 'settings')
}

// 监听更新状态变化，当有新更新时自动显示更新弹窗
watch(
  () => upgrade.isReadyToInstall,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      upgrade.openUpdateDialog()
    }
  }
)

// Import the utility functions
import { hasZentrunCore as checkZentrunCore } from '@shared/zentrunCore'

const checkZentrunCoreAvailability = () => {
  // Use the utility function to check if zentrun-app-core is available
  hasZentrunCore.value = checkZentrunCore()
}

onMounted(() => {
  upgrade.checkUpdate()
  checkZentrunCoreAvailability()
})
</script>
