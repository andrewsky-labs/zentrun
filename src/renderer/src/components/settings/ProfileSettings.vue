<template>
  <ScrollArea class="w-full h-full p-2">
    <div class="w-full h-full flex flex-col gap-4">
      <h2 class="text-lg font-semibold mb-2">{{ t('settings.profile.title', 'Profile Settings') }}</h2>

      <!-- Username -->
      <div class="flex flex-col gap-2">
        <Label class="text-sm font-medium">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:user" class="w-4 h-4 text-muted-foreground" />
            {{ t('settings.profile.username', 'Username') }} <span class="text-red-500">*</span>
          </div>
        </Label>
        <Input v-model="username" :placeholder="t('settings.profile.usernamePlaceholder', 'Enter your username')" />
      </div>

      <!-- Bio -->
      <div class="flex flex-col gap-2">
        <Label class="text-sm font-medium">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:file-text" class="w-4 h-4 text-muted-foreground" />
            {{ t('settings.profile.bio', 'Bio') }} <span class="text-red-500">*</span>
          </div>
        </Label>
        <Textarea
          v-model="bio"
          :placeholder="t('settings.profile.bioPlaceholder', 'Tell us about yourself')"
          rows="3"
        />
      </div>

      <!-- Profile Image -->
      <div class="flex flex-col gap-2 w-[150px]">
        <CoverImageUploader
          v-model="imageUrl"
          :label="t('settings.profile.coverImage', 'Profile Image')"
        />
      </div>

      <!-- Website URL -->
      <div class="flex flex-col gap-2">
        <Label class="text-sm font-medium">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:globe" class="w-4 h-4 text-muted-foreground" />
            {{ t('settings.profile.url', 'Website URL') }}
          </div>
        </Label>
        <Input
          v-model="url"
          :placeholder="t('settings.profile.urlPlaceholder', 'https://example.com')"
        />
      </div>

      <!-- Twitter URL -->
      <div class="flex flex-col gap-2">
        <Label class="text-sm font-medium">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:twitter" class="w-4 h-4 text-muted-foreground" />
            {{ t('settings.profile.urlTwitter', 'Twitter URL') }}
          </div>
        </Label>
        <Input
          v-model="urlTwitter"
          :placeholder="t('settings.profile.urlTwitterPlaceholder', 'https://twitter.com/username')"
        />
      </div>

      <!-- LinkedIn URL -->
      <div class="flex flex-col gap-2">
        <Label class="text-sm font-medium">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:linkedin" class="w-4 h-4 text-muted-foreground" />
            {{ t('settings.profile.urlLinkedin', 'LinkedIn URL') }}
          </div>
        </Label>
        <Input
          v-model="urlLinkedin"
          :placeholder="t('settings.profile.urlLinkedinPlaceholder', 'https://linkedin.com/in/username')"
        />
      </div>

      <!-- YouTube URL -->
      <div class="flex flex-col gap-2">
        <Label class="text-sm font-medium">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:youtube" class="w-4 h-4 text-muted-foreground" />
            {{ t('settings.profile.urlYoutube', 'YouTube URL') }}
          </div>
        </Label>
        <Input
          v-model="urlYoutube"
          :placeholder="t('settings.profile.urlYoutubePlaceholder', 'https://youtube.com/channel/...')"
        />
      </div>

      <!-- Instagram URL -->
      <div class="flex flex-col gap-2">
        <Label class="text-sm font-medium">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:instagram" class="w-4 h-4 text-muted-foreground" />
            {{ t('settings.profile.urlInstagram', 'Instagram URL') }}
          </div>
        </Label>
        <Input
          v-model="urlInstagram"
          :placeholder="t('settings.profile.urlInstagramPlaceholder', 'https://instagram.com/username')"
        />
      </div>

      <!-- Save Button -->
      <div class="flex justify-end mt-4">
        <Button
          @click="saveProfile"
          :disabled="isSaving"
          class="px-4"
        >
          <Icon v-if="isSaving" icon="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
          <Icon v-else icon="lucide:save" class="w-4 h-4 mr-2" />
          {{ t('settings.profile.saveButton', 'Save Profile') }}
        </Button>
      </div>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { apiRequest } from '@/api'
