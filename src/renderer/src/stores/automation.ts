import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePresenter } from "../composables/usePresenter";
import { useChatStore } from './chat';
import { useToast } from '@/components/ui/toast';
import router from '@/router';
import i18n from '@/i18n'
const t = i18n.global.t

// We'll need to create this presenter later
const automationP = usePresenter('automationSQLitePresenter')

interface Automation {
  id: string
  name: string
  user: number
  prompt: string
  schedule: string // Cron expression
  frequency: string // Human-readable frequency
  status: string // 'active' or 'inactive'
  lastRun?: string
  nextRun?: string
  organization?: string
  agent?: string
  team?: string
  tool_calls?: string
  created_at?: string
  updated_at?: string
}

export const automationStore = {
  automations: ref([]),
  automationTimer: null as NodeJS.Timeout | null,
  isInitialized: ref(false),

  // Load all automations
  async loadAutomations() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const queryTotal = await automationP.query()
      console.log("queryTotal");
      console.log(queryTotal);
      const automations = queryTotal.filter((x) => x.user === user.id)
      // Parse JSON fields
      const parsedAutomations = automations.map(automation => {
        return {
          ...automation,
          tool_calls: automation.tool_calls ? JSON.parse(automation.tool_calls) : []
        }
      })
      this.automations.value = parsedAutomations
      return parsedAutomations
    } catch (error) {
      console.error('Failed to load automations:', error)
    }
  },

  // Add a new automation
  async addAutomation(automation) {
    try {
      // Stringify JSON fields
      const automationToSave = {
        ...automation,
        tool_calls: automation.tool_calls ? (Array.isArray(automation.tool_calls) ? JSON.stringify(automation.tool_calls) : automation.tool_calls) : null
      }
      const result = await automationP.insert(automationToSave)
      await this.loadAutomations()
      return result
    } catch (error) {
      console.error('Failed to add automation:', error)
    }
  },

  // Update an existing automation
  async updateAutomation(id: string, automation) {
    try {
      // Stringify JSON fields
      const automationToUpdate = {
        ...automation,
      }

      if (automation.tool_calls) {
        automationToUpdate.tool_calls = automation.tool_calls ? (Array.isArray(automation.tool_calls) ? JSON.stringify(automation.tool_calls) : automation.tool_calls) : null
      }

      const result = await automationP.update(id, automationToUpdate)
      await this.loadAutomations()
      return result
    } catch (error) {
      console.error('Failed to update automation:', error)
    }
  },

  // Delete an automation
  async deleteAutomation(id: string) {
    try {
      const result = await automationP.delete(id)
      await this.loadAutomations()
      return result
    } catch (error) {
      console.error('Failed to delete automation:', error)
    }
  },

  // Get automation by ID
  async getAutomationById(id: string) {
    return this.automations.value.find(automation => automation.id === id)
  },

  // Get automations by organization
  getAutomationsByOrganization: computed(() => {
    return (orgSlug: string) => {
      return this.automations.value.filter(automation => automation.organization === orgSlug)
    }
  }),

  // Get automations by agent
  getAutomationsByAgent: computed(() => {
    return (agentSlug: string) => {
      return this.automations.value.filter(automation => automation.agent === agentSlug)
    }
  }),

  // Get automations by team
  getAutomationsByTeam: computed(() => {
    return (teamSlug: string) => {
      return this.automations.value.filter(automation => automation.team === teamSlug)
    }
  }),

  // Get standalone automations (not associated with org, team, or agent)
  getStandaloneAutomations: computed(() => {
    return () => {
      return this.automations.value.filter(automation =>
        !automation.organization &&
        !automation.team &&
        !automation.agent
      )
    }
  }),

  // Get active automations
  getActiveAutomations () {
      return this.automations.value.filter(automation => automation.status === 'active')
    },

  // Get inactive automations
  getInactiveAutomations () {
      return this.automations.value.filter(automation => automation.status === 'inactive')
    },

  // Function to check if a cron expression matches the current time
  cronMatches(cronExpression: string, date: Date = new Date()): boolean {
    if (!cronExpression) return false

    console.log(`Checking cron expression: ${cronExpression} against date: ${date.toISOString()}`)

    // Parse cron expression (minute hour day-of-month month day-of-week)
    const parts = cronExpression.split(' ')
    if (parts.length !== 5) {
      console.error(`Invalid cron expression format: ${cronExpression}. Expected 5 parts.`)
      return false
    }

    const minute = parts[0]
    const hour = parts[1]
    const dayOfMonth = parts[2]
    const month = parts[3]
    const dayOfWeek = parts[4]

    // Check if current time matches the cron expression
    const currentMinute = date.getMinutes()
    const currentHour = date.getHours()
    const currentDayOfMonth = date.getDate()
    const currentMonth = date.getMonth() + 1 // getMonth() returns 0-11
    const currentDayOfWeek = date.getDay() // getDay() returns 0-6 (0 is Sunday)

    console.log(`Current time: ${currentHour}:${currentMinute}, date: ${currentDayOfMonth}/${currentMonth}, day of week: ${currentDayOfWeek}`)
    console.log(`Cron parts: minute=${minute}, hour=${hour}, day=${dayOfMonth}, month=${month}, weekday=${dayOfWeek}`)

    // Handle ranges (e.g., 1-5)
    const matchPart = (part: string, current: number): boolean => {
      if (part === '*') return true

      // Handle comma-separated values
      if (part.includes(',')) {
        return part.split(',').some(p => matchPart(p, current))
      }

      // Handle ranges
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number)
        return current >= start && current <= end
      }

      // Handle step values
      if (part.includes('/')) {
        const [range, step] = part.split('/')
        const stepNum = parseInt(step, 10)

        if (range === '*') {
          return current % stepNum === 0
        } else if (range.includes('-')) {
          const [start, end] = range.split('-').map(Number)
          if (current < start || current > end) return false
          return (current - start) % stepNum === 0
        }
      }

      // Simple exact match
      return parseInt(part, 10) === current
    }

    // Check each part of the cron expression
    const minuteMatch = matchPart(minute, currentMinute)
    const hourMatch = matchPart(hour, currentHour)
    const dayMatch = matchPart(dayOfMonth, currentDayOfMonth)
    const monthMatch = matchPart(month, currentMonth)
    const weekdayMatch = matchPart(dayOfWeek, currentDayOfWeek)

    console.log(`Matches: minute=${minuteMatch}, hour=${hourMatch}, day=${dayMatch}, month=${monthMatch}, weekday=${weekdayMatch}`)

    return minuteMatch && hourMatch && dayMatch && monthMatch && weekdayMatch
  },

  // Function to calculate the next run time based on a cron expression
  calculateNextRunTime(cronExpression: string, fromDate: Date = new Date()): string {
    console.log(`Calculating next run time for cron: ${cronExpression} from date: ${fromDate.toISOString()}`)

    if (!cronExpression) {
      console.error('Cannot calculate next run time: empty cron expression')
      return ''
    }

    // Start with the next minute
    const nextDate = new Date(fromDate)
    nextDate.setMinutes(nextDate.getMinutes() + 1)
    nextDate.setSeconds(0)
    nextDate.setMilliseconds(0)

    // Try up to 10000 minutes (about 1 week) to find the next match
    const maxIterations = 10000
    for (let i = 0; i < maxIterations; i++) {
      if (this.cronMatches(cronExpression, nextDate)) {
        console.log(`Next run time found: ${nextDate.toISOString()}`)
        return nextDate.toISOString()
      }

      // Move to the next minute
      nextDate.setMinutes(nextDate.getMinutes() + 1)
    }

    console.error(`Could not find next run time within ${maxIterations} minutes`)
    return ''
  },

  // Function to execute an automation
  async executeAutomation(automation, t = key => key) {
    console.log(`Executing automation: ${automation.name} (ID: ${automation.id})`)
    const chatStore = useChatStore()
    const { toast } = useToast()

    try {

      toast({ title: t('running-automation') })

      // Create a new thread with the automation name
      const threadId = await chatStore.createThread(`Zpilot: ${automation.name}`, chatStore.chatConfig)

      // Set the active thread
      await chatStore.setActiveThread(threadId)

      console.log("automation.tool_calls", automation.tool_calls)

      const lockedInputs = automation.tool_calls.map(() => true)

      // // Navigate to the chat view
      // await router.push({ name: 'chat' })

      // Execute the automation using the chat store's executeZent function
      await chatStore.executeZent(
        automation,
        automation.prompt,
        automation.tool_calls,
        lockedInputs,
        t,
        threadId.value
      )

      // Update the lastRun field in local database
      const now = new Date()
      const updatedAutomation = {
        ...automation,
        lastRun: now.toISOString(),
        nextRun: this.calculateNextRunTime(automation.schedule, now)
      }
      await this.updateAutomation(automation.id, updatedAutomation)

      toast({ title: t('automation-executed-successfully') })
      console.log(`✅ Automation ${automation.name} executed successfully`)

      return true
    } catch (error) {
      console.error(`❌ Error executing automation ${automation.name}:`, error)

      // Try to log more details about the error
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, Message: ${error.message}`)
        console.error(`Stack trace: ${error.stack}`)
      }

      const { toast } = useToast()
      toast({
        title: t('failed-to-run-automation'),
        description: error.message || t('sync.error.unknown'),
        variant: 'destructive'
      })

      // Rethrow the error so the caller can handle it
      throw error
    }
  },

  // Function to start the automation timer
  startAutomationTimer() {
    console.log('Starting automation timer...')

    if (this.automationTimer) {
      console.log('Clearing existing automation timer')
      clearInterval(this.automationTimer)
    }

    // Check for automations to run every minute
    this.automationTimer = setInterval(async () => {
      try {
        console.log('Automation timer tick - checking for automations to run')

        // Get all active automations
        const activeAutomations = this.getActiveAutomations()
        console.log(`Found ${activeAutomations.length} active automations`)

        if (activeAutomations.length === 0) {
          console.log('No active automations to check')
          return
        }

        const now = new Date()
        console.log(`Current time: ${now.toISOString()}`)

        for (const automation of activeAutomations) {
          console.log(`Checking automation: ${automation.name} (ID: ${automation.id})`)
          console.log(`Schedule: ${automation.schedule}, Last run: ${automation.lastRun || 'never'}`)

          // Check if this automation should run now based on its cron schedule
          if (this.cronMatches(automation.schedule, now)) {
            console.log(`✅ Automation matched schedule: ${automation.name}`)

            // Execute the automation
            try {
              await this.executeAutomation(automation)
            } catch (execError) {
              console.error(`Failed to execute automation ${automation.name}:`, execError)
            }
          } else {
            console.log(`❌ Automation did not match schedule: ${automation.name}`)
          }
        }
      } catch (error) {
        console.error('Error in automation timer:', error)
      }
    }, 60000) // Check every minute

    console.log('Automation timer started successfully')
    this.isInitialized.value = true
  },

  // Function to stop the automation timer
  stopAutomationTimer() {
    if (this.automationTimer) {
      console.log('Stopping automation timer')
      clearInterval(this.automationTimer)
      this.automationTimer = null
    }
    this.isInitialized.value = false
  },

  // Initialize the automation store
  async initialize() {
    if (!this.isInitialized.value) {
      await this.loadAutomations()
      this.startAutomationTimer()
      this.setupEventListeners()
    }
  },

  // Cleanup when the component is unmounted
  cleanup() {
    this.stopAutomationTimer()
    this.removeEventListeners()
  },

  // Set up event listeners for automation execution requests from the main process
  setupEventListeners() {
    console.log('Setting up automation event listeners')

    // Listen for automation execution requests from the main process
    window.electron.ipcRenderer.on('automation:execute', async (automationId) => {
      console.log(`Received request to execute automation: ${automationId}`)

      try {
        // Get the automation by ID
        const automation = await this.getAutomationById(automationId)

        if (!automation) {
          console.error(`Automation with ID ${automationId} not found`)
          return
        }

        // Execute the automation
        await this.executeAutomation(automation)
      } catch (error) {
        console.error(`Error executing automation from main process:`, error)
      }
    })
  },

  // Remove event listeners
  removeEventListeners() {
    console.log('Removing automation event listeners')
    window.electron.ipcRenderer.removeAllListeners('automation:execute')
  }
}
