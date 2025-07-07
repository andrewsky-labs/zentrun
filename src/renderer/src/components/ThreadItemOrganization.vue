<template>
  <div class="flex items-center px-2 py-1 hover:bg-accent rounded select-none group">
    <div class="flex items-center flex-1 cursor-pointer">
      <div @click="toggleFolder" class="flex items-center">
        <Icon :icon="thread.expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-4 h-4 mr-1" />
        <Icon icon="lucide:package" class="w-4 h-4 mr-2" />
<!--        <img :src="getImageUrl(thread.thumbnail)" class="w-8 h-8 mr-2" style="border-radius: 10px" />-->
      </div>
      <span class="font-bold text-xs cursor-pointer" @click="$emit('view', thread)">{{ thread.name }}</span>
      <Icon v-if="thread.is_public" icon="lucide:globe" class="w-3 h-3 ml-1 text-blue-500" :title="t('public')" />
    </div>
    <Button
      variant="ghost"
      size="icon"
      class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
      @click="handleExecuteZpilot"
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
        <DropdownMenuItem @select="$emit('edit', thread)">
          <Icon icon="lucide:info" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.details', 'Details') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('addTeam', thread)">
          <Icon icon="lucide:folder-plus" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.addTeam') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('addAgent', thread)">
          <Icon icon="lucide:plus" class="mr-2 h-4 w-4"/>
          <span>{{ t('thread.actions.addAgent') }}</span>
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
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'
import type { CONVERSATION } from '@shared/presenter'
import { useChatStore } from '@/stores/chat'
import { agentStore } from '@/stores/agent'
import { useToast } from '@/components/ui/toast/use-toast'
import { isViewerRole } from '@/lib/roleUtils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import router from '@/router'

const props = defineProps<{
  thread: CONVERSATION
}>()

const emit = defineEmits<{
  toggleFolder: [thread: any]
  addTeam: [thread: any]
  addAgent: [thread: any]
  rename: [thread: any]
  delete: [thread: any]
  renameTeam: [team: any]
  deleteTeam: [team: any]
  edit: [thread: any]
  view: [thread: any]
}>()

const { t } = useI18n()
const chatStore = useChatStore()
const { toast } = useToast()

// Check if the current user has a viewer role in this organization
const isViewer = computed(() => {
  return isViewerRole(props.thread.slug)
})

function getImageUrl(imageName) {
  return new URL(`../assets/images/characters/${imageName}`, import.meta.url).href;
}


// Toggle folder expansion
const toggleFolder = () => {
  emit('toggleFolder', props.thread)
}

// Get available agents for this organization
const availableAgents = computed(() => {
  return agentStore.agents.value.filter(agent =>
    agent.organization === props.thread.slug
  )
})

// Handle click on the execute zpilot button
const handleExecuteZpilot = async () => {
  try {
    const agents = availableAgents.value;

    if (agents.length === 0) {
      toast({
        title: t('zpilot.execute.error', 'Execution Error'),
        description: t('zpilot.execute.noAgents', 'No agents available in this organization'),
        variant: 'destructive'
      })
      return
    }

    // Create a new thread with the organization name
    const threadId = await chatStore.createThread(`Zpilot: ${props.thread.name}`, chatStore.chatConfig)

    // Set the active thread
    await chatStore.setActiveThread(threadId)

    // Set the zpilot with the available agents
    chatStore.setZpilot({
      id: props.thread.id,
      name: props.thread.name,
      agents: agents,
      threadId: threadId
    })

    toast({
      title: t('zpilot.execute.success', 'Zpilot Execution Started'),
      description: t('zpilot.execute.ready', 'Enter your message to start the zpilot execution'),
      variant: 'default'
    })

    // Navigate to the thread
    router.push({ name: 'chat' })
  } catch (error) {
    console.error('Failed to execute zpilot:', error)
    toast({
      title: t('zpilot.execute.error', 'Execution Error'),
      description: error.message || t('zpilot.execute.unknownError', 'An unknown error occurred'),
      variant: 'destructive'
    })
  }
}
</script>
