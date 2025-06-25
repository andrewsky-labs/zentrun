<template>
  <Dialog :open="isOpen" @update:open="updateOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialog.rename.title') }}</DialogTitle>
        <DialogDescription>{{ t('dialog.rename.description') }}</DialogDescription>
      </DialogHeader>
      <Input v-if="zent" v-model="zent.name" />
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('dialog.cancel') }}
        </Button>
        <Button variant="default" @click="handleRename">
          {{ t('dialog.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast/use-toast'
import { apiRequest } from '@/api'
import { zentStore } from '@/stores/zent'

const { t } = useI18n()
const { toast } = useToast()

// Define props
const props = defineProps<{
  open: boolean
  zent: any
}>()

// Define emits
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'cancel'): void
}>()

// Create a computed property for the open state
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Update open state
const updateOpen = (value: boolean) => {
  isOpen.value = value
}

// Handle cancel button click
const handleCancel = () => {
  emit('cancel')
  emit('update:open', false)
}

// Handle rename button click
const handleRename = async () => {
  try {
    if (!props.zent) {
      return
    }
    await zentStore.updateZent(props.zent.id, {name: props.zent.name})

    // Create a deep copy of the data before making the API request
    const renameData = structuredClone({
      slug: props.zent?.slug,
      name: props.zent?.name
    });
    emit('update:open', false)
    toast({ title: t('zent-renamed-successfully') })
    await apiRequest('/zentrun-zent/', 'PUT', renameData)

  } catch (error) {
    console.error(t('common.error.renameZentFailed'), error)
    toast({
      title: t('error-renaming-zent'),
      description: error.message || t('failed-to-rename-zent'),
      variant: 'destructive'
    })
  }
  emit('update:open', false)
}
</script>
