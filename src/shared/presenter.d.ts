/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserWindow } from 'electron'
import { MessageFile } from './chat'
import { ShowResponse } from 'ollama'
import {MessageManager} from "@/presenter/threadPresenter/messageManager";

export type SQLITE_MESSAGE = {
  id: string
  conversation_id: string
  parent_id?: string
  role: MESSAGE_ROLE
  content: string
  user: number
  created_at: number
  order_seq: number
  token_count: number
  status: MESSAGE_STATUS
  metadata: string // JSON string of MESSAGE_METADATA
  is_context_edge: number // 0 or 1
  is_variant: number
  variants?: SQLITE_MESSAGE[]
}

export interface DirectoryMetaData {
  dirName: string
  dirPath: string
  dirCreated: Date
  dirModified: Date
}

export interface McpClient {
  name: string
  icon: string
  isRunning: boolean
  tools: MCPToolDefinition[]
  prompts?: PromptListEntry[]
  resources?: ResourceListEntry[]
}

export interface Resource {
  uri: string
  mimeType?: string
  text?: string
  blob?: string
}
export interface Prompt {
  name: string
  messages?: Array<{ role: string; content: { text: string } }> // 根据 getPrompt 示例添加
}
export interface PromptListEntry {
  name: string
  description?: string
  arguments?: {
    name: string
    description?: string
    required: boolean
  }[]
  client: {
    name: string
    icon: string
  }
}
// 定义工具调用结果的接口
export interface ToolCallResult {
  isError?: boolean
  content: Array<{
    type: string
    text: string
  }>
}

// 定义工具列表的接口
export interface Tool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: {
    title?: string // A human-readable title for the tool.
    readOnlyHint?: boolean // default false
    destructiveHint?: boolean // default true
    idempotentHint?: boolean // default false
    openWorldHint?: boolean // default true
  }
}

export interface ResourceListEntry {
  uri: string
  name?: string
  client: {
    name: string
    icon: string
  }
}

export interface ModelConfig {
  maxTokens: number
  contextLength: number
  temperature: number
  vision: boolean
  functionCall: boolean
  reasoning: boolean
}
export interface ProviderModelConfigs {
  [modelId: string]: ModelConfig
}

export interface IWindowPresenter {
  createMainWindow(): BrowserWindow
  getWindow(windowName: string): BrowserWindow | undefined
  mainWindow: BrowserWindow | undefined
  previewFile(filePath: string): void
  minimize(): void
  maximize(): void
  close(): void
  hide(): void
  show(): void
  isMaximized(): boolean
  isMainWindowFocused(): boolean
}

export interface ILlamaCppPresenter {
  init(): void
  prompt(text: string): Promise<string>
  startNewChat(): void
  destroy(): Promise<void>
}

export interface ISQLitePresenter {
  close(): void
  createConversation(title: string, settings?: Partial<CONVERSATION_SETTINGS>): Promise<string>
  deleteConversation(conversationId: string): Promise<void>
  renameConversation(conversationId: string, title: string): Promise<CONVERSATION>
  getConversation(conversationId: string): Promise<CONVERSATION>
  updateConversation(conversationId: string, data: Partial<CONVERSATION>): Promise<void>
  getConversationList(
    page: number,
    pageSize: number
  ): Promise<{ total: number; list: CONVERSATION[] }>
  insertMessage(
    conversationId: string,
    content: string,
    role: string,
    parentId: string,
    metadata: string,
    orderSeq: number,
    tokenCount: number,
    status: string,
    isContextEdge: number,
    isVariant: number
  ): Promise<string>
  queryMessages(conversationId: string): Promise<Array<SQLITE_MESSAGE>>
  deleteAllMessages(): Promise<void>
  runTransaction(operations: () => void): Promise<void>

  // 新增的消息管理方法
  getMessage(messageId: string): Promise<SQLITE_MESSAGE | null>
  getMessageVariants(messageId: string): Promise<SQLITE_MESSAGE[]>
  updateMessage(
    messageId: string,
    data: {
      content?: string
      status?: string
      metadata?: string
      isContextEdge?: number
      tokenCount?: number
    }
  ): Promise<void>
  deleteMessage(messageId: string): Promise<void>
  getMaxOrderSeq(conversationId: string): Promise<number>
  addMessageAttachment(
    messageId: string,
    attachmentType: string,
    attachmentData: string
  ): Promise<void>
  getMessageAttachments(messageId: string, type: string): Promise<{ content: string }[]>
  getLastUserMessage(conversationId: string): Promise<SQLITE_MESSAGE | null>
  getMainMessageByParentId(conversationId: string, parentId: string): Promise<SQLITE_MESSAGE | null>
  deleteAllMessagesInConversation(conversationId: string): Promise<void>
}

