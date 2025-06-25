/**
 * 事件系统常量定义
 *
 * 按功能领域分类事件名，采用统一的命名规范：
 * - 使用冒号分隔域和具体事件
 * - 使用小写并用连字符连接多个单词
 *
 * 看似这里和 renderer/events.ts 重复了，其实不然，这里只包含了main->renderer 和 main->main 的事件
 */

// 配置相关事件
export const CONFIG_EVENTS = {
  PROVIDER_CHANGED: 'config:provider-changed', // 替代 provider-setting-changed
  SYSTEM_CHANGED: 'config:system-changed',
  MODEL_LIST_CHANGED: 'config:model-list-changed', // 替代 provider-models-updated（ConfigPresenter）
  MODEL_STATUS_CHANGED: 'config:model-status-changed', // 替代 model-status-changed（ConfigPresenter）
  SETTING_CHANGED: 'config:setting-changed', // 替代 setting-changed（ConfigPresenter）
  PROXY_MODE_CHANGED: 'config:proxy-mode-changed',
  CUSTOM_PROXY_URL_CHANGED: 'config:custom-proxy-url-changed',
  ARTIFACTS_EFFECT_CHANGED: 'config:artifacts-effect-changed',
  SYNC_SETTINGS_CHANGED: 'config:sync-settings-changed',
  SEARCH_ENGINES_UPDATED: 'config:search-engines-updated',
  CONTENT_PROTECTION_CHANGED: 'config:content-protection-changed',
  PROXY_RESOLVED: 'config:proxy-resolved'
}

// 会话相关事件
export const CONVERSATION_EVENTS = {
  CREATED: 'conversation:created',
  ACTIVATED: 'conversation:activated', // 替代 conversation-activated
  DEACTIVATED: 'conversation:deactivated', // 替代 active-conversation-cleared
  MESSAGE_EDITED: 'conversation:message-edited' // 替代 message-edited
}

// 通信相关事件
export const STREAM_EVENTS = {
  RESPONSE: 'stream:response', // 替代 stream-response
  END: 'stream:end', // 替代 stream-end
  ERROR: 'stream:error' // 替代 stream-error
}

// 应用更新相关事件
export const UPDATE_EVENTS = {
  STATUS_CHANGED: 'update:status-changed', // 替代 update-status-changed
  ERROR: 'update:error', // 替代 update-error
  PROGRESS: 'update:progress', // 下载进度
  WILL_RESTART: 'update:will-restart' // 准备重启
}

// 窗口相关事件
export const WINDOW_EVENTS = {
  READY_TO_SHOW: 'window:ready-to-show', // 替代 main-window-ready-to-show
  FORCE_QUIT_APP: 'window:force-quit-app', // 替代 force-quit-app
  APP_FOCUS: 'app:focus',
  APP_BLUR: 'app:blur',
  WINDOW_MAXIMIZED: 'window:maximized',
  WINDOW_UNMAXIMIZED: 'window:unmaximized'
}

// ollama 相关事件
export const OLLAMA_EVENTS = {
  PULL_MODEL_PROGRESS: 'ollama:pull-model-progress'
}

// MCP 相关事件
export const MCP_EVENTS = {
  SERVER_STARTED: 'mcp:server-started',
  SERVER_STOPPED: 'mcp:server-stopped',
  CONFIG_CHANGED: 'mcp:config-changed',
  TOOL_CALL_RESULT: 'mcp:tool-call-result',
  SERVER_STATUS_CHANGED: 'mcp:server-status-changed',
  CLIENT_LIST_UPDATED: 'mcp:client-list-updated'
}

// 同步相关事件
export const SYNC_EVENTS = {
  BACKUP_STARTED: 'sync:backup-started',
  BACKUP_COMPLETED: 'sync:backup-completed',
  BACKUP_ERROR: 'sync:backup-error',
  IMPORT_STARTED: 'sync:import-started',
  IMPORT_COMPLETED: 'sync:import-completed',
  IMPORT_ERROR: 'sync:import-error',
  DATA_CHANGED: 'sync:data-changed'
}

// DeepLink 相关事件
export const DEEPLINK_EVENTS = {
  PROTOCOL_RECEIVED: 'deeplink:protocol-received',
  START: 'deeplink:start',
  MCP_INSTALL: 'deeplink:mcp-install'
}

// 全局通知相关事件
export const NOTIFICATION_EVENTS = {
  SHOW_ERROR: 'notification:show-error', // 显示错误通知
  SYS_NOTIFY_CLICKED: 'notification:sys-notify-clicked' // 系统通知点击事件
}

export const SHORTCUT_EVENTS = {
  ZOOM_IN: 'shortcut:zoom-in',
  ZOOM_OUT: 'shortcut:zoom-out',
  ZOOM_RESUME: 'shortcut:zoom-resume',
  CREATE_NEW_CONVERSATION: 'shortcut:create-new-conversation',
  GO_SETTINGS: 'shortcut:go-settings',
  CLEAN_CHAT_HISTORY: 'shortcut:clean-chat-history'
}
