<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ t('dialog.agent.add.title') }}</DialogTitle>
      </DialogHeader>
      <form class="grid grid-cols-2 gap-6 p-2 flex-1 overflow-y-auto ">
        <div class="flex flex-col gap-4 pr-3">
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.agent.add.name') }} <span class="text-red-500">*</span></span>
            <Input v-model="name" type="text" class="input input-bordered" />
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.agent.add.prompt') }} <span class="text-red-500">*</span></span>
            <Textarea v-model="prompt" rows="3" class="w-full border rounded p-2"></Textarea>
          </Label>

          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.agent.add.description') }} <span class="">{{ t('Optional') }}</span></span>
            <Textarea v-model="description" rows="3" class="w-full border rounded p-2" :placeholder="t('dialog.agent.add.descriptionPlaceholder', 'Enter agent description')"></Textarea>
          </Label>

          <div>
            <span class="font-semibold">{{ t('dialog.agent.add.addZent') }} <span class="">{{ t('Optional') }}</span></span>
            <div class="flex gap-2 items-center mt-2 relative">
              <Input
                v-model="searchZent"
                :placeholder="t('dialog.agent.add.searchZent')"
                class="input input-bordered text-xs flex-1"
                @focus="showZentDropdown = true"
                @input="showZentDropdown = true"
                @blur="onZentInputBlur"
              />
              <ul
                v-if="showZentDropdown && filteredZents.length > 0"
                class="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-y-auto"
              >
                <li
                  v-for="zent in filteredZents"
                  :key="zent.id"
                  class="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  @mousedown.prevent="addZent(zent)"
                >
                  <span class="font-semibold text-xs">{{ zent.name }}</span>
                  <span class="text-xs text-gray-400 ml-2">{{
                    zent.categories
                      ? Array.isArray(zent.categories)
                        ? zent.categories.join(', ')
                        : JSON.parse(zent.categories).join(', ')
                      : ''
                  }}</span>
                  <span class="text-xs text-gray-400 ml-2">{{
                    zent.tags
                      ? Array.isArray(zent.tags)
                        ? zent.tags.join(', ')
                        : JSON.parse(zent.tags).join(', ')
                      : ''
                  }}</span>
                </li>
              </ul>
              <ul
                v-if="showZentDropdown && filteredZents.length === 0 && searchZent"
                class="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-y-auto"
              >
                <li class="text-xs text-gray-400 px-2 py-1">
                  {{ t('dialog.agent.add.noSearchResults') }}
                </li>
              </ul>
            </div>
            <div class="flex flex-wrap gap-2 mt-2">
              <div
                v-for="zent in selectedZents"
                :key="zent.id"
                class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs"
              >
                <span>{{ zent.name }}</span>
                <button class="ml-1 text-red-400 hover:text-red-600" @click="removeZent(zent)">
                  ✕
                </button>
              </div>
            </div>
          </div>

          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.agent.add.categories') }} <span v-if="!isPublic" class="">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
            <div class="relative category-dropdown-container">
              <div
                class="flex flex-wrap gap-2 p-2 border rounded min-h-[38px] cursor-text"
                @click="showCategoryDropdown = true"
              >
                <div
                  v-for="cat in selectedCategories"
                  :key="cat"
                  class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs"
                >
                  <span>{{ cat }}</span>
                  <button
                    class="ml-1 text-red-400 hover:text-red-600"
                    @click.stop="removeCategory(cat)"
                  >
                    ✕
                  </button>
                </div>
                <span v-if="selectedCategories.length === 0" class="text-gray-400 text-xs">{{
                  t('dialog.agent.add.selectCategories')
                }}</span>
              </div>
              <div
                v-if="showCategoryDropdown"
                class="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-y-auto"
              >
                <div
                  v-for="cat in predefinedCategories"
                  :key="cat"
                  class="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  @click.stop="toggleCategory(cat)"
                >
                  <input
                    :id="cat"
                    type="checkbox"
                    :value="cat"
                    :checked="selectedCategories.includes(cat)"
                    class="mr-2"
                    @change.stop="toggleCategory(cat)"
                  />
                  <label class="flex-1 cursor-pointer" @click.stop="toggleCategory(cat)">{{
                    cat
                  }}</label>
                </div>
              </div>
            </div>
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.agent.add.tags') }} <span v-if="!isPublic" class="">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
            <div class="flex flex-wrap gap-2 p-2 border rounded">
              <div
                v-for="tag in tagList"
                :key="tag"
                class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs"
              >
                <span>{{ tag }}</span>
                <button class="ml-1 text-red-400 hover:text-red-600" @click="removeTag(tag)">
                  ✕
                </button>
              </div>
              <input
                v-model="tagInput"
                type="text"
                class="flex-1 outline-none text-sm min-w-[100px]"
                :placeholder="t('dialog.agent.add.tagInputPlaceholder')"
                @keydown="handleTagInputKeydown"
              />
            </div>
          </Label>

          <!-- Permission is set to private by default and hidden from UI -->

          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.agent.add.bio', 'Bio') }} <span v-if="!isPublic" class="">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
            <Textarea
              v-model="bio"
              rows="3"
              class="w-full border rounded p-2"
              :placeholder="t('dialog.agent.add.bioPlaceholder', 'Enter agent bio')"
            ></Textarea>
          </Label>

          <CoverImageUploader
            v-model="cover_image_url"
            :label="t('dialog.agent.add.coverImage', 'Cover Image')"
          />

          <div class="flex gap-2 mt-4">
            <Button
              variant="default"
              type="button"
              @click="handleSave"
              v-bind:disabled="isLoading.save.value"
              >
              <div v-if="isLoading.save.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>

              {{ t('dialog.agent.add.save') }}
            </Button>
            <Button variant="outline" type="button" @click="$emit('cancel')">{{
              t('dialog.cancel')
            }}</Button>
          </div>
        </div>

        <!-- RAG 관리 섹션 -->
        <div class="flex flex-col gap-2 pl-3 border-l">
          <ThumbnailSelector :isFullSize="true" v-model="thumbnail" label="Select Agent Thumbnail" :required="true" />

          <span class="font-semibold">{{ t('dialog.agent.add.ragReferenceData') }} <span class="">{{ t('Optional') }}</span></span>
          <div class="flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
            <div v-for="(entry, index) in ragEntries" :key="entry.id" class="border rounded p-2">
              <div class="flex justify-between items-center mb-1">
                <input
                  v-model="entry.title"
                  class="font-semibold text-sm outline-none flex-1"
                  :placeholder="t('dialog.agent.add.enterTitle')"
                />
                <div class="flex gap-1">
                  <button
                    class="text-blue-500 hover:text-blue-700 text-xs px-2 py-1"
                    @click="editRagEntry(index)"
                  >
                    {{ t('dialog.agent.add.edit') }}
                  </button>
                  <button
                    class="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                    @click="removeRagEntry(index)"
                  >
                    {{ t('dialog.agent.add.remove') }}
                  </button>
                </div>
              </div>
              <div v-if="editingRagIndex === index" class="mt-1">
                <Textarea
                  v-model="entry.content"
                  rows="4"
                  class="w-full border rounded p-2 text-xs"
                  :placeholder="t('dialog.agent.add.enterReferenceContent')"
                />
              </div>
              <div v-else class="text-xs text-gray-700 line-clamp-2">
                {{ entry.content }}
              </div>
            </div>

            <div v-if="showRagForm" class="border rounded p-2">
              <div class="flex justify-between items-center mb-1">
                <input
                  v-model="newRagTitle"
                  class="font-semibold text-sm outline-none flex-1"
                  :placeholder="t('dialog.agent.add.newReferenceTitle')"
                />
              </div>
              <Textarea
                v-model="newRagContent"
                rows="4"
                class="w-full border rounded p-2 text-xs mt-1"
                :placeholder="t('dialog.agent.add.newReferenceContent')"
              />
              <div class="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" @click="cancelAddRag">
                  {{ t('dialog.cancel') }}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  :disabled="!newRagContent.trim()"
                  @click="addRagEntry"
                >
                  {{ t('dialog.agent.add.add') }}
                </Button>
              </div>
            </div>

            <Button v-if="!showRagForm" variant="outline" class="mt-1" @click="showRagForm = true">
              {{ t('dialog.agent.add.addReference') }}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ThumbnailSelector from '@/components/ThumbnailSelector.vue'
