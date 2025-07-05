<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppBar from './components/AppBar.vue'
import SideBar from './components/SideBar.vue'
import UpdateDialog from './components/ui/UpdateDialog.vue'
import { usePresenter } from './composables/usePresenter'
import ArtifactDialog from './components/artifacts/ArtifactDialog.vue'
import { useArtifactStore } from './stores/artifact'
import { useChatStore } from '@/stores/chat'
import { NOTIFICATION_EVENTS, SHORTCUT_EVENTS } from './events'
import { useToast } from './components/ui/toast/use-toast'
import Toaster from './components/ui/toast/Toaster.vue'
import { useSettingsStore } from '@/stores/settings'
import { sseClient } from './api/sseClient'
import {apiRequest, syncZentrun} from './api'
import { automationStore } from '@/stores/automation'
import Clarity from "@microsoft/clarity";

const route = useRoute()
const configPresenter = usePresenter('configPresenter')
const devicePresenter = usePresenter('devicePresenter')
const artifactStore = useArtifactStore()
const chatStore = useChatStore()
const { toast } = useToast()
const settingsStore = useSettingsStore()

// Miniconda installation state
const isInstallingMiniconda = ref(false)
const minicondaInstallProgress = ref('')

// Function to check if Miniconda is installed using configPresenter
const checkMinicondaInstalled = async () => {
  try {
    return await configPresenter.checkMinicondaInstalled()
  } catch (error) {
    console.error('Error checking if Miniconda is installed:', error)
    return false
  }
}

// Function to download and install Miniconda using configPresenter
const installMiniconda = async () => {
  if (isInstallingMiniconda.value) {
    console.log('Miniconda installation already in progress')
    return
  }

  try {
    isInstallingMiniconda.value = true

    // Use the configPresenter to install Miniconda with progress updates
    const success = await configPresenter.installMiniconda()

    isInstallingMiniconda.value = false

    if (!success) {
      throw new Error('Miniconda installation failed')
    }

    return Promise.resolve()
  } catch (error) {
    console.error('Error installing Miniconda:', error)
    minicondaInstallProgress.value = `Error installing Miniconda: ${error.message}`
    isInstallingMiniconda.value = false
    throw error
  }
}

// 错误通知队列及当前正在显示的错误
const errorQueue = ref<Array<{ id: string; title: string; message: string; type: string }>>([])
const currentErrorId = ref<string | null>(null)
const errorDisplayTimer = ref<number | null>(null)

// 监听主题和字体大小变化，直接更新 body class
watch(
  [() => settingsStore.theme, () => settingsStore.fontSizeClass],
  ([newTheme, newFontSizeClass], [oldTheme, oldFontSizeClass]) => {
    if (oldTheme) {
      document.documentElement.classList.remove(oldTheme)
    }
    if (oldFontSizeClass) {
      document.documentElement.classList.remove(oldFontSizeClass)
    }
    document.documentElement.classList.add(newTheme)
    document.documentElement.classList.add(newFontSizeClass)
  },
  { immediate: false } // 初始化在 onMounted 中处理
)

// 处理错误通知
const showErrorToast = (error: { id: string; title: string; message: string; type: string }) => {
  // 查找队列中是否已存在相同ID的错误，防止重复
  const existingErrorIndex = errorQueue.value.findIndex((e) => e.id === error.id)

  if (existingErrorIndex === -1) {
    // 如果当前有错误正在展示，将新错误放入队列
    if (currentErrorId.value) {
      if (errorQueue.value.length > 5) {
        errorQueue.value.shift()
      }
      errorQueue.value.push(error)
    } else {
      // 否则直接展示这个错误
      displayError(error)
    }
  }
}

// 显示指定的错误
const displayError = (error: { id: string; title: string; message: string; type: string }) => {
  // 更新当前显示的错误ID
  currentErrorId.value = error.id

  // 显示错误通知
  const { dismiss } = toast({
    title: error.title,
    description: error.message,
    variant: 'destructive',
    onOpenChange: (open) => {
      if (!open) {
        // 用户手动关闭时也显示下一个错误
        handleErrorClosed()
      }
    }
  })

  // 设置定时器，3秒后自动关闭当前错误
  if (errorDisplayTimer.value) {
    clearTimeout(errorDisplayTimer.value)
  }

  errorDisplayTimer.value = window.setTimeout(() => {
    console.log('errorDisplayTimer.value', errorDisplayTimer.value)
    // 处理错误关闭后的逻辑
    dismiss()
    handleErrorClosed()
  }, 3000)
}

