<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialog.move.title') }}</DialogTitle>
        <DialogDescription>{{ t('dialog.move.description') }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div>
          <Label class="block mb-1">{{ t('dialog.move.organization') }}</Label>
          <select v-model="selectedOrg" class="w-full border rounded p-2">
            <option value="">{{ t('dialog.move.selectOrganization') }}</option>
            <option v-for="org in organizations" :key="org.id" :value="org">
              {{ org.name }}
            </option>
          </select>
        </div>

        <div>
          <Label class="block mb-1">{{ t('dialog.move.team') }}</Label>
          <select v-model="selectedTeam" class="w-full border rounded p-2">
            <option value="">{{ t('dialog.move.selectTeam') }}</option>
            <option v-for="team in filteredTeams" :key="team.id" :value="team">
              {{ team.name }}
            </option>
          </select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="$emit('cancel')">{{ t('dialog.cancel') }}</Button>
        <Button variant="default" @click="handleAgentMoveSelected">{{ t('dialog.confirm') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  loadTreeData: {
    type: Function,
    default: null
  },
  agent: {
    type: Object,
    default: null
  },
  organizations: {
    type: Array,
    default: () => []
  },
  teams: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:open', 'cancel', 'move'])

const selectedOrg = ref(null)
const selectedTeam = ref(null)

const filteredTeams = computed(() => {
  if (!selectedOrg.value) return []
  return props.teams.filter(team => team.organization === selectedOrg.value.slug)
})

watch(() => props.open, (open) => {
  if (!open) {
    // Reset selections when dialog closes
    selectedOrg.value = null
    selectedTeam.value = null
  }
})

watch(() => selectedOrg.value, () => {
  // Reset team selection when organization changes
  selectedTeam.value = null
})


const handleAgentMoveSelected = async () => {

  const selections = { organization: selectedOrg.value, team: selectedTeam.value }

  try {
    if (!props.agent || !selections.organization) {
      toast({ title: t('please-select-organization'), variant: 'destructive' })
      return
    }

    // Update agent's organization and team
    const updatedAgent = {
      organization: selections.organization?.slug,
      team: selections.team?.slug
    }

    console.log("updatedAgent");
    console.log(updatedAgent);
    console.log("selectedOrg");
    console.log(selectedOrg);

    let c = await agentStore.updateAgent(props.agent.id, updatedAgent)
    props.loadTreeData();
      // Create a deep copy of the data before making the API request
      const moveData = structuredClone(JSON.parse(JSON.stringify({
        slug: props.agent.slug,
        organization: selections.organization?.slug,
        team: selections.team?.slug
      })));
    emit('update:open', false)
    toast({ title: t('agent-moved-successfully') })

    try {
      await apiRequest('/zentrun-agent/', 'PUT', moveData)
    } catch (error) {
      toast({ title: t('error-moving-agent'), description: error.message || t('api-error'), variant: 'destructive' })
    }

    emit('update:open', false)

    props.agent = null
    selectedOrg.value = null
    selectedTeam.value = null
  } catch (error) {
    console.error('Failed to move agent:', error)
    toast({ title: t('failed-to-move-agent'), description: error.message, variant: 'destructive' })
  }
}

</script>
