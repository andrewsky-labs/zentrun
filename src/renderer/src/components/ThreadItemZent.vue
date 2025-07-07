<template>
  <li
    :class="[
      'select-none px-2 py-2 rounded-md text-accent-foreground text-xs cursor-pointer group flex items-center justify-between',
      isActive ? 'bg-slate-200 dark:bg-accent' : 'hover:bg-accent'
    ]"
  >
    <div class="flex items-center truncate cursor-pointer" @click="$emit('viewZent', thread)">
      <Icon icon="lucide:layout-grid" class="w-4 h-4 mr-2" />
      <Icon
        v-if="workingStatus && !isActive"
        :icon="getStatusIcon(workingStatus)"
        class="mr-1 h-3 w-3 flex-shrink-0"
        :class="{
          'text-blue-500 animate-spin': workingStatus === 'working',
          'text-red-500': workingStatus === 'error',
          'text-green-500': workingStatus === 'completed'
        }"
      />
      <span class="truncate">{{ thread.title }}</span>
      <Icon v-if="thread.is_public" icon="lucide:globe" class="w-3 h-3 ml-1 text-blue-500" :title="t('public')" />
    </div>
    <Button
      variant="ghost"
      size="icon"
      class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
      @click="handleClick"
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
          <Icon icon="lucide:more-horizontal" class="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('editZent', thread)">
          <Icon icon="lucide:edit-2" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.editZent') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem @select="$emit('copyZent', thread)">
          <Icon icon="lucide:copy" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.copyZent') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('moveZent', thread)">
          <Icon icon="lucide:move" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.moveZent') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('rename', thread)">
          <Icon icon="lucide:pencil" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.rename') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" @select="$emit('cleanmsgs', thread)">
          <Icon icon="lucide:eraser" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.cleanMessages') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="!isViewer" class="text-destructive" @select="$emit('delete', thread)">
          <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
          <span>{{ t('thread.actions.delete') }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </li>

  <!-- Zent Preview Dialog -->
  <Dialog :open="showPreview" @update:open="showPreview = $event">
    <DialogContent class="max-w-4xl h-[80vh]">
      <DialogHeader>
        <DialogTitle>{{ t('zent.preview.title', 'Execute Zent') }}</DialogTitle>
        <DialogDescription>{{ t('zent.preview.description', 'Review and execute your Zent') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-4 ">
        <form class="flex flex-col gap-4">
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('zent.preview.name', 'Name') }}</span>
            <div class="p-2 border rounded bg-gray-50">{{ zentData.name }}</div>
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('zent.preview.prompt', 'Prompt') }}</span>
            <Textarea v-model="editedPrompt" rows="3" class="w-full" />
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('zent.preview.description', 'Description') }}</span>
            <div class="p-2 border rounded bg-gray-50">{{ zentData?.description }}</div>