export interface IPresenter {
  windowPresenter: IWindowPresenter
  sqlitePresenter: ISQLitePresenter
  llmproviderPresenter: ILlmProviderPresenter
  configPresenter: IConfigPresenter
  threadPresenter: IThreadPresenter
  devicePresenter: IDevicePresenter
  upgradePresenter: IUpgradePresenter
  shortcutPresenter: IShortcutPresenter
  filePresenter: IFilePresenter
  mcpPresenter: IMCPPresenter
  syncPresenter: ISyncPresenter
  deeplinkPresenter: IDeeplinkPresenter
  notificationPresenter: INotificationPresenter
  ragPresenter: IRagPresenter
  zentSQLitePresenter: IZentSQLitePresenter
  organizationSQLitePresenter: IOrganizationSQLitePresenter
  teamSQLitePresenter: ITeamSQLitePresenter
  agentSQLitePresenter: IAgentSQLitePresenter
  runHistorySQLitePresenter: IRunHistorySQLitePresenter
  activitySQLitePresenter: IActivitySQLitePresenter
  automationSQLitePresenter: IAutomationSQLitePresenter
  genericSQLitePresenter: IGenericSQLitePresenter
  init(): void
  destroy(): void
}

export interface INotificationPresenter {
  showNotification(options: { id: string; title: string; body: string; silent?: boolean }): void
  clearNotification(id: string): void
  clearAllNotifications(): void
}

export interface IConfigPresenter {
  getSetting<T>(key: string): T | undefined
  setSetting<T>(key: string, value: T): void
  getProviders(): LLM_PROVIDER[]
  setProviders(providers: LLM_PROVIDER[]): void
  getProviderById(id: string): LLM_PROVIDER | undefined
  setProviderById(id: string, provider: LLM_PROVIDER): void
  getProviderModels(providerId: string): MODEL_META[]
  setProviderModels(providerId: string, models: MODEL_META[]): void
  getEnabledProviders(): LLM_PROVIDER[]
  getModelDefaultConfig(modelId: string, providerId?: string): ModelConfig
  getAllEnabledModels(): Promise<{ providerId: string; models: RENDERER_MODEL_META[] }[]>
  // 日志设置
  getLoggingEnabled(): boolean
  setLoggingEnabled(enabled: boolean): void
  openLoggingFolder(): void
  // 自定义模型管理
  getCustomModels(providerId: string): MODEL_META[]
  setCustomModels(providerId: string, models: MODEL_META[]): void
  addCustomModel(providerId: string, model: MODEL_META): void
  removeCustomModel(providerId: string, modelId: string): void
  updateCustomModel(providerId: string, modelId: string, updates: Partial<MODEL_META>): void
  // 关闭行为设置
  getCloseToQuit(): boolean
  setCloseToQuit(value: boolean): void
  getModelStatus(providerId: string, modelId: string): boolean
  setModelStatus(providerId: string, modelId: string, enabled: boolean): void
  // 语言设置
  getLanguage(): string
  getDefaultProviders(): LLM_PROVIDER[]
  // 代理设置
  getProxyMode(): string
  setProxyMode(mode: string): void
  getCustomProxyUrl(): string
  setCustomProxyUrl(url: string): void
  // 自定义搜索引擎
  getCustomSearchEngines(): Promise<SearchEngineTemplate[]>
  setCustomSearchEngines(engines: SearchEngineTemplate[]): Promise<void>
  // artifacts效果设置
  getArtifactsEffectEnabled(): boolean
  setArtifactsEffectEnabled(enabled: boolean): void
  // 搜索预览设置
  getSearchPreviewEnabled(): Promise<boolean>
  setSearchPreviewEnabled(enabled: boolean): void
  // 投屏保护设置
  getContentProtectionEnabled(): boolean
  setContentProtectionEnabled(enabled: boolean): void
  // 同步设置
  getSyncEnabled(): boolean
  setSyncEnabled(enabled: boolean): void
  getSyncFolderPath(): string
  setSyncFolderPath(folderPath: string): void
  getLastSyncTime(): number
  setLastSyncTime(time: number): void
  // MCP配置相关方法
  getMcpServers(): Promise<Record<string, MCPServerConfig>>
  setMcpServers(servers: Record<string, MCPServerConfig>): Promise<void>
  getMcpDefaultServers(): Promise<string[]>
  addMcpDefaultServer(serverName: string): Promise<void>
  removeMcpDefaultServer(serverName: string): Promise<void>
  toggleMcpDefaultServer(serverName: string): Promise<void>
  getMcpEnabled(): Promise<boolean>
  setMcpEnabled(enabled: boolean): Promise<void>
  addMcpServer(serverName: string, config: MCPServerConfig): Promise<boolean>
  removeMcpServer(serverName: string): Promise<void>
  updateMcpServer(serverName: string, config: Partial<MCPServerConfig>): Promise<void>
  getMcpConfHelper(): any // 用于获取MCP配置助手
  getModelConfig(modelId: string, providerId?: string): ModelConfig
  setNotificationsEnabled(enabled: boolean): void
  getNotificationsEnabled(): boolean
  // Miniconda installation
  checkMinicondaInstalled(): Promise<boolean>
  installMiniconda(): Promise<boolean>
}
export type RENDERER_MODEL_META = {
  id: string
  name: string
  group: string
  providerId: string
  enabled: boolean
  isCustom: boolean
  contextLength: number
  maxTokens: number
  vision?: boolean
  functionCall?: boolean
  reasoning?: boolean
}
export type MODEL_META = {
  id: string
  name: string
  group: string
  providerId: string
  isCustom: boolean
  contextLength: number
  maxTokens: number
  description?: string
  vision?: boolean
  functionCall?: boolean
  reasoning?: boolean
}
export type LLM_PROVIDER = {
  id: string
  name: string
  apiType: string
  apiKey: string
  baseUrl: string
  enable: boolean
  custom?: boolean
  websites?: {
    official: string
    apiKey: string
    docs: string
    models: string
  }
}