// 处理错误关闭后的逻辑
const handleErrorClosed = () => {
  // 清除当前错误ID
  currentErrorId.value = null

  // 显示队列中的下一个错误（如果有）
  if (errorQueue.value.length > 0) {
    const nextError = errorQueue.value.shift()
    if (nextError) {
      displayError(nextError)
    }
  } else {
    // 队列为空，清除定时器
    if (errorDisplayTimer.value) {
      clearTimeout(errorDisplayTimer.value)
      errorDisplayTimer.value = null
    }
  }
}

const router = useRouter()
const activeTab = ref('chat')

const getInitComplete = async () => {
  const initComplete = await configPresenter.getSetting('init_complete')
  if (!initComplete) {
    router.push({ name: 'welcome' })
  }
}

// 处理字体缩放
const handleZoomIn = () => {
  // 字体大小增加逻辑
  const currentLevel = settingsStore.fontSizeLevel
  settingsStore.updateFontSizeLevel(currentLevel + 1)
}

const handleZoomOut = () => {
  // 字体大小减小逻辑
  const currentLevel = settingsStore.fontSizeLevel
  settingsStore.updateFontSizeLevel(currentLevel - 1)
}

const handleZoomResume = () => {
  // 重置字体大小
  settingsStore.updateFontSizeLevel(1) // 1 对应 'text-base'，默认字体大小
}

// 处理创建新会话
const handleCreateNewConversation = () => {
  try {
    chatStore.createNewEmptyThread()
    // 简化处理，只记录日志，实际功能待实现
  } catch (error) {
    console.error('创建新会话失败:', error)
  }
}

// 处理进入设置页面
const handleGoSettings = () => {
  const currentRoute = router.currentRoute.value
  // 检查当前路由或其父路由是否已经是settings
  if (!currentRoute.path.startsWith('/settings')) {
    router.push({ name: 'settings' })
  }
}

getInitComplete()

