<template>
  <div class="w-full h-full flex flex-col">
    <!-- 固定部分 -->
    <div class="flex-shrink-0 bg-background sticky top-0 z-10">
      <!-- MCP全局开关 -->
      <div class="p-4 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium">{{ t('settings.mcp.enabledTitle') }}</h3>
            <p class="text-xs text-muted-foreground mt-1">
              {{ t('settings.mcp.enabledDescription') }}
            </p>
          </div>
          <Switch :checked="mcpEnabled" @update:checked="handleMcpEnabledChange" />
        </div>
      </div>

      <!-- MCP Marketplace 入口 -->
<!--      <div class="px-4 pb-4 flex-shrink-0">-->
<!--        <div class="flex gap-2">-->
<!--          <Button-->
<!--            v-if="false"-->
<!--            variant="outline"-->
<!--            class="flex-1 flex items-center justify-center gap-2"-->
<!--            @click="openMcpMarketplace"-->
<!--          >-->
<!--            <Icon icon="lucide:shopping-bag" class="w-4 h-4" />-->
<!--            <span>{{ t('settings.mcp.marketplace') }}</span>-->
<!--            <Icon icon="lucide:external-link" class="w-3.5 h-3.5 text-muted-foreground" />-->
<!--          </Button>-->

<!--          &lt;!&ndash; Higress MCP Marketplace 入口 &ndash;&gt;-->
<!--          <Button-->
<!--            variant="outline"-->
<!--            class="flex-1 flex items-center justify-center gap-2"-->
<!--            @click="openHigressMcpMarketplace"-->
<!--          >-->
<!--            <img src="@/assets/mcp-icons/higress.avif" class="w-4 h-4" />-->
<!--            <span>{{ $t('settings.mcp.higressMarket') }}</span>-->
<!--            <Icon icon="lucide:external-link" class="w-3.5 h-3.5 text-muted-foreground" />-->
<!--          </Button>-->
<!--        </div>-->
<!--      </div>-->
    </div>

    <!-- 可滚动部分 -->
    <!-- MCP配置 -->
    <div class="flex-grow overflow-y-auto">
      <div v-if="mcpEnabled" class="border-t h-full">
        <McpConfig />
      </div>
      <div v-else class="p-4 text-center text-secondary-foreground text-sm">
        {{ t('settings.mcp.enableToAccess') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import McpConfig from '@/components/mcp-config/mcpConfig.vue'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'
import { useMcpStore } from '@/stores/mcp'
import { MCP_MARKETPLACE_URL, HIGRESS_MCP_MARKETPLACE_URL } from '../mcp-config/const'

const { t } = useI18n()
const mcpStore = useMcpStore()

// 计算属性
const mcpEnabled = computed(() => mcpStore.mcpEnabled)

// 处理MCP开关状态变化
const handleMcpEnabledChange = async (enabled: boolean) => {
  await mcpStore.setMcpEnabled(enabled)
}

// 打开MCP Marketplace
const openMcpMarketplace = () => {
  window.open(MCP_MARKETPLACE_URL, '_blank')
}

// 打开Higress MCP Marketplace
const openHigressMcpMarketplace = () => {
  window.open(HIGRESS_MCP_MARKETPLACE_URL, '_blank')
}
</script>
