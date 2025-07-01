<template>
  <div class="flex h-full bg-background overflow-y-scroll">
    <div class="w-full max-w-7xl mx-auto p-6">
      <!-- 중앙 제목 및 부제목 -->
      <div class="flex flex-col items-center mb-8">
        <h1 class="text-4xl font-bold mb-2">{{ t('marketplace') }}</h1>
        <p class="text-lg text-gray-500 mb-4">{{ t('discover-and-create-premade-customised-zents-agents-and-zpilot') }}</p>
        <!-- 검색창, 정렬, 필터 -->
        <div class="flex flex-col md:flex-row items-center gap-3 w-full justify-center mb-6">
          <div class="flex gap-2 w-full md:w-auto">
            <input
              v-model="search"
              type="text"
              :placeholder="t('search-templates')"
              class="border border-gray-200 rounded px-3 py-2 w-full md:w-64 focus:outline-none focus:border-emerald-400"
              @keyup.enter="fetchMarketplaceData"
            />
            <Button @click="fetchMarketplaceData" variant="outline" class="">
              {{ t('search') }}
            </Button>
            <select v-model="sortBy" class="border border-gray-200 rounded px-2 py-2 text-sm">
              <option value="name">{{ t('sort-by-name') }}</option>
              <option value="created_at">{{ t('sort-by-date') }}</option>
            </select>
          </div>
        </div>
          <div class="flex flex-wrap gap-2 w-full">
            <button
              v-for="cat in allCategories"
              :key="cat"
              @click="selectCategory(cat)"
              :class="[
                'px-3 py-1 rounded-full text-sm border transition',
                selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
              ]"
            >
              {{ cat }}
            </button>
          </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="flex justify-center items-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>

      <!-- Error message -->
      <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
        {{ error }}
      </div>

      <!-- Zpilots List -->
      <div v-if="!isLoading && !error && organizations.length > 0" class="mb-12">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-2xl font-semibold">{{ t('zpilots') }}</h2>
            <p class="text-gray-500">{{ t('discover-advanced-workflows-unlocked-by-teams-of-ai-agents') }}</p>
          </div>
          <Button @click="showOrganizationsDialog = true" variant="outline" class="">
            {{ t('show-more') }}
          </Button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="item in organizations" :key="item.id" class=" rounded-xl border border-gray-200 shadow hover:shadow-lg transition flex flex-col cursor-pointer" @click="openTemplateModal(item)">
            <div class="flex items-center justify-between p-4 pb-0">
<!--              <img :src="getImageUrl(item.thumbnail) || 'https://via.placeholder.com/40'" alt="logo" class="w-10 h-10 rounded-md object-cover" />-->
              <span v-if="parseCategories(item.categories)" class="text-xs ">{{ parseCategories(item.categories)[0] }}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-base mb-1 truncate" :title="item.name">{{ item.name }}</h3>
              <span class="text-xs text-gray-400 mb-2">by {{ item.by || 'Unknown' }}</span>
              <p class="text-sm text-gray-700 mb-3 line-clamp-3">{{ item.bio || '' }}</p>
              <div class="flex flex-wrap gap-1 mb-2">
                <span v-for="cat in parseCategories(item.tags)" :key="cat" class=" text-xs px-2 py-0.5 rounded">{{ cat }}</span>
              </div>
<!--              <span class="text-xs text-gray-400 mt-auto">{{ formatDate(item.created_at) }}</span>-->
            </div>
          </div>
          <div v-if="filteredOrganizations.length === 0" class="col-span-full text-center py-8 text-gray-500">
            {{ t('no-zpilots-found-matching-your-criteria') }}
          </div>
        </div>
      </div>

      <!-- Agents List -->
      <div v-if="!isLoading && !error && agents.length > 0" class="mb-12">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-2xl font-semibold">{{ t('agents') }}</h2>
            <p class="text-gray-500">{{ t('discover-ai-agents-with-specialized-capabilities') }}</p>
          </div>
          <Button @click="showAgentsDialog = true" class="">
            {{ t('show-more') }}
          </Button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="item in agents" :key="item.id" class=" rounded-xl border border-gray-200 shadow hover:shadow-lg transition flex flex-col cursor-pointer" @click="openTemplateModal(item)">
            <div class="flex items-center justify-between p-4 pb-0">
