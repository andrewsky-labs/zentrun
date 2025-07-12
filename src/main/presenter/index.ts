import { ipcMain, IpcMainInvokeEvent, app } from 'electron'
// import { LlamaCppPresenter } from './llamaCppPresenter'
import { WindowPresenter } from './windowPresenter'
import { SQLitePresenter } from './sqlitePresenter'
import { ZentSQLitePresenter } from './zentSQLitePresenter'
import { RunHistorySQLitePresenter } from './runHistorySQLitePresenter'
import { ActivitySQLitePresenter } from './activitySQLitePresenter'
import { AutomationSQLitePresenter } from './automationSQLitePresenter'
import { ShortcutPresenter } from './shortcutPresenter'
import { IPresenter } from '@shared/presenter'
import { eventBus } from '@/eventbus'
import path from 'path'
import Database from 'better-sqlite3-multiple-ciphers'
import { LLMProviderPresenter } from './llmProviderPresenter'
import { ConfigPresenter } from './configPresenter'
import { ThreadPresenter } from './threadPresenter'
import { DevicePresenter } from './devicePresenter'
import { UpgradePresenter } from './upgradePresenter'
import { FilePresenter } from './filePresenter/FilePresenter'
import { McpPresenter } from './mcpPresenter'
import { SyncPresenter } from './syncPresenter'
import { DeeplinkPresenter } from './deeplinkPresenter'
import { NotificationPresenter } from './notifactionPresenter'
import { RagPresenter } from './ragPresenter'
import { BrowserAutomationPresenter } from './browserAutomationPresenter'
import {
  CONFIG_EVENTS,
  CONVERSATION_EVENTS,
  STREAM_EVENTS,
  WINDOW_EVENTS,
  UPDATE_EVENTS,
  OLLAMA_EVENTS,
  MCP_EVENTS,
  SYNC_EVENTS,
  DEEPLINK_EVENTS,
  NOTIFICATION_EVENTS,
  SHORTCUT_EVENTS
} from '@/events'
import {OrganizationSQLitePresenter} from "./organizationSQLitePresenter";
import {TeamSQLitePresenter} from "./teamSQLitePresenter";
import {AgentSQLitePresenter} from "./agentSQLitePresenter";
import {GenericSQLitePresenter} from "./genericSQLitePresenter";

// --- 所有需要通过 forward 函数处理的事件列表 ---
const eventsToForward: string[] = [
  CONFIG_EVENTS.PROVIDER_CHANGED,
  STREAM_EVENTS.RESPONSE,
  STREAM_EVENTS.END,
  STREAM_EVENTS.ERROR,
  CONVERSATION_EVENTS.ACTIVATED,
  CONVERSATION_EVENTS.DEACTIVATED,
  CONFIG_EVENTS.MODEL_LIST_CHANGED,
  CONFIG_EVENTS.MODEL_STATUS_CHANGED,
  UPDATE_EVENTS.STATUS_CHANGED,
  UPDATE_EVENTS.PROGRESS,
  UPDATE_EVENTS.WILL_RESTART,
  UPDATE_EVENTS.ERROR,
  CONVERSATION_EVENTS.MESSAGE_EDITED,
  MCP_EVENTS.SERVER_STARTED,
  MCP_EVENTS.SERVER_STOPPED,
  MCP_EVENTS.CONFIG_CHANGED,
  MCP_EVENTS.TOOL_CALL_RESULT,
  OLLAMA_EVENTS.PULL_MODEL_PROGRESS,
  SYNC_EVENTS.BACKUP_STARTED,
  SYNC_EVENTS.BACKUP_COMPLETED,
  SYNC_EVENTS.BACKUP_ERROR,
  SYNC_EVENTS.IMPORT_STARTED,
  SYNC_EVENTS.IMPORT_COMPLETED,
  SYNC_EVENTS.IMPORT_ERROR,
  DEEPLINK_EVENTS.START,
  DEEPLINK_EVENTS.MCP_INSTALL,
  NOTIFICATION_EVENTS.SHOW_ERROR,
  NOTIFICATION_EVENTS.SYS_NOTIFY_CLICKED,
  SHORTCUT_EVENTS.CREATE_NEW_CONVERSATION,
  SHORTCUT_EVENTS.GO_SETTINGS,
  SHORTCUT_EVENTS.CLEAN_CHAT_HISTORY,
  SHORTCUT_EVENTS.ZOOM_IN,
  SHORTCUT_EVENTS.ZOOM_OUT,
  SHORTCUT_EVENTS.ZOOM_RESUME
]
export class Presenter implements IPresenter {
  windowPresenter: WindowPresenter
  sqlitePresenter: SQLitePresenter
  llmproviderPresenter: LLMProviderPresenter
  configPresenter: ConfigPresenter
  threadPresenter: ThreadPresenter
  devicePresenter: DevicePresenter
  upgradePresenter: UpgradePresenter
  shortcutPresenter: ShortcutPresenter
  filePresenter: FilePresenter
  mcpPresenter: McpPresenter
  syncPresenter: SyncPresenter
  deeplinkPresenter: DeeplinkPresenter
  notificationPresenter: NotificationPresenter
  zentSQLitePresenter: ZentSQLitePresenter // <-- 추가
  organizationSQLitePresenter: OrganizationSQLitePresenter // <-- 추가
  teamSQLitePresenter: TeamSQLitePresenter // <-- 추가
  agentSQLitePresenter: AgentSQLitePresenter // <-- 추가
  runHistorySQLitePresenter: RunHistorySQLitePresenter // <-- 추가
  activitySQLitePresenter: ActivitySQLitePresenter // <-- 추가
  automationSQLitePresenter: AutomationSQLitePresenter // <-- 자동화 기능 추가
  ragPresenter: RagPresenter // <-- RAG 기능 추가
  genericSQLitePresenter: GenericSQLitePresenter // <-- 일반 SQLite 쿼리 기능 추가
  browserAutomationPresenter: BrowserAutomationPresenter // <-- 브라우저 자동화 기능 추가
  // llamaCppPresenter: LlamaCppPresenter