import CoverImageUploader from '@/components/CoverImageUploader.vue'
import {nanoid} from "nanoid";
import {zentStore} from "@/stores/zent";
import {apiRequest} from "@/api";
import {agentStore} from "@/stores/agent";
import { useToast } from '@/components/ui/toast/use-toast'
import ThumbnailSelectorZpilot from "@/components/ThumbnailSelectorZpilot.vue";

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  zents: {
    type: Array,
    default: () => []
  },
  organization: {
    type: Object,
    default: null
  },
  team: {
    type: Object,
    default: null
  }
})

const { toast } = useToast()
const emit = defineEmits(['update:open', 'cancel'])

const name = ref('')
const prompt = ref('')
const description = ref('')
const searchZent = ref('')
const selectedZents = ref([])
const showZentDropdown = ref(false)
const zentInputBlurTimeout = ref(null)
const permission = ref('private')
const isPublic = computed(() => permission.value === 'public')
const thumbnail = ref('')
const cover_image_url = ref('')
const bio = ref('')

// RAG 관련 데이터
const ragEntries = ref<Array<{ id: string; title: string; content: string }>>([])
const showRagForm = ref(false)
const newRagTitle = ref('')
const newRagContent = ref('')
const editingRagIndex = ref(-1)

// Tags implementation
const tagInput = ref('')
const tagList = ref([])


