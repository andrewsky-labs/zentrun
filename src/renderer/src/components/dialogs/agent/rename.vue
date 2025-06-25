<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialog.rename.title') }}</DialogTitle>
        <DialogDescription>{{ t('dialog.rename.description') }}</DialogDescription>
      </DialogHeader>
      <Input v-if="agent" v-model="agent.name" />
      <DialogFooter>
        <Button variant="outline" @click="$emit('cancel')">
          {{ t('dialog.cancel') }}
        </Button>
        <Button variant="default"
          v-bind:disabled="isLoading.rename.value"
                @click="handleThreadRenameAgent">
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
import {agentStore} from "@/stores/agent";
import {apiRequest} from "@/api";
import { useToast } from '@/components/ui/toast/use-toast'
import { useI18n } from 'vue-i18n'
import {ref} from "vue";

const isLoading = {
  rename: ref(false),
};

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  agent: {
    type: Object,
    default: null
  }
})
const { toast } = useToast()
const { t } = useI18n()
const emit = defineEmits(['update:open', 'cancel'])

const handleThreadRenameAgent = async () => {
  try {
    if (!props.agent) {
      return
    }
    isLoading.rename.value = true
    await agentStore.updateAgent(props.agent.id, {name: props.agent.name})

    // Create a deep copy of the data before making the API request
    const renameData = structuredClone(JSON.parse(JSON.stringify({
      slug: props.agent.slug,
      name: props.agent.name
    })));

    toast({ title: t('agent-renamed-successfully') })
    isLoading.rename.value = false
    emit('update:open', false)
    await apiRequest('/zentrun-agent/', 'PUT', renameData)

  } catch (error) {
    console.error(t('common.error.renameAgentFailed'), error)
    toast({
      title: t('error-renaming-agent'),
      description: error.message || t('failed-to-rename-agent'),
      variant: 'destructive'
    })
  }
  isLoading.rename.value = false

  if (props.agent) {
    props.agent = null;
  }

}
</script>