  constructor() {
    this.configPresenter = new ConfigPresenter()
    this.windowPresenter = new WindowPresenter(this.configPresenter)
    this.llmproviderPresenter = new LLMProviderPresenter(this.configPresenter)
    this.devicePresenter = new DevicePresenter()
    // 初始화 SQLite 数据库
    const dbDir = path.join(app.getPath('userData'), 'app_db')
    const dbPath = path.join(dbDir, '12_chat.db')
    const zentDbPath = path.join(dbDir, '12_zent.db')
    const organizationDbPath = path.join(dbDir, '12_org.db')
    const teamDbPath = path.join(dbDir, '12_team.db')
    const agentDbPath = path.join(dbDir, '12_agent.db')
    const runHistoryDbPath = path.join(dbDir, '12_runhistory.db')
    const activityDbPath = path.join(dbDir, '12_activity.db')
    const automationDbPath = path.join(dbDir, '12_automation.db')
    this.sqlitePresenter = new SQLitePresenter(dbPath)
    this.zentSQLitePresenter = new ZentSQLitePresenter(zentDbPath)
    this.organizationSQLitePresenter = new OrganizationSQLitePresenter(organizationDbPath)
    this.teamSQLitePresenter = new TeamSQLitePresenter(teamDbPath)
    this.agentSQLitePresenter = new AgentSQLitePresenter(agentDbPath)
    this.runHistorySQLitePresenter = new RunHistorySQLitePresenter(runHistoryDbPath)
    this.activitySQLitePresenter = new ActivitySQLitePresenter(activityDbPath)
    this.automationSQLitePresenter = new AutomationSQLitePresenter(automationDbPath)
    this.threadPresenter = new ThreadPresenter(
      this.sqlitePresenter,
      this.llmproviderPresenter,
      this.configPresenter
    )
    this.mcpPresenter = new McpPresenter(this.configPresenter)
    this.upgradePresenter = new UpgradePresenter()
    this.shortcutPresenter = new ShortcutPresenter()
    this.filePresenter = new FilePresenter()
    this.syncPresenter = new SyncPresenter(this.configPresenter, this.sqlitePresenter)
    this.deeplinkPresenter = new DeeplinkPresenter()
    this.notificationPresenter = new NotificationPresenter()
    this.ragPresenter = new RagPresenter()
    this.genericSQLitePresenter = new GenericSQLitePresenter()
    this.browserAutomationPresenter = new BrowserAutomationPresenter()
    // this.llamaCppPresenter = new LlamaCppPresenter()
    this.setupEventBus()
  }