<!--              <img :src="getImageUrl(item.thumbnail) || 'https://via.placeholder.com/40'" alt="logo" class="w-10 h-10 rounded-md object-cover" />-->
              <span v-if="parseCategories(item.categories)" class="text-xs ">{{ parseCategories(item.categories)[0] }}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-base mb-1 truncate" :title="item.name">{{ item.name }}</h3>
              <span class="text-xs text-gray-400 mb-2">by {{ item.by || 'Unknown' }}</span>
              <p class="text-sm text-gray-700 mb-3 line-clamp-3">{{ item.bio || '' }}</p>
              <div class="flex flex-wrap gap-1 mb-2">
                <span v-for="cat in parseCategories(item.tags)" :key="cat" class=" text-xs px-2 py-0.5 rounded">{{ cat }}</span>
              </div>
<!--              <span class="text-xs text-gray-400 mt-auto">{{ formatDate(item.created_at) }}</span>-->
            </div>
          </div>
          <div v-if="agents.length === 0" class="col-span-full text-center py-8 text-gray-500">
            {{ t('no-agents-found-matching-your-criteria') }}
          </div>
        </div>
      </div>
<!-- Zents List -->
      <div v-if="!isLoading && !error && zents.length > 0"  class="mb-12">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-2xl font-semibold">{{ t('zents') }}</h2>
            <p class="text-gray-500">{{ t('discover-knowledge-units-for-your-ai-assistants') }}</p>
          </div>
          <Button @click="showZentsDialog = true" variant="outline" class="">
            {{ t('show-more') }}
          </Button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="item in zents" :key="item.id" class=" rounded-xl border border-gray-200 shadow hover:shadow-lg transition flex flex-col cursor-pointer" @click="openTemplateModal(item)">
            <div class="flex items-center justify-between p-4 pb-0">
<!--              <img :src="item.logo_url || 'https://via.placeholder.com/40'" alt="logo" class="w-10 h-10 rounded-md object-cover" />-->
              <span v-if="parseCategories(item.categories)" class="text-xs ">{{ parseCategories(item.categories)[0] }}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-base mb-1 truncate" :title="item.name">{{ item.name }}</h3>
              <span class="text-xs text-gray-400 mb-2">by {{ item.by || 'Unknown' }}</span>
              <p class="text-sm text-gray-700 mb-3 line-clamp-3">{{ item.bio || '' }}</p>
              <div class="flex flex-wrap gap-1 mb-2">
                <span v-for="cat in parseCategories(item.tags)" :key="cat" class=" text-xs px-2 py-0.5 rounded">{{ cat }}</span>
              </div>