export type LLM_PROVIDER_BASE = {
  websites?: {
    official: string
    apiKey: string
    docs: string
    models: string
    defaultBaseUrl: string
  }
} & LLM_PROVIDER

export interface ILlmProviderPresenter {
  setProviders(provider: LLM_PROVIDER[]): void
  getProviders(): LLM_PROVIDER[]
  getProviderById(id: string): LLM_PROVIDER
  getModelList(providerId: string): Promise<MODEL_META[]>
  updateModelStatus(providerId: string, modelId: string, enabled: boolean): Promise<void>
  addCustomModel(
    providerId: string,
    model: Omit<MODEL_META, 'providerId' | 'isCustom' | 'group'>
  ): Promise<MODEL_META>
  removeCustomModel(providerId: string, modelId: string): Promise<boolean>
  updateCustomModel(
    providerId: string,
    modelId: string,
    updates: Partial<MODEL_META>
  ): Promise<boolean>
  getCustomModels(providerId: string): Promise<MODEL_META[]>
  startStreamCompletion(
    providerId: string,
    messages: ChatMessage[],
    modelId: string,
    eventId: string,
    temperature?: number,
    maxTokens?: number
  ): AsyncGenerator<LLMAgentEvent, void, unknown>
  generateCompletion(
    providerId: string,
    messages: { role: string; content: string }[],
    modelId: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<string>
  stopStream(eventId: string): Promise<void>
  check(providerId: string): Promise<{ isOk: boolean; errorMsg: string | null }>
  summaryTitles(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    providerId: string,
    modelId: string
  ): Promise<string>
  listOllamaModels(): Promise<OllamaModel[]>
  showOllamaModelInfo(modelName: string): Promise<ShowResponse>
  listOllamaRunningModels(): Promise<OllamaModel[]>
  pullOllamaModels(modelName: string): Promise<boolean>
  deleteOllamaModel(modelName: string): Promise<boolean>
}
export type CONVERSATION_SETTINGS = {
  systemPrompt: string
  temperature: number
  contextLength: number
  maxTokens: number
  providerId: string
  modelId: string
  userAppToken: string
  artifacts: 0 | 1
}

export type CONVERSATION = {
  id: string
  title: string
  thumbnail: string
  settings: CONVERSATION_SETTINGS
  createdAt: number
  updatedAt: number
  is_new?: number
  userApptoken?: string
  artifacts?: number
  is_pinned?: number
}

export interface IThreadPresenter {
  // 基本对话操作
  createConversation(title: string, settings?: Partial<CONVERSATION_SETTINGS>): Promise<string>
  deleteConversation(conversationId: string): Promise<void>
  getConversation(conversationId: string): Promise<CONVERSATION>
  renameConversation(conversationId: string, title: string): Promise<CONVERSATION>
  updateConversationTitle(conversationId: string, title: string): Promise<void>
  updateConversationSettings(
    conversationId: string,
    settings: Partial<CONVERSATION_SETTINGS>
  ): Promise<void>