import CoverImageUploader from '@/components/CoverImageUploader.vue'
import { organizationStore } from '@/stores/organization'
import { teamStore } from '@/stores/team'
import { agentStore } from '@/stores/agent'
import { zentStore } from '@/stores/zent'

const { t } = useI18n()
const { toast } = useToast()

// Form fields
const username = ref('')
const bio = ref('')
const imageUrl = ref('')
const url = ref('')
const urlTwitter = ref('')
const urlLinkedin = ref('')
const urlYoutube = ref('')
const urlInstagram = ref('')
const isSaving = ref(false)

// Function to update all entities with user info
const updateAllEntitiesWithUserInfo = async (userData) => {
  try {
    // Create userInfo object with all user profile data
    const userInfo = {
      username: userData.username,
      bio: userData.bio,
      imageUrl: userData.imageUrl,
      url: userData.url,
      urlYoutube: userData.urlYoutube,
      urlTwitter: userData.urlTwitter,
      urlInstagram: userData.urlInstagram,
      urlLinkedin: userData.urlLinkedin
    }

    // Load all entities
    await Promise.all([
      organizationStore.loadOrganizations(),
      teamStore.loadTeams(),
      agentStore.loadAgents(),
      zentStore.loadZents()
    ])

    // Update all organizations
    for (const org of organizationStore.organizations.value) {
      try {
        // Get existing data or create new data object
        const data = org.data || {}

        // Update userInfo in data
        data.userInfo = userInfo

        // Update organization
        await organizationStore.updateOrganization(org.id, { data })
      } catch (error) {
        console.error(`Failed to update organization ${org.id}:`, error)
      }
    }

    // Update all teams
    for (const team of teamStore.teams.value) {
      try {
        // Get existing data or create new data object
        const data = team.data || {}

        // Update userInfo in data
        data.userInfo = userInfo

        // Update team
        await teamStore.updateTeam(team.id, { data })
      } catch (error) {
        console.error(`Failed to update team ${team.id}:`, error)
      }
    }

    // Update all agents
    for (const agent of agentStore.agents.value) {
      try {
        // Get existing data or create new data object
        const data = agent.data || {}

        // Update userInfo in data
        data.userInfo = userInfo

        // Update agent
        await agentStore.updateAgent(agent.id, { data })
      } catch (error) {
        console.error(`Failed to update agent ${agent.id}:`, error)
      }
    }

    // Update all zents
    for (const zent of zentStore.zents.value) {
      try {
        // Get existing data or create new data object
        const data = zent.data || {}

        // Update userInfo in data
        data.userInfo = userInfo

        // Update zent
        await zentStore.updateZent(zent.id, { data })
      } catch (error) {
        console.error(`Failed to update zent ${zent.id}:`, error)
      }
    }

    console.log('All entities updated with user info')
  } catch (error) {
    console.error('Failed to update entities with user info:', error)
  }
}

// Track original values to detect changes
const originalValues = reactive({
  username: '',
  bio: '',
  imageUrl: '',
  url: '',
  urlTwitter: '',
  urlLinkedin: '',
  urlYoutube: '',
  urlInstagram: ''
})

// Track which fields have been modified
const modifiedFields = reactive({
  username: false,
  bio: false,
  imageUrl: false,
  url: false,
  urlTwitter: false,
  urlLinkedin: false,
  urlYoutube: false,
  urlInstagram: false
})

// Load user data from localStorage
onMounted(() => {
  loadUserData()
})

// Watch for changes in form fields
watch(username, (newValue) => {
  modifiedFields.username = newValue !== originalValues.username
})

watch(bio, (newValue) => {
  modifiedFields.bio = newValue !== originalValues.bio
})

watch(imageUrl, (newValue) => {
  modifiedFields.imageUrl = newValue !== originalValues.imageUrl
})

watch(url, (newValue) => {
  modifiedFields.url = newValue !== originalValues.url
})

watch(urlTwitter, (newValue) => {
  modifiedFields.urlTwitter = newValue !== originalValues.urlTwitter
})

watch(urlLinkedin, (newValue) => {
  modifiedFields.urlLinkedin = newValue !== originalValues.urlLinkedin
})

