<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div class="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
      <div class="flex justify-end mb-2">
        <LanguageSelector />
      </div>
      <div class="text-center">
        <h1 class="text-2xl font-bold text-foreground">{{ t('auth.forgotPassword') }}</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ t('auth.forgotPasswordDescription') }}
        </p>
      </div>

      <form @submit.prevent="handleResetRequest" class="space-y-4">
        <div class="space-y-2">
          <Label for="email">{{ t('auth.email') }}</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            :placeholder="t('auth.emailPlaceholder')"
            required
          />
        </div>


        <Button type="submit" class="w-full" :disabled="isLoading">
          {{ isLoading ? t('common.loading') : t('auth.resetPasswordButton') }}
        </Button>
      </form>

      <div class="text-center text-sm">
        <span>{{ t('auth.rememberedPassword') }}</span>
        <router-link to="/auth/login" class="text-primary hover:underline">
          {{ t('auth.backToLogin') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {apiRequest} from "@/api";
import { useI18n } from 'vue-i18n'
import LanguageSelector from '@/components/LanguageSelector.vue';
import { useSettingsStore } from '@/stores/settings';

const router = useRouter()
const { toast } = useToast()
const { t } = useI18n()
const settingsStore = useSettingsStore()
const isLoading = ref(false)

const email = ref('')

const handleResetRequest = async () => {
  // In a real implementation, this would send a request to the server
  // to generate a password reset link and send it to the user's email
  isLoading.value = true;


  // Get the current language from settings store
  const currentLang = settingsStore.language === 'system' ? navigator.language : settingsStore.language;
  await apiRequest('/forgot-password/', 'POST', { email: email.value, lang: currentLang });

  // Show success toast
  toast({
    title: t('auth.resetLinkSent'),
    description: t('auth.resetLinkSentDescription', { email: email.value }),
  })

  // Redirect to login page
  setTimeout(() => {
    router.push('/auth/login')
  }, 2000)
}
</script>
