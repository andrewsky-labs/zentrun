<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div class="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
      <div class="flex justify-end mb-2">
          <LanguageSelector />
      </div>
      <div class="text-center">
        <h1 class="text-2xl font-bold text-foreground">{{ t('auth.login') }}</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ t('auth.loginDescription') }}
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
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

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label for="password">{{ t('auth.password') }}</Label>
            <router-link
              to="/auth/forgot-password"
              class="text-xs text-primary hover:underline"
            >
              {{ t('auth.forgotPassword') }}
            </router-link>
          </div>
          <Input
            id="password"
            v-model="password"
            type="password"
            :placeholder="t('auth.passwordPlaceholder')"
            required
          />
        </div>

        <div class="flex items-center space-x-2">
          <Checkbox id="remember" v-model:checked="rememberMe" />
          <Label for="remember" class="text-sm">{{ t('auth.rememberMe') }}</Label>
        </div>

        <Button type="submit" class="w-full" :disabled="isLoading">
          {{ isLoading ? t('common.loading') : t('auth.loginButton') }}
        </Button>
      </form>

      <div class="text-center text-sm">
        <span>{{ t('auth.noAccount') }}</span>
        <router-link to="/auth/signup" class="text-primary hover:underline">
          {{ t('auth.signupLink') }}
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
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { apiRequest, syncZentrun } from '@/api'
import { useI18n } from 'vue-i18n'
import {usePresenter} from "@/composables/usePresenter";
import LanguageSelector from '@/components/LanguageSelector.vue';

const router = useRouter()
const { toast } = useToast()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const configP = usePresenter('configPresenter')

const tryLogin = async (loginInfo: { identifier: string; password: string; socialType?: string }) => {
  isLoading.value = true;

  try {
    const res = await apiRequest('/login-zentrun/', 'POST', loginInfo);

    // Store JWT token and user data
    localStorage.setItem('jwt', res.jwt);
    localStorage.setItem('user', JSON.stringify(res.user));

    await configP.setSetting('authToken', res.jwt);

    if (res.user.appTokenCode) {
      localStorage.setItem('apptoken', JSON.stringify(res.user.appTokenCode));
    }

    // Store user ID if remember me is checked
    if (rememberMe.value) {
      localStorage.setItem('userId', res.user.email);
    } else {
      localStorage.removeItem('userId');
    }

    // // Show success toast
    // toast({
    //   title: t('auth.loginSuccessful'),
    //   description: t('auth.loginSuccessfulDescription'),
    // });
    // Redirect based on account type
    // if (res.user.is_business_account) {
    //   router.push('/home');
    // } else {
    //   router.push('/');
    // }
    // router.push({ name: 'chat' });
    //
    // // Sync data with the server
    // await syncZentrun(true, false);


    // Reload to apply new authentication state
    window.location.reload();

    return res;
  } catch (error: any) {
    handleLoginError(error);
    throw error;
  } finally {
    isLoading.value = false;
  }
};

const handleLoginError = (error: any) => {
  toast({
    title: t('auth.loginFailed'),
    description: error,
    variant: 'destructive'
  })
};

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast({
      title: t('auth.validationError'),
      description: t('auth.pleaseEnterEmailAndPassword'),
      variant: 'destructive'
    });
    return;
  }

  const loginInfo = {
    identifier: email.value,
    password: password.value
  };

  try {
    await tryLogin(loginInfo);
  } catch (error) {
    // Error is already handled in tryLogin
    console.error('Login failed:', error);
  }
}
</script>
