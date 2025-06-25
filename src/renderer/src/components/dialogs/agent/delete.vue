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
        <Button variant="outline" @click="$emit('cancel')">
          {{ t('dialog.cancel') }}
        </Button>
        <Button variant="destructive" @click="handleThreadDeleteAgent">
          {{ t('dialog.delete.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {agentStore} from "@/stores/agent";
import {apiRequest} from "@/api";
import {useToast} from "@/components/ui/toast";
import {useI18n} from "vue-i18n";
const { toast } = useToast()
const { t } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  agent: {
    type: Object,
    default: null
  },
})

const emit = defineEmits(['update:open', 'cancel'])

const handleThreadDeleteAgent = async () => {
  const selectedAgent = props.agent;
  try {
    if (!selectedAgent) {
      return
    }
    await agentStore.deleteAgent(selectedAgent.id)

    // Create a deep copy of the data before making the API request
    const deleteData = structuredClone(JSON.parse(JSON.stringify({
      slug: selectedAgent.slug
    })));
    toast({ title: t('agent-deleted-successfully') })
    emit('update:open', false)
    await apiRequest('/zentrun-agent/', 'DELETE', deleteData)

  } catch (error) {
    console.error(t('common.error.deleteAgentFailed'), error)
    toast({
      title: t('error-deleting-agent'),
      description: error.message || t('failed-to-delete-agent'),
      variant: 'destructive'
    })
  }
  emit('update:open', false)
  props.agent = null
}

</script>
