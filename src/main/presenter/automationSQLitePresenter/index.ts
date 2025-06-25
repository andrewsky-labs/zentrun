import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { AutomationTable, AUTOMATION } from '../sqlitePresenter/tables/automations'
import { ipcMain } from 'electron'
import { presenter } from '../index'

export class AutomationSQLitePresenter {
  private db!: Database.Database
  private automationTable!: AutomationTable
  private dbPath: string
  private automationTimer: NodeJS.Timeout | null = null

  constructor(dbPath: string) {
    this.dbPath = dbPath
    // Ensure directory exists
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.initTables()
    this.setupIpcHandlers()
    this.startAutomationTimer()
  }

  private initTables() {
    this.automationTable = new AutomationTable(this.db)
    this.automationTable.createTable()
  }

  private setupIpcHandlers() {
    ipcMain.handle('automationSQLitePresenter:query', async () => {
      return this.query()
    })

    ipcMain.handle('automationSQLitePresenter:insert', async (event, automation) => {
      return this.insert(automation)
    })

    ipcMain.handle('automationSQLitePresenter:update', async (event, id, automation) => {
      return this.update(id, automation)
    })

    ipcMain.handle('automationSQLitePresenter:delete', async (event, id) => {
      return this.delete(id)
    })

    // New handler for executing automations from the renderer process
    ipcMain.handle('automationSQLitePresenter:executeAutomation', async (event, automationId) => {
      const automation = this.get(automationId)
      if (!automation) {
        throw new Error(`Automation with ID ${automationId} not found`)
      }

      // We don't actually execute the automation here anymore
      // Just return the automation object so the renderer can execute it
      return automation
    })
  }

  // Function to check if a cron expression matches the current time
  private cronMatches(cronExpression: string, date: Date): boolean {
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
  }

  // Function to calculate the next run time based on a cron expression
  private calculateNextRunTime(cronExpression: string, fromDate: Date): string {
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
  }

  // Function to start the automation timer
  private startAutomationTimer() {
    // We no longer need this timer as scheduling is now handled in the renderer process
    console.log('Automation timer is now handled in the renderer process')
  }

  // Function to execute an automation - now just a stub that notifies the renderer
  private async executeAutomation(automation: AUTOMATION) {
    console.log(`Notifying renderer to execute automation: ${automation.name} (ID: ${automation.id})`)

    try {
      // Get the main window
      const mainWindow = presenter.windowPresenter.mainWindow
      if (!mainWindow) {
        throw new Error('Main window is not available')
      }

      // Check if the window and webContents are still valid
      if (!mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        try {
          // Send an event to the renderer process to execute the automation
          mainWindow.webContents.send('automation:execute', automation.id)
          console.log(`✅ Notification sent to execute automation ${automation.name}`)
        } catch (error) {
          console.error(`Error sending automation execute event:`, error)
          throw new Error(`Failed to send automation execute event: ${error instanceof Error ? error.message : String(error)}`)
        }
      } else {
        console.log(`⚠️ Cannot send notification: window or webContents is destroyed`)
        throw new Error('Main window webContents is not available')
      }
      return true
    } catch (error) {
      console.error(`❌ Error notifying to execute automation ${automation.name}:`, error)

      // Try to log more details about the error
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, Message: ${error.message}`)
        console.error(`Stack trace: ${error.stack}`)
      }

      // Rethrow the error so the caller can handle it
      throw error
    }
  }

  insert(automation: Omit<AUTOMATION, 'id' | 'created_at' | 'updated_at'>): string {
    return this.automationTable.insert(automation)
  }

  query(): AUTOMATION[] {
    return this.automationTable.list()
  }

  get(id: string): AUTOMATION | null {
    return this.automationTable.get(id)
  }

  getActive(): AUTOMATION[] {
    return this.automationTable.getActive()
  }

  getByOrganization(organization: string): AUTOMATION[] {
    return this.automationTable.getByOrganization(organization)
  }

  getByTeam(team: string): AUTOMATION[] {
    return this.automationTable.getByTeam(team)
  }

  getByAgent(agent: string): AUTOMATION[] {
    return this.automationTable.getByAgent(agent)
  }

  update(id: string, data: Partial<Omit<AUTOMATION, 'id' | 'created_at'>>): boolean {
    return this.automationTable.update(id, data)
  }

  delete(id: string): boolean {
    return this.automationTable.delete(id)
  }

  close() {
    if (this.automationTimer) {
      clearInterval(this.automationTimer)
      this.automationTimer = null
    }
    this.db.close()
  }
}
