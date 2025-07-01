<template>
  <div class="flex items-center px-2 py-1 hover:bg-accent rounded select-none group">
    <div class="flex items-center flex-1 cursor-pointer" @click="toggleFolder">
      <Icon :icon="thread.expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-4 h-4 mr-1" />
      <Icon icon="lucide:bot" class="w-4 h-4 mr-2" />

<!--        <img :src="getImageUrl(thread.thumbnail)" class="w-8 h-8 mr-2" style="border-radius: 10px" />-->

      <span class="font-bold text-xs cursor-pointer" @click="$emit('view', thread)">{{ thread.name }}</span>
      <Icon v-if="thread.is_public" icon="lucide:globe" class="w-3 h-3 ml-1 text-blue-500" :title="t('public')" />
    </div>
    <Button
      variant="ghost"
      size="icon"
      class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
      @click="handleAgentClick"
    >
      <Icon icon="lucide:play" class="h-3 w-3 text-muted-foreground" />
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop
        >
          <Icon icon="lucide:more-horizontal" class="h-3 w-3 text-muted-foreground"/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('edit', thread)">
          <Icon icon="lucide:pencil" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.editAgent') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" @select="openAgentDatabase">
          <Icon icon="lucide:database" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.editAgentDb', 'Edit Database') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem @select="$emit('copy', thread)">
          <Icon icon="lucide:copy" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.copyAgent') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('move', thread)">
          <Icon icon="lucide:move" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.moveAgent') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('rename', thread)">
          <Icon icon="lucide:pencil" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.rename') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" class="text-destructive" @select="$emit('delete', thread)">
          <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.delete') }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  <div v-show="thread.expanded" class="pl-6">
    <template v-for="zent in thread.children" :key="zent.id">
      <ThreadItemZent
        v-if="zent.type === 'zent'"
        :thread="zent"
        :is-active="zent.id === activeThreadId"
        :working-status="chatStore.getThreadWorkingStatus(zent.id)"
        @select="$emit('selectZent', zent)"
        @rename="$emit('renameZent', zent)"
        @delete="$emit('deleteZent', zent)"
        @copyZent="$emit('copyZent', zent)"
        @moveZent="$emit('moveZent', zent)"
        @editZent="$emit('editZent', zent)"
        @cleanmsgs="$emit('cleanmsgsZent', zent)"
      />
    </template>
  </div>

  <!-- Agent Preview Dialog -->
  <Dialog :open="showPreview" @update:open="showPreview = $event">
    <DialogContent class="max-w-4xl h-[80vh]">
      <DialogHeader>
        <DialogTitle>{{ t('agent.preview.title', 'Execute Agent') }}</DialogTitle>
        <DialogDescription>{{ t('agent.preview.description', 'Review and execute your Agent') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-4 ">
        <form class="flex flex-col gap-4">
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('agent.preview.name', 'Name') }}</span>
            <div class="p-2 border rounded bg-gray-50">{{ agentData.name }}</div>
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('agent.preview.prompt', 'Prompt') }}</span>
            <Textarea v-model="editedPrompt" rows="3" class="w-full" />
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('agent.preview.description', 'Description') }}</span>
            <div class="p-2 border rounded bg-gray-50 whitespace-pre-wrap">{{ agentData?.description }}</div>
          </Label>
          <div v-if="agentData.tool_calls?.length">
            <span class="font-semibold">{{ t('agent.preview.toolCalls', 'Tool Calls') }}</span>
            <ul class="mt-2 space-y-2">
              <li v-for="(call, idx) in agentData.tool_calls" :key="call.id" class="flex gap-3 p-2 border rounded items-start">
                <img v-if="call.mcpImageUrl" :src="call.mcpImageUrl" :alt="t('mcp-image')" class="w-8 h-8 rounded bg-gray-100 object-cover mt-1" />
                <span v-else>{{ call.server_icons }}</span>
                <div class="flex flex-col flex-1 gap-1">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span v-if="call.mcpName" class="font-semibold text-sm">{{ call.mcpName }}</span>
                      <span v-else class="font-semibold text-sm">{{ call.server_name }}</span>
                      <span class="text-xs text-gray-500">{{ call.name }}</span>
                      <label class="flex items-center gap-1 ml-2 text-xs">
                        <input type="checkbox" v-model="lockedInputs[idx]" /> {{ t('agent.preview.lockInputs', 'Lock inputs') }}
                      </label>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1 mt-1">
                    <label class="text-xs font-semibold">{{ t('agent.preview.arguments', 'Arguments') }}</label>
                    <template v-if="lockedInputs[idx]">
                      <Textarea v-model="editedToolCalls[idx].params" class="text-sm" rows="2" />
                    </template>
                    <template v-else>
                      <div class="bg-gray-50 border rounded p-2 text-sm text-gray-700 whitespace-pre-wrap">{{ call.params }}</div>
                    </template>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </form>
      </div>

      <DialogFooter class="flex justify-between">
        <div>
          <Button variant="default" @click="executeAgent">{{ t('agent.preview.execute', 'Execute') }}</Button>
        </div>
        <div>
          <Button variant="outline" @click="showPreview = false">{{ t('dialog.cancel', 'Cancel') }}</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Agent Database Editor Dialog -->
  <Dialog :open="showDatabaseDialog" @update:open="showDatabaseDialog = $event">
    <DialogContent class="max-w-full h-[80vh]">
      <DialogHeader>
        <DialogTitle>{{ t('agent.database.title', 'Agent Database Editor') }}</DialogTitle>
        <DialogDescription>{{ t('agent.database.description', 'Edit the database for agent:') }} {{ agentData.name }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto">
        <AgentDatabaseEditor :db-path="agentDbPath" />
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showDatabaseDialog = false">{{ t('dialog.close', 'Close') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CONVERSATION, MCPToolCall, LLMAgentEvent } from '@shared/presenter'
import type { WorkingStatus } from '@/stores/chat'
import { STREAM_EVENTS } from '@shared/events'
import { useChatStore } from '@/stores/chat'
import { zentStore } from '@/stores/zent'
import { usePresenter } from '@/composables/usePresenter'
import { useToast } from '@/components/ui/toast/use-toast'
import { isViewerRole } from '@/lib/roleUtils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { runHistoryStore } from "@/stores/runHistory"
import { apiRequest } from "@/api"
import ThreadItemZent from '@/components/ThreadItemZent.vue'
import AgentDetailDialog from '@/components/dialogs/agent/detail.vue'
import AgentDatabaseEditor from '@/components/AgentDatabaseEditor.vue'
import router from '@/router'

const props = defineProps<{
  thread: CONVERSATION
  isActive?: boolean
  activeThreadId?: string
  workingStatus?: WorkingStatus | null
}>()

const emit = defineEmits<{
  toggleFolder: [thread: any]
  edit: [thread: any]
  copy: [thread: any]
  move: [thread: any]
  rename: [thread: any]
  delete: [thread: any]
  selectZent: [thread: any]
  renameZent: [thread: any]
  deleteZent: [thread: any]
  copyZent: [thread: any]
  moveZent: [thread: any]
  editZent: [thread: any]
  cleanmsgsZent: [thread: any]
}>()

const { t } = useI18n()
const chatStore = useChatStore()
const mcpPresenter = usePresenter('mcpPresenter')
const llmPresenter = usePresenter('llmproviderPresenter')
const agentSQLitePresenter = usePresenter('agentSQLitePresenter')
const { toast } = useToast()

// Check if the current user has a viewer role in this agent's organization
const isViewer = computed(() => {
  return isViewerRole(props.thread.organization)
})

// Preview dialog state
const showPreview = ref(false)
const showDetailDialog = ref(false)
const showDatabaseDialog = ref(false)
const agentData = ref<any>({})
const editedPrompt = ref('')
const editedToolCalls = ref<any[]>([])
const lockedInputs = ref<boolean[]>([])
const isPlanning = ref(false)
const plannedToolCalls = ref<any[]>([])
const agentDbPath = ref('')


function getImageUrl(imageName) {
  return new URL(`../assets/images/characters/${imageName}`, import.meta.url).href;
}


// Load agent data when thread changes
watch(() => props.thread, async (newThread) => {
  if (newThread && newThread.id) {
    agentData.value = newThread;
    editedPrompt.value = newThread.prompt || ''

    if (newThread.tool_calls && Array.isArray(newThread.tool_calls)) {
      editedToolCalls.value = JSON.parse(JSON.stringify(newThread.tool_calls))
      lockedInputs.value = newThread.tool_calls.map(() => true)
    } else {
      editedToolCalls.value = []
      lockedInputs.value = []
    }
  }
}, { immediate: true })

// Watch for changes in lockedInputs to update editedToolCalls
watch(lockedInputs, (newLockedInputs, oldLockedInputs) => {
  if (!agentData.value.tool_calls) return

  // Find which index changed
  const changedIndex = newLockedInputs.findIndex((value, index) => value !== oldLockedInputs[index])

  if (changedIndex !== -1) {
    // If locked status changed to unlocked, reset the edited tool call to the original
    if (!newLockedInputs[changedIndex]) {
      editedToolCalls.value[changedIndex] = JSON.parse(JSON.stringify(agentData.value.tool_calls[changedIndex]))
    }
  }
}, { deep: true })

// Toggle folder expansion
const toggleFolder = () => {
  emit('toggleFolder', props.thread)
}

// Handle click on the agent item to show preview
const handleAgentClick = () => {
  showPreview.value = true
}

// Open agent database editor
const openAgentDatabase = async () => {
  try {
    // Get the agent's database path
    agentDbPath.value = await agentSQLitePresenter.getAgentDatabasePath(agentData.value?.slug)

    // Create the database if it doesn't exist
    await agentSQLitePresenter.createAgentDatabase(agentData.value?.slug)

    // Show the database dialog
    showDatabaseDialog.value = true
  } catch (error) {
    console.error('Failed to open agent database:', error)
    toast({
      title: t('agent.database.error', 'Database Error'),
      description: error.message || t('agent.database.openError', 'An error occurred while opening the database'),
      variant: 'destructive'
    })
  }
}

// Execute the agent
const executeAgent = async () => {
  try {
    showPreview.value = false

    // Get model settings from the chat config (user-selected)
    const modelSettings = {
      systemPrompt: editedPrompt.value || '',
      temperature: chatStore.chatConfig.temperature || 0.7,
      contextLength: chatStore.chatConfig.contextLength || 1000,
      maxTokens: chatStore.chatConfig.maxTokens || 2000,
      providerId: chatStore.chatConfig.providerId,
      modelId: chatStore.chatConfig.modelId
    }

    // Create a new thread with the agent name
    const threadId = await chatStore.createThread(agentData.value.name, modelSettings)

    // Set the active thread
    await chatStore.setActiveThread(threadId)

    // Get the agent's database path
    const dbPath = await agentSQLitePresenter.getAgentDatabasePath(agentData.value.slug)

    // Append database path to the prompt
    const promptWithDb = editedPrompt.value + `\n\nLocal database path: ${dbPath}`

    // Set the agent in the chat store
    chatStore.setAgent({
      id: agentData.value.id,
      name: agentData.value.name,
      threadId: threadId,
      slug: agentData.value.slug,
      prompt: promptWithDb
    })

    runHistoryStore.addRunHistory({
      type: 'agent',
      status: 'Success',
      run_slug: agentData.value.slug,
      prompt: promptWithDb,
      tool_calls: editedToolCalls.value,
      user: agentData.value.user,
      by: agentData.value.by,
      agent: agentData.value.slug,
      agent_name: agentData.value.name,
      team: agentData.value.team,
      organization: agentData.value.organization,
      // data: any // JSON parsed
    });

    // Navigate to the thread
    router.push({ name: 'chat' })

    // toast({
    //   title: t('agent.execute.success', t('agent-ready')),
    //   description: t('agent.execute.prompt', t('enter-your-message-to-interact-with-the-agent')),
    //   variant: 'default'
    // })
  } catch (error) {
    console.error('Failed to execute agent:', error)
    toast({
      title: t('agent.execute.error', t('execution-error')),
      description: error.message || t('agent.execute.unknownError', t('an-unknown-error-occurred')),
      variant: 'destructive'
    })
  }
}

// Plan tool calls using the LLM
const planToolCalls = async (prompt: string, toolCalls: any[], lockedInputs: boolean[]) => {
  try {
    isPlanning.value = true

    // Get model settings from the chat config (user-selected)
    const providerId = chatStore.chatConfig.providerId
    const modelId = chatStore.chatConfig.modelId

    if (!providerId || !modelId) {
      toast({
        title: t('agent.planning.error', t('planning-error')),
        description: t('agent.planning.noModel', t('no-model-selected-for-planning-tool-calls')),
        variant: 'destructive'
      })
      return null
    }

    // Prepare the tool calls with lock status indicators
    const toolCallsWithLockInfo = toolCalls.map((toolCall, idx) => {
      const params = typeof toolCall.params === 'string' ?
        JSON.parse(toolCall.params) : toolCall.params

      // Mark locked parameters
      const markedParams = {}
      for (const [key, value] of Object.entries(params)) {
        markedParams[key] = lockedInputs[idx] ? `🔒 ${value}` : value
      }

      let data = {
        "id": toolCall.id,
        "name": toolCall.name,
        "params": toolCall.params,
        "server_name": toolCall.server_name,
        "server_icons": toolCall.server_icons,
        "server_description": toolCall.server_description
      }
      if (lockedInputs[idx]) {
        data.isLocked = true
      }

      return data
    })

    // Create the planning prompt
    const planningPrompt = [
      {
        role: 'system',
        content: `This is a tool call planner. So you need to return list of tool call based on the sequence of tool calls with prompt that you received.
Some parameters in tool calls may already be locked (indicated by isLocked). Do not change these parameters.
For unlocked parameters, it generates the appropriate params value based on the current context and operation.
So the response must follow the input parameter structure exactly, except for the changed params value.
Don't attach anything else but just answer the list of tool call that is edited.`
      },
      {
        role: 'user',
        content: `[Prompt]
${prompt}

[Tool Calls]
${JSON.stringify(toolCallsWithLockInfo, null, 2)}`
      }
    ]

    console.log("Generate the plan started")
    // Generate the plan
    const planResult = await llmPresenter.generateCompletion(
      providerId,
      planningPrompt,
      modelId,
      0.7,  // temperature
      2000  // maxTokens
    )

    console.log("planResult")
    console.log(planResult)

    // Parse the plan
    try {
      // Extract JSON if there's any surrounding text
      const jsonMatch = planResult.match(/\[[\s\S]*\]/)
      const jsonStr = jsonMatch ? jsonMatch[0] : planResult

      const plannedCalls = JSON.parse(jsonStr)

      // Process the planned calls to ensure they have the right structure
      const processedCalls = plannedCalls.map((plannedCall, idx) => {
        const originalCall = toolCalls[idx]

        // If the parameter is locked, use the original value
        if (lockedInputs[idx]) {
          return originalCall
        }

        // Otherwise, use the planned value but keep the original structure
        return {
          ...originalCall,
          params: plannedCall.params
        }
      })

      return processedCalls
    } catch (error) {
      console.error('Failed to parse planned tool calls:', error)
      toast({
        title: t('agent.planning.error', t('planning-error')),
        description: t('agent.planning.parseError', t('failed-to-parse-planned-tool-calls')),
        variant: 'destructive'
      })
      return null
    }
  } catch (error) {
    console.error('Failed to plan tool calls:', error)
    toast({
      title: t('agent.planning.error', t('planning-error')),
      description: t('agent.planning.generalError', t('failed-to-plan-tool-calls')),
      variant: 'destructive'
    })
    return null
  } finally {
    isPlanning.value = false
  }
}

// Get status icon based on working status
const getStatusIcon = (status: WorkingStatus | null) => {
  switch (status) {
    case 'working':
      return 'lucide:loader'
    case 'error':
      return 'lucide:cloud-alert'
    case 'completed':
      return 'lucide:circle-check-big'
    default:
      return ''
  }
}
</script>