<!--            <Textarea v-model="description" rows="3" class="w-full" placeholder="Enter a description for this Zent" />-->
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('zent.preview.runningCodeAutoMode', 'Running Code Auto Mode') }}</span>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <input type="radio" id="off" value="off" v-model="runningCodeAutoMode" class="radio" />
                <label for="off">{{ t('zent.preview.off', 'Off') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" id="all" value="all" v-model="runningCodeAutoMode" class="radio" />
                <label for="all">{{ t('zent.preview.all', 'All') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" id="end-only" value="end-only" v-model="runningCodeAutoMode" class="radio" />
                <label for="end-only">{{ t('zent.preview.endOnly', 'End Only') }}</label>
              </div>
            </div>
          </Label>
          <div v-if="zentData.tool_calls?.length">
            <span class="font-semibold">{{ t('zent.preview.toolCalls', 'Tool Calls') }}</span>
            <ul class="mt-2 space-y-2">
              <li v-for="(call, idx) in zentData.tool_calls" :key="call.id" class="flex gap-3 p-2 border rounded items-start">
                <img v-if="call.mcpImageUrl" :src="call.mcpImageUrl" :alt="t('mcp-image')" class="w-8 h-8 rounded bg-gray-100 object-cover mt-1" />
                <span v-else>{{ call.server_icons }}</span>
                <div class="flex flex-col flex-1 gap-1">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span v-if="call.mcpName" class="font-semibold text-sm">{{ call.mcpName }}</span>
                      <span v-else class="font-semibold text-sm">{{ call.server_name }}</span>
                      <span class="text-xs text-gray-500">{{ call.name }}</span>
                      <label class="flex items-center gap-1 ml-2 text-xs">
                        <input type="checkbox" v-model="lockedInputs[idx]" /> {{ t('zent.preview.lockInputs', 'Lock inputs') }}
                      </label>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1 mt-1">
                    <label class="text-xs font-semibold">{{ t('zent.preview.arguments', 'Arguments') }}</label>
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
        <div class="flex gap-2">
          <Button variant="default" @click="executeZent">{{ t('zent.preview.execute', 'Execute') }}</Button>
          <Button variant="outline" @click="showSavedOutput" v-if="zentData.data && zentData.data.messages && zentData.data.messages.length">
            {{ t('zent.preview.showSavedOutput', 'Show Saved Output') }}
          </Button>
        </div>
        <div>
          <Button variant="outline" @click="showPreview = false">{{ t('dialog.cancel', 'Cancel') }}</Button>
        </div>
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
import type { CONVERSATION } from '@shared/presenter'
import type { WorkingStatus } from '@/stores/chat'
import { useChatStore } from '@/stores/chat'
import { zentStore } from '@/stores/zent'
import { useToast } from '@/components/ui/toast/use-toast'
import { usePresenter } from '@/composables/usePresenter'
import { isViewerRole } from '@/lib/roleUtils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

const props = defineProps<{
  thread: CONVERSATION
  isActive: boolean
  workingStatus: WorkingStatus | null
}>()

const emit = defineEmits<{
  select: [thread: any]
  rename: [thread: any]
  delete: [thread: any]
  cleanmsgs: [thread: any]
  editZent: [thread: any]
  viewZent: [thread: any]
  copyZent: [thread: any]
  moveZent: [thread: any]
}>()

const { t } = useI18n()
const chatStore = useChatStore()
const { toast } = useToast()
const threadP = usePresenter('threadPresenter')

// Check if the current user has a viewer role in this zent's organization
const isViewer = computed(() => {
  // Use the organization property directly if available
  if (props.thread.organization) {
    return isViewerRole(props.thread.organization)
  }
  return false
})

// Preview dialog state
const showPreview = ref(false)
const zentData = ref<any>({})
const editedPrompt = ref('')
// const description = ref('') // Added description ref
const editedToolCalls = ref<any[]>([])
const lockedInputs = ref<boolean[]>([])
const isPlanning = ref(false)
const plannedToolCalls = ref<any[]>([])
const runningCodeAutoMode = ref('end-only') // Default value as specified in requirements

// Load zent data when thread changes
watch(() => props.thread, async (newThread) => {
  if (newThread && newThread.id) {
    if (!zentStore.zents) {
      zentStore.loadZents()
    }
    const zent = await zentStore.getZentById(newThread.id)
    if (zent) {
      zentData.value = zent
      editedPrompt.value = zent.prompt || ''
      // description.value = zent.description || ''
      runningCodeAutoMode.value = zent.data?.runningCodeAutoMode || 'end-only'

      if (zent.tool_calls && Array.isArray(zent.tool_calls)) {
        editedToolCalls.value = JSON.parse(JSON.stringify(zent.tool_calls))
        lockedInputs.value = zent.tool_calls.map(() => true)
      } else {
        editedToolCalls.value = []
        lockedInputs.value = []
      }
    }
  }
}, { immediate: true })

// Watch for changes in lockedInputs to update editedToolCalls
watch(lockedInputs, (newLockedInputs, oldLockedInputs) => {
  if (!zentData.value.tool_calls) return

  // Find which index changed
  const changedIndex = newLockedInputs.findIndex((value, index) => value !== oldLockedInputs[index])

  if (changedIndex !== -1) {
    // If locked status changed to unlocked, reset the edited tool call to the original
    if (!newLockedInputs[changedIndex]) {
      editedToolCalls.value[changedIndex] = JSON.parse(JSON.stringify(zentData.value.tool_calls[changedIndex]))
    }
  }
}, { deep: true })

// Handle click on the thread item
const handleClick = () => {
  console.log("zentData.value", zentData.value)
  showPreview.value = true
}

// Execute the zent
const executeZent = async () => {
  try {
    showPreview.value = false;

    // Create a copy of zentData with updated description and runningCodeAutoMode
    const updatedZentData = {
      ...zentData.value,
      data: {
        ...zentData.value.data,
        // description: description.value,
        runningCodeAutoMode: runningCodeAutoMode.value
      }
    };

    // Call the executeZent function from chatStore
    const threadId = await chatStore.executeZent(
      updatedZentData,
      editedPrompt.value,
      editedToolCalls.value,
      lockedInputs.value,
      t
    );

    // Emit the select event to navigate to the thread
    emit('select', { id: threadId });

    // Close the preview dialog
    showPreview.value = false;
  } catch (error) {
    console.error('Failed to execute zent:', error);
    toast({
      title: t('zent.execute.error', 'Execution Error'),
      description: error.message || t('zent.execute.unknownError', 'An unknown error occurred'),
      variant: 'destructive'
    });
  }
}

// Show saved output from zentData.data.messages
const showSavedOutput = async () => {
  let threadId = null;

  try {
    showPreview.value = false;

    console.log("zentData.value.data", zentData.value.data);

    if (!zentData.value.data || !zentData.value.data.messages || !zentData.value.data.messages.length) {
      toast({
        title: t('zent.showSavedOutput.error', 'No Saved Output'),
        description: t('zent.showSavedOutput.noMessages', 'There are no saved messages to display'),
        variant: 'destructive'
      });
      return;
    }

    // Create a new thread with the zent name
    const modelSettings = {
      systemPrompt: zentData.value.systemPrompt || '',
      temperature: zentData.value.temperature || 0.7,
      contextLength: zentData.value.contextLength || 1000,
      maxTokens: zentData.value.maxTokens || 2000,
      providerId: chatStore.chatConfig.providerId,
      modelId: chatStore.chatConfig.modelId
    };

    // Create a new thread with the zent name and "(Saved Output)" suffix
    threadId = await chatStore.createThread(
      `${zentData.value.name} (${t('zent.showSavedOutput.suffix', 'Saved Output')})`,
      modelSettings
    );

    // Load threads to ensure the new thread is registered in the system
    await chatStore.loadThreads(1);

    // Set the active thread
    await chatStore.setActiveThread(threadId);

    try {
      // Set thread status to completed immediately to prevent "loading" state
      chatStore.updateThreadWorkingStatus(threadId, 'completed');

      // Directly remove the thread from generatingThreadIds to prevent "Thinking..." state
      // This is more reliable than cancelGenerating which only works if there's a message in generatingMessagesCache
      chatStore.generatingThreadIds.delete(threadId);

      // Also call cancelGenerating as a backup
      await chatStore.cancelGenerating(threadId);

      console.log("Thread status after setting to completed:",
        chatStore.getThreadWorkingStatus(threadId),
        "Is in generatingThreadIds:",
        chatStore.generatingThreadIds.has(threadId));

      // Display all messages from zentData.data.messages
      const messages = zentData.value.data.messages;

      if (!Array.isArray(messages)) {
        console.error('Messages is not an array:', messages);
        throw new Error(t('invalid-message-format'));
      }

      // Group messages by pairs (user followed by assistant)
      // This helps prevent the automatic creation of pending assistant messages
      const userMessages = messages.filter(msg => msg.role === 'user');
      const assistantMessages = messages.filter(msg => msg.role === 'assistant');

      // Make sure we have the same number of user and assistant messages
      // If not, we'll use the minimum number to avoid issues
      const pairCount = Math.min(userMessages.length, assistantMessages.length);

      console.log(`Found ${userMessages.length} user messages and ${assistantMessages.length} assistant messages`);
      console.log(`Processing ${pairCount} message pairs`);

      // Process messages in pairs
      for (let i = 0; i < pairCount; i++) {
        const userMessage = userMessages[i];
        const assistantMessage = assistantMessages[i];

        // Log the message pair for debugging
        console.log(`Processing message pair ${i}:`);
        console.log(`User message:`, userMessage);
        console.log(`Assistant message:`, assistantMessage);

        // Process user message
        let userText = '';

        // Extract text from different content formats
        if (typeof userMessage.content === 'string') {
          userText = userMessage.content;
        } else if (userMessage.content && typeof userMessage.content === 'object') {
          if (userMessage.content.text) {
            // If content has a text property, use it
            userText = userMessage.content.text;
          } else if (userMessage.content.content && Array.isArray(userMessage.content.content)) {
            // If content has a content array, extract text from it
            userText = userMessage.content.content
              .filter(item => item.type === 'text')
              .map(item => item.content)
              .join('\n');
          } else {
            // Fallback: use a simplified representation
            userText = t('user-message');
          }
        }

        const userContent = {
          text: userText,
          files: [],
          links: [],
          type: 'content'
        };

        // Process assistant message
        let assistantContent = [];

        // Process the message content based on its structure
        if (Array.isArray(assistantMessage.content)) {
          // Process each content block
          assistantContent = assistantMessage.content.map(block => {
            if (typeof block === 'string') {
              return { type: 'text', content: block, status: 'success' };
            }

            // Handle tool_call blocks
            if (block.type === 'tool_call' && block.tool_call) {
              return {
                type: 'tool_call',
                status: 'success',
                tool_call: {
                  name: block.tool_call.name,
                  server_name: block.tool_call.server_name,
                  server_icons: block.tool_call.server_icons,
                  params: block.tool_call.params,
                  response: block.tool_call.response
                }
              };
            }

            return {
              type: block.type || 'text',
              content: block.content || '',
              status: 'success'
            };
          });
        } else if (typeof assistantMessage.content === 'object' && assistantMessage.content !== null) {
          // Check if the object has tool_call property
          if (assistantMessage.content.tool_call) {
            assistantContent.push({
              type: 'tool_call',
              status: 'success',
              tool_call: {
                name: assistantMessage.content.tool_call.name,
                server_name: assistantMessage.content.tool_call.server_name,
                server_icons: assistantMessage.content.tool_call.server_icons,
                params: assistantMessage.content.tool_call.params,
                response: assistantMessage.content.tool_call.response
              }
            });
          } else {
            // For other object types, convert to text
            assistantContent.push({
              type: 'text',
              content: typeof assistantMessage.content.text === 'string' ? assistantMessage.content.text :
                      (typeof assistantMessage.content.content === 'string' ? assistantMessage.content.content :
                      JSON.stringify(assistantMessage.content)),
              status: 'success'
            });
          }
        } else {
          // Handle string content
          assistantContent.push({
            type: 'text',
            content: assistantMessage.content || '',
            status: 'success'
          });
        }

        // Add both messages to the database using messageManager directly
        // This bypasses the automatic creation of pending assistant messages
        // First, add the user message
        const userMessageId = await threadP.sendMessageByMessageManager(
          threadId,
          JSON.stringify(userContent),
          'user',
          '',
          false,
          {
            totalTokens: 0,
            generationTime: 0,
            firstTokenTime: 0,
            tokensPerSecond: 0,
            inputTokens: 0,
            outputTokens: 0,
            model: chatStore.chatConfig.modelId,
            provider: chatStore.chatConfig.providerId
          }
        );

        // Then, add the assistant message with the user message as parent
        await threadP.sendMessageByMessageManager(
          threadId,
          JSON.stringify(assistantContent),
          'assistant',
          userMessageId.id,
          false,
          {
            totalTokens: 0,
            generationTime: 0,
            firstTokenTime: 0,
            tokensPerSecond: 0,
            inputTokens: 0,
            outputTokens: 0,
            model: chatStore.chatConfig.modelId,
            provider: chatStore.chatConfig.providerId
          }
        );
      }
    } catch (messageError) {
      console.error('Error processing messages:', messageError);
      toast({
        title: t('zent.showSavedOutput.error', 'Error Processing Messages'),
        description: messageError.message || t('zent.showSavedOutput.formatError', 'Invalid message format'),
        variant: 'destructive'
      });
    } finally {
      // Always ensure the thread status is set to completed and messages are loaded
      if (threadId) {
        await chatStore.loadMessages();
        chatStore.updateThreadWorkingStatus(threadId, 'completed');

        // Directly remove the thread from generatingThreadIds
        chatStore.generatingThreadIds.delete(threadId);

        // Also call cancelGenerating as a backup
        await chatStore.cancelGenerating(threadId);

        console.log("Thread status in inner finally:",
          chatStore.getThreadWorkingStatus(threadId),
          "Is in generatingThreadIds:",
          chatStore.generatingThreadIds.has(threadId));
      }
    }

    // Emit the select event to navigate to the thread
    if (threadId) {
      // Make sure all messages are loaded before navigating
      await chatStore.loadMessages();

      // Double-check that the thread is not in generatingThreadIds
      chatStore.generatingThreadIds.delete(threadId);

      console.log("Final check before navigation:",
        "Thread status:", chatStore.getThreadWorkingStatus(threadId),
        "Is in generatingThreadIds:", chatStore.generatingThreadIds.has(threadId),
        "Messages count:", chatStore.messages.length);

      // Navigate to the thread
      emit('select', { id: threadId });
      // Load threads to ensure the new thread is registered in the system
      await chatStore.loadThreads(1);

      // Set the active thread
      await chatStore.setActiveThread(threadId);
    }

  } catch (error) {
    console.error('Failed to show saved output:', error);
    toast({
      title: t('zent.showSavedOutput.error', 'Error Displaying Saved Output'),
      description: error.message || t('zent.showSavedOutput.unknownError', 'An unknown error occurred'),
      variant: 'destructive'
    });
  } finally {
    // Double-check that the thread status is set to completed, messages are loaded,
    // and the thread is removed from generatingThreadIds
    if (threadId) {
      await chatStore.loadMessages();
      chatStore.updateThreadWorkingStatus(threadId, 'completed');

      // Directly remove the thread from generatingThreadIds
      chatStore.generatingThreadIds.delete(threadId);

      // Also call cancelGenerating as a backup
      await chatStore.cancelGenerating(threadId);

      console.log("Thread status in outer finally:",
        chatStore.getThreadWorkingStatus(threadId),
        "Is in generatingThreadIds:",
        chatStore.generatingThreadIds.has(threadId));
    }
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