  // 会话分支操作
  forkConversation(
    targetConversationId: string,
    targetMessageId: string,
    newTitle: string,
    settings?: Partial<CONVERSATION_SETTINGS>
  ): Promise<string>

  // 对话列表和激活状态
  getConversationList(
    page: number,
    pageSize: number
  ): Promise<{ total: number; list: CONVERSATION[] }>
  setActiveConversation(conversationId: string): Promise<void>
  getActiveConversation(): Promise<CONVERSATION | null>

  getSearchResults(messageId: string): Promise<SearchResult[]>
  clearAllMessages(conversationId: string): Promise<void>

  // 消息操作
  getMessages(
    conversationId: string,
    page: number,
    pageSize: number
  ): Promise<{ total: number; list: MESSAGE[] }>
  sendMessage(conversationId: string, content: string, role: MESSAGE_ROLE): Promise<MESSAGE | null>
  showMessage(conversationId: string, content: string, role: MESSAGE_ROLE): Promise<MESSAGE | null>
  startStreamCompletion(conversationId: string, queryMsgId?: string, agentId?: string): Promise<void>
  editMessage(messageId: string, content: string): Promise<MESSAGE>
  deleteMessage(messageId: string): Promise<void>
  retryMessage(messageId: string, modelId?: string): Promise<MESSAGE>
  getMessage(messageId: string): Promise<MESSAGE>
  sendMessageByMessageManager(conversationId: string,
    content: string,
    role: MESSAGE_ROLE,
    parentId: string,
    isVariant: boolean,
    metadata: MESSAGE_METADATA,
    searchResults?: string
  ): Promise<MESSAGE | null>

  getMessageVariants(messageId: string): Promise<MESSAGE[]>
  updateMessageStatus(messageId: string, status: MESSAGE_STATUS): Promise<void>
  updateMessageMetadata(messageId: string, metadata: Partial<MESSAGE_METADATA>): Promise<void>
  getMessageExtraInfo(messageId: string, type: string): Promise<Record<string, unknown>[]>

  handleLLMAgentEnd(msg: LLMAgentEventData): Promise<void>
  handleLLMAgentResponse(msg: LLMAgentEventData): Promise<void>
  findGeneratingState(conversationId: string): Promise<GeneratingMessageState | null>
  getGeneratingMessages(): Promise<Map<string, GeneratingMessageState> | null>
  getGeneratingMessageState(messageId: string): Promise<GeneratingMessageState | null>

  // 上下文控制
  getContextMessages(conversationId: string): Promise<MESSAGE[]>
  clearContext(conversationId: string): Promise<void>
  markMessageAsContextEdge(messageId: string, isEdge: boolean): Promise<void>
  summaryTitles(modelId?: string): Promise<string>
  clearActiveThread(): Promise<void>
  stopMessageGeneration(messageId: string): Promise<void>
  getSearchEngines(): Promise<SearchEngineTemplate[]>
  getActiveSearchEngine(): Promise<SearchEngineTemplate>
  setActiveSearchEngine(engineId: string): Promise<void>
  setSearchEngine(engineId: string): Promise<boolean>
  // 搜索引擎测试
  testSearchEngine(query?: string): Promise<boolean>
  // 搜索助手模型设置
  setSearchAssistantModel(model: MODEL_META, providerId: string): void
  getMainMessageByParentId(conversationId: string, parentId: string): Promise<Message | null>
  destroy(): void
  continueStreamCompletion(conversationId: string, queryMsgId: string, agentId?: string): Promise<AssistantMessage>
  toggleConversationPinned(conversationId: string, isPinned: boolean): Promise<void>
}

export type MESSAGE_STATUS = 'sent' | 'pending' | 'error'
export type MESSAGE_ROLE = 'user' | 'assistant' | 'system' | 'function'

export type MESSAGE_METADATA = {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  generationTime: number
  firstTokenTime: number
  tokensPerSecond: number
  model?: string
  provider?: string
  reasoningStartTime?: number
  reasoningEndTime?: number
}

export interface IMessageManager {
  // 基本消息操作
  sendMessage(
    conversationId: string,
    content: string,
    role: MESSAGE_ROLE,
    parentId: string,
    isVariant: boolean,
    metadata: MESSAGE_METADATA
  ): Promise<MESSAGE>
  editMessage(messageId: string, content: string): Promise<MESSAGE>
  deleteMessage(messageId: string): Promise<void>
  retryMessage(messageId: string, metadata: MESSAGE_METADATA): Promise<MESSAGE>

