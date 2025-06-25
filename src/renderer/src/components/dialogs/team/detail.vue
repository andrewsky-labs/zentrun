<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-4xl h-[80vh]">
      <DialogHeader>
        <DialogTitle>{{ team.name }}</DialogTitle>
        <DialogDescription>{{ t('team.details.description', 'Team details and management') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" class="h-full flex flex-col">
          <div class="sticky top-0 bg-background z-10">
            <TabsList class="grid grid-cols-5">
              <TabsTrigger value="overview">{{ t('team.tabs.overview', 'Overview') }}</TabsTrigger>
<!--              <TabsTrigger value="members">{{ t('team.tabs.members', 'Members') }}</TabsTrigger>-->
              <TabsTrigger value="agents">{{ t('team.tabs.agents', 'Agents') }}</TabsTrigger>
              <TabsTrigger value="activity">{{ t('team.tabs.activity', 'Activity') }}</TabsTrigger>
              <TabsTrigger value="runHistory">{{ t('team.tabs.runHistory', 'Run History') }}</TabsTrigger>
            </TabsList>
          </div>

          <!-- Overview Tab -->
          <TabsContent value="overview" class="flex-1 overflow-auto p-4">
            <div class="space-y-4">
              <div>
                <h3 class="text-lg font-medium">{{ t('team.overview.basicInfo', 'Basic Information') }}</h3>
                <div class="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label>{{ t('team.overview.name', 'Name') }}</Label>
                    <div class="p-2 border rounded mt-1">{{ team.name }}</div>
                  </div>
                  <div>
                    <Label>{{ t('team.overview.created', 'Created') }}</Label>
                    <div class="p-2 border rounded mt-1">{{ formatDate(team.created_at) }}</div>
                  </div>
                  <div>
                    <Label>{{ t('team.overview.description', 'Description') }}</Label>
                    <div class="p-2 border rounded mt-1 min-h-[60px]">{{ team.description || t('team.overview.noDescription', 'No description') }}</div>
                  </div>
                  <div>
                    <Label>{{ t('team.overview.organization', 'Organization') }}</Label>
                    <div class="p-2 border rounded mt-1">{{ getOrganizationName(team.organization) }}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 class="text-lg font-medium">{{ t('team.overview.stats', 'Quick Stats') }}</h3>
                <div class="grid grid-cols-3 gap-4 mt-2">
                  <div class="p-4 border rounded bg-muted/50">
                    <div class="text-2xl font-bold">{{ memberCount }}</div>
                    <div class="text-sm text-muted-foreground">{{ t('team.overview.members', 'Members') }}</div>
                  </div>
                  <div class="p-4 border rounded bg-muted/50">
                    <div class="text-2xl font-bold">{{ agentCount }}</div>
                    <div class="text-sm text-muted-foreground">{{ t('team.overview.agents', 'Agents') }}</div>
                  </div>
                  <div class="p-4 border rounded bg-muted/50">
                    <div class="text-2xl font-bold">{{ zentCount }}</div>
                    <div class="text-sm text-muted-foreground">{{ t('team.overview.zents', 'Zents') }}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 class="text-lg font-medium">{{ t('team.overview.editTeam', 'Edit Team') }}</h3>
                <div class="space-y-4 mt-2">
                  <div>
                    <Label for="teamName">{{ t('team.overview.name', 'Name') }} <span class="text-red-500">*</span></Label>
                    <Input id="teamName" v-model="editedName" class="mt-1" />
                  </div>
                  <div>
                    <Label for="teamDescription">{{ t('team.overview.description', 'Description') }} <span class="text-black">{{ t('Optional') }}</span></Label>
                    <Textarea id="teamDescription" v-model="editedDescription" rows="3" class="mt-1" />
                  </div>
<!--                  <div>-->
<!--                    <Label for="teamPermission">{{ t('dialog.organization.add.permission') }}</Label>-->
<!--                    <select id="teamPermission" v-model="permission" class="w-full border rounded p-2 mt-1">-->
<!--                      <option value="public">{{ t('dialog.organization.add.permissionPublic') }}</option>-->
<!--                      <option value="private">{{ t('dialog.organization.add.permissionPrivate') }}</option>-->
<!--                    </select>-->
<!--                    <p class="text-xs text-muted-foreground mt-1">-->
<!--                      {{ permission === 'public' ? t('dialog.organization.add.permissionPublicDesc') : t('dialog.organization.add.permissionPrivateDesc') }}-->
<!--                    </p>-->
<!--                  </div>-->
                  <Button variant="outline" @click="saveTeamSettings">
                    {{ t('team.overview.saveSettings', 'Save Settings') }}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <!-- Members Tab -->
          <TabsContent value="members" class="flex-1 overflow-auto p-4">
            <div class="space-y-4">
              <div>
                <h3 class="text-lg font-medium">{{ t('team.members.addMembers', 'Add Members') }}</h3>
                <p class="text-sm text-muted-foreground mb-2">
                  {{ t('team.members.addMembersDesc', 'Add members from your organization to this team') }}
                </p>

                <div class="border rounded mt-2 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{{ t('team.members.name', 'Name') }}</TableHead>
                        <TableHead>{{ t('team.members.email', 'Email') }}</TableHead>
                        <TableHead>{{ t('team.members.role', 'Role') }}</TableHead>
                        <TableHead>{{ t('team.members.actions', 'Actions') }}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-if="organizationMembers.length === 0">
                        <TableCell colspan="4" class="text-center py-4">
                          {{ t('team.members.noOrgMembers', 'No organization members found') }}
                        </TableCell>
                      </TableRow>
                      <TableRow v-for="member in organizationMembers" :key="member.id">
                        <TableCell>{{ member.name }}</TableCell>
                        <TableCell>{{ member.email }}</TableCell>
                        <TableCell>{{ member.role }}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" @click="addMemberToTeam(member)">
                            {{ t('team.members.add', 'Add to Team') }}
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              <div>
                <h3 class="text-lg font-medium">{{ t('team.members.teamMembers', 'Team Members') }}</h3>

                <div class="border rounded mt-2 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{{ t('team.members.name', 'Name') }}</TableHead>
                        <TableHead>{{ t('team.members.email', 'Email') }}</TableHead>
                        <TableHead>{{ t('team.members.role', 'Role') }}</TableHead>
                        <TableHead>{{ t('team.members.actions', 'Actions') }}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-if="teamMembers.length === 0">
                        <TableCell colspan="4" class="text-center py-4">
                          {{ t('team.members.noMembers', 'No team members found') }}
                        </TableCell>
                      </TableRow>
                      <TableRow v-for="member in teamMembers" :key="member.id">
                        <TableCell>{{ member.name }}</TableCell>
                        <TableCell>{{ member.email }}</TableCell>
                        <TableCell>
                          <Select v-model="member.teamRole" @update:modelValue="updateMemberRole(member)">
                            <SelectTrigger class="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">{{ t('team.members.admin', 'Admin') }}</SelectItem>
                              <SelectItem value="editor">{{ t('team.members.editor', 'Editor') }}</SelectItem>
                              <SelectItem value="viewer">{{ t('team.members.viewer', 'Viewer') }}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" @click="removeMemberFromTeam(member)">
                            <Icon icon="lucide:trash-2" class="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <!-- Agents Tab -->
          <TabsContent value="agents" class="flex-1 overflow-auto p-4">
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium">{{ t('team.agents.title', 'Agents') }}</h3>
                <Button @click="$emit('addAgent', team)">
                  <Icon icon="lucide:bot-plus" class="h-4 w-4 mr-2" />
                  {{ t('team.agents.addAgent', 'Add Agent') }}
                </Button>
              </div>

              <div class="border rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{{ t('team.agents.name', 'Name') }}</TableHead>
                      <TableHead>{{ t('team.agents.description', 'Description') }}</TableHead>
                      <TableHead>{{ t('team.agents.zents', 'Zents') }}</TableHead>
                      <TableHead>{{ t('team.agents.actions', 'Actions') }}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-if="agents.length === 0">
                      <TableCell colspan="4" class="text-center py-4">
                        {{ t('team.agents.noAgents', 'No agents found') }}
                      </TableCell>
                    </TableRow>
                    <TableRow v-for="agent in agents" :key="agent.id">
                      <TableCell>{{ agent.name }}</TableCell>
                      <TableCell>{{ agent.description || agent.prompt?.substring(0, 50) + '...' || t('team.agents.noDescription', 'No description') }}</TableCell>
                      <TableCell>{{ getAgentZentCount(agent) }}</TableCell>
                      <TableCell>
                        <div class="flex gap-1">
                          <Button variant="ghost" size="icon" @click="editAgent(agent)">
                            <Icon icon="lucide:pencil" class="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" @click="deleteAgent(agent)">
                            <Icon icon="lucide:trash-2" class="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <!-- Activity Tab -->
          <TabsContent value="activity" class="flex-1 overflow-auto p-4">
            <div class="space-y-4">
              <h3 class="text-lg font-medium">{{ t('team.activity.title', 'Activity Log') }}</h3>

              <div class="border rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{{ t('team.activity.date', 'Date') }}</TableHead>
                      <TableHead>{{ t('team.activity.user', 'User') }}</TableHead>
                      <TableHead>{{ t('team.activity.action', 'Action') }}</TableHead>
                      <TableHead>{{ t('team.activity.details', 'Details') }}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-if="activityLogs.length === 0">
                      <TableCell colspan="4" class="text-center py-4">
                        {{ t('team.activity.noLogs', 'No activity logs found') }}
                      </TableCell>
                    </TableRow>
                    <TableRow v-for="log in activityLogs" :key="log.id">
                      <TableCell>{{ formatDate(log.created_at) }}</TableCell>
                      <TableCell>{{ log.user }}</TableCell>
                      <TableCell>{{ log.action }}</TableCell>
                      <TableCell>{{ log.details }}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <!-- Run History Tab -->
          <TabsContent value="runHistory" class="flex-1 overflow-auto p-4">
            <div class="space-y-4">
              <h3 class="text-lg font-medium">{{ t('team.runHistory.title', 'Run History') }}</h3>

              <div class="border rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{{ t('team.runHistory.date', 'Date') }}</TableHead>
                      <TableHead>{{ t('team.runHistory.type', 'Type') }}</TableHead>
                      <TableHead>{{ t('team.runHistory.agent', 'Agent') }}</TableHead>
                      <TableHead>{{ t('team.runHistory.status', 'Status') }}</TableHead>
<!--                      <TableHead>{{ t('team.runHistory.actions', 'Actions') }}</TableHead>-->
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-if="runHistories.length === 0">
                      <TableCell colspan="5" class="text-center py-4">
                        {{ t('team.runHistory.noHistory', 'No run history found') }}
                      </TableCell>
                    </TableRow>
                    <TableRow v-for="history in runHistories" :key="history.id">
                      <TableCell>{{ formatDate(history.created_at) }}</TableCell>
                      <TableCell>{{ history.type }}</TableCell>
                      <TableCell>{{ history.agent_name }}</TableCell>
                      <TableCell>
                        <Badge :variant="getStatusVariant(history.status)">
                          {{ history.status }}
                        </Badge>
                      </TableCell>
<!--                      <TableCell>-->
<!--                        <Button variant="ghost" size="icon" @click="viewRunDetails(history)">-->
<!--                          <Icon icon="lucide:eye" class="h-4 w-4" />-->
<!--                        </Button>-->
<!--                      </TableCell>-->
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@iconify/vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { organizationStore } from '@/stores/organization'
import { teamStore } from '@/stores/team'
import { agentStore } from '@/stores/agent'
import { zentStore } from '@/stores/zent'
import { runHistoryStore } from '@/stores/runHistory'
import { activityStore } from '@/stores/activity'
import { apiRequest } from '@/api'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  team: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:open', 'addAgent'])

const { t } = useI18n()
const { toast } = useToast()

// Team settings
const editedName = ref(props.team?.name || '')
const editedDescription = ref(props.team?.description || '')
const permission = ref(props.team?.is_public ? 'public' : 'private')

// Members management
const organizationMembers = ref([])
const teamMembers = ref([])

// Agents and activity data
const agents = computed(() => {
  return agentStore.agents.value.filter(agent => agent.team === props.team?.slug)
})

const agentCount = computed(() => agents.value.length)

const zentCount = computed(() => {
  return zentStore.zents.value.filter(zent => {
    // Count zents that belong to agents in this team
    const teamAgentSlugs = agents.value.map(agent => agent.slug)
    return teamAgentSlugs.includes(zent.agent)
  }).length
})

const memberCount = ref(0)

const activityLogs = ref([])
const runHistories = ref([])

// Load data when component is mounted
onMounted(async () => {
  if (props.team) {
    await loadMembers()
    await loadActivityLogs()
    await loadRunHistory()
  }
})

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
  } catch (e) {
    return dateString
  }
}

