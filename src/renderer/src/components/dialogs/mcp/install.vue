<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { useMcpStore } from '@/stores/mcp'
import { useToast } from '@/components/ui/toast'

const { t } = useI18n()
const mcpStore = useMcpStore()
const { toast } = useToast()

const props = defineProps<{
  isOpen: boolean
  serverData: any
  serverName: string
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'install'): void
}>()

// Create a copy of environment variables for editing
const envVars = ref<{ key: string; value: string }[]>(props.serverData?.env)

// Initialize envVars when serverData changes
const initEnvVars = () => {
  console.log('initEnvVars called')
  console.log('Server data:', props.serverData)
  console.log('Server data type:', typeof props.serverData)
  console.log('Environment variables:', props.serverData?.env)
  console.log('Environment variables type:', typeof props.serverData?.env)

  // Ensure we have at least one empty row by default
  envVars.value = [{ key: '', value: '' }]
  if (!props.serverData?.env) {
    console.log('No environment variables found in server data')
    return
  }

  try {
    // Handle the case where env might contain nested JSON strings
    const entries = Object.entries(props.serverData.env || {})
    console.log('Environment variable entries:', entries)

    if (entries.length === 0) {
      console.log('No environment variable entries found')
      return
    }

    // Clear the default empty row if we have actual data
    envVars.value = []

    entries.forEach(([key, value]) => {
      let processedValue = value
      console.log(`Processing env var ${key} with value:`, value)
      console.log(`Value type:`, typeof value)

      // If the value is a string that looks like JSON, try to parse it for display
      if (typeof value === 'string' &&
          (value.trim().startsWith('{') || value.trim().startsWith('[')) &&
          (value.trim().endsWith('}') || value.trim().endsWith(']'))) {
        try {
          // Just for display purposes, keep the original string in the data
          const parsedValue = JSON.parse(value)
          console.log(`Successfully parsed JSON for ${key}:`, parsedValue)
          processedValue = JSON.stringify(parsedValue, null, 2)
        } catch (e) {
          // If parsing fails, keep the original string
          console.log('Failed to parse JSON string:', value, e)
        }
      } else if (typeof value !== 'string') {
        processedValue = JSON.stringify(value, null, 2)
      }

      console.log(`Final processed value for ${key}:`, processedValue)
      envVars.value.push({
        key,
        value: processedValue
      })
    })
  } catch (error) {
    console.error('Error processing environment variables:', error)
    // Keep the default empty row if there was an error
  }

  // If no environment variables were added, ensure we have at least one empty row
  if (envVars.value.length === 0) {
    console.log('No environment variables after processing, initializing with empty row')
    envVars.value = [{ key: '', value: '' }]
  }

  console.log('Initialized envVars:', envVars.value)
}

// Watch for changes in serverData and isOpen
const onDialogOpenChange = (open: boolean) => {
  if (open) {
    initEnvVars()
  }
  emit('update:isOpen', open)
}

// Watch for changes in isOpen prop
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    console.log('isOpen changed to true, initializing environment variables')
    initEnvVars()
  }
})

// Format command and arguments for display
const commandDisplay = computed(() => {
  if (!props.serverData) return ''
  return `${props.serverData.command} ${props.serverData.args.join(' ')}`
})

// Editable command string
const editableCommand = ref('')

// Initialize editable command when dialog opens
watch(() => props.isOpen, (newValue) => {
  if (newValue && props.serverData) {
    editableCommand.value = commandDisplay.value
  }
}, { immediate: true })

// Parse the editable command back into command and args
const parseCommand = () => {
  if (!editableCommand.value.trim()) return null

  const parts = editableCommand.value.trim().split(/\s+/)
  if (parts.length === 0) return null

  return {
    command: parts[0],
    args: parts.slice(1)
  }
}

// Handle environment variable key and value changes
const updateEnvKey = (index: number, newKey: string) => {
  if (index >= 0 && index < envVars.value.length) {
    envVars.value[index].key = newKey
  }
}

const updateEnvValue = (index: number, newValue: string) => {
  if (index >= 0 && index < envVars.value.length) {
    envVars.value[index].value = newValue
  }
}

// Add a new environment variable row
const addEnvVar = () => {
  envVars.value.push({ key: '', value: '' })
}

// Remove an environment variable row
const removeEnvVar = (index: number) => {
  if (index >= 0 && index < envVars.value.length) {
    envVars.value.splice(index, 1)
  }
}