  // 消息查询
  getMessage(messageId: string): Promise<MESSAGE>
  getMessageVariants(messageId: string): Promise<MESSAGE[]>
  getMessageThread(
    conversationId: string,
    page: number,
    pageSize: number
  ): Promise<{
    total: number
    list: MESSAGE[]
  }>
  getContextMessages(conversationId: string, contextLength: number): Promise<MESSAGE[]>

  // 消息状态管理
  updateMessageStatus(messageId: string, status: MESSAGE_STATUS): Promise<void>
  updateMessageMetadata(messageId: string, metadata: Partial<MESSAGE_METADATA>): Promise<void>

  // 上下文管理
  markMessageAsContextEdge(messageId: string, isEdge: boolean): Promise<void>
}

export interface IDevicePresenter {
  getAppVersion(): Promise<string>
  getDeviceInfo(): Promise<DeviceInfo>
  getCPUUsage(): Promise<number>
  getMemoryUsage(): Promise<MemoryInfo>
  getDiskSpace(): Promise<DiskInfo>
  resetData(): Promise<void>

  // 目录选择和应用重启
  selectDirectory(): Promise<{ canceled: boolean; filePaths: string[] }>
  openFileDialog(options: { title?: string; filters?: Array<{ name: string; extensions: string[] }>; properties?: string[] }): Promise<{ canceled: boolean; filePaths: string[] }>
  restartApp(): Promise<void>

  // 图片缓存
  cacheImage(imageData: string): Promise<string>
}

export type DeviceInfo = {
  platform: string
  arch: string
  cpuModel: string
  totalMemory: number
  osVersion: string
}

export type MemoryInfo = {
  total: number
  free: number
  used: number
}

export type DiskInfo = {
  total: number
  free: number
  used: number
}

export type LLMResponse = {
  content: string
  reasoning_content?: string
  tool_call_name?: string
  tool_call_params?: string
  tool_call_response?: string
  tool_call_id?: string
  tool_call_server_name?: string
  tool_call_server_icons?: string
  tool_call_server_description?: string
  tool_call_response_raw?: MCPToolResponse
  maximum_tool_calls_reached?: boolean
  totalUsage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
export type LLMResponseStream = {
  content?: string
  reasoning_content?: string
  image_data?: {
    data: string
    mimeType: string
  }
  tool_call?: 'start' | 'end' | 'error'
  tool_call_name?: string
  tool_call_params?: string
  tool_call_response?: string
  tool_call_id?: string
  tool_call_server_name?: string
  tool_call_server_icons?: string
  tool_call_server_description?: string
  tool_call_response_raw?: MCPToolResponse
  maximum_tool_calls_reached?: boolean
  totalUsage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
export interface IUpgradePresenter {
  checkUpdate(): Promise<void>
  getUpdateStatus(): {
    status: UpdateStatus | null
    progress: UpdateProgress | null
    error: string | null
    updateInfo: {
      version: string
      releaseDate: string
      releaseNotes: any
      githubUrl: string | undefined
      downloadUrl: string | undefined
    } | null
  }
  goDownloadUpgrade(type: 'github' | 'netdisk'): Promise<void>
  startDownloadUpdate(): boolean
  restartToUpdate(): boolean
  restartApp(): void
}
// 更新状态类型
export type UpdateStatus =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

export interface SearchResult {
  title: string
  url: string
  rank: number
  content?: string
  icon?: string
  description?: string
}

export interface ISearchPresenter {
  init(): void
  search(query: string, engine: 'google' | 'baidu'): Promise<SearchResult[]>
}

export type FileOperation = {
  path: string
  content?: string
}

export interface IFilePresenter {
  readFile(relativePath: string): Promise<string>
  writeFile(operation: FileOperation): Promise<void>
  deleteFile(relativePath: string): Promise<void>
  createFileAdapter(filePath: string, typeInfo?: string): Promise<any> // Return type might need refinement
  prepareFile(absPath: string, typeInfo?: string): Promise<MessageFile>
  prepareDirectory(absPath: string): Promise<MessageFile>
  writeTemp(file: { name: string; content: string | Buffer | ArrayBuffer }): Promise<string>
  isDirectory(absPath: string): Promise<boolean>
  getMimeType(filePath: string): Promise<string>
  writeImageBase64(file: { name: string; content: string }): Promise<string>
}

export interface FileMetaData {
  fileName: string
  fileSize: number
  // fileHash: string
  fileDescription?: string
  fileCreated: Date
  fileModified: Date
}
// 根据 Ollama SDK 定义模型接口
export interface OllamaModel {
  name: string
  model: string
  modified_at: Date | string // 修改为可以是 Date 或 string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
}

// 定义进度回调的接口
export interface ProgressResponse {
  status: string
  digest?: string
  total?: number
  completed?: number
}

// MCP相关类型定义
export interface MCPServerConfig {
  command: string
  args: string[]
  env: Record<string, unknow>
  descriptions: string
  icons: string
  autoApprove: string[]
  disable?: boolean
  baseUrl?: string
  customHeaders?: Record<string, string>
  customNpmRegistry?: string
  type: 'sse' | 'stdio' | 'inmemory' | 'http'
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>
  defaultServers: string[]
  mcpEnabled: boolean
}

export interface MCPToolDefinition {
  type: string
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, any>
      required?: string[]
    }
  }
  server: {
    name: string
    icons: string
    description: string
  }
}

export interface MCPToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
  server: {
    name: string
    icons: string
    description: string
  }
}

