import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Define base routes without LLM-specific routes
let settingRoutes = [
      {
        path: 'profile',
        name: 'settings-profile',
        component: () => import('@/components/settings/ProfileSettings.vue'),
        meta: {
          titleKey: 'routes.settings-profile',
          icon: 'lucide:user'
        }
      },
      {
        path: 'common',
        name: 'settings-common',
        component: () => import('@/components/settings/CommonSettings.vue'),
        meta: {
          titleKey: 'routes.settings-common',
          icon: 'lucide:bolt'
        }
      },
      {
        path: 'display',
        name: 'settings-display',
        component: () => import('@/components/settings/DisplaySettings.vue'),
        meta: {
          titleKey: 'routes.settings-display',
          icon: 'lucide:monitor'
        }
      },
      {
        path: 'provider/:providerId?',
        name: 'settings-provider',
        component: () => import('@/components/settings/ModelProviderSettings.vue'),
        meta: {
          titleKey: 'routes.settings-provider',
          icon: 'lucide:cloud-cog'
        }
      },
      {
        path: 'mcp',
        name: 'settings-mcp',
        component: () => import('@/components/settings/McpSettings.vue'),
        meta: {
          titleKey: 'routes.settings-mcp',
          icon: 'lucide:server'
        }
      },
      {
        path: 'knowledge-base',
        name: 'settings-knowledge-base',
        component: () => import('@/components/settings/KnowledgeBaseSettings.vue'),
        meta: {
          titleKey: 'routes.settings-knowledge-base',
          icon: 'lucide:book-marked'
        }
      },
      // {
      //   path: 'payment',
      //   name: 'settings-payment',
      //   component: () => import(`@/components/settings/PaymentSettings.vue`),
      //   meta: {
      //     titleKey: 'routes.settings-payment',
      //     icon: 'lucide:credit-card'
      //   }
      // },
      {
        path: 'database',
        name: 'settings-database',
        component: () => import('@/components/settings/DataSettings.vue'),
        meta: {
          titleKey: 'routes.settings-database',
          icon: 'lucide:database'
        }
      },
      {
        path: 'shortcut',
        name: 'settings-shortcut',
        component: () => import('@/components/settings/ShortcutSettings.vue'),
        meta: {
          titleKey: 'routes.settings-shortcut',
          icon: 'lucide:keyboard'
        }
      },
      {
        path: 'about',
        name: 'settings-about',
        component: () => import('@/components/settings/AboutUsSettings.vue'),
        meta: {
          titleKey: 'routes.settings-about',
          icon: 'lucide:info'
        }
      }
      // {
      //   path: 'sqlite-test',
      //   name: 'settings-sqlite-test',
      //   component: () => import('@/components/SQLiteTest.vue'),
      //   meta: {
      //     titleKey: 'SQLite Query Test',
      //     icon: 'lucide:database'
      //   }
      // },
    ]
const routes: RouteRecordRaw[] = [
  {
    path: '/auth/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      titleKey: 'routes.login',
      icon: 'lucide:log-in'
    }
  },
  {
    path: '/auth/signup',
    name: 'signup',
    component: () => import('@/views/auth/SignupView.vue'),
    meta: {
      titleKey: 'routes.signup',
      icon: 'lucide:user-plus'
    }
  },
  {
    path: '/auth/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: {
      titleKey: 'routes.forgotPassword',
      icon: 'lucide:key'
    }
  },
  {
    path: '/',
    name: 'chat',
    component: () => import('@/views/ChatTabView.vue'),
    meta: {
      titleKey: 'routes.chat',
      icon: 'lucide:message-square'
    }
  },
  {
    path: '/market',
    name: 'market',
    component: () => import('@/views/MarketTabView.vue'),
    meta: {
      titleKey: 'routes.chat',
      icon: 'lucide:message-square'
    }
  },
  {
    path: '/automation',
    name: 'automation',
    component: () => import('@/views/AutomationTabView.vue'),
    meta: {
      titleKey: 'routes.chat',
      icon: 'lucide:message-square'
    }
  },
  {
    path: '/welcome',
    name: 'welcome',
    component: () => import('@/views/WelcomeView.vue'),
    meta: {
      titleKey: 'routes.welcome',
      icon: 'lucide:message-square'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsTabView.vue'),
    meta: {
      titleKey: 'routes.settings',
      icon: 'lucide:settings'
    },
    redirect: { name: 'settings-profile' },
    children: settingRoutes
  },

  // LLM-specific routes will be added dynamically if the module is available
]

// Import the utility functions
import { getZentrunCorePath, hasZentrunCore } from '@shared/zentrunCore'

// Add LLM-specific routes
// The module path is determined by the environment variable
const zentrunCorePath = getZentrunCorePath()
settingRoutes.push(
  {
    path: 'payment',
    name: 'settings-payment',
    component: () => import(`@shared/${zentrunCorePath}/views/PaymentSettings.vue`),
    meta: {
      titleKey: 'routes.settings-payment',
      icon: 'lucide:credit-card'
    }
  }
)
routes.push(
  {
    path: '/record',
    name: 'record',
    component: () => import(`@shared/${zentrunCorePath}/views/RecordTabView.vue`),
    meta: {
      titleKey: 'routes.record',
      icon: 'lucide:video'
    }
  },
)
routes.push(
  {
    path: '/llm-usage',
    name: 'llm-usage',
    component: () => import(`@shared/${zentrunCorePath}/views/ZentrunLLMUsage.vue`),
    meta: {
      titleKey: 'routes.llmUsage',
      icon: 'lucide:message-square'
    }
  }
)
routes.push(
  {
    path: '/llm-pricing-plan',
    name: 'llm-pricing-plan',
    component: () => import(`@shared/${zentrunCorePath}/views/ZentrunLLMPricingPlan.vue`),
    meta: {
      titleKey: 'routes.llmPricingPlan',
      icon: 'lucide:message-square'
    }
  }
)
console.log(`Added LLM-specific routes from ${zentrunCorePath}`)

// Create the router instance
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard to check if user is logged in
router.beforeEach((to, from, next) => {
  // List of routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password']

  // Check if the route requires authentication
  const requiresAuth = !publicRoutes.includes(to.path)

  // Get user data from localStorage
  const user = localStorage.getItem('user')

  if (requiresAuth && !user) {
    // If the route requires authentication and user is not logged in, redirect to login
    next('/auth/login')
  } else if (!requiresAuth && user) {
    // If the route is a public route (like login) and user is already logged in, redirect to home
    next('/')
  } else {
    // Otherwise, proceed as normal
    next()
  }
})

export default router
