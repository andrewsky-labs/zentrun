<template>
  <Dialog :open="isOpen" @update:open="updateOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialog.delete.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialog.delete.description') }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('dialog.cancel') }}
        </Button>
        <Button variant="destructive" @click="handleDelete">
          {{ t('dialog.delete.confirm') }}
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
import { useToast } from '@/components/ui/toast/use-toast'
import { apiRequest } from '@/api'
import { zentStore } from '@/stores/zent'

const { t } = useI18n()
const { toast } = useToast()

// Define props
const props = defineProps<{
  open: boolean
  zent?: any
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

// Handle delete button click
const handleDelete = async () => {
  try {
    if (!props.zent) {
      return
    }
    await zentStore.deleteZent(props.zent.id)

    // Create a deep copy of the data before making the API request
    const deleteData = structuredClone({
      slug: props.zent.slug
    });

    toast({ title: t('zent-deleted-successfully') })
    emit('update:open', false)
    await apiRequest('/zentrun-zent/', 'DELETE', deleteData)

  } catch (error) {
    console.error(t('common.error.deleteZentFailed'), error)
    toast({
      title: t('error-deleting-zent'),
      description: error.message || t('failed-to-delete-zent'),
      variant: 'destructive'
    })
  }
  emit('update:open', false)
}
</script>
