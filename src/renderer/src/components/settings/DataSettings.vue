<template>
  <ScrollArea class="w-full h-full p-2">
    <div class="w-full h-full flex flex-col gap-1.5">
      <!-- 同步功能开关 -->
      <div class="flex flex-row p-2 items-center gap-2 px-2">
        <span class="flex flex-row items-center gap-2 flex-grow w-full">
          <Icon icon="lucide:refresh-cw" class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ t('settings.data.syncEnable') }}</span>
        </span>
        <div class="flex-shrink-0">
          <Switch v-model:checked="syncEnabled" />
        </div>
      </div>

      <!-- 同步文件夹设置 -->
      <div class="flex flex-col p-2 gap-2 px-2">
        <div class="flex flex-row items-center gap-2">
          <span class="flex flex-row items-center gap-2 flex-grow w-full">
            <Icon icon="lucide:folder" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{ t('settings.data.syncFolder') }}</span>
          </span>
          <div class="flex-shrink-0 w-96 flex gap-2">
            <Input
              v-model="syncFolderPath"
              :disabled="!syncStore.syncEnabled"
              class="cursor-pointer"
              @click="syncStore.selectSyncFolder"
            />
            <Button
              size="icon"
              variant="outline"
              @click="syncStore.openSyncFolder"
              :disabled="!syncStore.syncEnabled"
              title="打开同步文件夹"
            >
              <Icon icon="lucide:external-link" class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- 上次同步时间 -->
      <div class="p-2 flex flex-row items-center gap-2">
        <Icon icon="lucide:clock" class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-medium">{{ t('settings.data.lastSyncTime') }}:</span>
        <span class="text-sm text-muted-foreground">
          {{
            !syncStore.lastSyncTime
              ? t('settings.data.never')
              : new Date(syncStore.lastSyncTime).toLocaleString()
          }}
        </span>
      </div>

      <!-- 手动备份 -->
      <div
        class="p-2 flex flex-row items-center gap-2 hover:bg-accent rounded-lg cursor-pointer"
        @click="syncStore.startBackup"
        :class="{
          'opacity-50 cursor-not-allowed': !syncStore.syncEnabled || syncStore.isBackingUp
        }"
      >
        <Icon icon="lucide:save" class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-medium">{{ t('settings.data.startBackup') }}</span>
        <span v-if="syncStore.isBackingUp" class="text-xs text-muted-foreground ml-2">
          ({{ t('settings.data.backingUp') }})
        </span>
      </div>

      <!-- 导入数据 -->
      <Dialog v-model:open="isImportDialogOpen">
        <DialogTrigger as-child>
          <div
            class="p-2 flex flex-row items-center gap-2 hover:bg-accent rounded-lg cursor-pointer"
            :class="{ 'opacity-50 cursor-not-allowed': !syncStore.syncEnabled }"
          >
            <Icon icon="lucide:download" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{ t('settings.data.importData') }}</span>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ t('settings.data.importConfirmTitle') }}</DialogTitle>
            <DialogDescription>
              {{ t('settings.data.importConfirmDescription') }}
            </DialogDescription>
          </DialogHeader>
          <div class="p-4">
            <RadioGroup v-model="importMode" class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="increment" />
                <Label>{{ t('settings.data.incrementImport') }}</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" />
                <Label>{{ t('settings.data.overwriteImport') }}</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="closeImportDialog">
              {{ t('dialog.cancel') }}
            </Button>
            <Button variant="default" @click="handleImport" :disabled="syncStore.isImporting">
              {{
                syncStore.isImporting
                  ? t('settings.data.importing')
                  : t('settings.data.confirmImport')
              }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog :open="!!syncStore.importResult">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{
              syncStore.importResult?.success
                ? t('settings.data.importSuccessTitle')
                : t('settings.data.importErrorTitle')
            }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ syncStore.importResult?.message ? t(syncStore.importResult.message) : '' }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction @click="handleAlertAction">
              {{ t('dialog.ok') }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ref, onMounted, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useSyncStore } from '@/stores/sync'

const { t } = useI18n()
const syncStore = useSyncStore()
const isImportDialogOpen = ref(false)
const importMode = ref('increment')

// 使用计算属性处理双向绑定
const syncEnabled = computed({
  get: () => syncStore.syncEnabled,
  set: (value) => syncStore.setSyncEnabled(value)
})

const syncFolderPath = computed({
  get: () => syncStore.syncFolderPath,
  set: (value) => syncStore.setSyncFolderPath(value)
})

// 初始化
onMounted(async () => {
  await syncStore.initialize()
})

// 关闭导入对话框
const closeImportDialog = () => {
  isImportDialogOpen.value = false
  importMode.value = 'increment' // 重置为默认值
}

// 处理导入
const handleImport = async () => {
  await syncStore.importData(importMode.value as 'increment' | 'overwrite')
  closeImportDialog()
}

// 处理警告对话框的确认操作
const handleAlertAction = () => {
  // 如果导入成功，则重启应用
  console.log(syncStore.importResult)
  if (syncStore.importResult?.success) {
    syncStore.restartApp()
  }
  syncStore.clearImportResult()
}
</script>