<!--              <span class="text-xs text-gray-400 mt-auto">{{ formatDate(item.created_at) }}</span>-->
            </div>
          </div>
          <div v-if="filteredZents.length === 0" class="col-span-full text-center py-8 text-gray-500">
            {{ t('no-zents-found-matching-your-criteria') }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Zents Dialog -->
  <Dialog :open="showZentsDialog" @update:open="handleZentsDialogUpdate($event)">
    <DialogContent class="max-w-[80%]">
      <DialogHeader>
        <DialogTitle>{{ t('all-zents') }}</DialogTitle>
      </DialogHeader>

      <div class="flex items-center gap-4 mb-4">
        <Input
          v-model="searchQuery.zents"
          :placeholder="t('search-zents')"
          class="flex-1"
          @keyup.enter="handleSearch('zents')"
        />
        <Button @click="handleSearch('zents')" variant="outline">{{ t('search') }}</Button>
        <Button @click="toggleSortDirection('zents')" variant="outline">
          Sort {{ isDescending.zents ? '↓' : '↑' }}
        </Button>
      </div>

      <!-- Category filter -->
      <div class="flex flex-wrap gap-2 mb-4 w-full">
        <button
          v-for="cat in allCategories"
          :key="cat"
          @click="selectCategoryAndSearch(cat, 'zents')"
          :class="[
            'px-3 py-1 rounded-full text-sm border transition',
            selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <ScrollArea class="h-[60vh]">
        <div v-if="isLoading" class="flex justify-center items-center py-10">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>

        <div v-else-if="zents.length === 0" class="text-center py-8 text-gray-500">
          {{ t('no-zents-found') }}
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div v-for="item in zents" :key="item.id" class=" rounded-xl border border-gray-200 shadow hover:shadow-lg transition flex flex-col cursor-pointer" @click="openTemplateModal(item)">
            <div class="flex items-center justify-between p-4 pb-0">
  <!--              <img :src="item.logo_url || 'https://via.placeholder.com/40'" alt="logo" class="w-10 h-10 rounded-md object-cover" />-->
              <span v-if="parseCategories(item.categories)" class="text-xs ">{{ parseCategories(item.categories)[0] }}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-base mb-1 truncate" :title="item.name">{{ item.name }}</h3>
              <span class="text-xs text-gray-400 mb-2">by {{ item.by || 'Unknown' }}</span>
              <p class="text-sm text-gray-700 mb-3 line-clamp-3">{{ item.bio || '' }}</p>
              <div class="flex flex-wrap gap-1 mb-2">
                <span v-for="cat in parseCategories(item.tags)" :key="cat" class=" text-xs px-2 py-0.5 rounded">{{ cat }}</span>
              </div>
  <!--              <span class="text-xs text-gray-400 mt-auto">{{ formatDate(item.created_at) }}</span>-->
            </div>
          </div>
        </div>
      </ScrollArea>

      <!-- Pagination -->
      <div v-if="totalPages.zents.value > 1" class="flex justify-center items-center gap-2 mt-4">

        <Button
          v-for="page in visiblePageNumbers.zents.value"
          :key="page"
          @click="handlePageChange(page, 'zents')"
          :variant="currentPage.zents === page ? 'default' : 'outline'"
          size="sm"
        >
          {{ page }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Agents Dialog -->
  <Dialog :open="showAgentsDialog" @update:open="handleAgentsDialogUpdate($event)">
    <DialogContent class="max-w-[80%]">
      <DialogHeader>
        <DialogTitle>{{ t('all-agents') }}</DialogTitle>
      </DialogHeader>

      <div class="flex items-center gap-4 mb-4">
        <Input
          v-model="searchQuery.agents"
          :placeholder="t('search-agents')"
          class="flex-1"
          @keyup.enter="handleSearch('agents')"
        />
        <Button @click="handleSearch('agents')" variant="outline">{{ t('search') }}</Button>
        <Button @click="toggleSortDirection('agents')" variant="outline">
          Sort {{ isDescending.agents ? '↓' : '↑' }}
        </Button>
      </div>

      <!-- Category filter -->
      <div class="flex flex-wrap gap-2 mb-4 w-full">
        <button
          v-for="cat in allCategories"
          :key="cat"
          @click="selectCategoryAndSearch(cat, 'agents')"
          :class="[
            'px-3 py-1 rounded-full text-sm border transition',
            selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <ScrollArea class="h-[60vh]">
        <div v-if="isLoading" class="flex justify-center items-center py-10">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>

        <div v-else-if="agents.length === 0" class="text-center py-8 text-gray-500">
          {{ t('no-agents-found') }}
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div v-for="item in agents" :key="item.id" class=" rounded-xl border border-gray-200 shadow hover:shadow-lg transition flex flex-col cursor-pointer" @click="openTemplateModal(item)">
            <div class="flex items-center justify-between p-4 pb-0">
<!--                <img :src="getImageUrl(item.thumbnail) || 'https://via.placeholder.com/40'" alt="logo" class="w-10 h-10 rounded-md object-cover" />-->
                <span v-if="parseCategories(item.categories)" class="text-xs ">{{ parseCategories(item.categories)[0] }}</span>
              </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-base mb-1 truncate" :title="item.name">{{ item.name }}</h3>
              <span class="text-xs text-gray-400 mb-2">by {{ item.by || 'Unknown' }}</span>
              <p class="text-sm text-gray-700 mb-3 line-clamp-3">{{ item.bio || '' }}</p>
              <div class="flex flex-wrap gap-1 mb-2">
                <span v-for="cat in parseCategories(item.tags)" :key="cat" class=" text-xs px-2 py-0.5 rounded">{{ cat }}</span>
              </div>
  <!--              <span class="text-xs text-gray-400 mt-auto">{{ formatDate(item.created_at) }}</span>-->
            </div>
          </div>
        </div>
      </ScrollArea>

      <!-- Pagination -->
      <div v-if="totalPages.agents.value > 1" class="flex justify-center items-center gap-2 mt-4">

        <Button
          v-for="page in visiblePageNumbers.agents.value"
          :key="page"
          @click="handlePageChange(page, 'agents')"
          :variant="currentPage.agents === page ? 'default' : 'outline'"
          size="sm"
        >
          {{ page }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Organizations Dialog -->
  <Dialog :open="showOrganizationsDialog" @update:open="handleOrganizationsDialogUpdate($event)">
    <DialogContent class="max-w-[80%]">
      <DialogHeader>
        <DialogTitle>{{ t('all-zpilots') }}</DialogTitle>
      </DialogHeader>

      <div class="flex items-center gap-4 mb-4">
        <Input
          v-model="searchQuery.organizations"
          :placeholder="t('search-zpilots')"
          class="flex-1"
          @keyup.enter="handleSearch('organizations')"
        />
        <Button @click="handleSearch('organizations')" variant="outline">{{ t('search') }}</Button>
        <Button @click="toggleSortDirection('organizations')" variant="outline">
          Sort {{ isDescending.organizations ? '↓' : '↑' }}
        </Button>
      </div>

      <!-- Category filter -->
      <div class="flex flex-wrap gap-2 mb-4 w-full">
        <button
          v-for="cat in allCategories"
          :key="cat"
          @click="selectCategoryAndSearch(cat, 'organizations')"
          :class="[
            'px-3 py-1 rounded-full text-sm border transition',
            selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <ScrollArea class="h-[60vh]">
        <div v-if="isLoading" class="flex justify-center items-center py-10">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>

        <div v-else-if="organizations.length === 0" class="text-center py-8 text-gray-500">
          {{ t('no-zpilots-found') }}
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div v-for="item in organizations" :key="item.id" class=" rounded-xl border border-gray-200 shadow hover:shadow-lg transition flex flex-col cursor-pointer" @click="openTemplateModal(item)">
            <div class="flex items-center justify-between p-4 pb-0">
<!--              <img :src="getImageUrl(item.thumbnail) || 'https://via.placeholder.com/40'" alt="logo" class="w-10 h-10 rounded-md object-cover" />-->
              <span v-if="parseCategories(item.categories)" class="text-xs ">{{ parseCategories(item.categories)[0] }}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-base mb-1 truncate" :title="item.name">{{ item.name }}</h3>
              <span class="text-xs text-gray-400 mb-2">by {{ item.by || 'Unknown' }}</span>
              <p class="text-sm text-gray-700 mb-3 line-clamp-3">{{ item.bio || '' }}</p>
              <div class="flex flex-wrap gap-1 mb-2">
                <span v-for="cat in parseCategories(item.tags)" :key="cat" class=" text-xs px-2 py-0.5 rounded">{{ cat }}</span>
              </div>
  <!--              <span class="text-xs text-gray-400 mt-auto">{{ formatDate(item.created_at) }}</span>-->
            </div>
          </div>
        </div>
      </ScrollArea>

      <!-- Pagination -->
      <div v-if="totalPages.organizations.value > 1" class="flex justify-center items-center gap-2 mt-4">

        <Button
          v-for="page in visiblePageNumbers.organizations.value"
          :key="page"
          @click="handlePageChange(page, 'organizations')"
          :variant="currentPage.organizations === page ? 'default' : 'outline'"
          size="sm"
        >
          {{ page }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Detail Modals -->
  <ZentDetail
    :open="showZentDetailModal"
    :zent="selectedTemplate"
    :isMarketplaceMode="true"
    @update:open="showZentDetailModal = $event"
  />

  <AgentDetail
    :open="showAgentDetailModal"
    :agent="selectedTemplate"
    :isMarketplaceMode="true"
    :isViewMode="true"
    @update:open="showAgentDetailModal = $event"
  />

  <OrganizationDetail
    :open="showOrganizationDetailModal"
    :organization="selectedTemplate"
    :isMarketplaceMode="true"
    :isViewMode="true"
    @update:open="showOrganizationDetailModal = $event"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiRequest } from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ZentDetail from '@/components/dialogs/zent/detail.vue';
import AgentDetail from '@/components/dialogs/agent/detail.vue';
import OrganizationDetail from '@/components/dialogs/organization/detail.vue';

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// 모달 상태 및 선택 템플릿
const showZentDetailModal = ref(false);
const showAgentDetailModal = ref(false);
const showOrganizationDetailModal = ref(false);
const selectedTemplate = ref({});
const isLoading = ref(false);
const error = ref(null);

// Data for each category
const zents = ref([]);
const agents = ref([]);
const organizations = ref([]);

// Show more dialogs
const showZentsDialog = ref(false);
const showAgentsDialog = ref(false);
const showOrganizationsDialog = ref(false);

// Pagination for each category
const currentPage = {
  zents: ref(0),
  agents: ref(0),
  organizations: ref(0)
};

const itemsPerPage = ref(12);

const totalItems = {
  zents: ref(0),
  agents: ref(0),
  organizations: ref(0)
};

const totalPages = {
  zents: ref(0),
  agents: ref(0),
  organizations: ref(0)
};

// const totalPages = {
//   zents: computed(() => Math.ceil(totalItems.zents.value / itemsPerPage.value)),
//   agents: computed(() => Math.ceil(totalItems.agents.value / itemsPerPage.value)),
//   organizations: computed(() => Math.ceil(totalItems.organizations.value / itemsPerPage.value))
// };

// Search for each category
const searchQuery = {
  zents: ref(''),
  agents: ref(''),
  organizations: ref('')
};

const isDescending = {
  zents: ref(false),
  agents: ref(false),
  organizations: ref(false)
};

// Compute visible page numbers (limited to 5) for each category
const visiblePageNumbers = {
  zents: computed(() => getVisiblePageNumbers('zents')),
  agents: computed(() => getVisiblePageNumbers('agents')),
  organizations: computed(() => getVisiblePageNumbers('organizations'))
};

function getVisiblePageNumbers(category) {
  const total = totalPages[category].value;
  const current = currentPage[category].value;

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  let startPage = Math.max(current - 1, 1);
  let endPage = Math.min(startPage + 4, total);

  if (endPage === total) {
    startPage = Math.max(endPage - 4, 1);
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
}



function getImageUrl(imageName) {
  return new URL(`../assets/images/characters/${imageName}`, import.meta.url).href;
}

// Function to handle category selection
const selectCategory = async (category) => {
  try {
    selectedCategory.value = category;
    await fetchMarketplaceData();
  } catch (error) {
    console.error('Error fetching marketplace data:', error);
  } finally {
    isLoading.value = false;
  }
};

// Fetch marketplace data
const fetchMarketplaceData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // Build query parameters
    const params = {};

    if (search.value.trim()) {
      params.searching = search.value.trim();
    }

    // Add category parameter if not 'All'
    if (selectedCategory.value !== 'All') {
      params.category = selectedCategory.value;
    }

    // Convert params to query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    // Add query string to endpoint if it exists
    let endpoint = '/zentrun-marketplace/';
    // let endpoint = '/my-zentrun-marketplace/';
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    const result = await apiRequest(endpoint);
    zents.value = result.zents?.zents || [];
    agents.value = result.agents?.agents || [];
    organizations.value = result.organizations?.organizations || [];
    totalItems.zents.value = result.zents?.totalLength;
    totalItems.agents.value = result.agents?.totalLength;
    totalItems.organizations.value = result.organizations?.totalLength;
    totalPages.zents.value = Math.ceil(result.zents?.totalLength / itemsPerPage.value);
    totalPages.agents.value = Math.ceil(result.agents?.totalLength / itemsPerPage.value);
    totalPages.organizations.value = Math.ceil(result.organizations?.totalLength / itemsPerPage.value);

    console.log("fetchMarketplaceData with category:", selectedCategory.value);
    console.log(result);

    console.log("totalPages");
    console.log(totalPages);
  } catch (err) {
    console.error('Failed to fetch marketplace data:', err);
    error.value = err instanceof Error ? err.message : t('failed-to-fetch-marketplace-data');
  } finally {
    isLoading.value = false;
  }
};

// Fetch specific category data with pagination and search
const fetchCategoryData = async (category) => {
  isLoading.value = true;
  error.value = null;

  try {
    const params = {
      count: itemsPerPage.value,
      page: currentPage[category].value,
      desc: isDescending[category].value
    };

    // Only add searching parameter if it has a value
    if (searchQuery[category].value && searchQuery[category].value.trim() !== '') {
      params.searching = searchQuery[category].value.trim();
    }

    // Add category parameter if not 'All'
    if (selectedCategory.value !== 'All') {
      params.category = selectedCategory.value;
    }

    // Convert params to query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const endpoint = `/zentrun-${category.slice(0, -1)}s/`; // Remove 's' and add back to match API format
    const result = await apiRequest(`${endpoint}?${queryString}`);

    console.log(`Fetching ${category} with category:`, selectedCategory.value);
    console.log(result);

    if (category === 'zents') {
      zents.value = result.zents || [];
      totalItems.zents.value = result.totalLength || 0;
      totalPages.zents.value = Math.ceil(result.totalLength / itemsPerPage.value) || 0;
    } else if (category === 'agents') {
      agents.value = result.agents || [];
      totalItems.agents.value = result.totalLength || 0;
      totalPages.agents.value = Math.ceil(result.totalLength / itemsPerPage.value) || 0;
    } else if (category === 'organizations') {
      organizations.value = result.organizations || [];
      totalItems.organizations.value = result.totalLength || 0;
      totalPages.organizations.value = Math.ceil(result.totalLength / itemsPerPage.value) || 0;
    }
  } catch (err) {
    console.error(`Failed to fetch ${category}:`, err);
    error.value = err instanceof Error ? err.message : t('failed-to-fetch') + `${category}`;
  } finally {
    isLoading.value = false;
  }
};

// Handle page change for a specific category
const handlePageChange = async (page, category) => {
  try {
    currentPage[category].value = page;
    await fetchCategoryData(category);
  } catch (error) {
    console.error(`Error fetching ${category} data:`, error);
  } finally {
    isLoading.value = false;
  }
};

// Handle search for a specific category
const handleSearch = async (category) => {
  try {
    currentPage[category].value = 0; // Reset to first page
    await fetchCategoryData(category);
  } catch (error) {
    console.error(`Error fetching ${category} data:`, error);
  } finally {
    isLoading.value = false;
  }
};

// Handle sort direction change
const toggleSortDirection = async (category) => {
  try {
    isDescending[category].value = !isDescending[category].value;
    await fetchCategoryData(category);
  } catch (error) {
    console.error(`Error fetching ${category} data:`, error);
  } finally {
    isLoading.value = false;
  }
};

function openTemplateModal(item) {
  selectedTemplate.value = item;

  // Determine the type of template and open the appropriate modal
  if (item.type === 'zent' || zents.value.some(zent => zent.id === item.id)) {
    showZentDetailModal.value = true;
  } else if (item.type === 'agent' || agents.value.some(agent => agent.id === item.id)) {
    showAgentDetailModal.value = true;
  } else if (item.type === 'zpilot' || organizations.value.some(zpilot => zpilot.id === item.id)) {
    showOrganizationDetailModal.value = true;
  }
}

function runTask() {
  // 실제 동작 연결 전, 콘솔 로그만
  console.log('Run Task for:', selectedTemplate.value);
}

const search = ref('');
const sortBy = ref('name');
const selectedCategory = ref('All');

const allCategories = [
  'All',
  'Business',
  'Research',
  'Organisation',
  'Fun',
  'Entertainment',
  'News',
  'Marketing',
  'Sales',
  'Education',
  'DevOps',
  'Health',
  'Politics',
  'Science',
  'Technology'
];

// We now filter on the server side through API calls

// Function to handle category selection in dialogs
const selectCategoryAndSearch = async (category, dataType) => {
  try {
    selectedCategory.value = category;
    currentPage[dataType].value = 0; // Reset to first page
    await fetchCategoryData(dataType);
  } catch (error) {
    console.error(`Error fetching ${dataType} data:`, error);
  } finally {
    isLoading.value = false;
  }
};

function filterItems(items) {
  let arr = items;
  // Sort the items
  arr = arr.slice().sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy.value === 'created_at') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return 0;
  });
  return arr;
}

