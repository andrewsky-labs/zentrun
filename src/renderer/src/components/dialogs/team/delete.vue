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
import { teamStore } from '@/stores/team'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  team: {
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
    if (!props.team) {
      return
    }
    await teamStore.deleteTeam(props.team.id)

    // Create a deep copy of the data before making the API request
    const deleteData = structuredClone({
      slug: props.team.slug
    });
    toast({ title: t('team-deleted-successfully') })
    emit('update:open', false);
    await apiRequest('/zentrun-team/', 'DELETE', deleteData)

  } catch (error) {
    console.error(t('common.error.deleteTeamFailed'), error)
    toast({
      title: t('error-deleting-team'),
      description: error.message || t('failed-to-delete-team'),
      variant: 'destructive'
    })
  }
  emit('update:open', false)
}
</script>
