<template>
  <Dialog :open="isOpen" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-md bg-blue-100 flex items-center justify-center text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <h2 class="font-bold text-xl">{{ automation.name }}</h2>
            <span class="text-xs text-gray-500">{{t("by")}} {{ automation.by || t('Unknown') }}</span>
          </div>
        </div>
      </DialogHeader>

      <div class="mb-2">
        <span class="text-xs text-gray-400">{{t("Created")}}: {{ formatDate(automation.created_at) }}</span>
      </div>

      <!-- 추가 정보: 일정, 빈도, 상태, 최근 실행 -->
      <div class="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
        <div class="font-semibold">{{ t('schedule-cron') }}</div>
        <div>{{ automation.schedule || '-' }}</div>
        <div class="font-semibold">Frequency:</div>
        <div>{{ automation.frequency || '-' }}</div>
        <div class="font-semibold">Status:</div>
        <div class="flex items-center">
          <div>
            <Switch
              :aria-label="automation.status"
              :checked="automation.status === 'active'"
              @update:checked="toggleStatus"
            />
          </div>
          <div
            class="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium"
            :class="automation.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'"
          >
            {{ automation.status || '-' }}
          </div>
        </div>
        <div class="font-semibold">{{ t('latest-run') }}</div>
        <div>{{ formatDate(automation.lastRun) }}</div>
      </div>

          <Button @click="openEdit" variant="outline" class="ml-2">{{ t('edit') }}</Button>
      <div class="mt-4">
        <h3 class="font-semibold text-base mb-2">{{ t('prompt') }}</h3>
        <div class="grid grid-cols-1 gap-3">
          <p class="text-sm text-gray-700 mb-2">{{ automation.prompt || 'No description available' }}</p>
        </div>
      </div>

      <div v-if="automation.tool_calls && automation.tool_calls.length" class="mt-4">
        <h3 class="font-semibold text-base mb-2">{{ t('tool-calls') }}</h3>
        <div class="grid grid-cols-1 gap-3">
          <div v-for="(call, index) in automation.tool_calls" :key="index" class="flex items-center gap-3 p-2 rounded border border-gray-100 bg-gray-50">
            <div class="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">{{ call.mcpName || call.server_name || 'Tool Call' }}</div>
              <div class="text-xs text-gray-500">{{ call.name || 'No name' }}</div>
            </div>
          </div>
        </div>
      </div>
      <div>
      </div>

      <DialogFooter class="flex justify-between gap-2 mt-8">
        <div>
          <Button @click="$emit('update:open', false)" variant="outline">{{ t('close') }}</Button>

        </div>
        <div>
        <Button @click="deleteAutomation" variant="destructive" class="ml-2">{{ t('delete') }}</Button>
        <Button @click="runNow" :disabled="isLoading" class="ml-2">
          {{ isLoading ? t('common.running') : t('common.runNow') }}
        </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { automationStore } from '@/stores/automation';
import { useChatStore } from '@/stores/chat';
import { useI18n } from "vue-i18n";
import { apiRequest } from "@/api";
import router from '@/router'
import {Switch} from "@/components/ui/switch/index.js";


const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  automation: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:open', 'deleted', 'updated', 'edit']);

const { toast } = useToast();
const chatStore = useChatStore();
const isLoading = ref(false);
const { t } = useI18n()

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString();
}

async function toggleStatus() {
  try {
    const newStatus = props.automation.status === 'active' ? 'inactive' : 'active';
    const updatedAutomation = {
      ...props.automation,
      status: newStatus
    };

    // Update in local database
    await automationStore.updateAutomation(props.automation.id, updatedAutomation);

    props.automation.status = newStatus;

    // Update on remote server
    try {
      // Create a deep copy of the data before making the API request
      const updatedAutomationCopy = structuredClone(JSON.parse(JSON.stringify(updatedAutomation)));
      await apiRequest(`/zentrun-automation/${props.automation.id}/`, 'PUT', updatedAutomationCopy);
    } catch (apiError) {
      console.error('API error:', apiError);
      toast({
        title: t('local-status-update-successful-but-remote-sync-failed'),
        description: apiError.message || t('sync.error.unknown'),
        variant: 'warning'
      });
    }

    toast({ title: t('update-successfully') });
    emit('updated');
  } catch (error) {
    console.error('Failed to update automation status:', error);
    toast({
      title: t('failed-to-update-automation-status'),
      description: error.message || t('sync.error.unknown'),
      variant: 'destructive'
    });
  }
}

async function deleteAutomation() {
  if (confirm(t('are-you-sure-you-want-to-delete-this-automation'))) {
    try {
      // Delete from local database
      await automationStore.deleteAutomation(props.automation.id);

      // Delete from remote server
      try {
        await apiRequest(`/zentrun-automation/${props.automation.id}/`, 'DELETE');
      } catch (apiError) {
        console.error('API error:', apiError);
        toast({
          title: t('local-deletion-successful-but-remote-sync-failed'),
          description: apiError.message || t('sync.error.unknown'),
          variant: 'warning'
        });
      }

      toast({ title: t('automation-deleted-successfully') });
      emit('deleted');
      emit('update:open', false);
    } catch (error) {
      console.error('Failed to delete automation:', error);
      toast({
        title: t('failed-to-delete-automation'),
        description: error.message || t('sync.error.unknown'),
        variant: 'destructive'
      });
    }
  }
}

function openEdit() {
  emit('update:open', false);
  emit('edit', props.automation);
}

async function runNow() {
  try {
    isLoading.value = true;
    toast({ title: t('running-automation') });

    // Create a new thread with the organization name
    const threadId = await chatStore.createThread(`Zpilot: ${props.automation.name}`, chatStore.chatConfig)

    // Set the active thread
    await chatStore.setActiveThread(threadId)

    console.log("props.automation.tool_calls");
    console.log(props.automation.tool_calls);

    const lockedInputs = await props.automation.tool_calls.map(() => true);

    console.log("lockedInputs");
    console.log(lockedInputs);

    await router.push({ name: 'chat' })


    // Execute the automation using the chat store's executeZent function
    await chatStore.executeZent(
      props.automation,
      props.automation.prompt,
      props.automation.tool_calls,
      lockedInputs,
      t,
      threadId.value
    );

    // Update the lastRun field in local database
    const updatedAutomation = {
      ...props.automation,
      lastRun: new Date().toISOString()
    };
    await automationStore.updateAutomation(props.automation.id, updatedAutomation);

    // // Update on remote server
    // try {
    //   await apiRequest(`/zentrun-automation/${props.automation.id}/`, 'PUT', updatedAutomation);
    // } catch (apiError) {
    //   console.error('API error:', apiError);
    //   toast({
    //     title: 'Local update successful, but remote sync failed',
    //     description: apiError.message || 'Unknown error',
    //     variant: 'warning'
    //   });
    // }

    toast({ title: t('automation-executed-successfully') });

    emit('updated');
    emit('update:open', false);
  } catch (error) {
    console.error('Failed to run automation:', error);
    toast({
      title: t('failed-to-run-automation'),
      description: error.message || t('sync.error.unknown'),
      variant: 'destructive'
    });
  } finally {
    isLoading.value = false;
  }
}
</script>