// Debug function to test parsing of environment variables
const debugParseEnv = () => {
  console.log('Debugging environment variables parsing:')
  console.log('Full server data prop:', props.serverData)

  if (!props.serverData) {
    console.log('No server data found')
    return
  }

  // Log all properties of serverData
  console.log('Server data properties:')
  for (const key in props.serverData) {
    console.log(`- ${key}:`, props.serverData[key])
  }

  if (!props.serverData?.env) {
    console.log('No environment variables found in server data')
    return
  }

  try {
    console.log('Raw env object:', props.serverData.env)

    // Try to parse each environment variable
    Object.entries(props.serverData.env).forEach(([key, value]) => {
      console.log(`Env var ${key}:`, value)
      console.log(`Type of ${key}:`, typeof value)

      if (typeof value === 'string' &&
          (value.startsWith('{') || value.startsWith('[')) &&
          (value.endsWith('}') || value.endsWith(']'))) {
        try {
          const parsed = JSON.parse(value)
          console.log(`Parsed ${key}:`, parsed)
        } catch (e) {
          console.log(`Failed to parse ${key}:`, e)
        }
      }
    })

    // Log the current state of envVars
    console.log('Current envVars state:', envVars.value)
  } catch (error) {
    console.error('Error in debugParseEnv:', error)
  }
}

// Handle installation
const handleInstall = async () => {
  try {
    // Convert envVars back to object format, filtering out empty entries
    const envObject: Record<string, string> = {}

    envVars.value.forEach(({ key, value }) => {
      // Skip entries with empty keys
      if (!key.trim()) return

      // Process the value - try to parse JSON if it looks like JSON
      let processedValue = value

      // If it's a formatted JSON string (with newlines and indentation),
      // try to compact it to a single line for storage
      if (typeof value === 'string' &&
          (value.trim().startsWith('{') || value.trim().startsWith('[')) &&
          (value.trim().endsWith('}') || value.trim().endsWith(']'))) {
        try {
          const parsed = JSON.parse(value)
          processedValue = JSON.stringify(parsed) // Compact JSON without formatting
        } catch (e) {
          // If parsing fails, keep the original string
          console.log('Failed to parse JSON string for storage:', value)
        }
      }

      envObject[key] = processedValue
    })

    // Parse the command and arguments from the editable command
    const parsedCommand = parseCommand()

    // If parsing failed, show an error
    if (!parsedCommand) {
      throw new Error(t('mcp.errors.invalidCommand', t('invalid-command-format')))
    }

    // Prepare installation data
    const installData = {
      command: parsedCommand.command,
      args: parsedCommand.args,
      env: envObject
    }

    console.log('Installing with data:', installData)

    // Call MCP store to perform installation
    await mcpStore.installMcpServer(props.serverName, installData)

    toast({
      title: t('mcp.installSuccess'),
      description: t('mcp.serverInstalled', { name: props.serverName }),
      variant: 'default'
    })

    emit('install')
    emit('update:isOpen', false)
  } catch (error) {
    console.error('Installation failed:', error)
    toast({
      title: t('mcp.installFailed'),
      description: error instanceof Error ? error.message : String(error),
      variant: 'destructive'
    })
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="onDialogOpenChange">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{ t('mcp.installServer', { name: serverName }) }}</DialogTitle>
        <DialogDescription>
          {{ t('mcp.installDescription') }}
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <!-- Command and Arguments Section -->
        <div class="mb-4">
          <h4 class="text-sm font-medium mb-1">{{ t('mcp.commandAndArgs') }}</h4>
          <div class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto">
            <Textarea
              v-model="editableCommand"
              class=" text-xs font-mono bg-white border-none focus:ring-0 resize-none"
              :placeholder="t('mcp.commandPlaceholder', 'Enter command and arguments')"
              spellcheck="false"
            />
          </div>
        </div>

        <!-- Environment Variables Section -->
        <div class="mb-4">
          <h4 class="text-sm font-medium mb-1">{{ t('mcp.environmentVariables') }}</h4>

          <div class="border rounded-md overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-muted">
                <tr>
                  <th class="py-2 px-3 text-left font-medium">{{ t('common.key') }}</th>
                  <th class="py-2 px-3 text-left font-medium">{{ t('common.value') }}</th>
                  <th class="py-2 px-3 text-left font-medium w-10">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(env, index) in envVars" :key="index" class="border-t">

                  <td class="py-2 px-3">
                    <Textarea
                      v-model="env.key"
                      @input="updateEnvKey(index, env.key)"
                      class="min-h-[80px] text-xs font-mono"
                      :placeholder="t('mcp.envKeyPlaceholder', 'Enter environment variable name')"
                      spellcheck="false"
                    />
                  </td>
                  <td class="py-2 px-3">
                    <Textarea
                      v-model="env.value"
                      @input="updateEnvValue(index, env.value)"
                      class="min-h-[80px] text-xs font-mono"
                      :placeholder="t('mcp.envValuePlaceholder', 'Enter value or JSON string')"
                      spellcheck="false"
                    />
                  </td>
                  <td class="py-2 px-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="removeEnvVar(index)"
                      class="h-8 w-8"
                    >
                      <span class="sr-only">{{ t('common.remove') }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="p-3 bg-muted border-t">
              <Button
                variant="outline"
                size="sm"
                @click="addEnvVar"
                class="w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus mr-2"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                {{ t('common.add') }}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" @click="debugParseEnv" class="mr-auto">
          t('debug')
        </Button>
        <Button variant="outline" @click="emit('update:isOpen', false)">
          {{ t('common.cancel') }}
        </Button>
        <Button variant="default" @click="handleInstall">
          {{ t('common.install', 'Install') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
