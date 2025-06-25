<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/use-toast'
import { apiRequest } from '@/api'
import { organizationStore } from '@/stores/organization'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  organization: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open', 'cancel'])
const { toast } = useToast()
const { t } = useI18n()

const handleCancel = () => {
  emit('cancel')
}

const handleDelete = async () => {
  try {
    if (!props.organization) {
      return
    }
    await organizationStore.deleteOrganization(props.organization.id)

    // Create a deep copy of the data before making the API request
    const deleteData = structuredClone({
      slug: props.organization.slug
    });
    toast({ title: t('organization-deleted-successfully') })
    emit('update:open', false);
    await apiRequest('/zentrun-organization/', 'DELETE', deleteData)

  } catch (error) {
    console.error(t('common.error.deleteChatFailed'), error)
    toast({
      title: t('error-deleting-organization'),
      description: error.message || t('failed-to-delete-organization'),
      variant: 'destructive'
    })
  }
  emit('update:open', false)
}
</script>