onMounted(async () => {
  // 设置初始 body class
  document.body.classList.add(settingsStore.theme)
  document.body.classList.add(settingsStore.fontSizeClass)

  Clarity.init("r8nmcbdle8");
  Clarity.consent();
  Clarity.event("openApp");

  // Check if Miniconda is installed and install it if not
  try {
    const isMinicondaInstalled = await checkMinicondaInstalled()
    if (!isMinicondaInstalled) {
      console.log('Miniconda not found. Installing...')
      toast({
        title: 'Installing Python Environment',
        description: 'Setting up Miniconda for Python support. This may take a few minutes.',
        duration: 5000
      })

      // Install Miniconda
      await installMiniconda()

      toast({
        title: 'Python Environment Ready',
        description: 'Miniconda has been installed successfully.',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Error setting up Miniconda:', error)
    toast({
      title: 'Python Environment Setup Failed',
      description: 'Failed to set up Miniconda. Some features may not work properly.',
      variant: 'destructive',
      duration: 5000
    })
  }
  // Clarity.setTag("env", process.env.NODE_ENV);
  // Clarity.setTag("isBuild", process.env.VITE_IS_FOR_BUILD);
  // Clarity.setTag("version", electronData.get().version);

  try {
    const response = await apiRequest('/refresh-zentrun/', 'GET')
    console.log('Zentrun usage refreshed:', response)
    localStorage.setItem('user', JSON.stringify(response))
    const user = localStorage.getItem('user')
    if (user) {
      syncZentrun(true, false).catch(error => {
        console.error('Error syncing data on app initialization:', error)
      })
    }
  } catch (error) {

  }


  // 初始化 SSE 客户端，用于接收组织更新
  sseClient.init()

  // 初始化自动化调度
  automationStore.initialize().catch(error => {
    console.error('Error initializing automation store:', error)
  })



  // 监听全局错误通知事件
  window.electron.ipcRenderer.on(NOTIFICATION_EVENTS.SHOW_ERROR, (_event, error) => {
    showErrorToast(error)
  })

  // 监听快捷键事件
  window.electron.ipcRenderer.on(SHORTCUT_EVENTS.ZOOM_IN, () => {
    handleZoomIn()
  })

  window.electron.ipcRenderer.on(SHORTCUT_EVENTS.ZOOM_OUT, () => {
    handleZoomOut()
  })

  window.electron.ipcRenderer.on(SHORTCUT_EVENTS.ZOOM_RESUME, () => {
    handleZoomResume()
  })

  window.electron.ipcRenderer.on(SHORTCUT_EVENTS.CREATE_NEW_CONVERSATION, () => {
    handleCreateNewConversation()
  })

  window.electron.ipcRenderer.on(SHORTCUT_EVENTS.GO_SETTINGS, () => {
    handleGoSettings()
  })

  window.electron.ipcRenderer.on(NOTIFICATION_EVENTS.SYS_NOTIFY_CLICKED, (_, msg) => {
    let threadId: string | null = null

    // 检查msg是否为字符串且是否以chat/开头
    if (typeof msg === 'string' && msg.startsWith('chat/')) {
      // 按/分割，检查是否有三段数据
      const parts = msg.split('/')
      if (parts.length === 3) {
        // 提取中间部分作为threadId
        threadId = parts[1]
      }
    } else if (msg && msg.threadId) {
      // 兼容原有格式，如果msg是对象且包含threadId属性
      threadId = msg.threadId
    }

    if (threadId) {
      chatStore.setActiveThread(threadId)
    }
  })

  watch(
    () => activeTab.value,
    (newVal) => {
      // Handle 'auth' tab specially since there's no route named 'auth'
      if (newVal === 'auth') {
        // Navigate to login page when auth tab is selected
        router.push({ name: 'login' })
      } else {
        router.push({ name: newVal })
      }
    }
  )

  watch(
    () => route.fullPath,
    (newVal) => {
      const pathWithoutQuery = newVal.split('?')[0]
      const newTab =
        pathWithoutQuery === '/'
          ? (route.name as string)
          : pathWithoutQuery.split('/').filter(Boolean)[0] || ''
      if (newTab !== activeTab.value) {
        activeTab.value = newTab
      }
      // 路由变化时关闭 artifacts 页面
      artifactStore.hideArtifact()
    }
  )

  // 监听当前对话的变化
  watch(
    () => chatStore.activeThreadId,
    () => {
      // 当切换对话时关闭 artifacts 页面
      artifactStore.hideArtifact()
    }
  )

  watch(
    () => artifactStore.isOpen,
    () => {
      chatStore.isSidebarOpen = false
    }
  )
})

// 在组件卸载前清除定时器和事件监听
onBeforeUnmount(() => {
  if (errorDisplayTimer.value) {
    clearTimeout(errorDisplayTimer.value)
    errorDisplayTimer.value = null
  }

  // 关闭 SSE 客户端连接
  sseClient.close()

  // 清理自动化调度
  automationStore.cleanup()

  // 移除快捷键事件监听
  window.electron.ipcRenderer.removeAllListeners(SHORTCUT_EVENTS.ZOOM_IN)
  window.electron.ipcRenderer.removeAllListeners(SHORTCUT_EVENTS.ZOOM_OUT)
  window.electron.ipcRenderer.removeAllListeners(SHORTCUT_EVENTS.ZOOM_RESUME)
  window.electron.ipcRenderer.removeAllListeners(SHORTCUT_EVENTS.CREATE_NEW_CONVERSATION)
  window.electron.ipcRenderer.removeAllListeners(SHORTCUT_EVENTS.GO_SETTINGS)
  window.electron.ipcRenderer.removeAllListeners(NOTIFICATION_EVENTS.SYS_NOTIFY_CLICKED)
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <AppBar v-show="route.name !== 'welcome' && !route.path.startsWith('/auth')" />
    <div class="flex flex-row h-0 flex-grow relative overflow-hidden">
      <!-- 侧边导航栏 -->
      <SideBar
        v-show="route.name !== 'welcome' && !route.path.startsWith('/auth')"
        v-model:model-value="activeTab"
        class="h-full z-10"
      />

      <!-- 主内容区域 -->
      <div
        :class="{
          'flex-1 w-0 h-full transition-all duration-200': true,
          'mr-[calc(60%_-_104px)]': artifactStore.isOpen && route.name === 'chat'
        }"
      >
        <RouterView />
      </div>

      <!-- Artifacts 预览区域 -->
      <ArtifactDialog />
    </div>

    <!-- Miniconda Installation Progress -->
    <div
      v-if="isInstallingMiniconda"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-xl font-semibold mb-4">Installing Python Environment</h3>
        <p class="mb-4">Please wait while we set up Miniconda for Python support. This may take a few minutes.</p>
        <div class="w-full bg-muted rounded-full h-2.5 mb-4">
          <div
            class="bg-primary h-2.5 rounded-full animate-pulse"
            style="width: 100%"
          ></div>
        </div>
        <p class="text-sm text-muted-foreground">{{ minicondaInstallProgress }}</p>
      </div>
    </div>

    <!-- 全局更新弹窗 -->
    <UpdateDialog />
    <!-- 全局Toast提示 -->
    <Toaster />
  </div>
</template>