export interface MCPToolResponse {
  /** 工具调用的唯一标识符 */
  toolCallId: string

  /**
   * 工具调用的响应内容
   * 可以是简单字符串或结构化内容数组
   */
  content: string | MCPContentItem[]

  /** 可选的元数据 */
  _meta?: Record<string, any>

  /** 是否发生错误 */
  isError?: boolean

  /** 当使用兼容模式时，可能直接返回工具结果 */
  toolResult?: unknown
}

/** 内容项类型 */
export type MCPContentItem = MCPTextContent | MCPImageContent | MCPResourceContent

/** 文本内容 */
export interface MCPTextContent {
  type: 'text'
  text: string
}

/** 图像内容 */
export interface MCPImageContent {
  type: 'image'
  data: string // Base64编码的图像数据
  mimeType: string // 例如 "image/png", "image/jpeg" 等
}

/** 资源内容 */
export interface MCPResourceContent {
  type: 'resource'
  resource: {
    uri: string
    mimeType?: string
    /** 资源文本内容，与blob互斥 */
    text?: string
    /** 资源二进制内容，与text互斥 */
    blob?: string
  }
}

export interface IMCPPresenter {
  getMcpServers(): Promise<Record<string, MCPServerConfig>>
  getMcpClients(): Promise<McpClient[]>
  getMcpDefaultServers(): Promise<string[]>
  addMcpDefaultServer(serverName: string): Promise<void>
  removeMcpDefaultServer(serverName: string): Promise<void>
  toggleMcpDefaultServer(serverName: string): Promise<void>
  addMcpServer(serverName: string, config: MCPServerConfig): Promise<boolean>
  removeMcpServer(serverName: string): Promise<void>
  updateMcpServer(serverName: string, config: Partial<MCPServerConfig>): Promise<void>
  isServerRunning(serverName: string): Promise<boolean>
  startServer(serverName: string): Promise<void>
  stopServer(serverName: string): Promise<void>
  getAllToolDefinitions(): Promise<MCPToolDefinition[]>
  getAllPrompts(): Promise<Array<PromptListEntry & { client: { name: string; icon: string } }>>
  getAllResources(): Promise<Array<ResourceListEntry & { client: { name: string; icon: string } }>>
  getPrompt(prompt: PromptListEntry, args?: Record<string, unknown>): Promise<unknown>
  readResource(resource: ResourceListEntry): Promise<Resource>
  callTool(request: {
    id: string
    type: string
    function: {
      name: string
      arguments: string
    }
  }): Promise<{ content: string; rawData: MCPToolResponse }>
  setMcpEnabled(enabled: boolean): Promise<void>
  getMcpEnabled(): Promise<boolean>
  resetToDefaultServers(): Promise<void>
  /**
   * Execute JavaScript code in a sandboxed environment using vm2
   * @param code JavaScript code to execute
   * @returns Result of the code execution as a string
   */
  runJavaScriptCode(code: string): Promise<string>

