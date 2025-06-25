<template>
  <ScrollArea class="w-full h-full p-2">
    <div class="w-full h-full flex flex-col gap-4">
      <h2 class="text-lg font-semibold mb-2">{{ t('settings.payment.title', 'Payment Settings') }}</h2>


      <!-- Card Registration/Change -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('settings.payment.paymentMethod', 'Payment Method') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-4">
<!--            <div v-if="cardInfo" class="flex items-center justify-between">-->
<!--              <div class="flex items-center gap-2">-->
<!--                <Icon icon="lucide:credit-card" class="w-5 h-5" />-->
<!--                <span>**** **** **** {{ cardInfo.last4 }}</span>-->
<!--                <span class="text-sm text-muted-foreground">{{ cardInfo.expMonth }}/{{ cardInfo.expYear }}</span>-->
<!--              </div>-->
<!--            </div>-->
            <Button @click="handleCardAction">
              <Icon :icon="cardActionIcon" class="w-4 h-4 mr-2" />
              {{ cardActionText }}
            </Button>
          </div>
        </CardContent>
      </Card>
      <!-- Current Month Fee -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('settings.payment.currentMonthlyFee', 'Current Monthly Fee') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">$0</div>
        </CardContent>
      </Card>

      <!-- Total Sales -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('settings.payment.totalSales', 'Total Sales') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">$0</div>
        </CardContent>
      </Card>

      <!-- Products Table -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('settings.payment.products', 'Products') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="relative w-full overflow-auto">
            <table class="w-full caption-bottom text-sm">
              <thead>
                <tr class="border-b">
                  <th class="h-12 px-4 text-left align-middle font-medium">
                    {{ t('settings.payment.productName', 'Product Name') }}
                  </th>
                  <th class="h-12 px-4 text-left align-middle font-medium">
                    {{ t('settings.payment.price', 'Price') }}
                  </th>
                  <th class="h-12 px-4 text-left align-middle font-medium">
                    {{ t('settings.payment.commission', 'Commission') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="products.length === 0" class="border-b">
                  <td colspan="3" class="p-4 text-center text-muted-foreground">
                    {{ t('settings.payment.noProducts', 'No products available') }}
                  </td>
                </tr>
                <tr v-for="product in products" :key="product.id" class="border-b">
                  <td class="p-4">{{ product.name }}</td>
                  <td class="p-4">${{ product.price }}</td>
                  <td class="p-4">${{ product.commission }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { apiRequest } from '@/api'

const { t } = useI18n()
const { toast } = useToast()

// User data
const user = JSON.parse(localStorage.getItem('user') || '{}')
const cardInfo = ref<any>(null)
const products = ref<any[]>([])

// Computed properties
const cardActionText = computed(() => {
  console.log("user");
  console.log(user);
  return user.is_business_account
    ? t('settings.payment.changeCard', 'Change Card')
    : t('settings.payment.registerCard', 'Register Card')
})

const cardActionIcon = computed(() => {
  return user.is_business_account ? 'lucide:edit' : 'lucide:plus'
})

// Load user data
const loadUserData = () => {
  try {
    console.log('Loaded user data:', user)

    // Mock card info for demonstration
    if (user.is_business_account) {
      cardInfo.value = {
        last4: '4242',
        expMonth: '12',
        expYear: '2025'
      }
    } else {
      cardInfo.value = null
    }

    // Mock products for demonstration
    products.value = [
      // { id: 1, name: 'Basic Plan', price: '9.99', commission: '0.99' },
      // { id: 2, name: 'Premium Plan', price: '19.99', commission: '1.99' },
      // { id: 3, name: 'Enterprise Plan', price: '49.99', commission: '4.99' }
    ]
  } catch (error) {
    console.error('Failed to load user data:', error)
    toast({
      title: t('settings.payment.loadError', 'Error loading payment data'),
      description: t('settings.payment.loadErrorDesc', 'Could not load your payment data'),
      variant: 'destructive'
    })
  }
}

// Handle card registration or change
const handleCardAction = async () => {
  try {
    // This would typically open a payment form or redirect to a payment provider
    // toast({
    //   title: user.is_business_account
    //     ? t('settings.payment.changeCardTitle', 'Change Card')
    //     : t('settings.payment.registerCardTitle', 'Register Card'),
    //   description: t('settings.payment.cardActionDesc', 'This feature is not implemented in this demo'),
    //   variant: 'default'
    // })
    if (user.is_business_account) {
      window.open('https://polar.sh/zebtryb/portal', '_blank')
    } else {
      window.open('https://buy.polar.sh/polar_cl_SXaFgDP16LnBv2w08UCcxrp1bnIhcBChnjHxv1CHLXg' + "?customer_email=" + user.email, '_blank')
    }

    // In a real implementation, you would:
    // 1. Open a payment form or redirect to a payment provider
    // 2. Process the payment information
    // 3. Update the user's payment information in the database
    // 4. Update the local user data

  } catch (error) {
    console.error('Failed to process card action:', error)
    toast({
      title: t('settings.payment.cardActionError', 'Error processing card'),
      description: t('settings.payment.cardActionErrorDesc', 'Could not process your card information'),
      variant: 'destructive'
    })
  }
}

// Load data on component mount
onMounted(() => {
  loadUserData()
})
</script>
