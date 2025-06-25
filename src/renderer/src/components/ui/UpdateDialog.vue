<template>
  <Dialog
    :open="upgrade.showUpdateDialog"
    @update:open="handleDialogUpdate"
    :closeOnEscapeKey="!upgrade.needToUpdate"
    :closeOnOutsideClick="!upgrade.needToUpdate"
  >
    <DialogContent :showCloseButton="!upgrade.needToUpdate">
      <DialogHeader>
        <DialogTitle>{{ upgrade.needToUpdate ? t('update.requiredUpdate') : t('update.newVersion') }}</DialogTitle>
        <DialogDescription>
          <div class="space-y-2">
            <p>{{ t('update.version') }}: {{ upgrade.updateInfo?.version }}</p>
            <p>{{ t('update.releaseDate') }}: {{ upgrade.updateInfo?.releaseDate }}</p>
            <p v-if="upgrade.needToUpdate" class="text-red-500 font-bold">
              {{ t('update.requiredUpdateMessage') }}
            </p>
            <p>{{ t('update.releaseNotes') }}:</p>
            <p
              class="whitespace-pre-line"
              v-html="renderMarkdown(getCommonMarkdown(), upgrade.updateInfo?.releaseNotes || '')"
            />

            <!-- 显示下载进度 -->
            <div v-if="upgrade.isDownloading && upgrade.updateProgress" class="mt-4">
              <p class="mb-2">
                {{ t('update.downloading') }}: {{ Math.round(upgrade.updateProgress.percent) }}%
              </p>
              <progress class="w-full" :value="upgrade.updateProgress.percent" max="100"></progress>
              <p class="text-xs mt-1">
                {{ formatSize(upgrade.updateProgress.transferred) }} /
                {{ formatSize(upgrade.updateProgress.total) }}
                ({{ formatSpeed(upgrade.updateProgress.bytesPerSecond) }})
              </p>
            </div>
          </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          variant="outline"
          @click="upgrade.closeUpdateDialog"
          :disabled="upgrade.isRestarting || upgrade.needToUpdate"
          v-if="!upgrade.needToUpdate"
        >
          {{ t('update.later') }}
        </Button>

        <!-- 如果已下载完成，只显示"立即安装"按钮 -->
        <Button
          v-if="upgrade.isReadyToInstall"
          @click="handleUpdate('auto')"
          :disabled="upgrade.isRestarting"
        >
          {{ upgrade.isRestarting ? t('update.restarting') : t('update.installNow') }}
        </Button>

        <!-- 如果自动更新失败，显示手动下载按钮 -->
        <template v-else-if="upgrade.updateError">
          <Button @click="handleUpdate('github')">
            {{ t('update.githubDownload') }}
          </Button>
          <Button @click="handleUpdate('netdisk')">
            {{ t('update.netdiskDownload') }}
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useUpgradeStore } from '@/stores/upgrade'
import { renderMarkdown, getCommonMarkdown } from '@/lib/markdown.helper'

const { t } = useI18n()
const upgrade = useUpgradeStore()

// 处理对话框关闭事件
const handleDialogUpdate = (open: boolean) => {
  // 如果是关闭对话框且不需要强制更新，则允许关闭
  if (!open && !upgrade.needToUpdate) {
    upgrade.closeUpdateDialog()
  }
}

const handleUpdate = async (type: 'github' | 'netdisk' | 'auto') => {
  await upgrade.handleUpdate(type)
}

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 格式化下载速度
const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
}
</script>
