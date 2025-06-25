// This is a placeholder for the zentrun-app-core routes
// It provides empty implementations of the required exports

import type { RouteRecordRaw } from 'vue-router'

// Define LLM-specific routes
export const llmRoutes: RouteRecordRaw[] = [
  {
    path: '/llm-usage',
    name: 'llm-usage',
    component: () => import("@shared/zentrun-app-core-community/views/ZentrunLLMUsage.vue"),
    meta: {
      titleKey: 'routes.llmUsage',
      icon: 'lucide:message-square'
    }
  },
  {
    path: '/llm-pricing-plan',
    name: 'llm-pricing-plan',
    component: () => import("@shared/zentrun-app-core-community/views/ZentrunLLMPricingPlan.vue"),
    meta: {
      titleKey: 'routes.llmPricingPlan',
      icon: 'lucide:message-square'
    }
  },
  {
    path: '/seat-pricing-plan',
    name: 'seat-pricing-plan',
    component: () => import("@shared/zentrun-app-core-community/views/ZentrunSeatPricingPlan.vue"),
    meta: {
      titleKey: 'routes.seatPricingPlan',
      icon: 'lucide:users'
    }
  }
]

// Add any other exports that might be needed
