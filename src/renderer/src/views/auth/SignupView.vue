<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div class="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
      <div class="flex justify-end mb-2">
          <LanguageSelector />
      </div>
      <div class="text-center">
        <h1 class="text-2xl font-bold text-foreground">{{ t('auth.signup') }}</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ t('auth.signupDescription') }}
        </p>
      </div>

      <form @submit.prevent="handleSignup" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="firstName">{{ t('auth.firstName') }}</Label>
            <Input
              id="firstName"
              v-model="firstName"
              type="text"
              :placeholder="t('auth.firstNamePlaceholder')"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="lastName">{{ t('auth.lastName') }}</Label>
            <Input
              id="lastName"
              v-model="lastName"
              type="text"
              :placeholder="t('auth.lastNamePlaceholder')"
              required
            />
          </div>
        </div>

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
          <Label for="password">{{ t('auth.password') }}</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            :placeholder="t('auth.passwordPlaceholder')"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="confirmPassword">{{ t('auth.confirmPassword') }}</Label>
          <Input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            :placeholder="t('auth.confirmPasswordPlaceholder')"
            required
          />
        </div>

        <div class="flex items-center space-x-2">
          <Checkbox id="terms" v-model:checked="agreeToTerms" />
          <Label for="terms" class="text-sm">
            {{ t('auth.agreeToTerms') }}
            <a href="https://zentrun.com/terms" class="text-primary hover:underline">{{ t('auth.termsLink') }}</a>
          </Label>
        </div>

        <Button type="submit" class="w-full" :disabled="!agreeToTerms || isLoading">
          {{ isLoading ? t('common.loading') : t('auth.signupButton') }}
        </Button>
      </form>

      <div class="text-center text-sm">
        <span>{{ t('auth.alreadyHaveAccount') }}</span>
        <router-link to="/auth/login" class="text-primary hover:underline">
          {{ t('auth.loginLink') }}
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
import { apiRequest } from '@/api'
import { useI18n } from 'vue-i18n'
import jwt_decode from 'jwt-decode'
import LanguageSelector from '@/components/LanguageSelector.vue'

const router = useRouter()
const { toast } = useToast()
const { t } = useI18n()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeToTerms = ref(false)
const isLoading = ref(false)

// Password validation function
const validatePassword = (password: string): boolean => {
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&+=]/.test(password)
  const isValidLength = password.length >= 8

  if (!hasLetter || !hasNumber || !hasSpecialChar) {
    toast({
      title: t('auth.validationError'),
      description: t('auth.passwordRequirements'),
      variant: 'destructive'
    })
    return false
  }

  if (!isValidLength) {
    toast({
      title: t('auth.validationError'),
      description: t('auth.passwordLength'),
      variant: 'destructive'
    })
    return false
  }

  return true
}

const tryRegister = async (registerInfo: any, isRegisterByEmail = true) => {
  isLoading.value = true

  try {
    // Use the same endpoint as in the reference implementation
    await apiRequest('/register-zentrun/', 'POST', registerInfo)

    if (isRegisterByEmail) {
      // Show success toast for email registration
      toast({
        title: t('auth.verificationSent'),
        description: t('auth.verificationSentDescription')
      })

      // Redirect to login page
      router.push('/auth/login')
    } else {
      // For social login, attempt to log in immediately
      const loginInfo = {
        id: registerInfo.email,
        password: registerInfo.password,
        socialType: registerInfo.socialType
      }

      await tryLogin(loginInfo)
    }
  } catch (error: any) {
    handleRegistrationError(error)
  } finally {
    isLoading.value = false
  }
}

// Function to handle Google login success
const onSuccessGoogle = async (response: any) => {
  const info = jwt_decode(response.credential)
  const registerInfo = {
    email: info.email,
    password: info.sub + "1a!",
    invitedBy: localStorage.getItem("_fprom_ref") || '',
    socialType: "google",
    isAgreedMarketing: false,
    provider: "skyoffer",
    birth: "2001-01-01T01:01:01"
  }

  await tryRegister(registerInfo, false)
}

const tryLogin = async (loginInfo: { id: string; password: string; socialType?: string }) => {
  isLoading.value = true

  try {
    // Use the same endpoint as in the reference implementation
    const res = await apiRequest('/login-zentrun/', 'POST', loginInfo)

    // Store JWT token and user data
    localStorage.setItem('jwt', res.jwt)
    localStorage.setItem('user', JSON.stringify(res.user))

    if (res.user.appTokenCode) {
      localStorage.setItem('apptoken', JSON.stringify(res.user.appTokenCode))
    }

    // Show success toast
    toast({
      title: t('auth.loginSuccessful'),
      description: t('auth.loginSuccessfulDescription')
    })

    window.location.reload()
    // // Redirect based on account type
    // if (res.user.is_business_account) {
    //   router.push('/home')
    // } else {
    //   router.push('/')
    // }
    //
    // // Reload to apply new authentication state
    // window.location.reload()
  } catch (error: any) {
    handleLoginError(error)
  } finally {
    isLoading.value = false
  }
}

const handleRegistrationError = (error: any) => {
  toast({
    title: t('auth.signupFailed'),
    description: error,
    variant: 'destructive'
  })
}

const handleLoginError = (error: any) => {
  toast({
    title: t('auth.loginFailed'),
    description: error,
    variant: 'destructive'
  })
}

const handleSignup = async () => {
  // Validate passwords match
  if (password.value !== confirmPassword.value) {
    toast({
      title: t('auth.validationError'),
      description: t('auth.passwordsDoNotMatch'),
      variant: 'destructive'
    })
    return
  }

  // Validate password complexity
  if (!validatePassword(password.value)) {
    return
  }

  // Create registration info object
  const registerInfo = {
    email: email.value,
    password: password.value,
    invitedBy: localStorage.getItem('_fprom_ref') || '',
    socialType: 'email',
    isAgreedMarketing: false,
    provider: 'skyoffer',
    birth: "2001-01-01T01:01:01"
  }

  // Register the user
  await tryRegister(registerInfo, true)
}
</script>