  setupEventBus() {
    // --- 事件转发辅助函数（包含特定逻辑处理） ---
    const forward = (eventName: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eventBus.on(eventName, (...payload: any[]) => {
        const mainWindow = this.windowPresenter.mainWindow
        if (!mainWindow) return // 窗口不存在则不处理
        if (mainWindow.isDestroyed() || !mainWindow.webContents || mainWindow.webContents.isDestroyed()) {
          console.log(`Cannot send ${eventName} event: window or webContents is destroyed`)
          return // 窗口或webContents已销毁，不处理
        }

        try {
          // 根据事件名称处理特定逻辑
          if (eventName === STREAM_EVENTS.RESPONSE) {
            const [msg] = payload
            const dataToRender = { ...msg }
            delete dataToRender.tool_call_response_raw // 删除原始数据
            mainWindow.webContents.send(eventName, dataToRender)
          } else if (eventName === STREAM_EVENTS.END) {
            const [msg] = payload
            console.log('stream-end', msg.eventId)
            mainWindow.webContents.send(eventName, msg)
          } else if (eventName === CONFIG_EVENTS.PROVIDER_CHANGED) {
            const providers = this.configPresenter.getProviders()
            this.llmproviderPresenter.setProviders(providers)
            mainWindow.webContents.send(eventName) // 此事件转发无需 payload
          } else if (
            eventName === UPDATE_EVENTS.STATUS_CHANGED ||
            eventName === UPDATE_EVENTS.PROGRESS ||
            eventName === UPDATE_EVENTS.WILL_RESTART ||
            eventName === UPDATE_EVENTS.ERROR ||
            eventName === DEEPLINK_EVENTS.START
          ) {
            const [msg] = payload
            console.log(eventName, msg) // 记录日志
            mainWindow.webContents.send(eventName, msg)
          } else {
            // 默认处理：直接转发所有 payload
            mainWindow.webContents.send(eventName, ...payload)
          }
        } catch (error) {
          console.error(`Error sending from webFrameMain for event ${eventName}:`, error)
        }
      })
    }

    // --- 真正需要特殊处理的事件 ---
    eventBus.on(WINDOW_EVENTS.READY_TO_SHOW, () => {
      this.init()
    })

    // 统一注册事件
    eventsToForward.forEach(forward)
  }

  init() {
    if (this.windowPresenter.mainWindow) {
      // this.llamaCppPresenter.setMainwindow(this.windowPresenter.mainWindow)
    }
    // 持久化 LLMProviderPresenter 的 Providers 数据
    const providers = this.configPresenter.getProviders()
    this.llmproviderPresenter.setProviders(providers)

    // 同步所有 provider 的自定义模型
    this.syncCustomModels()
  }

  private async syncCustomModels() {
    const providers = this.configPresenter.getProviders()
    for (const provider of providers) {
      if (provider.enable) {
        const customModels = this.configPresenter.getCustomModels(provider.id)
        console.log('syncCustomModels', provider.id, customModels)
        for (const model of customModels) {
          await this.llmproviderPresenter.addCustomModel(provider.id, {
            id: model.id,
            name: model.name,
            contextLength: model.contextLength,
            maxTokens: model.maxTokens
          })
        }
      }
    }
  }

  // 在应用退出时关闭数据库连接
  destroy() {
    this.sqlitePresenter.close()
    this.zentSQLitePresenter.close()
    this.organizationSQLitePresenter.close()
    this.teamSQLitePresenter.close()
    this.agentSQLitePresenter.close()
    this.runHistorySQLitePresenter.close()
    this.automationSQLitePresenter.close()
    this.genericSQLitePresenter.close()
    this.shortcutPresenter.destroy()
    this.syncPresenter.destroy()
    this.notificationPresenter.clearAllNotifications()
    this.browserAutomationPresenter.dispose()
  }
}

export const presenter = new Presenter()
ipcMain.handle(
  'presenter:call',
  (_event: IpcMainInvokeEvent, name: string, method: string, ...payloads: unknown[]) => {
    try {
      const calledPresenter = presenter[name]
      if (!calledPresenter) {
        console.warn('calling wrong presenter', name)
        return
      }
      if (!calledPresenter[method]) {
        console.warn('calling wrong presenter method', name, method)
        return
      }
      return calledPresenter[method](...payloads)
    } catch (e) {
      console.warn('error on presenter handle', e)
      return null
    }
  }
)
