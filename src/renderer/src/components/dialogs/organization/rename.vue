<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialog.rename.title') }}</DialogTitle>
        <DialogDescription>{{ t('dialog.rename.description') }}</DialogDescription>
      </DialogHeader>
      <Input v-if="organization" v-model="organization.name" />
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const handleRename = async () => {
  try {
    if (!props.organization) {
      return
    }
    await organizationStore.updateOrganization(props.organization.id,
      {name: props.organization.name})

    // Create a deep copy of the data before making the API request
    const renameData = structuredClone({
      slug: props.organization.slug,
      name: props.organization.name
    });
    toast({ title: t('organization-renamed-successfully') })
    emit('update:open', false)
    await apiRequest('/zentrun-organization/', 'PUT', renameData)

  } catch (error) {
    console.error(t('common.error.renameChatFailed'), error)
    toast({
      title: t('error-renaming-organization'),
      description: error.message || t('failed-to-rename-organization'),
      variant: 'destructive'
    })
  }
  emit('update:open', false)
}
</script>