const isLoading = {
  save: ref(false),
};

// Category implementation
const predefinedCategories = [
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
]
const selectedCategories = ref([])
const showCategoryDropdown = ref(false)

const handleSave = async () => {
    addTag()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const agentData = {
      name: name.value,
      prompt: prompt.value,
      description: description.value,
      categories: selectedCategories.value,
      tags: tagList.value,
      selectedZents: selectedZents.value,
      ragEntries: ragEntries.value,
      permission: permission.value,
      thumbnail: thumbnail.value,
      bio: bio.value,
      data: {
        userInfo: {
          username: user?.username,
          bio: user?.bio,
          imageUrl: user?.imageUrl,
          url: user?.url,
          urlYoutube: user?.urlYoutube,
          urlTwitter: user?.urlTwitter,
          urlInstagram: user?.urlInstagram,
          urlLinkedin: user?.urlLinkedin
        }
      }
    }

    console.log('agentData:', agentData);
    console.log('Name:', agentData.name, 'Prompt:', agentData.prompt);
    // 필수 필드 체크
  const missingFields = [];

  // Private 모드일 때 필수 필드: name, prompt, thumbnail
  if (permission.value === 'private') {
    if (!agentData.name) missingFields.push('name');
    if (!agentData.prompt) missingFields.push('prompt');
    if (!agentData.thumbnail) missingFields.push('thumbnail');
  }
  // Public 모드일 때 필수 필드: 모든 입력 필드 (tool_calls, zents 제외)
  else {
    if (!agentData.name) missingFields.push('name');
    if (!agentData.prompt) missingFields.push('prompt');
    if (!agentData.thumbnail) missingFields.push('thumbnail');
    if (agentData.categories.length === 0) missingFields.push('categories');
    if (agentData.tags.length === 0) missingFields.push('tags');
    if (!agentData.bio) missingFields.push('bio');
  }

  if (missingFields.length > 0) {
    console.log('필수 필드 누락:', missingFields);
    toast({
      title: t('require-field-input'),
      description: t('require-field-input-more') + `${missingFields.join(', ')}`,
      variant: 'destructive'
    });
    return;
  }

  isLoading.save.value = true;


    try {
      // 선택된 zent 목록 확인
      console.log('선택된 Zent:', agentData.selectedZents);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const slug = agentData.name.replaceAll(' ', '-') + "-" + nanoid();
      // agent 생성

      let data = {}
      if (agentData.ragEntries && Array.isArray(agentData.ragEntries)) {
        data = {
          rag_data: {
            entries: agentData.ragEntries.map(entry => ({
              id: entry.id,
              title: entry.title,
              content: entry.content,
              createdAt: Date.now()
            })),
            lastUpdated: Date.now()
          }
        }
      }
      data['userInfo'] = {
        username: user?.username,
        bio: user?.bio,
        imageUrl: user?.imageUrl,
        url: user?.url,
        urlYoutube: user?.urlYoutube,
        urlTwitter: user?.urlTwitter,
        urlInstagram: user?.urlInstagram,
        urlLinkedin: user?.urlLinkedin
      }

      await zentStore.loadZents();

      let newZents = [];

      for (const zent of agentData.selectedZents) {
        // Create a new zent with the same properties but linked to the new agent
        const newZent = {
          ...zent,
          id: nanoid(),
          slug: `${zent.slug}-copy-${nanoid()}`,
          name: `${zent.name}`,
          agent: slug,
          user: user?.id,
          by: user?.username,
        }

        console.log("newZents pushed");
        console.log(JSON.parse(JSON.stringify(newZent)));
        newZents.push(JSON.parse(JSON.stringify(newZent)) );

        // Save the new zent
        await zentStore.addZent(newZent)
      }

      const agentId = await agentStore.addAgent({
        name: agentData.name,
        prompt: agentData.prompt,
        description: agentData.description,
        organization: props.organization?.value?.slug,
        team: props.team?.value?.slug,
        categories: agentData.categories,
        tags: agentData.tags,
        bio: agentData.bio,
        thumbnail: agentData.thumbnail,
        data: data,
        slug: slug,
        is_public: agentData.permission === 'public' ? 1 : 0,
        user: user?.id,
        by: user?.username,
      })

      console.log('생성된 Agent ID:', agentId);
      console.log("newZents");
      console.log(newZents);
      // Create a deep copy of the data before making the API request
      const newZentsCopy = structuredClone(JSON.parse(JSON.stringify(newZents)));
      const agentCopy = structuredClone(JSON.parse(JSON.stringify({
          name: agentData.name,
          prompt: agentData.prompt,
          description: agentData.description,
          categories: agentData.categories,
          tags: agentData.tags,
          bio: agentData.bio,
          thumbnail: agentData.thumbnail,
          organization: props.organization?.value?.slug,
          team: props.team?.value?.slug,
          slug: slug,
          zents: newZents.map(z => z.slug),
          is_public: agentData.permission === 'public',
          user: user?.id,
          by: user?.username,
        })))



      toast({ title: t('agent-added-successfully') })
      emit('update:open', false)

      for (const newZent of newZentsCopy) {

        try {
          await apiRequest('/zentrun-zent/', 'POST', newZent);
          // toast({ title: 'Zent copied successfully!' });
        } catch (error: any) {
          // toast({ title: 'Error copying zent', description: error.message || 'API error', variant: 'destructive' });
        }
      }

      try {
        await apiRequest('/zentrun-agent/', 'POST', agentCopy);
      } catch (error) {
      }

      if (props.organization) {
        props.organization.value = null;
      }
      if (props.team) {
        props.team.value = null;
      }
    } catch (error) {
      console.error('Agent 추가 실패:', error);
      toast({
        title: t('failed-to-add-agent'),
        description: error.message || t('an-unknown-error-occurred'),
        variant: 'destructive'
      });
    }
    isLoading.save.value = false;
}

