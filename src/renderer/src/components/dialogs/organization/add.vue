<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ t('dialog.organization.add.title') }}</DialogTitle>
        <DialogDescription>{{ t('dialog.organization.add.createDesc') }}</DialogDescription>
      </DialogHeader>
      <!-- Step 1: Basic Organization Info -->
      <form v-if="currentStep === 1" class="grid grid-cols-2 gap-6 p-2 flex-1 overflow-y-auto ">
        <div class="flex flex-col gap-4 pr-3">
          <div>
            <Label class="block mb-1">{{ t('dialog.organization.add.nameLabel') }} <span class="text-red-500">*</span></Label>
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg font-bold">T</div>
              <Input v-model="name" :placeholder="t('dialog.organization.add.namePlaceholder')" class="flex-1" />
            </div>
          </div>
          <div>
            <Label class="block mb-1">{{ t('dialog.organization.add.descLabel') }} <span class="">{{ t('Optional') }}</span></Label>
            <Textarea v-model="description" :placeholder="t('dialog.organization.add.descPlaceholder')" rows="3" />
          </div>
          <div>
            <Label class="block mb-1">{{ t('dialog.organization.add.bioLabel', 'Bio') }} <span class="">{{ t('Optional') }}</span></Label>
            <Textarea v-model="bio" :placeholder="t('dialog.organization.add.bioPlaceholder', 'Enter organization bio')" rows="3" />
          </div>
          <!-- Permission is set to private by default and hidden from UI -->
          <div>
            <ThumbnailSelectorZpilot :isFullSize="true" v-model="thumbnail" :label="t('select-zpliot-thumbnail')" :required="true" />
          </div>
          <div class="flex justify-between items-center mt-4">
            <span class="text-xs text-muted-foreground">
              <Icon icon="lucide:info" class="inline h-4 w-4 mr-1 align-text-bottom" />
              {{ t('dialog.organization.add.about') }}
            </span>
            <Button variant="default" @click="handleButtonClick" v-bind:disabled="isLoading.buttonClick.value">

              <div v-if="isLoading.buttonClick.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white mr-2"></div>
              {{ mode === 'agency' || mode === 'service' ? t('common.nextStep') : t('dialog.organization.add.createButton') }}
            </Button>
          </div>
        </div>

        <div class="flex flex-col gap-4 pl-3 border-l" v-if="!isEnterpriseMode">
          <Label class="block mb-1">{{ t('dialog.organization.add.mode') }}</Label>
          <RadioGroup v-model="mode" class="space-y-4">
            <div class="flex items-start space-x-2 p-3 border rounded">
              <RadioGroupItem value="team" id="team" />
              <div>
                <Label for="team" class="font-medium">{{ t('dialog.organization.add.modeTeam') }}</Label>
                <p class="text-sm text-muted-foreground">{{ t('dialog.organization.add.modeTeamDesc') }}</p>
              </div>
            </div>

            <div v-if="hasZentrunCore" class="flex items-start space-x-2 p-3 border rounded">
              <RadioGroupItem value="service" id="service" />
              <div>
                <Label for="service" class="font-medium">{{ t('dialog.organization.add.modeService') }}</Label>
                <p class="text-sm text-muted-foreground">{{ t('dialog.organization.add.modeServiceDesc') }}</p>
                <p v-if="mode === 'service'" class="text-xs text-amber-500 mt-1">
                  {{ t('dialog.organization.add.modeWarning') }}
                </p>
              </div>
            </div>

            <div v-if="hasZentrunCore" class="flex items-start space-x-2 p-3 border rounded">
              <RadioGroupItem value="agency" id="agency" />
              <div>
                <Label for="agency" class="font-medium">{{ t('dialog.organization.add.modeAgency') }}</Label>
                <p class="text-sm text-muted-foreground">{{ t('dialog.organization.add.modeAgencyDesc') }}</p>
                <p v-if="mode === 'agency'" class="text-xs text-amber-500 mt-1">
                  {{ t('dialog.organization.add.modeWarning') }}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
      </form>

      <!-- Step 2: Agency/Service-specific Information -->
      <form v-if="currentStep === 2" class="flex flex-col gap-6 p-2 flex-1 overflow-y-auto ">
        <div class="flex flex-col gap-4">
          <h3 class="text-lg font-medium">{{ t('payout') }}</h3>

          <div>
            <Label class="block mb-1">{{ t('polar-sh-key') }}</Label>
            <Input v-model="agencyData.polarsh_key" :placeholder="t('enter-polar-sh-key')" class="flex-1" />
            <p class="text-xs text-muted-foreground mt-1">{{ t('polar-sh-payment-gateway') }}</p>
          </div>

          <div>
            <Label class="block mb-1">{{ t('polar-sh-organization-id') }}</Label>
            <Input v-model="agencyData.polarsh_organization_id" :placeholder="t('enter-polar-sh-key')" class="flex-1" />
            <p class="text-xs text-muted-foreground mt-1">{{ t('polar-sh-organization-id-polar-sh') }}</p>
          </div>

          <div>
            <Label class="block mb-1">{{ t('polar-sh-webhook-secret') }}</Label>
            <Input v-model="agencyData.polarsh_webhook_secret" :placeholder="t('enter-polar-sh-webhook-secret')" class="flex-1" />
            <p class="text-xs text-muted-foreground mt-1">{{ t('polar-sh-webhook-secret-settings-greater-than-webhooks-add-endpoint-url-https-api-zentrun-com-polarsh-webhook-secret') }}</p>
          </div>

          <div>
            <Label class="block mb-1">{{ t('pricing-plan-title') }}</Label>
            <Input v-model="agencyData.service_cost" placeholder="0" type="number" class="flex-1" />
            <p class="text-xs text-muted-foreground mt-1">{{ t('pricing-plan-description') }}</p>
          </div>

          <!-- Agency-specific fields -->
          <template v-if="mode === 'agency'">
            <div class="flex items-center gap-2 mt-2">
              <Checkbox
                :checked="agencyData.vapi_enabled"
                @update:checked="agencyData.vapi_enabled = $event"
                id="vapi_enabled"
              />
              <Label for="vapi_enabled" class="font-medium">{{ t('vapi-service') }}</Label>
              <p class="text-xs text-muted-foreground ml-2">{{ t('vapi-service-description') }}</p>
            </div>

            <div class="flex items-center gap-2 mt-2">
              <Checkbox
                :checked="agencyData.n8n_enabled"
                @update:checked="agencyData.n8n_enabled = $event"
                id="n8n_enabled"
              />
              <Label for="n8n_enabled" class="font-medium">{{ t('n8n-cloud-service') }}</Label>
              <p class="text-xs text-muted-foreground ml-2">{{ t('n8n-cloud-service-description') }}</p>
            </div>

            <div class="flex items-center gap-2 mt-2">
              <Checkbox
                :checked="agencyData.make_enabled"
                @update:checked="agencyData.make_enabled = $event"
                id="make_enabled"
              />
              <Label for="make_enabled" class="font-medium">{{ t('make-com-service') }}</Label>
              <p class="text-xs text-muted-foreground ml-2">{{ t('make-com-service-description') }}</p>
            </div>

            <div class="flex items-center gap-2 mt-2">
              <Checkbox
                :checked="agencyData.openai_enabled"
                @update:checked="agencyData.openai_enabled = $event"
                id="openai_enabled"
              />
              <Label for="openai_enabled" class="font-medium">{{ t('openai-service') }}</Label>
              <p class="text-xs text-muted-foreground ml-2">{{ t('openai-service-description') }}</p>
            </div>

            <div>
              <Label class="block mb-1">{{ t('verder-margin-label') }}</Label>
              <Input v-model="agencyData.vendor_margin" :placeholder="t('enter-vendor-margin-percentage')" type="number" min="0" max="100" class="flex-1" />
              <p class="text-xs text-muted-foreground mt-1">{{ t('vender-margin-rate-description') }}</p>
            </div>
          </template>

          <div class="flex justify-end items-center mt-4">
            <Button variant="outline" class="mr-2" @click="currentStep = 1">{{ t('common.cancel') }}</Button>
            <Button variant="default" @click="createOrganization" v-bind:disabled="isLoading.buttonClick.value">
              <div v-if="isLoading.buttonClick.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white mr-2"></div>
              {{ t('dialog.organization.add.createButton') }}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {computed, ref, onMounted, watch} from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/vue'
