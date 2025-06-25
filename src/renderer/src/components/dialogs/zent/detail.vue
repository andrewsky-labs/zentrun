<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-4xl h-[80vh]">
<!--      <DialogHeader>-->
<!--        <DialogTitle>{{ t('dialog.zent.edit.title') }}</DialogTitle>-->
<!--        <DialogDescription>{{ t('dialog.zent.edit.description') }}</DialogDescription>-->
<!--      </DialogHeader>-->

      <div class="flex-1 overflow-y-auto p-4 text-black">
        <form class="flex flex-col gap-4">
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.zent.edit.name') }} <span class="text-red-500">*</span></span>
            <Input v-if="!props.isViewMode && !isMarketplaceMode" v-model="name" type="text" class="w-full" />
            <div v-else class="w-full border rounded p-2 mt-1 bg-gray-50">{{ name }}</div>
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.zent.edit.prompt') }} <span class="text-red-500">*</span></span>
            <Textarea v-if="!props.isViewMode && !isMarketplaceMode" v-model="prompt" rows="3" class="w-full" />
            <div v-else class="w-full border rounded p-2 mt-1 bg-gray-50 whitespace-pre-wrap" style="min-height: 80px">{{ prompt }}</div>
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.zent.edit.description') }} <span class="text-black">{{ t('Optional') }}</span></span>
            <Textarea v-if="!props.isViewMode && !isMarketplaceMode" v-model="description" rows="3" class="w-full" placeholder="Enter a description for this Zent" />
            <div v-else class="w-full border rounded p-2 mt-1 bg-gray-50 whitespace-pre-wrap" style="min-height: 80px">{{ props.zent?.data?.description || '' }}</div>
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.zent.edit.runningCodeAutoMode', 'Running Code Auto Mode') }}</span>
            <div v-if="!props.isViewMode && !isMarketplaceMode" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <input type="radio" id="off" value="off" v-model="runningCodeAutoMode" class="radio" />
                <label for="off">{{ t('dialog.zent.edit.off', 'Off') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" id="all" value="all" v-model="runningCodeAutoMode" class="radio" />
                <label for="all">{{ t('dialog.zent.edit.all', 'All') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" id="end-only" value="end-only" v-model="runningCodeAutoMode" class="radio" />
                <label for="end-only">{{ t('dialog.zent.edit.endOnly', 'End Only') }}</label>
              </div>
            </div>
            <div v-else class="w-full border rounded p-2 mt-1 bg-gray-50">
              {{ props.zent?.data?.runningCodeAutoMode || 'end-only' }}
            </div>
          </Label>
          <!-- Connected MCPs -->
          <div class="mb-4">
            <h3 class="text-sm font-medium mb-4">{{ t('connected-mcps') }}</h3>
            <p class="text-xs text-gray-600 mb-4">
              {{ t('allow-mcps-to-trigger-zents-for-your-agent-for-example-connect-gmail-to-trigger-your-agent-via-mcp-0') }}
            </p>

            <div class="space-y-2">
              <div v-for="mcp in uniqueMcps" :key="mcp.server_name"
                   class="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div class="flex items-center">
                  <span v-if="mcp.server_icons" class="mr-2">{{mcp.server_icons}}</span>
                  <span class="text-sm">{{ mcp.server_name }}</span>
                </div>
                <div class="flex items-center">
                  <span v-if="isInstalledMcp(mcp.server_name)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                    {{ t('connected') }}
                  </span>
                  <button v-else @click="openInstallMcpModal(mcp.server_name)"
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-300 text-gray-800 mr-2 hover:bg-gray-50">
                    {{ t('install') }}
                  </button>
                </div>
              </div>
              <div v-if="uniqueMcps.length === 0" class="text-xs text-gray-500 p-2">
                {{ t('no-mcps-found-in-this-zent') }}
              </div>
            </div>
          </div>

          <!-- Creator Info -->
          <div v-if="zent?.data?.userInfo" class="mb-4">
            <h3 class="text-sm font-medium mb-4">{{ t('creator-info') }}</h3>
            <div class="border rounded-md p-4">
              <div class="flex items-center mb-2">
                <div class="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <img
                    v-if="zent?.data?.userInfo?.imageUrl"
                    :src="zent.data.userInfo.imageUrl"
                    :alt="t('user-profile')"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="font-medium text-sm">{{ zent.data.userInfo.username || 'Unknown creator' }}</p>
                </div>
              </div>

              <!-- Bio -->
                <p v-if="zent?.data?.userInfo?.bio" class="text-xs text-gray-600 mb-5 mt-5">
                {{ zent.data.userInfo.bio }}
              </p>

              <!-- Social Links -->
              <div class="flex flex-wrap gap-2">
                <!-- Website URL -->
                <a
                  v-if="zent?.data?.userInfo?.url"
                  :href="zent.data.userInfo.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <span class="mr-1">🌐</span> {{ t('website') }}
                </a>

                <!-- Twitter URL -->
                <a
                  v-if="zent?.data?.userInfo?.urlTwitter"
                  :href="zent.data.userInfo.urlTwitter"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <span class="mr-1">🐦</span> {{ t('twitter') }}
                </a>

                <!-- LinkedIn URL -->
                <a
                  v-if="zent?.data?.userInfo?.urlLinkedin"
                  :href="zent.data.userInfo.urlLinkedin"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <span class="mr-1">💼</span> {{ t('linkedin') }}
                </a>

                <!-- YouTube URL -->
                <a
                  v-if="zent?.data?.userInfo?.urlYoutube"
                  :href="zent.data.userInfo.urlYoutube"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <span class="mr-1">📺</span> {{ t("YouTube") }}
                </a>
              </div>
            </div>
          </div>

          <div v-if="zent?.tool_calls?.length">
            <span class="font-semibold">{{ t('dialog.zent.edit.toolCalls') }}</span>
            <ul class="mt-2 space-y-2">
              <li v-for="(call, idx) in zent?.tool_calls" :key="call.id" class="flex gap-3 p-2 border rounded items-start">
                <img v-if="call.mcpImageUrl" :src="call.mcpImageUrl" :alt="t('mcp-image')" class="w-8 h-8 rounded bg-gray-100 object-cover mt-1" />
                <span v-else>{{ call.server_icons }}</span>
                <div class="flex flex-col flex-1 gap-1">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span v-if="call.mcpName" class="font-semibold text-sm">{{ call.mcpName }}</span>
                      <span v-else class="font-semibold text-sm">{{ call.server_name }}</span>
                      <span class="text-xs text-gray-500">{{ call.name }}</span>
                      <label v-if="!removedCalls[idx] && !props.isViewMode" class="flex items-center gap-1 ml-2 text-xs">
                        <input type="checkbox" v-model="lockedInputs[idx]" /> {{ t('dialog.zent.edit.lockInput') }}
                      </label>
                    </div>
                    <button
                      v-if="!removedCalls[idx] && !props.isViewMode"
                      @click="removedCalls[idx] = true"
                      class="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                    >
                      {{ t('dialog.zent.edit.remove') }}
                    </button>
                    <button
                      v-else-if="!props.isViewMode"
                      @click="removedCalls[idx] = false"
                      class="text-xs text-green-500 hover:text-green-700 px-2 py-1 rounded border border-green-300 hover:bg-green-50"
                    >
                      {{ t('dialog.zent.edit.restore') }}
                    </button>
                  </div>
                  <template v-if="!removedCalls[idx]">
                    <div class="flex flex-col gap-1 mt-1">
                      <label class="text-xs font-semibold">{{ t('dialog.zent.edit.arguments') }}</label>
                      <template v-if="lockedInputs[idx] && !props.isViewMode">
                        <Textarea v-model="call.params" class="text-sm" rows="2" />
                      </template>
                      <template v-else>
                        <div class="bg-gray-50 border rounded p-2 text-sm text-gray-700 whitespace-pre-wrap">{{ call.params }}</div>
                      </template>
                    </div>
                    <div class="flex flex-col gap-1 mt-1">
                      <label class="text-xs font-semibold">{{ t('dialog.zent.edit.response') }}</label>
                      <CollapsibleText :text="call.response" />
                    </div>
                  </template>
                </div>
              </li>
            </ul>
          </div>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.zent.edit.categories') }} <span v-if="!isPublic" class="text-black">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
            <div v-if="!props.isViewMode && !isMarketplaceMode" class="relative category-dropdown-container">
              <div
                class="flex flex-wrap gap-2 p-2 border rounded min-h-[38px] cursor-text"
                @click="showCategoryDropdown = true"
              >
                <div v-for="cat in selectedCategories" :key="cat" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                  <span>{{ cat }}</span>
                  <button class="ml-1 text-red-400 hover:text-red-600" @click.stop="removeCategory(cat)">✕</button>
                </div>
                <span v-if="selectedCategories.length === 0" class="text-gray-400 text-xs">{{ t('dialog.zent.edit.selectCategories') }}</span>
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
            <div v-else class="flex flex-wrap gap-2 p-2 border rounded min-h-[38px] bg-gray-50">
              <div v-for="cat in selectedCategories" :key="cat" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                <span>{{ cat }}</span>
              </div>
              <span v-if="selectedCategories.length === 0" class="text-gray-400 text-xs">{{ t('no-categories') }}</span>
            </div>
          </Label>
          <Label class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.zent.edit.tags') }} <span v-if="!isPublic" class="text-black">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
            <div v-if="!props.isViewMode && !isMarketplaceMode" class="flex flex-wrap gap-2 p-2 border rounded">
              <div v-for="tag in tagList" :key="tag" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                <span>{{ tag }}</span>
                <button class="ml-1 text-red-400 hover:text-red-600" @click="removeTag(tag)">✕</button>
              </div>
              <input
                v-model="tagInput"
                type="text"
                class="flex-1 outline-none text-sm min-w-[100px]"
                :placeholder="t('dialog.zent.edit.tagInputPlaceholder')"
                @keydown="handleTagInputKeydown"
              />
            </div>
            <div v-else class="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
              <div v-for="tag in tagList" :key="tag" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                <span>{{ tag }}</span>
              </div>
              <span v-if="tagList.length === 0" class="text-gray-400 text-xs">{{ t('no-tags') }}</span>
            </div>
          </Label>
          <Label v-if="!props.isViewMode && !isMarketplaceMode"  class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.organization.add.permission') }}</span>
            <select v-if="permission === 'public'" v-model="permission" class="w-full border rounded p-2 mt-1">
              <option value="public">{{ t('dialog.organization.add.permissionPublic') }}</option>
              <option value="private">{{ t('dialog.organization.add.permissionPrivate') }}</option>
            </select>
            <div v-else class="w-full border rounded p-2 mt-1 bg-gray-50">
              {{ permission === 'public' ? t('dialog.organization.add.permissionPublic') : t('dialog.organization.add.permissionPrivate') }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              {{ permission === 'public' ? t('dialog.organization.add.permissionPublicDesc') + " When changed to Public, it will be displayed in the marketplace after review and approval." : t('dialog.organization.add.permissionPrivateDesc') }}
            </p>
          </Label>
          <Label v-else-if="!isMarketplaceMode" class="flex flex-col gap-1">
            <span class="font-semibold">{{ t('dialog.organization.add.permission') }}</span>
            <div class="w-full border rounded p-2 mt-1 bg-gray-50">
              {{ permission === 'public' ? t('dialog.organization.add.permissionPublic') : t('dialog.organization.add.permissionPrivate') }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              {{ permission === 'public' ? t('dialog.organization.add.permissionPublicDesc') : t('dialog.organization.add.permissionPrivateDesc') }}
            </p>
          </Label>
            <Button
              v-if="!props.isViewMode && permission === 'private' && !isEnterpriseMode && isBuildMode"
              variant="outline"
              class="mt-2"
              v-bind:disabled="isLoading.deploy.value"
              @click="deployToMarketplace"
            >
              <div v-if="isLoading.deploy.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-black"></div>
              <Icon v-else icon="lucide:upload-cloud" class="h-4 w-4 mr-2" />
              {{ t('deploy-to-marketplace') }}
            </Button>

            <p v-if="!props.isViewMode && permission === 'private'" class="text-xs text-muted-foreground mt-1">
              {{ !user.bio && t('common.introduceProfileSettings') }}
            </p>

        </form>
      </div>

      <DialogFooter class="flex justify-between">
        <div>
          <Button
            variant="outline"
            class="mr-2"
            @click="$emit('update:open', false)"
          >
            {{ t('close') }}
          </Button>
          <Button v-if="props.isViewMode && !isMarketplaceMode" variant="outline" @click="$emit('edit')">
            <Icon icon="lucide:edit" class="h-4 w-4 mr-2" />
            {{ t('edit') }}
          </Button>
          <Button v-else-if="!isMarketplaceMode" variant="default" @click="onUpdate">{{ t('dialog.zent.edit.save') }}</Button>
          <Button v-else variant="default" @click="cloneZent">{{ t('clone') }}</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- MCP Installation Modal -->
  <McpInstallDialog
    v-if="installMcpModalOpen"
    :open="installMcpModalOpen"
    :server-name="currentMcpToInstall"
    @update:open="installMcpModalOpen = $event"
    @install="handleInstallMcp"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { nanoid } from 'nanoid'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { useI18n } from 'vue-i18n'
import { zentStore } from '@/stores/zent'
import { useMcpStore } from "@/stores/mcp"
import { apiRequest } from "@/api";
import CollapsibleText from "@/components/message/CollapsibleText.vue";
import { usePresenter } from '@/composables/usePresenter';
import McpInstallDialog from '@/components/dialogs/mcp/install.vue';
import { Icon } from '@iconify/vue'
import {organizationStore} from "@/stores/organization";

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  zent: {
    type: Object,
    default: null
  },
  isViewMode: {
    type: Boolean,
    default: false
  },
  isMarketplaceMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'cancel', 'edit'])

// Check if enterprise mode is enabled
const isEnterpriseMode = computed(() => {
  return import.meta.env.VITE_ZENTRUN_ENTERPRISE_MODE === 'true'
})
const isBuildMode = computed(() => {
  return import.meta.env.VITE_IS_FOR_BUILD === 'true'
})

// Initialize refs with default values
const name = ref('')
const prompt = ref('')
const description = ref('')
const runningCodeAutoMode = ref('end-only') // Default value as specified in requirements
const tool_calls = ref('')
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
const user = JSON.parse(localStorage.getItem('user') || '{}');

const selectedCategories = ref([])
const showCategoryDropdown = ref(false)
const lockedInputs = ref([])
// Track which calls are removed
const removedCalls = ref([])

// Loading states
const isLoading = {
  deploy: ref(false),
  clone: ref(false),
  save: ref(false),
}

// Watch for zent prop changes
watch(() => props.zent, (newZent) => {
  if (!newZent) return

  name.value = newZent?.name || ''
  prompt.value = newZent?.prompt || ''
  description.value = newZent?.description || ''
  runningCodeAutoMode.value = newZent?.data?.runningCodeAutoMode || 'end-only'
  permission.value = newZent?.is_public ? 'public' : 'private'

  // Initialize categories
  if (newZent?.categories) {
    try {
      const parsedCategories = typeof newZent.categories === 'string'
        ? JSON.parse(newZent.categories)
        : newZent.categories

      if (Array.isArray(parsedCategories)) {
        selectedCategories.value = parsedCategories
      }
    } catch (e) {
      selectedCategories.value = []
    }
  } else {
    selectedCategories.value = []
  }

  // Initialize tags
  if (newZent?.tags) {
    try {
      const parsedTags = typeof newZent.tags === 'string'
        ? JSON.parse(newZent.tags)
        : newZent.tags

      if (Array.isArray(parsedTags)) {
        tagList.value = parsedTags
      }
    } catch (e) {
      tagList.value = []
    }
  } else {
    tagList.value = []
  }

  tool_calls.value = newZent?.tool_calls || ""

  if (newZent?.toolCalls) {
    lockedInputs.value = newZent.toolCalls.map(() => true)
  }
}, { immediate: true })

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    // Reset form when dialog closes
    name.value = ''
    prompt.value = ''
    description.value = ''
    runningCodeAutoMode.value = 'end-only'
    tagInput.value = ''
    tagList.value = []
    selectedCategories.value = []
    tool_calls.value = ''
    permission.value = 'private'
    lockedInputs.value = []
    removedCalls.value = []
  }
})

const { toast } = useToast()
const t = useI18n().t
const mcpStore = useMcpStore()

// Get mcpPresenter
const mcpPresenter = usePresenter('mcpPresenter')

// Use reactive reference to store MCP servers data
const installedMcps = ref({})
const currentMcpToInstall = ref('')
const installMcpModalOpen = ref(false)

// Initialize the MCP servers data on component mount
onMounted(async () => {
  try {
    // Fetch MCP servers from the presenter
    installedMcps.value = await mcpPresenter.getMcpServers()
  } catch (error) {
    console.error('Failed to fetch installed MCPs:', error)
  }
})

// Check if an MCP is installed by checking if it exists as a key in the installedMcps object
function isInstalledMcp(mcpName) {
  return Object.keys(installedMcps.value).includes(mcpName);
}

function openInstallMcpModal(mcpName) {
  currentMcpToInstall.value = mcpName;
  installMcpModalOpen.value = true;
}

async function handleInstallMcp(serverName, installData) {
  try {
    await mcpStore.installMcpServer(serverName, installData);
    installedMcps.value.push(serverName);
    toast({
      title: t('mcp-installed'),
      description: t('successfully-installed') + `${serverName}`,
    });
  } catch (error) {
    console.error('Failed to install MCP:', error);
    toast({
      title: t('mcp.installFailed'),
      description: t('could-not-install') + `${serverName}`,
      variant: 'destructive',
    });
  }
}

// Process MCPs from tool_calls
const processedMcps = computed(() => {
  const mcps = []

  if (props.zent?.tool_calls) {
    let toolCalls

    if (typeof props.zent.tool_calls === 'string') {
      try {
        toolCalls = JSON.parse(props.zent.tool_calls)
      } catch (e) {
        console.error('Error parsing tool_calls:', e)
        return mcps
      }
    } else {
      toolCalls = props.zent.tool_calls
    }

    // Extract server information from tool_calls
    if (toolCalls) {
      toolCalls.forEach(mcp => {
        if (mcp.server_name) {
          mcps.push(mcp)
        }
      })
    }
  }

  return mcps
})

// Get unique MCPs based on server_name
const uniqueMcps = computed(() => {
  const uniqueMap = new Map()

  processedMcps.value.forEach(mcp => {
    if (!uniqueMap.has(mcp.server_name)) {
      uniqueMap.set(mcp.server_name, mcp)
    }
  })

  return Array.from(uniqueMap.values())
})

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

watch(() => props.zent?.toolCalls, (newCalls) => {
  if (newCalls) {
    lockedInputs.value = newCalls.map(() => true)
    removedCalls.value = newCalls.map(() => false)
  }
})

// Handle zent update
const handleZentUpdate = async (zentData) => {
  // Filter out removed tool calls
  let filteredToolCalls = props.zent?.toolCalls
  if (filteredToolCalls) {
    filteredToolCalls = filteredToolCalls.filter((_, idx) => !removedCalls.value[idx])
  }

  try {
    await zentStore.updateZent(props.zent?.id, {
      name: zentData.name,
      prompt: zentData.prompt,
      data: {
        ...props.zent?.data,
        description: zentData.description,
        runningCodeAutoMode: zentData.runningCodeAutoMode
      },
      categories: JSON.stringify(zentData.categories),
      tags: JSON.stringify(zentData.tags),
      tool_calls: filteredToolCalls ? JSON.stringify(filteredToolCalls) : tool_calls.value,
      is_public: zentData.permission === 'public' ? 1 : 0
    })
      // Create a deep copy of the data before making the API request
      const updateData = structuredClone(JSON.parse(JSON.stringify({
        name: zentData.name,
        slug: props.zent?.slug,
        prompt: zentData.prompt,
        data: {
          ...props.zent?.data,
          description: zentData.description,
          runningCodeAutoMode: zentData.runningCodeAutoMode
        },
        categories: zentData.categories,
        tags: zentData.tags,
        tool_calls: filteredToolCalls || tool_calls,
        is_public: zentData.permission === 'public'
      })));

    toast({ title: t('zent-updated-successfully') })
    emit('update:open', false)

    try {
      await apiRequest('/zentrun-zent/', 'PUT', updateData)
    } catch (error) {
      toast({ title: t('error-moving-zent'), description: error.message || t('api-error'), variant: 'destructive' })
    }
  } catch (error) {
    toast({
      title: error.message || t('failed-to-update-zent'),
      variant: 'destructive'
    })
  }
};

const onUpdate = async () => {
  addTag();

  // Validate required fields
  const missingFields = [];

  // Always require name and prompt
  if (name.value.length === 0) {
    missingFields.push('name');
  }
  if (prompt.value.length === 0) {
    missingFields.push('prompt');
  }

  // If permission is public, also require categories and tags
  if (permission.value === 'public') {
    if (selectedCategories.value.length === 0) {
      missingFields.push('categories');
    }
    if (tagList.value.length === 0) {
      missingFields.push('tags');
    }
  }

  if (missingFields.length > 0) {
    toast({
      title: t('please-fill-in-all-required-fields'),
      description: t('the-following-fields-are-required') + `${missingFields.join(', ')}`,
      variant: 'destructive'
    });
    return;
  }

  await handleZentUpdate({
    name: name.value,
    prompt: prompt.value,
    description: description.value,
    runningCodeAutoMode: runningCodeAutoMode.value,
    categories: selectedCategories.value,
    tags: tagList.value,
    permission: permission.value
  });
}

// Check if all required MCPs are installed
const checkRequiredMcpsInstalled = () => {
  const uninstalledMcps = uniqueMcps.value.filter(mcp => !isInstalledMcp(mcp.server_name));
  return {
    allInstalled: uninstalledMcps.length === 0,
    uninstalledMcps: uninstalledMcps
  };
}

// Deploy to marketplace function
const deployToMarketplace = async () => {
  try {
    isLoading.deploy.value = true;
    addTag();

    // Validate required fields
    const missingFields = [];

    // Required fields for marketplace deployment
    if (name.value.length === 0) {
      missingFields.push('name');
    }
    if (prompt.value.length === 0) {
      missingFields.push('prompt');
    }
    if (selectedCategories.value.length === 0) {
      missingFields.push('categories');
    }
    if (tagList.value.length === 0) {
      missingFields.push('tags');
    }

    if (missingFields.length > 0) {
      toast({
        title: t('please-fill-in-all-required-fields'),
        description: t('the-following-fields-are-required-for-marketplace-deployment') + `${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      isLoading.deploy.value = false;
      return;
    }

    // Create a deep copy of the data before making the API request
    const deployData = structuredClone(JSON.parse(JSON.stringify(props.zent)));
    await apiRequest(`/zentrun-zent/deploy/`, 'POST', deployData);

    // Update permission to public
    permission.value = 'public';
    await zentStore.updateZent(props.zent.id, { is_public: 1 });

    toast({
      title: t('zent-deployed-to-marketplace'),
      description: t('your-zent-has-been-successfully-deployed-to-the-marketplace'),
    });
    isLoading.deploy.value = false;

    // Call handleZentUpdate to ensure all changes are properly saved
    handleZentUpdate({
      name: name.value,
      prompt: prompt.value,
      description: description.value,
      runningCodeAutoMode: runningCodeAutoMode.value,
      categories: selectedCategories.value,
      tags: tagList.value,
      permission: permission.value
    });
  } catch (error) {
    toast({
      title: t('error-deploying-to-marketplace'),
      description: error.message || t('an-error-occurred-while-deploying-to-marketplace'),
      variant: 'destructive'
    });
    isLoading.deploy.value = false;
  }
};

const cloneZent = async () => {
  // Check if all required MCPs are installed
  const mcpCheck = checkRequiredMcpsInstalled();
  if (!mcpCheck.allInstalled) {
    const mcpNames = mcpCheck.uninstalledMcps.map(mcp => mcp.server_name).join(', ');
    toast({
      title: t('mcp-installation-required'),
      description: t('please-install-the-following-mcp-tools-first-mcpnames', [mcpNames]),
      variant: 'destructive'
    });
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const newSlug = props.zent.slug + "-" + nanoid();

    // Create a new zent with the same data but a new name
    const newZent = {
      name: `${name.value}`,
      is_public: 0,
      slug: newSlug,
      prompt: prompt.value,
      categories: selectedCategories.value,
      tags: tagList.value,
      tool_calls: props.zent?.tool_calls,
      agent: props.zent?.agent,
      user: user?.id,
      by: user?.username,
      data: {
        ...(props.zent.data || {}),
        cloned_from: props.zent.slug
      }
    }

    // Create the zent in the local store
    const result = await zentStore.addZent(newZent)

    toast({ title: t('zent-cloned-successfully') })
    emit('update:open', false)

    // Create the zent in the API
    try {
      // Create a deep copy of the data before making the API request
      const newZentCopy = structuredClone(JSON.parse(JSON.stringify(newZent)));
      await apiRequest('/zentrun-zent/', 'POST', newZentCopy)
    } catch (error) {
      toast({ title: t('error-creating-zent-in-api'), description: error.message || t('api-error'), variant: 'destructive' })
    }
  } catch (error) {
    toast({
      title: error.message || t('failed-to-clone-zent'),
      variant: 'destructive'
    })
  }
}

const handleCancel = () => {
  emit('update:open', false)
}

</script>