const filteredZents = computed(() => {
  // Filter zents that don't belong to any agent or match the search criteria
  if (!searchZent.value)
    return props.zents.filter((z) =>
      !selectedZents.value.some((sel) => sel.id === z.id) &&
      !z.agent
    )
  return props.zents.filter(
    (z) =>
      z.name?.toLowerCase().includes(searchZent.value.toLowerCase()) &&
      !selectedZents.value.some((sel) => sel.id === z.id)
  )
})

function addZent(zent) {
  if (!selectedZents.value.some((z) => z.id === zent.id)) {
    selectedZents.value.push(zent)

    // Automatically add zent's title and prompt to rag_data
    if (zent.name && zent.prompt) {
      ragEntries.value.push({
        id: `zent-${zent.id}-${Date.now()}`,
        title: zent.name,
        content: JSON.stringify(zent.data),
        createdAt: Date.now()
      })
    }
  }
  searchZent.value = ''
  setTimeout(() => {
    showZentDropdown.value = false
  })
}

function removeZent(zent) {
  selectedZents.value = selectedZents.value.filter((z) => z.id !== zent.id)

  // Remove corresponding RAG entry if it exists
  // Find entries that might have been created from this zent
  const zentEntryPrefix = `zent-${zent.id}-`;
  ragEntries.value = ragEntries.value.filter(entry => {
    // Keep entries that don't start with the zent ID prefix
    return !entry.id.startsWith(zentEntryPrefix);
  });
}