import ThumbnailSelectorZpilot from '@/components/ThumbnailSelectorZpilot.vue'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast/use-toast'
import { nanoid } from 'nanoid'
import { organizationStore } from '@/stores/organization'
import { apiRequest } from '@/api'
// Import the utility function to check if zentrun-app-core is available
import { hasZentrunCore as checkZentrunCore } from '@shared/zentrunCore'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// Loading state
const isLoading = {
  buttonClick: ref(false),
};

defineProps({
  open: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:open'])

const { toast } = useToast()

// Basic organization info
const name = ref('')
const description = ref('')
const bio = ref('')
const permission = ref('private')
const mode = ref('team') // Default to Team Mode
const thumbnail = ref('')
const cover_image_url = ref('')

// Step management
const currentStep = ref(1)

// Agency-specific data
const agencyData = ref({
  polarsh_key: '',
  polarsh_organization_id: '',
  polarsh_webhook_secret: '',
  service_cost: 0,
  vapi_enabled: false,
  n8n_enabled: false,
  make_enabled: false,
  openai_enabled: false,
  vendor_margin: 0
})

// Check if enterprise mode is enabled
const isEnterpriseMode = computed(() => {
  // Check for environment variable ZENTRUN_ENTERPRISE_MODE
  // This will be true if the environment variable is set to 'true'
  return import.meta.env.VITE_ZENTRUN_ENTERPRISE_MODE === 'true'
})

// Check if zentrun-app-core is available
const hasZentrunCore = ref(false)

// Function to check if zentrun-app-core is available
const checkZentrunCoreAvailability = () => {
  // Use the utility function to check if zentrun-app-core is available
  hasZentrunCore.value = checkZentrunCore()
}

// Check if zentrun-app-core is available on component mount
onMounted(() => {
  checkZentrunCoreAvailability()

  // If we're in the community version, reset mode to 'team'
  if (!hasZentrunCore.value && (mode.value === 'service' || mode.value === 'agency')) {
    mode.value = 'team'
  }
})

// Watch for changes in hasZentrunCore and reset mode to 'team' if it's false and mode is 'service' or 'agency'
watch(hasZentrunCore, (newValue) => {
  if (!newValue && (mode.value === 'service' || mode.value === 'agency')) {
    mode.value = 'team'
    toast({
      title: t('feature-unavailable'),
      description: t('service-agency-mode-unavailable'),
      variant: 'destructive'
    })
  }
})

// Handle button click based on mode and current step
const handleButtonClick = async () => {

  try {
    if ((mode.value === 'agency' || mode.value === 'service') && currentStep.value === 1) {
      // Check if user has a business account
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user.is_business_account) {
        toast({
          title: t('payment-information-required'),
          description: t('please-register-your-card-first-in-settings-greater-than-payment'),
          variant: 'destructive'
        })
        return
      }
      currentStep.value = 2
    } else {
      await createOrganization()
    }
  } catch (error) {
    console.error('Error in handleButtonClick:', error);
  } finally {
    isLoading.buttonClick.value = false;
  }
}

// Create organization with all data
const createOrganization = async () => {
  // Check required fields
  if (!name.value || name.value.length === 0) {
    toast({ title: t('please-write-the-name'), variant: 'destructive' });
    return;
  }

    // 필수 필드 체크
  const missingFields = [];

  console.log("thumbnail");
  console.log(thumbnail);
  if (!name.value) missingFields.push(t("name"));
  if (!thumbnail.value) missingFields.push(t('thumbnail'));

  // Check for required fields in step 2 for service or agency mode
  if ((mode.value === 'service' || mode.value === 'agency') && currentStep.value === 2) {
    if (!agencyData.value.polarsh_key) missingFields.push(t('polar-sh-key-0'));
    if (!agencyData.value.polarsh_organization_id) missingFields.push(t('polar-sh-organization-id'));
    if (!agencyData.value.polarsh_webhook_secret) missingFields.push(t('polar-sh-webhook-secret'));

    // For agency mode, check additional fields if needed
    if (mode.value === 'agency') {
      // Check vendor_margin if any service is enabled
      if ((agencyData.value.vapi_enabled ||
           agencyData.value.n8n_enabled ||
           agencyData.value.make_enabled ||
           agencyData.value.openai_enabled) &&
          !agencyData.value.vendor_margin) {
        missingFields.push(t('vender-margin-fee'));
      }
    }
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
  isLoading.buttonClick.value = true;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const organizationData = {
    name: name.value,
    description: description.value,
    bio: bio.value,
    permission: permission.value,
    thumbnail: thumbnail.value,
    cover_image_url: null,
    mode: mode.value,
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

  // Add agency/service-specific data if in agency or service mode
  if (mode.value === 'agency' || mode.value === 'service') {
    // Create data object
    let dataObj = {};

    // Common fields for both agency and service modes
    dataObj = {
      polarsh_key: agencyData.value.polarsh_key,
      polarsh_organization_id: agencyData.value.polarsh_organization_id,
      polarsh_webhook_secret: agencyData.value.polarsh_webhook_secret,
      service_cost: agencyData.value.service_cost
    };

    // Add agency-specific fields only if in agency mode
    if (mode.value === 'agency') {
      dataObj = {
        ...dataObj,
        vendor_margin: agencyData.value.vendor_margin,
        vapi_enabled: agencyData.value.vapi_enabled,
        n8n_enabled: agencyData.value.n8n_enabled,
        make_enabled: agencyData.value.make_enabled,
        openai_enabled: agencyData.value.openai_enabled
      };
    }

    // Store all data in the data field with the appropriate setting key
    const settingKey = "payoutSetting";
    organizationData['data'] = {
      ...organizationData['data'],
      [settingKey]: dataObj
    };
  }

  const slug = organizationData.name.replaceAll(' ', '-') + "-" + nanoid();

  // Create organization in local store
  try {

    // Create organization in API
    const payload = {
      name: organizationData.name,
      description: organizationData.description,
      slug: slug,
      is_public: organizationData.permission === 'public',
      user: user?.id,
      by: user?.username,
      data: organizationData?.data,
      bio: organizationData.bio,
      permission: organizationData.permission,
      thumbnail: organizationData.thumbnail,
      cover_image_url: organizationData.cover_image_url,
      mode: organizationData.mode || 'team', // Include the mode field with 'team' as default
    };
    const payloadCopyNotTeam = structuredClone(JSON.parse(JSON.stringify(payload)));

    let orgId = await organizationStore.addOrganization({
      name: organizationData.name,
      description: organizationData.description,
      slug: slug,
      is_public: organizationData.permission === 'public' ? 1 : 0,
      user: user?.id,
      by: user?.username,
      data: organizationData?.data,
      bio: organizationData.bio,
      permission: organizationData.permission,
      thumbnail: organizationData.thumbnail,
      cover_image_url: organizationData.cover_image_url,
      mode: organizationData.mode || 'team', // Include the mode field with 'team' as default
    });
    // Create a deep copy of the data before making the API request
    const payloadCopyTeam = structuredClone(JSON.parse(JSON.stringify(payload)));

    toast({ title: t('organization-added-successfully') });
    emit('update:open', false);



    if (organizationData.mode !== 'team') {
      // Create a deep copy of the data before making the API request
      await apiRequest('/zentrun-organization/', 'POST', payloadCopyNotTeam);
    }
    if (organizationData.mode === 'team') {
      await apiRequest('/zentrun-organization/', 'POST', payloadCopyTeam);
    }

  } catch (error) {
    toast({
      title: t('error-adding-organization'),
      description: error.message || t('api-error'),
      variant: 'destructive'
    });
  }
    emit('update:open', false);
}
</script>
