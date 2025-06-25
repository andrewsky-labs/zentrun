<template>
  <div class="flex h-full bg-background">
    <div class="w-full max-w-7xl mx-auto p-6">
      <!-- 중앙 제목 및 부제목 -->
      <div class="flex flex-col items-center mb-8">
        <h1 class="text-4xl font-bold mb-2">{{t('scheduling-hub')}}</h1>
<!--        <p class="text-lg text-gray-500 mb-4">Discover and create premade customised tasks</p>-->
        <!-- 검색창, 정렬, 필터 -->
        <div class="flex flex-col md:flex-row items-center gap-3 w-full justify-center mb-6">
          <div class="flex gap-2">
            <button
              v-for="cat in allCategories"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'px-3 py-1 rounded-full text-sm border transition',
                selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
              ]"
            >
              {{ cat }}
            </button>
          </div>
          <div class="flex gap-2 w-full md:w-auto">
            <input
              v-model="search"
              type="text"
              :placeholder="t('search-templates')"
              class="border border-gray-200 rounded px-3 py-2 w-full md:w-64 focus:outline-none focus:border-emerald-400"
            />
            <select v-model="sortBy" class="border border-gray-200 rounded px-2 py-2 text-sm">
              <option value="name">{{ t('sort-by-name') }}</option>
              <option value="created_at">{{ t('sort-by-date') }}</option>
            </select>
          </div>
        </div>
      </div>
      <!-- 오토메이션 리스트 -->
        <!-- Automations Table -->
        <div class="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('title') }}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('status') }}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('scheduled-for-utc') }}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('frequency') }}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('latest-run-0') }}</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr v-for="item in filteredTemplates" :key="item.id" class="hover:bg-emerald-50 cursor-pointer">
                <td class="px-6 py-4 whitespace-nowrap flex items-center gap-3" @click="openTemplateModal(item)">
                  <div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <span class="font-medium text-gray-800">{{ item.name }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-block px-2 py-0.5 rounded text-xs font-medium cursor-pointer"
                    :class="item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'"
                    @click.stop="toggleAutomationStatus(item)"
                  >
                    {{ item.status || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" @click="openTemplateModal(item)">{{ item.schedule || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap" @click="openTemplateModal(item)">{{ item.frequency || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap" @click="openTemplateModal(item)">{{ formatDate(item.lastRun) }}</td>
              </tr>
              <tr v-if="filteredTemplates.length === 0">
                <td colspan="5" class="text-center py-8 text-gray-400">{{ t('no-results') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>
  </div>

  <!-- Use the new dialog components -->
  <AutomationDetailsDialog
    :is-open="showDetailsDialog"
    :automation="selectedTemplate"
    @update:open="showDetailsDialog = $event"
    @deleted="loadAutomations"
    @updated="loadAutomations"
    @edit="openEditDialog"
  />

  <AutomationEditDialog
    :is-open="showEditDialog"
    :automation="selectedTemplate"
    @update:open="showEditDialog = $event"
    @updated="loadAutomations"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/components/ui/toast';
import { automationStore } from '../stores/automation';
import { useI18n } from 'vue-i18n';
import { usePresenter } from '@/composables/usePresenter';
import { useChatStore } from '@/stores/chat';
import AutomationDetailsDialog from '@/components/dialogs/automation/details.vue';
import AutomationEditDialog from '@/components/dialogs/automation/edit.vue';

const { t } = useI18n();
const { toast } = useToast();
const automationP = usePresenter('automationSQLitePresenter');
const chatStore = useChatStore()

// 다이얼로그 상태 및 선택 템플릿
const showDetailsDialog = ref(false);
const showEditDialog = ref(false);
const selectedTemplate = ref({});

function openTemplateModal(item) {
  selectedTemplate.value = item;
  showDetailsDialog.value = true;
}

function openEditDialog(item) {
  selectedTemplate.value = item;
  showEditDialog.value = true;
}

async function toggleAutomationStatus(automation) {
  try {
    const newStatus = automation.status === 'active' ? 'inactive' : 'active';
    await automationStore.updateAutomation(automation.id, {
      ...automation,
      status: newStatus
    });
    toast({ title: `Automation ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!` });
    loadAutomations();
  } catch (error) {
    console.error('Failed to update automation status:', error);
    toast({
      title: t('failed-to-update-automation-status-0'),
      description: error.message || t('unknown-error'),
      variant: 'destructive'
    });
  }
}

const search = ref('');
const sortBy = ref('name');
const selectedCategory = ref('All');

// Load automations from store
async function loadAutomations() {
  try {
    await automationStore.loadAutomations();
  } catch (error) {
    console.error('Failed to load automations:', error);
    toast({
      title: t('failed-to-load-automations'),
      description: error.message || t('unknown-error'),
      variant: 'destructive'
    });
  }
}

// Get all unique categories from automations
const allCategories = computed(() => {
  const cats = new Set(['All']);
  automationStore.automations.value.forEach(automation => {
    if (automation.tool_calls) {
      automation.tool_calls.forEach(call => {
        if (call.mcpName) {
          cats.add(call.mcpName);
        }
      });
    }
  });
  return Array.from(cats);
});

// Filter and sort automations
const filteredTemplates = computed(() => {
  // Create a new array from the reactive array to avoid proxy issues
  let arr = Array.from(automationStore.automations.value || []);

  // Category filter
  if (selectedCategory.value !== 'All') {
    arr = arr.filter(automation => {
      if (!automation.tool_calls) return false;
      return automation.tool_calls.some(call => call.mcpName === selectedCategory.value);
    });
  }

  // Search
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    arr = arr.filter(automation =>
      automation.name.toLowerCase().includes(q) ||
      (automation.prompt && automation.prompt.toLowerCase().includes(q)) ||
      (automation.by && automation.by.toLowerCase().includes(q))
    );
  }

  // Sort - create a new array before sorting to avoid modifying the original
  return [...arr].sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy.value === 'created_at') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    return 0;
  });
});

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString();
}

// Load automations on component mount
onMounted(async () => {
  await loadAutomations();
});
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