// Get organization name
const getOrganizationName = (slug) => {
  if (!slug) return t('team.overview.noOrganization', 'No organization')
  const org = organizationStore.organizations.value.find(org => org.slug === slug)
  return org ? org.name : slug
}

// Get status variant for badges
const getStatusVariant = (status) => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'error':
      return 'destructive'
    case 'running':
      return 'secondary'
    default:
      return 'outline'
  }
}

// Get agent zent count
const getAgentZentCount = (agent) => {
  return zentStore.zents.value.filter(zent => zent.agent === agent.slug).length
}

// Save team settings
const saveTeamSettings = async () => {
  // Validate required fields
  if (!editedName.value || !editedName.value.trim()) {
    toast({
      title: t('team.overview.nameRequired', 'Name is required'),
      description: t('team.overview.nameRequiredDesc', 'Please enter a name for the team'),
      variant: 'destructive'
    });
    return;
  }

  try {
    // Create team data object
    const teamData = {
      slug: props.team.slug,
      name: editedName.value,
      description: editedDescription.value,
    };
    console.log("props.team");
    console.log(props.team);
    console.log("teamData");
    console.log(teamData);

    // Save to local database
    await teamStore.updateTeam(props.team.id, teamData);
    emit('update:open', false)
    toast({
      title: t('team.overview.settingsSaved', 'Settings saved'),
      description: t('team.overview.settingsSavedDesc', 'Team settings have been updated'),
    })

    // Save to server via API
    // Create a deep copy of the data before making the API request
    const teamDataCopy = structuredClone(JSON.parse(JSON.stringify(teamData)));
    await apiRequest(`/zentrun-team/`, 'PUT', teamDataCopy);
  } catch (error) {
    toast({
      title: t('team.overview.settingsError', 'Error saving settings'),
      description: error.message || t('team.overview.settingsErrorDesc', 'An error occurred while saving settings'),
      variant: 'destructive'
    })
  }
}

