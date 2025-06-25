<template>
  <div class="fixed top-20 h-[80vh] w-1/2 bg-white shadow-lg z-50 flex flex-col border-l border-gray-200" v-if="visible">
    <div class="flex justify-between items-center px-6 py-4 border-b">
      <h2 class="text-lg font-bold text-blue-500">{{ t('save-zent') }}</h2>
      <button @click="$emit('close')" class="text-gray-500 hover:text-gray-900">✕</button>
    </div>
    <form class="flex flex-col gap-4 p-6 flex-1 overflow-y-auto text-black">
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('name') }} <span class="text-red-500">*</span></span>
        <input v-model="name" type="text" class="input input-bordered" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('prompt') }} <span class="text-red-500">*</span></span>
        <textarea v-model="prompt" rows="3" class="input input-bordered" ></textarea>
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('description') }} <span class="text-black">{{ t('Optional') }}</span></span>
        <textarea v-model="description" rows="3" class="input input-bordered" placeholder="Enter a description for this Zent"></textarea>
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('zent.preview.runningCodeAutoMode') }}</span>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <input type="radio" id="off" value="off" v-model="runningCodeAutoMode" class="radio" />
            <label for="off">{{ t('off') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <input type="radio" id="all" value="all" v-model="runningCodeAutoMode" class="radio" />
            <label for="all">{{ t('all') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <input type="radio" id="end-only" value="end-only" v-model="runningCodeAutoMode" class="radio" />
            <label for="end-only">{{ t('end-only') }}</label>
          </div>
        </div>
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('categories') }} <span v-if="!isPublic" class="text-black">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
        <div class="relative category-dropdown-container">
          <div
            class="flex flex-wrap gap-2 p-2 border rounded min-h-[38px] cursor-text input"
            @click="showCategoryDropdown = true"
          >
            <div v-for="cat in selectedCategories" :key="cat" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
              <span>{{ cat }}</span>
              <button class="ml-1 text-red-400 hover:text-red-600" @click.stop="removeCategory(cat)">✕</button>
            </div>
            <span v-if="selectedCategories.length === 0" class="text-gray-400 text-xs">{{ t('select-categories') }}</span>
          </div>
          <div v-if="showCategoryDropdown" class="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-y-auto">
            <div
              v-for="cat in predefinedCategories"
              :key="cat"
              class="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
              @click.stop="toggleCategory(cat)"
            >
              <input
                type="checkbox"
                :id="cat"
                :value="cat"
                :checked="selectedCategories.includes(cat)"
                @change.stop="toggleCategory(cat)"
                class="mr-2"
              />
              <label class="flex-1 cursor-pointer" @click.stop="toggleCategory(cat)">{{ cat }}</label>
            </div>
          </div>
        </div>
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('tags') }} <span v-if="!isPublic" class="text-black">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
        <div class="flex flex-wrap gap-2 p-2 border rounded input">
          <div v-for="tag in tagList" :key="tag" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
            <span>{{ tag }}</span>
            <button class="ml-1 text-red-400 hover:text-red-600" @click="removeTag(tag)">✕</button>
          </div>
          <input
            v-model="tagInput"
            type="text"
            class="flex-1 outline-none text-sm min-w-[100px]"
            :placeholder="t('type-and-press-comma-or-space-to-add-tags')"
            @keydown="handleTagInputKeydown"
          />
        </div>
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('Organization') }} <span class="text-black">{{ t('Optional') }}</span></span>
        <select v-model="selectedOrganizationSlug" class="input input-bordered" @change="fetchTeams">
          <option :value="null">{{ t('select-organization-0') }}</option>
          <option v-for="org in organizationStore.organizations.value" :key="org.slug" :value="org.slug">
            {{ org.name }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1" v-if="selectedOrganizationSlug">
        <span class="font-semibold">{{ t('Team') }} <span class="text-black">{{ t('Optional') }}</span></span>
        <select v-model="selectedTeamSlug" class="input input-bordered">
          <option :value="null">{{ t('select-team-0') }}</option>
          <option v-for="team in filteredTeams" :key="team.slug" :value="team.slug">
            {{ team.name }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('agent') }} <span class="text-black">{{ t('Optional') }}</span></span>
        <select v-model="selectedAgentSlug" class="input input-bordered">
          <option :value="null">{{ t('select-agent-0') }}</option>
          <option v-for="agent in filteredAgents" :key="agent.slug" :value="agent.slug">
            {{ agent.name }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="font-semibold">{{ t('dialog.organization.add.permission') }}</span>
        <select v-model="permission" class="input input-bordered">
          <option value="public">{{ t('dialog.organization.add.permissionPublic') }}</option>
          <option value="private">{{ t('dialog.organization.add.permissionPrivate') }}</option>
        </select>
        <p class="text-xs text-muted-foreground mt-1">
          {{ permission === 'public' ? t('dialog.organization.add.permissionPublicDesc') : t('dialog.organization.add.permissionPrivateDesc') }}
        </p>
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
                            <CollapsibleText :text="call.response" />
                          </div>
                        </template>
            </div>
          </li>
        </ul>
      </div>
      <div class="flex gap-2 mt-4">
        <button type="button" class="btn btn-primary" @click.prevent="onSave" v-bind:disabled="isLoading">
          <div v-if="isLoading" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white mr-2 inline-block"></div>
          {{ t('save') }}
        </button>
        <button type="button" class="btn btn-secondary" @click.prevent="$emit('close')">{{ t('cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, computed, onMounted } from 'vue'
import { useToast } from '@/components/ui/toast'
import {useI18n} from "vue-i18n";
import { usePresenter } from '@/composables/usePresenter'
import {nanoid} from "nanoid";
import {organizationStore} from "../../stores/organization";
import {teamStore} from "../../stores/team";
import {agentStore} from "../../stores/agent";
import {zentStore} from "../../stores/zent";
import {useMcpStore} from "../../stores/mcp";
import {apiRequest} from "@/api";
import CollapsibleText from './CollapsibleText.vue'

const props = defineProps({
  visible: Boolean,
  messages: { type: Object, default: () => {} },
  toolCalls: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'save'])

const name = ref('')
const prompt = ref(props.messages ? props.messages[0]?.content?.text : '')
const description = ref('')
const runningCodeAutoMode = ref('end-only') // Default value as specified in requirements
const selectedOrganizationSlug = ref(null)
const selectedAgentSlug = ref(null)
const selectedTeamSlug = ref(null)
const permission = ref('private')
const isPublic = computed(() => permission.value === 'public')

// Tags implementation
const tagInput = ref('')
const tagList = ref([])

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
// const organizations = ref<any[]>([])

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

const { toast } = useToast()
const zentP = usePresenter('zentSQLitePresenter')
const orgP = usePresenter('organizationSQLitePresenter')
const agentP = usePresenter('agentSQLitePresenter')
const mcpStore = useMcpStore()

// Loading state
const isLoading = ref(false)

const t = useI18n().t

const fetchTeams = async () => {
  if (!selectedOrganizationSlug.value) return
  teamStore.loadTeams()
}

const saveZent = async (e) => {
  // 필수 필드 체크
  const missingFields = [];

  // Private 모드일 때 필수 필드: name, prompt
  if (permission.value === 'private') {
    if (!name.value) missingFields.push('name');
    if (!prompt.value) missingFields.push('prompt');
  }
  // Public 모드일 때 필수 필드: 모든 입력 필드 (tool_calls, zents 제외)
  else {
    if (!name.value) missingFields.push('name');
    if (!prompt.value) missingFields.push('prompt');
    if (selectedCategories.value.length === 0) missingFields.push('categories');
    if (tagList.value.length === 0) missingFields.push('tags');
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

  // Use the toolCalls passed from the onSave function, which already includes MCP installation info
  const toolCallsWithMcpInfo = e.toolCalls;

  const slug = name.value.replaceAll(' ', '-') + "-" + nanoid();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const payload = {
    name: name.value,
    slug: slug,
    data: {
      description: description.value,
      runningCodeAutoMode: runningCodeAutoMode.value,
      messages: props.messages,
      userInfo: {
        username: user?.username,
        bio: user?.bio,
        cover_image_url: user?.cover_image_url,
        url: user?.url,
        urlYoutube: user?.urlYoutube,
        urlTwitter: user?.urlTwitter,
        urlInstagram: user?.urlInstagram,
        urlLinkedin: user?.urlLinkedin
      }
    },
    prompt: prompt.value,
    categories: selectedCategories.value,
    tags: tagList.value,
    tool_calls: toolCallsWithMcpInfo,
    organization: selectedOrganizationSlug.value,
    agent: selectedAgentSlug.value,
    is_public: permission.value === 'public',
    user: user?.id,
    by: user?.username,
  };

  let zentData: any = {
    name: name.value,
    slug: slug,
    data: {
      messages: props.messages,
      description: description.value,
      runningCodeAutoMode: runningCodeAutoMode.value,
      userInfo: {
        username: user?.username,
        bio: user?.bio,
        cover_image_url: user?.cover_image_url,
        url: user?.url,
        urlYoutube: user?.urlYoutube,
        urlTwitter: user?.urlTwitter,
        urlInstagram: user?.urlInstagram,
        urlLinkedin: user?.urlLinkedin
      }
    },
    prompt: prompt.value,
    categories: JSON.stringify(selectedCategories.value),
    tags: JSON.stringify(tagList.value),
    tool_calls: JSON.stringify(toolCallsWithMcpInfo),
    is_public: permission.value === 'public' ? 1 : 0,
    user: user?.id,
    by: user?.username,
  }
  if (selectedOrganizationSlug.value) {
    zentData.organization = selectedOrganizationSlug.value;
  }
  if (selectedAgentSlug.value) {
    zentData.agent = selectedAgentSlug.value;
  }

  let a = await zentStore.addZent(zentData);
  toast({ title: t('zent-saved-successfully') });
  emit('close');

  try {

      try {
        await apiRequest('/zentrun-zent/', 'POST', payload);
        // toast({ title: 'Zent copied successfully!' });
      } catch (error: any) {
        // toast({ title: 'Error copying zent', description: error.message || 'API error', variant: 'destructive' });
      }
    // Reset fields after success
    name.value = '';
    tagInput.value = '';
    tagList.value = [];
    selectedCategories.value = [];
    selectedOrganizationSlug.value = null;
    selectedAgentSlug.value = null;
  } catch (error: any) {
    toast({ title: t('error-saving-zent'), description: error.message || t('api-error'), variant: 'destructive' });
  }
}

// Track the lock state for each call (default: true)
const lockedInputs = ref(props.toolCalls.map(() => true))
// Track which calls are removed
const removedCalls = ref(props.toolCalls.map(() => false))

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
  tagList.value = tagList.value.filter(t => t !== tag)
}

// Category functions
function toggleCategory(category) {
  if (selectedCategories.value.includes(category)) {
    selectedCategories.value = selectedCategories.value.filter(c => c !== category)
  } else {
    selectedCategories.value.push(category)
  }
}

function removeCategory(category) {
  selectedCategories.value = selectedCategories.value.filter(c => c !== category)
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

watch(() => props.toolCalls, (newCalls) => {
  // Sync lock state if toolCalls array length changes
  lockedInputs.value = newCalls.map(() => true)
  // Reset removed calls state
  removedCalls.value = newCalls.map(() => false)
}, { immediate: true })

// onMounted(() => {
//   // Load data from stores
//   organizationStore.loadOrganizations()
//   agentStore.loadAgents()
//   teamStore.loadTeams()
//   zentStore.loadZents()
// })

watch(() => props.visible, (val) => {
  if (val) {
    name.value = ''
    // prompt.value = '' // Keep prompt from message
    prompt.value = props.messages[0].content?.text ?? ''
    description.value = ''
    runningCodeAutoMode.value = 'end-only' // Reset to default value
    tagInput.value = ''
    tagList.value = []
    selectedCategories.value = []
    selectedOrganizationSlug.value = null
    selectedAgentSlug.value = null
    lockedInputs.value = props.toolCalls.map(() => true)
    removedCalls.value = props.toolCalls.map(() => false)
  }
})

async function onSave() {
  try {
    isLoading.value = true
    addTag()
    // Filter out removed tool calls
    const filteredToolCalls = props.toolCalls.filter((_, idx) => !removedCalls.value[idx]);

    // Get MCP installation information for each tool call
    const toolCallsWithMcpInfo = await Promise.all(filteredToolCalls.map(async (toolCall) => {
    // Get server name from the tool call
    const serverName = toolCall.server_name;

    // Get server information from MCP store
    const serverInfo = mcpStore.serverList.find(server => server.name === serverName);

    if (serverInfo) {
      // Add MCP installation information to the tool call
      return {
        ...toolCall,
        mcp_install_info: {
          command: serverInfo.command || '',
          args: serverInfo.args || [],
          env: serverInfo.env || {}
        }
      };
    }

    return toolCall;
  }));
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  await saveZent({
    name: name.value,
    prompt: prompt.value,
    category: selectedCategories.value,
    tags: tagList.value,
    lockedInputs: lockedInputs.value,
    toolCalls: toolCallsWithMcpInfo,
    organization: selectedOrganizationSlug.value,
    agent: selectedAgentSlug.value,
    data: {
      description: description.value,
      runningCodeAutoMode: runningCodeAutoMode.value,
      messages: props.messages,
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
  });
  // emit('save', {
  //   name: name.value,
  //   data: {
  //     messages: props.messages,
  //   },
  //   prompt: prompt.value,
  //   category: selectedCategories.value,
  //   tags: tagList.value,
  //   lockedInputs: lockedInputs.value,
  //   toolCalls: toolCallsWithMcpInfo,
  //   organization: selectedOrganizationSlug.value,
  //   agent: selectedAgentSlug.value
  // })
  } catch (error) {
    console.error('Error saving zent:', error)
    toast({
      title: t('error-saving-zent'),
      description: error.message || t('an-unknown-error-occurred'),
      variant: 'destructive'
    })
  } finally {
    isLoading.value = false
  }
}
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
