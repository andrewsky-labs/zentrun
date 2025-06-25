<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('team.createTitle', '새 팀 추가하기') }}</DialogTitle>
        <DialogDescription>{{ t('team.createDesc', '팀을 추가하여 멤버들과 협업하세요.') }}</DialogDescription>
      </DialogHeader>
      <div class="mb-2">
        <Label class="block mb-1">{{ t('team.nameLabel', '팀 이름') }} <span class="text-red-500">*</span></Label>
        <Input v-model="name" :placeholder="t('team.namePlaceholder', '팀 이름을 입력하세요')" class="w-full" />
      </div>
      <div class="mb-2">
        <Label class="block mb-1">{{ t('team.descLabel', '팀 설명') }} <span class="text-black">{{ t('Optional') }}</span></Label>
        <Textarea v-model="description" :placeholder="t('team.descPlaceholder', '팀에 대한 설명을 입력하세요')" rows="3" class="w-full" />
      </div>
      <div class="mb-2">
        <Label class="block mb-1">{{ t('team.bioLabel', 'Bio') }} <span class="text-black">{{ t('Optional') }}</span></Label>
        <Textarea v-model="bio" :placeholder="t('team.bioPlaceholder', 'Enter team bio')" rows="3" class="w-full" />
      </div>
      <div class="mb-2">
        <Label class="block mb-1">{{ t('dialog.organization.add.permission') }}</Label>
        <select v-model="permission" class="w-full border rounded p-2 mt-1">
          <option value="public">{{ t('dialog.organization.add.permissionPublic') }}</option>
          <option value="private">{{ t('dialog.organization.add.permissionPrivate') }}</option>
        </select>
        <p class="text-xs text-muted-foreground mt-1">
          {{ permission === 'public' ? t('dialog.organization.add.permissionPublicDesc') : t('dialog.organization.add.permissionPrivateDesc') }}
        </p>
      </div>
      <div class="flex justify-between items-center mt-4">
        <Button variant="outline" @click="handleCancel">{{ t('common.cancel') }}</Button>
        <Button variant="default" @click="handleCreateTeam">{{ t('team.createButton', '팀 추가하기') }}</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/use-toast'
import { nanoid } from 'nanoid'
import { teamStore } from '@/stores/team'
import { apiRequest } from '@/api'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  organization: {
    type: Object,
    default: null
  },
  parentTeam: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open', 'cancel'])
const { toast } = useToast()
const { t } = useI18n()

const name = ref('')
const description = ref('')
const permission = ref('private')
const bio = ref('')
const cover_image_url = ref('')

const handleCancel = () => {
  emit('cancel')
}

const handleCreateTeam = async () => {
  if (!name.value || !name.value.trim()) {
    toast({ title: t('please-write-the-team-name'), variant: 'destructive' });
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const slug = name.value.replaceAll(' ', '-') + "-" + nanoid();
    const team = await teamStore.createTeam({
      name: name.value,
      slug: slug,
      description: description.value,
      organization: props.organization?.slug,
      parentTeam: props.parentTeam?.slug,
      is_public: permission.value === 'public' ? 1 : 0,
      user: user?.id,
      by: user?.username,
      bio: bio.value,
      cover_image_url: cover_image_url.value,
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
    });
      // Create a deep copy of the data before making the API request
      const teamApiData = structuredClone({
        name: name.value,
        slug: slug,
        description: description.value,
        organization: props.organization?.slug,
        parentTeam: props.parentTeam?.slug,
        is_public: permission.value === 'public',
        user: user?.id,
        by: user?.username,
        bio: bio.value,
        cover_image_url: cover_image_url.value,
      });
      toast({ title: t('team-added-successfully') });
      emit('update:open', false);

    try {
      await apiRequest('/zentrun-team/', 'POST', teamApiData);
    } catch (error) {
      toast({ title: t('error-adding-team'), description: error.message || t('api-error'), variant: 'destructive' });
    }
  } catch (error) {
    console.error('Failed to create team:', error);
    toast({ title: t('failed-to-create-team'), description: error.message, variant: 'destructive' });
  }
    emit('update:open', false);
}
</script>
