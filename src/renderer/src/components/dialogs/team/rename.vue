<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialog.rename.title') }}</DialogTitle>
        <DialogDescription>{{ t('dialog.rename.description') }}</DialogDescription>
      </DialogHeader>
      <Input v-if="team" v-model="team.name" />
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

const handleRename = async () => {
  try {
    if (!props.team) {
      return
    }
    await teamStore.updateTeam(props.team.id,
      {name: props.team.name})

    // Create a deep copy of the data before making the API request
    const renameData = structuredClone({
      slug: props.team.slug,
      name: props.team.name
    });
    toast({ title: t('team-renamed-successfully') })
    emit('update:open', false);
    await apiRequest('/zentrun-team/', 'PUT', renameData)

  } catch (error) {
    console.error(t('common.error.renameTeamFailed'), error)
    toast({
      title: t('error-renaming-team'),
      description: error.message || t('failed-to-rename-team'),
      variant: 'destructive'
    })
  }
  emit('update:open', false)
}
</script>