// Add member to team
const addMemberToTeam = async (member) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Create a deep copy of the data before making the API request
    const addMemberData = structuredClone(JSON.parse(JSON.stringify({
      team: props.team.slug,
      memberId: member.id,
      role: 'editor',
      user: user?.id,
      by: user?.username,
    })));
    await apiRequest(`/zentrun-team/members`, 'POST', addMemberData)

    toast({
      title: t('team.members.memberAdded', 'Member added'),
      description: t('team.members.memberAddedDesc', 'Member has been added to the team'),
    })

    await loadMembers()
  } catch (error) {
    toast({
      title: t('team.members.addError', 'Error adding member'),
      description: error.message || t('team.members.addErrorDesc', 'An error occurred while adding the member'),
      variant: 'destructive'
    })
  }
}

// Update a member's role
const updateMemberRole = async (member) => {
  try {
    // Create a deep copy of the data before making the API request
    const updateRoleData = structuredClone(JSON.parse(JSON.stringify({
      team: props.team.slug,
      memberId: member.id,
      role: member.teamRole
    })));
    await apiRequest(`/zentrun-team/members`, 'PUT', updateRoleData)

    toast({
      title: t('team.members.roleUpdated', 'Role updated'),
      description: t('team.members.roleUpdatedDesc', 'Member role has been updated'),
    })
  } catch (error) {
    toast({
      title: t('team.members.roleError', 'Error updating role'),
      description: error.message || t('team.members.roleErrorDesc', 'An error occurred while updating the role'),
      variant: 'destructive'
    })
  }
}