  /**
   * Execute Python code using the configured Python interpreter
   * @param code Python code to execute
   * @returns Result of the code execution as a string
   */
  runPythonCode(code: string): Promise<string>
}

export interface IDeeplinkPresenter {
  /**
   * 初始化 DeepLink 协议
   */
  init(): void

  /**
   * 处理 DeepLink 协议
   * @param url DeepLink URL
   */
  handleDeepLink(url: string): Promise<void>

  /**
   * 处理 start 命令
   * @param params URL 参数
   */
  handleStart(params: URLSearchParams): Promise<void>

  /**
   * 处理 mcp/install 命令
   * @param params URL 参数
   */
  handleMcpInstall(params: URLSearchParams): Promise<void>
}

export interface ISyncPresenter {
  // 备份相关操作
  startBackup(): Promise<void>
  cancelBackup(): Promise<void>
  getBackupStatus(): Promise<{ isBackingUp: boolean; lastBackupTime: number }>

  // 导入相关操作
  importFromSync(importMode?: ImportMode): Promise<{ success: boolean; message: string }>
  checkSyncFolder(): Promise<{ exists: boolean; path: string }>
  openSyncFolder(): Promise<void>

  // 初始化和销毁
  init(): void
  destroy(): void
}

// RAG Entry interface
export interface RAGEntry {
  id: string
  content: string
  embedding?: number[]
  title?: string
  createdAt: number
  score?: number
}

// RAG Data interface
export interface RAGData {
  entries: RAGEntry[]
  lastUpdated: number
}

export interface IRagPresenter {
  // Get RAG data for an agent
  getAgentRagData(agentId: string): Promise<RAGData>

  // Save RAG data for an agent
  saveAgentRagData(agentId: string, ragData: RAGData): Promise<boolean>

  // Add a new RAG entry
  addRagEntry(agentId: string, content: string, title?: string): Promise<RAGEntry | null>

  // Update an existing RAG entry
  updateRagEntry(agentId: string, entryId: string, content: string, title?: string): Promise<boolean>

  // Delete a RAG entry
  deleteRagEntry(agentId: string, entryId: string): Promise<boolean>

  // Find similar entries based on query
  findSimilarEntries(agentId: string, query: string, topK?: number): Promise<RAGEntry[]>

  // Format RAG entries for inclusion in prompt
  formatRagEntriesForPrompt(entries: RAGEntry[]): string
}

// 从 LLM Provider 的 coreStream 返回的标准化事件
export interface LLMCoreStreamEvent {
  type:
    | 'text'
    | 'reasoning'
    | 'tool_call_start'
    | 'tool_call_chunk'
    | 'tool_call_end'
    | 'error'
    | 'usage'
    | 'stop'
    | 'image_data'
  content?: string // 用于 type 'text'
  reasoning_content?: string // 用于 type 'reasoning'
  tool_call_id?: string // 用于 tool_call_* 类型
  tool_call_name?: string // 用于 tool_call_start
  tool_call_arguments_chunk?: string // 用于 tool_call_chunk (流式参数)
  tool_call_arguments_complete?: string // 用于 tool_call_end (可选，如果一次性可用)
  error_message?: string // 用于 type 'error'
  usage?: {
    // 用于 type 'usage'
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  stop_reason?: 'tool_use' | 'max_tokens' | 'stop_sequence' | 'error' | 'complete' // 用于 type 'stop'
  image_data?: {
    // 用于 type 'image_data'
    data: string // Base64 编码的图像数据
    mimeType: string
  }
}

// 定义ChatMessage接口用于统一消息格式
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | ChatMessageContent[]
  tool_calls?: Array<{
    function: {
      arguments: string
      name: string
    }
    id: string
    type: 'function'
  }>
  tool_call_id?: string
}

export interface ChatMessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

