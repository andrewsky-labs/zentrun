<template>
  <div class="fixed top-20 h-[80vh] w-1/2 bg-white shadow-lg z-50 flex flex-col border-l border-gray-200" v-if="visible">
    <div class="flex justify-between items-center px-6 py-4 border-b">
      <h2 class="text-lg font-bold ">{{ t('common.automateZent') }}</h2>
      <button @click="$emit('close')" class="text-gray-500 hover:text-gray-900">✕</button>
    </div>
    <form class="flex flex-col gap-4 p-6 flex-1 overflow-y-auto text-black">
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('name') }}</span>
        <input v-model="name" type="text" class="input input-bordered" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('prompt') }}</span>
        <textarea v-model="prompt" rows="3" class="input input-bordered" ></textarea>
      </label>

      <!-- Schedule Configuration -->
      <div class="border rounded-md p-4 bg-gray-50">
        <h3 class="font-semibold mb-3">{{ t('schedule-configuration') }}</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Schedule Type -->
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">{{ t('schedule-type') }}</span>
            <select v-model="scheduleType" class="input input-bordered" @change="updateCronExpression">
              <option value="hourly">{{ t('hourly') }}</option>
              <option value="daily">{{ t('daily') }}</option>
              <option value="weekly">{{ t('weekly') }}</option>
              <option value="monthly">{{ t('monthly') }}</option>
              <option value="custom">{{ t('custom-cron-expression') }}</option>
            </select>
          </label>

          <!-- Time Selection (for daily, weekly, monthly) -->
          <label v-if="['daily', 'weekly', 'monthly'].includes(scheduleType)" class="flex flex-col gap-1">
            <span class="text-sm font-medium">{{ t('time') }}</span>
            <input type="time" v-model="scheduleTime" class="input input-bordered" @change="updateCronExpression" />
          </label>

          <!-- Day Selection (for weekly) -->
          <label v-if="scheduleType === 'weekly'" class="flex flex-col gap-1">
            <span class="text-sm font-medium">{{ t('day-of-week') }}</span>
            <select v-model="scheduleDayOfWeek" class="input input-bordered" @change="updateCronExpression">
              <option value="0">{{ t('sunday') }}</option>
              <option value="1">{{ t('monday') }}</option>
              <option value="2">{{ t('tuesday') }}</option>
              <option value="3">{{ t('wednesday') }}</option>
              <option value="4">{{ t('thursday') }}</option>
              <option value="5">{{ t('friday') }}</option>
              <option value="6">{{ t('saturday') }}</option>
            </select>
          </label>

          <!-- Day Selection (for monthly) -->
          <label v-if="scheduleType === 'monthly'" class="flex flex-col gap-1">
            <span class="text-sm font-medium">{{ t('day-of-month') }}</span>
            <select v-model="scheduleDayOfMonth" class="input input-bordered" @change="updateCronExpression">
              <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
            </select>
          </label>

          <!-- Minute Selection (for hourly) -->
          <label v-if="scheduleType === 'hourly'" class="flex flex-col gap-1">
            <span class="text-sm font-medium">{{ t('minute') }}</span>
            <select v-model="scheduleMinute" class="input input-bordered" @change="updateCronExpression">
              <option v-for="minute in 60" :key="minute-1" :value="minute-1">{{ minute-1 }}</option>
            </select>
          </label>

          <!-- Custom Cron Expression -->
          <label v-if="scheduleType === 'custom'" class="flex flex-col gap-1 md:col-span-2">
            <span class="text-sm font-medium">{{ t('cron-expression') }}</span>
            <input type="text" v-model="cronExpression" class="input input-bordered" placeholder="* * * * *" />
            <span class="text-xs text-gray-500 mt-1">{{ t('format-minute-hour-day-of-month-month-day-of-week-0') }}</span>
          </label>
        </div>

        <!-- Human-readable schedule display -->
        <div class="mt-4 p-3 bg-white border rounded-md">
          <span class="text-sm font-medium">Schedule:</span>
          <span class="ml-2 text-sm">{{ humanReadableSchedule }}</span>
        </div>
      </div>

      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('organization-optional') }}</span>
        <select v-model="selectedOrganizationSlug" class="input input-bordered" @change="fetchTeams">
          <option :value="null">{{ t('select-organization-0') }}</option>
          <option v-for="org in organizationStore.organizations.value" :key="org.slug" :value="org.slug">
            {{ org.name }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1" v-if="selectedOrganizationSlug">
        <span class="font-semibold">{{ t('team-optional') }}</span>
        <select v-model="selectedTeamSlug" class="input input-bordered">
          <option :value="null">{{ t('select-team-0') }}</option>
          <option v-for="team in filteredTeams" :key="team.slug" :value="team.slug">
            {{ team.name }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('agent-optional') }}</span>
        <select v-model="selectedAgentSlug" class="input input-bordered">
          <option :value="null">{{ t('select-agent-0') }}</option>
          <option v-for="agent in filteredAgents" :key="agent.slug" :value="agent.slug">
            {{ agent.name }}
          </option>
        </select>
      </label>
      <div>
        <span class="font-semibold">{{ t('tool-calls') }}</span>
        <ul class="mt-2 space-y-2">
          <li v-for="(call, idx) in toolCalls" :key="call.id" class="flex gap-3 p-2 border rounded items-start">
            <img v-if="call.mcpImageUrl" :src="call.mcpImageUrl" :alt="t('mcp-image')" class="w-8 h-8 rounded bg-gray-100 object-cover mt-1" />
            <span v-else>{{ call.server_icons }}</span>
            <div class="flex flex-col flex-1 gap-1">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span v-if="call.mcpName" class="font-semibold text-sm">{{ call.mcpName }}</span>
                  <span v-else class="font-semibold text-sm">{{ call.server_name }}</span>
                  <span class="text-xs text-gray-500">{{ call.name }}</span>
                  <label v-if="!removedCalls[idx]" class="flex items-center gap-1 ml-2 text-xs">
                    <input type="checkbox" v-model="lockedInputs[idx]" /> {{ t('hold-input') }}
                  </label>
                </div>
                <button
                  v-if="!removedCalls[idx]"
                  @click="removedCalls[idx] = true"
                  class="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                >
                  {{ t('remove') }}
                </button>
                <button
                  v-else
                  @click="removedCalls[idx] = false"
                  class="text-xs text-green-500 hover:text-green-700 px-2 py-1 rounded border border-green-300 hover:bg-green-50"
                >
                  {{ t('restore') }}
                </button>
              </div>
              <template v-if="!removedCalls[idx]">
                <div class="flex flex-col gap-1 mt-1">
                  <label class="text-xs font-semibold">{{ t('arguments') }}</label>
                  <template v-if="lockedInputs[idx]">
                    <textarea v-model="call.params" class="input input-bordered text-sm" rows="2"></textarea>
                  </template>
                  <template v-else>
                    <div class="bg-gray-50 border rounded p-2 text-sm text-gray-700 whitespace-pre-wrap">{{ call.params }}</div>
                  </template>
                </div>
                <div class="flex flex-col gap-1 mt-1">
                  <label class="text-xs font-semibold">{{ t('response') }}</label>
                  <div class="bg-gray-50 border rounded p-2 text-sm text-gray-700 whitespace-pre-wrap max-h-24 overflow-y-auto">{{ call.response }}</div>
                </div>
              </template>
            </div>
          </li>
        </ul>
      </div>
      <div class="flex gap-2 mt-4">
        <Button type="button" @click.prevent="onSave">{{ t('save') }}</Button>
        <button type="button" class="btn btn-secondary" @click.prevent="$emit('close')">{{ t('cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, computed, onMounted } from 'vue'
import { useToast } from '@/components/ui/toast'
import { useI18n } from "vue-i18n";
import { usePresenter } from '@/composables/usePresenter'
import { nanoid } from "nanoid";
import { organizationStore } from "../../stores/organization";
import { teamStore } from "../../stores/team";
import { agentStore } from "../../stores/agent";
import { automationStore } from "../../stores/automation";
import { apiRequest } from "@/api";
import { Button } from '@/components/ui/button'

const props = defineProps({
  visible: Boolean,
  messages: { type: Object, default: () => {} },
  toolCalls: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'save'])

const name = ref('')
const prompt = ref(props.messages ? props.messages[0]?.content?.text : '')
const selectedOrganizationSlug = ref(null)
const selectedAgentSlug = ref(null)
const selectedTeamSlug = ref(null)

// Schedule configuration
const scheduleType = ref('daily')
const scheduleTime = ref('12:00')
const scheduleDayOfWeek = ref('1') // Monday
const scheduleDayOfMonth = ref(1)
const scheduleMinute = ref(0)
const cronExpression = ref('0 12 * * *') // Default: daily at 12:00

// Filter teams based on selected organization
const filteredTeams = computed(() => {
  if (!selectedOrganizationSlug.value) return []
  return teamStore.teams.value.filter(team => team.organization === selectedOrganizationSlug.value)
})

// Filter agents based on organization and team
const filteredAgents = computed(() => {
  if (!selectedOrganizationSlug.value) return []

  let filtered = agentStore.agents.value.filter(agent => agent.organization === selectedOrganizationSlug.value)

  if (selectedTeamSlug.value) {
    filtered = filtered.filter(agent => agent.team === selectedTeamSlug.value)
  }

  return filtered
})

// Human-readable schedule
const humanReadableSchedule = computed(() => {
  switch (scheduleType.value) {
    case 'hourly':
      return t('every-hour-at') + scheduleMinute.value + t('minutes-past-the-hour')
    case 'daily':
      return t('every-day-at') + scheduleTime.value
    case 'weekly':
      const days = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')]
      return `Every ${days[parseInt(scheduleDayOfWeek.value)]} at ${scheduleTime.value}`
    case 'monthly':
      return t('on-day') + scheduleDayOfMonth.value + t('of-every-month-at') + scheduleTime.value
    case 'custom':
      return t('custom-schedule') + cronExpression.value
    default:
      return t('invalid-schedule')
  }
})

const { toast } = useToast()
const automationP = usePresenter('automationSQLitePresenter')
const orgP = usePresenter('organizationSQLitePresenter')
const agentP = usePresenter('agentSQLitePresenter')

const t = useI18n().t

const fetchTeams = async () => {
  if (!selectedOrganizationSlug.value) return
  teamStore.loadTeams()
}

// Update cron expression based on schedule settings
function updateCronExpression() {
  switch (scheduleType.value) {
    case 'hourly':
      cronExpression.value = `${scheduleMinute.value} * * * *`
      break
    case 'daily':
      const [hours, minutes] = scheduleTime.value.split(':')
      cronExpression.value = `${minutes} ${hours} * * *`
      break
    case 'weekly':
      const [weekHours, weekMinutes] = scheduleTime.value.split(':')
      cronExpression.value = `${weekMinutes} ${weekHours} * * ${scheduleDayOfWeek.value}`
      break
    case 'monthly':
      const [monthHours, monthMinutes] = scheduleTime.value.split(':')
      cronExpression.value = `${monthMinutes} ${monthHours} ${scheduleDayOfMonth.value} * *`
      break
    // For custom, we don't update the cronExpression as the user sets it directly
  }
}

const saveAutomation = async () => {
  if (name.value.length === 0) {
    toast({ title: t('please-write-the-name'), variant: 'destructive' });
    return
  }

  if (scheduleType.value === 'custom' && !cronExpression.value) {
    toast({ title: t('please-enter-a-cron-expression'), variant: 'destructive' });
    return
  }

  // Filter out removed tool calls
  const filteredToolCalls = props.toolCalls.filter((_, idx) => !removedCalls.value[idx]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  let automationData: any = {
    name: name.value,
    prompt: prompt.value,
    schedule: cronExpression.value,
    frequency: humanReadableSchedule.value,
    status: 'active',
    tool_calls: JSON.stringify(filteredToolCalls),
    user: user?.id,
    by: user?.username,
  }

  if (selectedOrganizationSlug.value) {
    automationData.organization = selectedOrganizationSlug.value;
  }

  if (selectedTeamSlug.value) {
    automationData.team = selectedTeamSlug.value;
  }

  if (selectedAgentSlug.value) {
    automationData.agent = selectedAgentSlug.value;
  }

  try {
    console.log("automationData");
    console.log(automationData);
    let result = await automationStore.addAutomation(automationData);
    console.log("result");
    console.log(result);

    // Send automation data to remote server
    try {
      await apiRequest('/zentrun-automation/', 'POST', automationData);
    } catch (error: any) {
      console.error('API error:', error);
      toast({
        title: t('local-automation-saved-but-remote-sync-failed'),
        description: error.message || t('unknown-error'),
        variant: 'warning'
      });
    }

    toast({ title: t('automation-scheduled-successfully') });

    // Reset fields after success
    name.value = '';
    prompt.value = '';
    selectedOrganizationSlug.value = null;
    selectedTeamSlug.value = null;
    selectedAgentSlug.value = null;

    emit('close');
  } catch (error: any) {
    toast({ title: t('error-scheduling-automation'), description: error.message || t('unknown-error'), variant: 'destructive' });
  }
}

// Track the lock state for each call (default: true)
const lockedInputs = ref(props.toolCalls.map(() => true))
// Track which calls are removed
const removedCalls = ref(props.toolCalls.map(() => false))

watch(() => props.toolCalls, (newCalls) => {
  // Sync lock state if toolCalls array length changes
  lockedInputs.value = newCalls.map(() => true)
  // Reset removed calls state
  removedCalls.value = newCalls.map(() => false)
}, { immediate: true })

watch(() => props.visible, (val) => {
  if (val) {
    name.value = ''
    prompt.value = props.messages[0].content?.text ?? ''
    selectedOrganizationSlug.value = null
    selectedAgentSlug.value = null
    selectedTeamSlug.value = null
    scheduleType.value = 'daily'
    scheduleTime.value = '12:00'
    updateCronExpression()
    lockedInputs.value = props.toolCalls.map(() => true)
    removedCalls.value = props.toolCalls.map(() => false)
  }
})

function onSave() {
  saveAutomation();
}

// Initialize cron expression
onMounted(() => {
  updateCronExpression()
})
</script>

<style scoped>
.input {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem;
  font-size: 1rem;
}
.btn {
  padding: 0.5rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary {
  background: #2563eb;
  color: white;
}
.btn-secondary {
  background: #f3f4f6;
  color: #111827;
}
</style>