// Remove a member from team
const removeMemberFromTeam = async (member) => {
  try {
    // Create a deep copy of the data before making the API request
    const removeMemberData = structuredClone(JSON.parse(JSON.stringify({
      team: props.team.slug,
      memberId: member.id
    })));
    await apiRequest(`/zentrun-team/members`, 'DELETE', removeMemberData)

    toast({
      title: t('team.members.memberRemoved', 'Member removed'),
      description: t('team.members.memberRemovedDesc', 'Member has been removed from the team'),
    })

    await loadMembers()
  } catch (error) {
    toast({
      title: t('team.members.removeError', 'Error removing member'),
      description: error.message || t('team.members.removeErrorDesc', 'An error occurred while removing the member'),
      variant: 'destructive'
    })
  }
}

// Edit agent
const editAgent = (agent) => {
  // This would open the agent edit dialog
  console.log('Edit agent:', agent)
}

// Delete agent
const deleteAgent = async (agent) => {
  try {
    // Create a deep copy of the data before making the API request
    const deleteAgentData = structuredClone(JSON.parse(JSON.stringify({
      slug: agent.slug
    })));
    await apiRequest(`/zentrun-agent/`, 'DELETE', deleteAgentData)

    toast({
      title: t('team.agents.agentDeleted', 'Agent deleted'),
      description: t('team.agents.agentDeletedDesc', 'Agent has been deleted'),
    })
  } catch (error) {
    toast({
      title: t('team.agents.deleteError', 'Error deleting agent'),
      description: error.message || t('team.agents.deleteErrorDesc', 'An error occurred while deleting the agent'),
      variant: 'destructive'
    })
  }
}

// View run history details
const viewRunDetails = (history) => {
  // This would open a detailed view of the run history
  console.log('View run details:', history)
}

// Load members data
const loadMembers = async () => {
  try {
    // This would be replaced with actual API calls
    organizationMembers.value = []
    teamMembers.value = []
    memberCount.value = 0
  } catch (error) {
    console.error('Error loading members:', error)
  }
}

// Load activity logs
const loadActivityLogs = async () => {
  try {
    // Load activities from the activity store
    await activityStore.loadActivities()
    // Filter activities for this team
    activityLogs.value = activityStore.getActivitiesByTeam(props.team.slug)
  } catch (error) {
    console.error('Error loading activity logs:', error)
  }
}

// Load run history
const loadRunHistory = async () => {
  try {
    await runHistoryStore.loadRunHistories()
    runHistories.value = await runHistoryStore.getRunHistoriesByTeam(props.team.slug)
    // runHistories.value = histories.filter(h => h.team === props.team.slug)
  } catch (error) {
    console.error('Error loading run history:', error)
  }
}
</script>
