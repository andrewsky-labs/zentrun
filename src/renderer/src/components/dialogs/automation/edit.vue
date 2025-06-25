<template>
  <Dialog :open="isOpen" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ t('edit-automation') }}</DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('name') }}</label>
          <input
            type="text"
            v-model="name"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('schedule-cron-expression') }}</label>
          <input
            type="text"
            v-model="schedule"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">{{ t('format-minute-hour-day-of-month-month-day-of-week') }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('status') }}</label>
          <select
            v-model="status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="active">{{ t('active') }}</option>
            <option value="inactive">{{ t('inactive') }}</option>
          </select>
        </div>
      </div>

      <DialogFooter class="flex justify-end gap-2 mt-6">
        <Button @click="$emit('update:open', false)" variant="outline">{{ t('cancel') }}</Button>
        <Button @click="saveChanges" variant="default">{{ t('save-changes') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { automationStore } from '@/stores/automation';
import { apiRequest } from "@/api";

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

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

const emit = defineEmits(['update:open', 'updated']);

const { toast } = useToast();

// Form data
const name = ref('');
const schedule = ref('');
const status = ref('active');

// Initialize form data when automation changes
watch(() => props.automation, (newAutomation) => {
  if (newAutomation) {
    name.value = newAutomation.name || '';
    schedule.value = newAutomation.schedule || '';
    status.value = newAutomation.status || 'active';
  }
}, { immediate: true });

async function saveChanges() {
  try {
    if (!name.value) {
      toast({ title: t('name-is-required'), variant: 'destructive' });
      return;
    }

    const updatedAutomation = {
      ...props.automation,
      name: name.value,
      schedule: schedule.value,
      status: status.value
    };

    // Update in local database
    await automationStore.updateAutomation(props.automation.id, updatedAutomation);

    // Update on remote server
    try {
      // Create a deep copy of the data before making the API request
      const updatedAutomationCopy = structuredClone(updatedAutomation);
      await apiRequest(`/zentrun-automation/${props.automation.id}/`, 'PUT', updatedAutomationCopy);
    } catch (apiError) {
      console.error('API error:', apiError);
      toast({
        title: t('local-update-successful-but-remote-sync-failed'),
        description: apiError.message || t('sync.error.unknown'),
        variant: 'warning'
      });
    }

    toast({ title: t('automation-updated-successfully') });
    emit('updated');
    emit('update:open', false);
  } catch (error) {
    console.error('Failed to update automation:', error);
    toast({
      title: t('failed-to-update-automation-status'),
      description: error.message || t('sync.error.unknown'),
      variant: 'destructive'
    });
  }
}
</script>