watch(urlYoutube, (newValue) => {
  modifiedFields.urlYoutube = newValue !== originalValues.urlYoutube
})

watch(urlInstagram, (newValue) => {
  modifiedFields.urlInstagram = newValue !== originalValues.urlInstagram
})

const loadUserData = () => {
  try {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')

    // Set current values
    username.value = userData.username || ''
    bio.value = userData.bio || ''
    imageUrl.value = userData.imageUrl || ''
    url.value = userData.url || ''
    urlTwitter.value = userData.urlTwitter || ''
    urlLinkedin.value = userData.urlLinkedin || ''
    urlYoutube.value = userData.urlYoutube || ''
    urlInstagram.value = userData.urlInstagram || ''

    // Store original values for comparison
    originalValues.username = username.value
    originalValues.bio = bio.value
    originalValues.imageUrl = imageUrl.value
    originalValues.url = url.value
    originalValues.urlTwitter = urlTwitter.value
    originalValues.urlLinkedin = urlLinkedin.value
    originalValues.urlYoutube = urlYoutube.value
    originalValues.urlInstagram = urlInstagram.value

    // Reset modified flags
    Object.keys(modifiedFields).forEach(key => {
      modifiedFields[key] = false
    })
  } catch (error) {
    console.error('Failed to load user data:', error)
    toast({
      title: t('settings.profile.loadError', 'Error loading profile'),
      description: t('settings.profile.loadErrorDesc', 'Could not load your profile data'),
      variant: 'destructive'
    })
  }
}

const saveProfile = async () => {
  try {
    isSaving.value = true

    // Get current user data
    const userData = JSON.parse(localStorage.getItem('user') || '{}')

    // Check if any fields have been modified
    const hasModifications = Object.values(modifiedFields).some(modified => modified)

    if (!hasModifications) {
      toast({
        title: t('settings.profile.noChanges', 'No Changes'),
        description: t('settings.profile.noChangesDesc', 'No changes were made to your profile'),
        variant: 'default'
      })
      isSaving.value = false
      return
    }

    // Prepare updated user data with only modified fields
    const updatedUserData: Record<string, any> = {}

    if (modifiedFields.username) updatedUserData.username = username.value
    if (modifiedFields.bio) updatedUserData.bio = bio.value
    if (modifiedFields.imageUrl) updatedUserData.imageUrl = imageUrl.value
    if (modifiedFields.url) updatedUserData.url = url.value
    if (modifiedFields.urlTwitter) updatedUserData.urlTwitter = urlTwitter.value
    if (modifiedFields.urlLinkedin) updatedUserData.urlLinkedin = urlLinkedin.value
    if (modifiedFields.urlYoutube) updatedUserData.urlYoutube = urlYoutube.value
    if (modifiedFields.urlInstagram) updatedUserData.urlInstagram = urlInstagram.value

    // Send API request to update user profile with only modified fields
    await apiRequest('/user/', 'PUT', updatedUserData)

    // Update localStorage with new user data
    const newUserData = { ...userData, ...updatedUserData }
    localStorage.setItem('user', JSON.stringify(newUserData))

    // Update original values to match current values
    Object.keys(modifiedFields).forEach(key => {
      originalValues[key] = newUserData[key] || ''
      modifiedFields[key] = false
    })

    // Update all organizations, teams, agents, and zents with the user info
    await updateAllEntitiesWithUserInfo(newUserData)

    // Show success message
    toast({
      title: t('settings.profile.saveSuccess', 'Profile Updated'),
      description: t('settings.profile.saveSuccessDesc', 'Your profile has been updated successfully'),
      variant: 'default'
    })
  } catch (error: any) {
    console.error('Failed to save profile:', error)

    // Extract error message from API response if available
    const errorMessage = error.cause?.data?.message_en ||
                         error.message ||
                         t('settings.profile.saveErrorDesc', 'Could not save your profile data')

    toast({
      title: t('settings.profile.saveError', 'Error Saving Profile'),
      description: errorMessage,
      variant: 'destructive'
    })
  } finally {
    isSaving.value = false
  }
}
</script>
