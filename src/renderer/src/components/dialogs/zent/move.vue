<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('move') }}</DialogTitle>
        <!-- <DialogDescription>{{ t('dialog.move.description') }}</DialogDescription> -->
      </DialogHeader>
      <div class="space-y-4">
        <div>
          <Label class="block mb-1">{{ t("Organization") }}</Label>
          <select v-model="selectedOrg" class="w-full border rounded p-2">
            <option value="">{{ t('select-organization') }}</option>
            <option v-for="org in organizations" :key="org.id" :value="org">
              {{ org.name }}
            </option>
          </select>
        </div>

        <div>
          <Label class="block mb-1">{{  t("Team") }}</Label>
          <select v-model="selectedTeam" class="w-full border rounded p-2">
            <option value="">{{ t('select-team') }}</option>
            <option v-for="team in filteredTeams" :key="team.id" :value="team">
              {{ team.name }}
            </option>
          </select>
        </div>

        <div>
          <Label class="block mb-1">{{ t('agent') }}</Label>
          <select v-model="selectedAgent" class="w-full border rounded p-2">
            <option value="">{{ t('select-agent') }}</option>
            <option v-for="agent in filteredAgents" :key="agent.id" :value="agent">
              {{ agent.name }}
            </option>
          </select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">{{ t('dialog.cancel') }}</Button>
        <Button variant="default" @click="handleMove">{{ t('dialog.confirm') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/use-toast'
import { apiRequest } from '@/api'
import { zentStore } from '@/stores/zent'
import { agentStore } from '@/stores/agent'
import { useI18n } from 'vue-i18n'

const { toast } = useToast()
const { t } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  zent: {
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
  },
  agents: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:open'])

const selectedOrg = ref(null)
const selectedTeam = ref(null)
const selectedAgent = ref(null)

const filteredTeams = computed(() => {
  if (!selectedOrg.value) return []
  return props.teams.filter(team => team.organization === selectedOrg.value.slug)
})

const filteredAgents = computed(() => {
  if (!selectedOrg.value) {
    // When no organization is selected, show agents that don't belong to any organization
    return props.agents.filter(agent => !agent.organization)
  }
  if (!selectedTeam.value) {
    return props.agents.filter(agent => agent.organization === selectedOrg.value.slug)
  }
  return props.agents.filter(agent =>
    agent.organization === selectedOrg.value.slug &&
    agent.team === selectedTeam.value.slug
  )
})

watch(() => props.open, (open) => {
  if (!open) {
    // Reset selections when dialog closes
    selectedOrg.value = null
    selectedTeam.value = null
    selectedAgent.value = null
  }
})

watch(() => selectedOrg.value, () => {
  // Reset team and agent selection when organization changes
  selectedTeam.value = null
  selectedAgent.value = null
})

watch(() => selectedTeam.value, () => {
  // Reset agent selection when team changes
  selectedAgent.value = null
})

const handleCancel = () => {
  emit('update:open', false)
}

const handleMove = async () => {
  try {
    if (!props.zent) {
      toast({ title: t('please-select-organization'), variant: 'destructive' })
      return
    }

    // Get the current agent of the zent (if any)
    const currentAgentSlug = props.zent.agent;
    // Get the new agent slug (if any)
    const newAgentSlug = selectedAgent.value?.slug;

    // Update zent's organization, team, and agent
    const updatedZent = {
      organization: selectedOrg.value?.slug,
      team: selectedTeam.value?.slug,
      agent: newAgentSlug
    }

    // Update RAG data for the agents
    if (currentAgentSlug !== newAgentSlug) {
      // If the zent is being moved from one agent to another or being added/removed from an agent

      // If the zent was previously in an agent, remove its RAG entry from that agent
      if (currentAgentSlug) {
        try {
          // Find the current agent
          const currentAgent = agentStore.agents.value.find(agent => agent.slug === currentAgentSlug);
          if (currentAgent && currentAgent.data && currentAgent.data.rag_data) {
            // Create a copy of the current RAG data
            const ragData = { ...currentAgent.data.rag_data };

            // Filter out entries related to this zent
            const zentEntryPrefix = `zent-${props.zent.id}-`;
            if (ragData.entries && Array.isArray(ragData.entries)) {
              ragData.entries = ragData.entries.filter(entry => !entry.id.startsWith(zentEntryPrefix));
              ragData.lastUpdated = Date.now();

              // Update the agent's RAG data
              const updatedData = { ...currentAgent.data, rag_data: ragData };
              await agentStore.updateAgent(currentAgent.id, { data: updatedData });
            }
          }
        } catch (error) {
          console.error('Error updating previous agent RAG data:', error);
          // Continue with the move even if updating the RAG data fails
        }
      }

      // If the zent is being moved to a new agent, add its RAG entry to that agent
      if (newAgentSlug) {
        try {
          // Find the new agent
          const newAgent = agentStore.agents.value.find(agent => agent.slug === newAgentSlug);
          if (newAgent) {
            // Create a copy of the current data or initialize it
            const agentData = { ...newAgent.data } || {};
            const ragData = agentData.rag_data || { entries: [], lastUpdated: Date.now() };

            // Add the zent's title and prompt as a new RAG entry
            if (props.zent.name && props.zent.prompt) {
              const newEntry = {
                id: `zent-${props.zent.id}-${Date.now()}`,
                title: props.zent.name,
                content: JSON.stringify(props.zent.data),
                createdAt: Date.now()
              };

              // Ensure entries is an array
              ragData.entries = Array.isArray(ragData.entries) ? [...ragData.entries, newEntry] : [newEntry];
              ragData.lastUpdated = Date.now();

              // Update the agent's RAG data
              agentData.rag_data = ragData;
              await agentStore.updateAgent(newAgent.id, { data: agentData });
            }
          }
        } catch (error) {
          console.error('Error updating new agent RAG data:', error);
          // Continue with the move even if updating the RAG data fails
        }
      }
    }
    // Create a deep copy of the data before making the API request
    const moveData = structuredClone({
      slug: props.zent.slug,
      organization: selectedOrg.value?.slug,
      team: selectedTeam.value?.slug,
      agent: newAgentSlug
    });

    await zentStore.updateZent(props.zent.id, updatedZent)
    toast({ title: 'Zent moved successfully!' })
    emit('update:open', false)

    try {
      await apiRequest('/zentrun-zent/', 'PUT', moveData)
    } catch (error) {
      toast({ title: 'Error moving zent', description: error.message || 'API error', variant: 'destructive' })
    }

    // Close the dialog
  } catch (error) {
    console.error('Failed to move zent:', error)
    toast({ title: 'Failed to move zent', description: error.message, variant: 'destructive' })
  }
  emit('update:open', false)
}
</script>