function parseCategories(catString) {
  console.log("catString");
  console.log(catString);
  try {
    return JSON.parse(catString);
  } catch {
    return catString;
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

// Search is now only triggered by Enter key or Search button click
// No automatic search on typing

// Handler methods for dialog updates
const handleZentsDialogUpdate = async (newVal) => {
  showZentsDialog.value = newVal;
  if (newVal) {
    try {
      // Reset pagination when opening dialog
      currentPage.zents.value = 0;
      await fetchCategoryData('zents');
    } catch (error) {
      console.error('Error fetching zents data:', error);
    } finally {
      isLoading.value = false;
    }
  }
};

const handleAgentsDialogUpdate = async (newVal) => {
  showAgentsDialog.value = newVal;
  if (newVal) {
    try {
      // Reset pagination when opening dialog
      currentPage.agents.value = 0;
      await fetchCategoryData('agents');
    } catch (error) {
      console.error('Error fetching agents data:', error);
    } finally {
      isLoading.value = false;
    }
  }
};

const handleOrganizationsDialogUpdate = async (newVal) => {
  showOrganizationsDialog.value = newVal;
  if (newVal) {
    try {
      // Reset pagination when opening dialog
      currentPage.organizations.value = 0;
      await fetchCategoryData('organizations');
    } catch (error) {
      console.error('Error fetching organizations data:', error);
    } finally {
      isLoading.value = false;
    }
  }
};

// Fetch data on component mount
onMounted(async () => {
  try {
    await fetchMarketplaceData();
  } catch (error) {
    console.error('Error fetching marketplace data:', error);
  } finally {
    isLoading.value = false;
  }
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
