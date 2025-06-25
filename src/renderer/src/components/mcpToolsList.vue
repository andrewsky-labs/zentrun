<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useMcpStore } from '@/stores/mcp'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'

const { t } = useI18n()
const mcpStore = useMcpStore()

// 计算属性
const isLoading = computed(() => mcpStore.toolsLoading)
const isError = computed(() => mcpStore.toolsError)
const errorMessage = computed(() => mcpStore.toolsErrorMessage)
const toolCount = computed(() => mcpStore.toolCount)
const hasTools = computed(() => mcpStore.hasTools)
const mcpEnabled = computed(() => mcpStore.mcpEnabled)

// 处理MCP开关状态变化
const handleMcpEnabledChange = async (enabled: boolean) => {
  await mcpStore.setMcpEnabled(enabled)
}

const getTools = (serverName: string) => {
  return mcpStore.tools.filter((tool) => tool.server.name === serverName)
}

const onServerToggle = (serverName: string) => {
  mcpStore.toggleServer(serverName)
}

// 生命周期钩子
onMounted(async () => {
  if (mcpEnabled.value) {
    await mcpStore.loadTools()
    await mcpStore.loadClients()
  }
})
</script>

<template>
  <TooltipProvider>
    <Popover>
      <PopoverTrigger>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              id="mcp-btn"
              variant="outline"
              :class="[
                'flex border border-border rounded-lg shadow-sm items-center gap-1.5 h-7 text-xs px-1.5 w-auto',
                mcpEnabled
                  ? 'dark:!bg-primary bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground '
              ]"
              size="icon"
            >
              <Icon v-if="isLoading" icon="lucide:loader" class="w-4 h-4 animate-spin" />
              <Icon
                v-else-if="isError"
                icon="lucide:alert-circle"
                class="w-4 h-4 text-destructive"
              />
              <Icon v-else icon="lucide:hammer" class="w-4 h-4" />

              <span
                v-if="hasTools && !isLoading && !isError"
                :class="{ 'text-muted-foreground': !mcpEnabled, 'text-white': mcpEnabled }"
                class="text-sm"
                >{{ toolCount }}</span
              >
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p v-if="!mcpEnabled">{{ t('mcp.tools.disabled') }}</p>
            <p v-else-if="isLoading">{{ t('mcp.tools.loading') }}</p>
            <p v-else-if="isError">{{ t('mcp.tools.error') }}</p>
            <p v-else-if="hasTools">{{ t('mcp.tools.available', { count: toolCount }) }}</p>
            <p v-else>{{ t('mcp.tools.none') }}</p>
          </TooltipContent>
        </Tooltip>
      </PopoverTrigger>

      <PopoverContent class="w-80 p-0" align="start">
        <!-- MCP启用开关 -->
        <div class="p-2 border-b flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">{{ t('mcp.tools.enabled') }}</div>
            <div class="text-xs text-muted-foreground">{{ t('mcp.tools.enabledDescription') }}</div>
          </div>
          <Switch
            aria-label="启用MCP"
            :checked="mcpEnabled"
            @update:checked="handleMcpEnabledChange"
          />
        </div>

        <div class="max-h-[300px] overflow-y-auto">
          <div v-if="!mcpEnabled" class="p-2 text-sm text-muted-foreground text-center">
            {{ t('mcp.tools.enableToUse') }}
          </div>
          <!-- <div v-else-if="isLoading" class="flex justify-center items-center py-8">
            <Icon icon="lucide:loader" class="w-6 h-6 animate-spin" />
          </div>
          <div v-else-if="isError" class="p-2 text-sm text-destructive">
            {{ t('mcp.tools.loadError') }}: {{ errorMessage }}
          </div> -->
          <div v-else-if="isError" class="p-2 text-sm text-destructive">
            {{ t('mcp.tools.loadError') }}: {{ errorMessage }}
          </div>
          <div
            v-if="mcpEnabled && mcpStore.serverList.length === 0"
            class="p-2 text-sm text-muted-foreground text-center"
          >
            {{ t('mcp.tools.empty') }}
          </div>
          <div v-else-if="mcpEnabled" class="divide-y">
            <div v-for="server in mcpStore.serverList" :key="server.name" class="w-full">
              <div class="p-2 hover:bg-accent flex items-center w-full">
                <span class="mr-2">{{ server.icons }}</span
                ><span class="flex-grow truncate text-left text-sm">{{ server.name }}</span>
                <Popover>
                  <PopoverTrigger>
                    <Badge
                      v-if="server.isRunning && !server.isLoading"
                      variant="outline"
                      class="flex items-center gap-1 mr-2 text-xs"
                    >
                      {{ getTools(server.name).length }}
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent align="start" class="p-2 max-h-[300px] overflow-y-auto">
                    <div
                      v-for="tool in getTools(server.name)"
                      :key="tool.function.name"
                      class="py-1"
                    >
                      <div class="font-medium text-sm">{{ tool.function.name }}</div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Switch :checked="server.isRunning" @click="onServerToggle(server.name)">
                  <template #thumb>
                    <div class="flex items-center justify-center w-full h-full">
                      <Icon
                        v-if="server.isLoading"
                        icon="lucide:loader-2"
                        class="w-3 h-3 text-muted-foreground animate-spin"
                      />
                    </div>
                  </template>
                </Switch>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </TooltipProvider>
</template>