function onZentInputBlur() {
  // 드롭다운 클릭 시 blur로 닫히지 않게 약간 지연
  zentInputBlurTimeout.value = setTimeout(() => {
    showZentDropdown.value = false
  }, 120)
}

// RAG 관련 메서드
function addRagEntry() {
  if (!newRagContent.value.trim()) return

  ragEntries.value.push({
    id: Date.now().toString(), // 임시 ID
    title: newRagTitle.value || t('reference') + `${ragEntries.value.length + 1}`,
    content: newRagContent.value
  })

  // 폼 초기화
  newRagTitle.value = ''
  newRagContent.value = ''
  showRagForm.value = false
}

function editRagEntry(index) {
  if (editingRagIndex.value === index) {
    editingRagIndex.value = -1
  } else {
    editingRagIndex.value = index
  }
}

function removeRagEntry(index) {
  ragEntries.value.splice(index, 1)
}

function cancelAddRag() {
  newRagTitle.value = ''
  newRagContent.value = ''
  showRagForm.value = false
}

// Tag functions
function handleTagInputKeydown(e) {
  // Add tag when comma or space is pressed
  if (e.key === ',' || e.key === ' ') {
    e.preventDefault()
    addTag()
  }
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !tagList.value.includes(tag)) {
    tagList.value.push(tag)
  }
  tagInput.value = ''
}

function removeTag(tag) {
  tagList.value = tagList.value.filter((t) => t !== tag)
}

// Category functions
function toggleCategory(category) {
  if (selectedCategories.value.includes(category)) {
    selectedCategories.value = selectedCategories.value.filter((c) => c !== category)
  } else {
    selectedCategories.value.push(category)
  }
}

function removeCategory(category) {
  selectedCategories.value = selectedCategories.value.filter((c) => c !== category)
}

// Close category dropdown when clicking outside
window.addEventListener('click', (e) => {
  if (showCategoryDropdown.value) {
    // Check if the click is outside the category dropdown
    const categoryDropdown = document.querySelector('.category-dropdown-container')
    if (categoryDropdown && !categoryDropdown.contains(e.target)) {
      showCategoryDropdown.value = false
    }
  }
})

watch(
  () => props.open,
  (open) => {
    if (!open) {
      // Reset form when dialog closes
      name.value = ''
      prompt.value = ''
      description.value = ''
      tagInput.value = ''
      tagList.value = []
      selectedCategories.value = []
      searchZent.value = ''
      selectedZents.value = []
      thumbnail.value = ''
      cover_image_url.value = ''
      bio.value = ''
      // Reset RAG-related data
      ragEntries.value = []
      showRagForm.value = false
      newRagTitle.value = ''
      newRagContent.value = ''
      editingRagIndex.value = -1
    }
  }
)
</script>