export interface LLMAgentEventData {
  eventId: string
  content?: string
  reasoning_content?: string
  tool_call_id?: string
  tool_call_name?: string
  tool_call_params?: string
  tool_call_response?: string | MCPToolResponse['content'] // Allow complex tool response content
  maximum_tool_calls_reached?: boolean
  tool_call_server_name?: string
  tool_call_server_icons?: string
  tool_call_server_description?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool_call_response_raw?: any
  tool_call?: 'start' | 'end' | 'error'
  totalUsage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  image_data?: { data: string; mimeType: string }
  error?: string // For error event
  userStop?: boolean // For end event
}
export type LLMAgentEvent =
  | { type: 'response'; data: LLMAgentEventData }
  | { type: 'error'; data: { eventId: string; error: string } }
  | { type: 'end'; data: { eventId: string; userStop: boolean } }

export interface ORGANIZATION_USER_TYPE {
  id: string
  user: number
  organization: string
  role: string
  status: string
  data: string // JSON string
  invited_at: string
  joined_at: string
  removed_at: string
  created_at: string
  updated_at: string
}

export interface ORGANIZATION_TYPE {
  id: string
  name: string
  slug?: string
  description?: string
  seat_pool_limit?: number
  billing_customer?: string
  subscription?: string
  is_public?: number
  user?: number
  by?: string
  created_at?: string
  thumbnail?: string
  cover_image_url?: string
  bio?: string
  mode?: string
  data?: string // JSON string
}

export interface IOrganizationSQLitePresenter {
  // Organization methods
  insert(organization: Omit<ORGANIZATION_TYPE, 'id' | 'created_at'>): string
  query(): ORGANIZATION_TYPE[]
  get(id: string): ORGANIZATION_TYPE | null
  update(id: string, data: Partial<Omit<ORGANIZATION_TYPE, 'id' | 'created_at'>>): boolean
  delete(id: string): boolean
  close(): void

  // Organization Users methods
  insertUser(organizationUser: Omit<ORGANIZATION_USER_TYPE, 'id' | 'created_at' | 'updated_at' | 'invited_at'>): string
  queryUsers(): ORGANIZATION_USER_TYPE[]
  getUsersByOrganization(organizationId: string): ORGANIZATION_USER_TYPE[]
  getUser(id: string): ORGANIZATION_USER_TYPE | null
  updateUser(id: string, data: Partial<Omit<ORGANIZATION_USER_TYPE, 'id' | 'created_at' | 'updated_at'>>): boolean
  updateUserRole(id: string, role: string): boolean
  updateUserStatus(id: string, status: string): boolean
  markUserAsJoined(id: string): boolean
  markUserAsRemoved(id: string): boolean
  deleteUser(id: string): boolean
  deleteUsersByOrganization(organizationId: string): boolean
}

export interface IZentSQLitePresenter {
  // Basic methods for Zent operations
  close(): void
}

export interface ITeamSQLitePresenter {
  // Basic methods for Team operations
  close(): void
}

// Agent type definition
export interface AGENT {
  id: string
  name: string
  slug: string
  prompt?: string
  categories?: string // JSON string
  tags?: string // JSON string
  zents?: string // JSON string
  data?: string // JSON string
  is_public?: number
  created_at?: string
  user?: number
  organization?: string
  team?: string
  by?: string
  thumbnail?: string
  cover_image_url?: string
  bio?: string
}

export interface IAgentSQLitePresenter {
  // Basic methods for Agent operations
  close(): void

  // Agent database methods
  createAgentDatabase(slug: string): string
  getAgentDatabasePath(slug: string): string

  // CRUD operations
  insert(agent: Omit<AGENT, 'id' | 'created_at'>): string
  query(): AGENT[]
  get(id: string): AGENT | null
  update(id: string, data: Partial<Omit<AGENT, 'id' | 'created_at'>>): boolean
  delete(id: string): boolean
}

export interface IRunHistorySQLitePresenter {
  // Basic methods for RunHistory operations
  close(): void
}

export interface IActivitySQLitePresenter {
  // Basic methods for Activity operations
  close(): void
}

export interface IAutomationSQLitePresenter {
  // Basic methods for Automation operations
  close(): void
}

export interface IGenericSQLitePresenter {
  // Methods for generic SQLite operations
  executeQuery(dbPath: string, query: string, params?: any[]): Promise<any[]>
  close(): void
}

export interface IShortcutPresenter {
  // Basic methods for Shortcut operations
  destroy(): void
}
