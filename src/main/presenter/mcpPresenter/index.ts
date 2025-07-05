import {
  IMCPPresenter,
  MCPServerConfig,
  MCPToolDefinition,
  MCPToolCall,
  McpClient,
  MCPToolResponse,
  Prompt,
  ResourceListEntry,
  Resource,
  PromptListEntry
} from '@shared/presenter'
import { VM } from 'vm2'
import { ServerManager } from './serverManager'
import { ToolManager } from './toolManager'
import { eventBus } from '@/eventbus'
import { MCP_EVENTS, NOTIFICATION_EVENTS } from '@/events'
import { IConfigPresenter } from '@shared/presenter'
import { getErrorMessageLabels } from '@shared/i18n'
import { OpenAI } from 'openai'
import { presenter } from '@/presenter'
import fs from "fs";

// 定义MCP工具接口
interface MCPTool {
  id: string
  name: string
  type: string
  description: string
  serverName: string
  inputSchema: {
    properties: Record<string, Record<string, unknown>>
    required: string[]
    [key: string]: unknown
  }
}

// 定义各家LLM的工具类型接口
interface OpenAIToolCall {
  function: {
    name: string
    arguments: string
  }
}

interface AnthropicToolUse {
  name: string
  input: Record<string, unknown>
}

interface GeminiFunctionCall {
  name: string
  args: Record<string, unknown>
}

// 定义工具转换接口
interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, Record<string, unknown>>
      required: string[]
    }
  }
}

interface AnthropicTool {
  name: string
  description: string
  input_schema: {
    type: string
    properties: Record<string, Record<string, unknown>>
    required: string[]
  }
}

interface GeminiTool {
  functionDeclarations: {
    name: string
    description: string
    parameters?: {
      type: string
      properties: Record<string, Record<string, unknown>>
      required: string[]
    }
  }[]
}

// 完整版的 McpPresenter 实现
export class McpPresenter implements IMCPPresenter {
  private serverManager: ServerManager
  private toolManager: ToolManager
  private configPresenter: IConfigPresenter

  constructor(configPresenter?: IConfigPresenter) {
    console.log('Initializing MCP Presenter')

    // 如果提供了configPresenter实例，则使用它，否则保持与当前方式兼容
    if (configPresenter) {
      this.configPresenter = configPresenter
    } else {
      // 这里需要处理项目环境下的循环引用问题，通过延迟初始化解决
      // McpPresenter会在Presenter初始化过程中创建，此时presenter还不可用
      // 我们在initialize方法中会设置configPresenter
      this.configPresenter = {} as IConfigPresenter
    }

    this.serverManager = new ServerManager(this.configPresenter)
    this.toolManager = new ToolManager(this.configPresenter, this.serverManager)

    // 应用启动时初始化
    this.initialize()
  }

  private async initialize() {
    try {
      // 如果没有提供configPresenter，从presenter中获取
      if (!this.configPresenter.getLanguage) {
        // 重新创建管理器
        this.serverManager = new ServerManager(this.configPresenter)
        this.toolManager = new ToolManager(this.configPresenter, this.serverManager)
      }

      // 加载配置
      const [servers, defaultServers] = await Promise.all([
        this.configPresenter.getMcpServers(),
        this.configPresenter.getMcpDefaultServers()
      ])

      // 先测试npm registry速度
      console.log('[MCP] Testing npm registry speed...')
      try {
        await this.serverManager.testNpmRegistrySpeed()
        console.log(
          `[MCP] npm registry speed test completed, selected best registry: ${this.serverManager.getNpmRegistry()}`
        )
      } catch (error) {
        console.error('[MCP] npm registry speed test failed:', error)
      }

      // 如果有默认服务器，尝试启动
      if (defaultServers.length > 0) {
        for (const serverName of defaultServers) {
          if (servers[serverName]) {
            console.log(`[MCP] Attempting to start default server: ${serverName}`)

            try {
              await this.serverManager.startServer(serverName)
              console.log(`[MCP] Default server ${serverName} started successfully`)

              // 通知渲染进程服务器已启动
              eventBus.emit(MCP_EVENTS.SERVER_STARTED, serverName)
            } catch (error) {
              console.error(`[MCP] Failed to start default server ${serverName}:`, error)
            }
          }
        }
      }
    } catch (error) {
      console.error('[MCP] Initialization failed:', error)
    }
  }

  // 获取MCP服务器配置
  getMcpServers(): Promise<Record<string, MCPServerConfig>> {
    return this.configPresenter.getMcpServers()
  }

  // 获取所有MCP服务器
  async getMcpClients(): Promise<McpClient[]> {
    const clients = await this.toolManager.getRunningClients()
    const clientsList: McpClient[] = []
    for (const client of clients) {
      const results: MCPToolDefinition[] = []
      const tools = await client.listTools()
      for (const tool of tools) {
        const properties = tool.inputSchema.properties || {}
        const toolProperties = { ...properties }
        for (const key in toolProperties) {
          if (!toolProperties[key].description) {
            toolProperties[key].description = 'Params of ' + key
          }
        }
        results.push({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: {
              type: 'object',
              properties: toolProperties,
              required: Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required : []
            }
          },
          server: {
            name: client.serverName,
            icons: client.serverConfig['icons'] as string,
            description: client.serverConfig['description'] as string
          }
        })
      }

      // 创建客户端基本信息对象
      const clientObj: McpClient = {
        name: client.serverName,
        icon: client.serverConfig['icons'] as string,
        isRunning: client.isServerRunning(),
        tools: results
      }

      // 检查并添加 prompts（如果支持）
      if (typeof client.listPrompts === 'function') {
        try {
          const prompts = await client.listPrompts()
          if (prompts && prompts.length > 0) {
            clientObj.prompts = prompts
          }
        } catch (error) {
          console.error(
            `[MCP] Failed to get prompt templates for client ${client.serverName}:`,
            error
          )
        }
      }

      // 检查并添加 resources（如果支持）
      if (typeof client.listResources === 'function') {
        try {
          const resources = await client.listResources()
          if (resources && resources.length > 0) {
            clientObj.resources = resources
          }
        } catch (error) {
          console.error(`[MCP] Failed to get resources for client ${client.serverName}:`, error)
        }
      }

      clientsList.push(clientObj)
    }
    return clientsList
  }

  // 获取所有默认MCP服务器
  getMcpDefaultServers(): Promise<string[]> {
    return this.configPresenter.getMcpDefaultServers()
  }

  // 添加默认MCP服务器
  async addMcpDefaultServer(serverName: string): Promise<void> {
    await this.configPresenter.addMcpDefaultServer(serverName)
  }

  // 移除默认MCP服务器
  async removeMcpDefaultServer(serverName: string): Promise<void> {
    await this.configPresenter.removeMcpDefaultServer(serverName)
  }

  // 切换服务器的默认状态
  async toggleMcpDefaultServer(serverName: string): Promise<void> {
    await this.configPresenter.toggleMcpDefaultServer(serverName)
  }

  // 添加MCP服务器
  async addMcpServer(serverName: string, config: MCPServerConfig): Promise<boolean> {
    const existingServers = await this.getMcpServers()
    if (existingServers[serverName]) {
      console.error(`[MCP] Failed to add server: Server name "${serverName}" already exists.`)
      // 获取当前语言并发送通知
      const locale = this.configPresenter.getLanguage?.() || 'zh-CN'
      const errorMessages = getErrorMessageLabels(locale)
      eventBus.emit(NOTIFICATION_EVENTS.SHOW_ERROR, {
        title: errorMessages.addMcpServerErrorTitle || '添加服务器失败',
        message:
          errorMessages.addMcpServerDuplicateMessage?.replace('{serverName}', serverName) ||
          `服务器名称 "${serverName}" 已存在。请选择一个不同的名称。`,
        id: `mcp-error-add-server-${serverName}-${Date.now()}`,
        type: 'error'
      })
      return false
    }
    await this.configPresenter.addMcpServer(serverName, config)
    return true
  }

  // 更新MCP服务器配置
  async updateMcpServer(serverName: string, config: Partial<MCPServerConfig>): Promise<void> {
    const wasRunning = this.serverManager.isServerRunning(serverName)
    await this.configPresenter.updateMcpServer(serverName, config)

    // 如果服务器之前正在运行，则重启它以应用新配置
    if (wasRunning) {
      console.log(`[MCP] Configuration updated, restarting server: ${serverName}`)
      try {
        await this.stopServer(serverName) // stopServer 会发出 SERVER_STOPPED 事件
        await this.startServer(serverName) // startServer 会发出 SERVER_STARTED 事件
        console.log(`[MCP] Server ${serverName} restarted successfully`)
      } catch (error) {
        console.error(`[MCP] Failed to restart server ${serverName}:`, error)
        // 即使重启失败，也要确保状态正确，标记为未运行
        eventBus.emit(MCP_EVENTS.SERVER_STOPPED, serverName)
      }
    }
  }

  // 移除MCP服务器
  async removeMcpServer(serverName: string): Promise<void> {
    // 如果服务器正在运行，先停止
    if (await this.isServerRunning(serverName)) {
      await this.stopServer(serverName)
    }
    await this.configPresenter.removeMcpServer(serverName)
  }

  async isServerRunning(serverName: string): Promise<boolean> {
    return Promise.resolve(this.serverManager.isServerRunning(serverName))
  }

  async startServer(serverName: string): Promise<void> {
    await this.serverManager.startServer(serverName)
    // 通知渲染进程服务器已启动
    eventBus.emit(MCP_EVENTS.SERVER_STARTED, serverName)
  }

  async stopServer(serverName: string): Promise<void> {
    await this.serverManager.stopServer(serverName)
    // 通知渲染进程服务器已停止
    eventBus.emit(MCP_EVENTS.SERVER_STOPPED, serverName)
  }

  async getAllToolDefinitions(): Promise<MCPToolDefinition[]> {
    const enabled = await this.configPresenter.getMcpEnabled()
    if (enabled) {
      return this.toolManager.getAllToolDefinitions()
    }
    return []
  }

  /**
   * 获取所有客户端的提示模板，并附加客户端信息
   * @returns 所有提示模板列表，每个提示模板附带所属客户端信息
   */
  async getAllPrompts(): Promise<Array<PromptListEntry>> {
    const enabled = await this.configPresenter.getMcpEnabled()
    if (!enabled) {
      return []
    }

    const clients = await this.toolManager.getRunningClients()
    const promptsList: Array<Prompt & { client: { name: string; icon: string } }> = []

    for (const client of clients) {
      if (typeof client.listPrompts === 'function') {
        try {
          const prompts = await client.listPrompts()
          if (prompts && prompts.length > 0) {
            // 为每个提示模板添加客户端信息
            const clientPrompts = prompts.map((prompt) => ({
              ...prompt,
              client: {
                name: client.serverName,
                icon: client.serverConfig['icons'] as string
              }
            }))
            promptsList.push(...clientPrompts)
          }
        } catch (error) {
          console.error(
            `[MCP] Failed to get prompt templates for client ${client.serverName}:`,
            error
          )
        }
      }
    }

    return promptsList
  }

  /**
   * 获取所有客户端的资源列表，并附加客户端信息
   * @returns 所有资源列表，每个资源附带所属客户端信息
   */
  async getAllResources(): Promise<
    Array<ResourceListEntry & { client: { name: string; icon: string } }>
  > {
    const enabled = await this.configPresenter.getMcpEnabled()
    if (!enabled) {
      return []
    }

    const clients = await this.toolManager.getRunningClients()
    const resourcesList: Array<ResourceListEntry & { client: { name: string; icon: string } }> = []

    for (const client of clients) {
      if (typeof client.listResources === 'function') {
        try {
          const resources = await client.listResources()
          if (resources && resources.length > 0) {
            // 为每个资源添加客户端信息
            const clientResources = resources.map((resource) => ({
              ...resource,
              client: {
                name: client.serverName,
                icon: client.serverConfig['icons'] as string
              }
            }))
            resourcesList.push(...clientResources)
          }
        } catch (error) {
          console.error(`[MCP] Failed to get resources for client ${client.serverName}:`, error)
        }
      }
    }

    return resourcesList
  }

  async callTool(request: MCPToolCall): Promise<{ content: string; rawData: MCPToolResponse }> {

    console.log("presenter.mcpPresenter.callTool mcpPresenter");
    const toolCallResult = await this.toolManager.callTool(request)

    // 格式化工具调用结果为大模型易于解析的字符串
    let formattedContent = ''

    // 判断内容类型
    if (typeof toolCallResult.content === 'string') {
      // 内容已经是字符串
      formattedContent = toolCallResult.content
    } else if (Array.isArray(toolCallResult.content)) {
      // 内容是结构化数组，需要格式化
      const contentParts: string[] = []

      // 处理每个内容项
      for (const item of toolCallResult.content) {
        if (item.type === 'text') {
          contentParts.push(item.text)
        } else if (item.type === 'image') {
          contentParts.push(`[图片: ${item.mimeType}]`)
        } else if (item.type === 'resource') {
          if ('text' in item.resource && item.resource.text) {
            contentParts.push(`[资源: ${item.resource.uri}]\n${item.resource.text}`)
          } else if ('blob' in item.resource) {
            contentParts.push(`[二进制资源: ${item.resource.uri}]`)
          } else {
            contentParts.push(`[资源: ${item.resource.uri}]`)
          }
        } else {
          // 处理其他未知类型
          contentParts.push(JSON.stringify(item))
        }
      }

      // 合并所有内容
      formattedContent = contentParts.join('\n\n')
    }

    // 添加错误标记（如果有）
    if (toolCallResult.isError) {
      formattedContent = `错误: ${formattedContent}`
    }

    return { content: formattedContent, rawData: toolCallResult }
  }

  // 将MCPToolDefinition转换为MCPTool
  private mcpToolDefinitionToMcpTool(
    toolDefinition: MCPToolDefinition,
    serverName: string
  ): MCPTool {
    const mcpTool = {
      id: toolDefinition.function.name,
      name: toolDefinition.function.name,
      type: toolDefinition.type,
      description: toolDefinition.function.description,
      serverName,
      inputSchema: {
        properties: toolDefinition.function.parameters.properties as Record<
          string,
          Record<string, unknown>
        >,
        type: toolDefinition.function.parameters.type,
        required: toolDefinition.function.parameters.required
      }
    } as MCPTool
    return mcpTool
  }

  // 工具属性过滤函数
  private filterPropertieAttributes(tool: MCPTool): Record<string, Record<string, unknown>> {
    const supportedAttributes = [
      'type',
      'nullable',
      'description',
      'properties',
      'items',
      'enum',
      'anyOf'
    ]

    const properties = tool.inputSchema.properties
    const getSubMap = (obj: Record<string, unknown>, keys: string[]): Record<string, unknown> => {
      return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)))
    }

    const result: Record<string, Record<string, unknown>> = {}
    for (const [key, val] of Object.entries(properties)) {
      result[key] = getSubMap(val, supportedAttributes)
    }

    return result
  }

  // 新增工具转换方法
  /**
   * 将MCP工具定义转换为OpenAI工具格式
   * @param mcpTools MCP工具定义数组
   * @param serverName 服务器名称
   * @returns OpenAI工具格式的工具定义
   */
  async mcpToolsToOpenAITools(
    mcpTools: MCPToolDefinition[],
    serverName: string
  ): Promise<OpenAITool[]> {
    const openaiTools: OpenAITool[] = mcpTools.map((toolDef) => {
      const tool = this.mcpToolDefinitionToMcpTool(toolDef, serverName)
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: this.filterPropertieAttributes(tool),
            required: tool.inputSchema.required || []
          }
        }
      }
    })
    // console.log('openaiTools', JSON.stringify(openaiTools))
    return openaiTools
  }

  /**
   * 将OpenAI工具调用转换回MCP工具调用
   * @param mcpTools MCP工具定义数组
   * @param llmTool OpenAI工具调用
   * @param serverName 服务器名称
   * @returns 匹配的MCP工具调用
   */
  async openAIToolsToMcpTool(
    llmTool: OpenAIToolCall,
    providerId: string
  ): Promise<MCPToolCall | undefined> {
    const mcpTools = await this.getAllToolDefinitions()
    const tool = mcpTools.find((tool) => tool.function.name === llmTool.function.name)
    if (!tool) {
      return undefined
    }

    // 创建MCP工具调用
    const mcpToolCall: MCPToolCall = {
      id: `${providerId}:${tool.function.name}-${Date.now()}`, // 生成唯一ID，包含服务器名称
      type: tool.type,
      function: {
        name: tool.function.name,
        arguments: llmTool.function.arguments
      },
      server: {
        name: tool.server.name,
        icons: tool.server.icons,
        description: tool.server.description
      }
    }
    // console.log('mcpToolCall', mcpToolCall, tool)

    return mcpToolCall
  }

  /**
   * 将MCP工具定义转换为Anthropic工具格式
   * @param mcpTools MCP工具定义数组
   * @param serverName 服务器名称
   * @returns Anthropic工具格式的工具定义
   */
  async mcpToolsToAnthropicTools(
    mcpTools: MCPToolDefinition[],
    serverName: string
  ): Promise<AnthropicTool[]> {
    return mcpTools.map((toolDef) => {
      const tool = this.mcpToolDefinitionToMcpTool(toolDef, serverName)
      return {
        name: tool.name,
        description: tool.description,
        input_schema: {
          type: 'object',
          properties: tool.inputSchema.properties,
          required: tool.inputSchema.required as string[]
        }
      }
    })
  }

  /**
   * 将Anthropic工具使用转换回MCP工具调用
   * @param mcpTools MCP工具定义数组
   * @param toolUse Anthropic工具使用
   * @param serverName 服务器名称
   * @returns 匹配的MCP工具调用
   */
  async anthropicToolUseToMcpTool(
    toolUse: AnthropicToolUse,
    providerId: string
  ): Promise<MCPToolCall | undefined> {
    const mcpTools = await this.getAllToolDefinitions()

    const tool = mcpTools.find((tool) => tool.function.name === toolUse.name)
    // console.log('tool', tool, toolUse)
    if (!tool) {
      return undefined
    }

    // 创建MCP工具调用
    const mcpToolCall: MCPToolCall = {
      id: `${providerId}:${tool.function.name}-${Date.now()}`, // 生成唯一ID，包含服务器名称
      type: tool.type,
      function: {
        name: tool.function.name,
        arguments: JSON.stringify(toolUse.input)
      },
      server: {
        name: tool.server.name,
        icons: tool.server.icons,
        description: tool.server.description
      }
    }

    return mcpToolCall
  }

  /**
   * 将MCP工具定义转换为Gemini工具格式
   * @param mcpTools MCP工具定义数组
   * @param serverName 服务器名称
   * @returns Gemini工具格式的工具定义
   */
  async mcpToolsToGeminiTools(
    mcpTools: MCPToolDefinition[] | undefined,
    serverName: string
  ): Promise<GeminiTool[]> {
    if (!mcpTools || mcpTools.length === 0) {
      return []
    }

    // 递归清理Schema对象，确保符合Gemini API要求
    const cleanSchema = (schema: Record<string, unknown>): Record<string, unknown> => {
      const allowedTopLevelFields = [
        'type',
        'description',
        'enum',
        'properties',
        'items',
        'nullable',
        'anyOf'
      ]

      // 创建新对象，只保留允许的字段
      const cleanedSchema: Record<string, unknown> = {}

      // 处理允许的顶级字段
      for (const field of allowedTopLevelFields) {
        if (field in schema) {
          if (field === 'properties' && typeof schema.properties === 'object') {
            // 递归处理properties中的每个属性
            const properties = schema.properties as Record<string, unknown>
            const cleanedProperties: Record<string, unknown> = {}

            for (const [propName, propValue] of Object.entries(properties)) {
              if (typeof propValue === 'object' && propValue !== null) {
                cleanedProperties[propName] = cleanSchema(propValue as Record<string, unknown>)
              } else {
                cleanedProperties[propName] = propValue
              }
            }

            cleanedSchema.properties = cleanedProperties
          } else if (field === 'items' && typeof schema.items === 'object') {
            // 递归处理items对象
            cleanedSchema.items = cleanSchema(schema.items as Record<string, unknown>)
          } else if (field === 'anyOf' && Array.isArray(schema.anyOf)) {
            // 递归处理anyOf数组中的每个选项
            cleanedSchema.anyOf = (schema.anyOf as Array<Record<string, unknown>>).map((item) =>
              cleanSchema(item)
            )
          } else {
            // 其他字段直接复制
            cleanedSchema[field] = schema[field]
          }
        }
      }

      return cleanedSchema
    }

    // 处理每个工具定义，构建符合Gemini API的函数声明
    const functionDeclarations = mcpTools.map((toolDef) => {
      // 转换为内部工具表示
      const tool = this.mcpToolDefinitionToMcpTool(toolDef, serverName)

      // 获取参数属性
      const properties = tool.inputSchema.properties
      const processedProperties: Record<string, Record<string, unknown>> = {}

      // 处理每个属性，应用清理函数
      for (const [propName, propValue] of Object.entries(properties)) {
        if (typeof propValue === 'object' && propValue !== null) {
          processedProperties[propName] = cleanSchema(propValue as Record<string, unknown>)
        }
      }

      // 准备函数声明结构
      const functionDeclaration = {
        name: tool.id,
        description: tool.description
      } as {
        name: string
        description: string
        parameters?: {
          type: string
          properties: Record<string, Record<string, unknown>>
          required: string[]
        }
      }
      if (Object.keys(processedProperties).length > 0) {
        functionDeclaration.parameters = {
          type: 'object',
          properties: processedProperties,
          required: tool.inputSchema.required || []
        }
      }

      // 记录没有参数的函数
      if (Object.keys(processedProperties).length === 0) {
        console.log(
          `[MCP] Function ${tool.id} has no parameters, providing minimal parameter structure`
        )
      }

      return functionDeclaration
    })

    // 返回符合Gemini工具格式的结果
    return [
      {
        functionDeclarations
      }
    ]
  }

  /**
   * 将Gemini函数调用转换回MCP工具调用
   * @param mcpTools MCP工具定义数组
   * @param fcall Gemini函数调用
   * @param serverName 服务器名称
   * @returns 匹配的MCP工具调用
   */
  async geminiFunctionCallToMcpTool(
    fcall: GeminiFunctionCall | undefined,
    providerId: string
  ): Promise<MCPToolCall | undefined> {
    const mcpTools = await this.getAllToolDefinitions()
    if (!fcall) return undefined
    if (!mcpTools) return undefined

    const tool = mcpTools.find((tool) => tool.function.name === fcall.name)
    if (!tool) {
      return undefined
    }

    // 创建MCP工具调用
    const mcpToolCall: MCPToolCall = {
      id: `${providerId}:${tool.function.name}-${Date.now()}`, // 生成唯一ID，包含服务器名称
      type: tool.type,
      function: {
        name: tool.function.name,
        arguments: JSON.stringify(fcall.args)
      },
      server: {
        name: tool.server.name,
        icons: tool.server.icons,
        description: tool.server.description
      }
    }

    return mcpToolCall
  }

  // 获取MCP启用状态
  async getMcpEnabled(): Promise<boolean> {
    return this.configPresenter.getMcpEnabled()
  }

  // 设置MCP启用状态
  async setMcpEnabled(enabled: boolean): Promise<void> {
    await this.configPresenter?.setMcpEnabled(enabled)
  }

  async resetToDefaultServers(): Promise<void> {
    await this.configPresenter?.getMcpConfHelper().resetToDefaultServers()
  }

  /**
   * 获取指定提示模板
   * @param prompt 提示模板对象（包含客户端信息）
   * @param params 提示模板参数
   * @returns 提示模板内容
   */
  async getPrompt(prompt: PromptListEntry, args?: Record<string, unknown>): Promise<unknown> {
    const enabled = await this.configPresenter.getMcpEnabled()
    if (!enabled) {
      throw new Error('MCP功能已禁用')
    }

    // 传递客户端信息和提示模板名称给toolManager
    return this.toolManager.getPromptByClient(prompt.client.name, prompt.name, args)
  }

  /**
   * 读取指定资源
   * @param resource 资源对象（包含客户端信息）
   * @returns 资源内容
   */
  async readResource(resource: ResourceListEntry): Promise<Resource> {
    const enabled = await this.configPresenter.getMcpEnabled()
    if (!enabled) {
      throw new Error('MCP功能已禁用')
    }

    // 传递客户端信息和资源URI给toolManager
    return this.toolManager.readResourceByClient(resource.client.name, resource.uri)
  }

  /**
   * 将MCP工具定义转换为OpenAI Responses API工具格式
   * @param mcpTools MCP工具定义数组
   * @param serverName 服务器名称
   * @returns OpenAI Responses API工具格式的工具定义
   */
  async mcpToolsToOpenAIResponsesTools(
    mcpTools: MCPToolDefinition[],
    serverName: string
  ): Promise<OpenAI.Responses.Tool[]> {
    const openaiTools: OpenAI.Responses.Tool[] = mcpTools.map((toolDef) => {
      const tool = this.mcpToolDefinitionToMcpTool(toolDef, serverName)
      return {
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: this.filterPropertieAttributes(tool),
          required: tool.inputSchema.required || []
        },
        strict: false
      }
    })
    return openaiTools
  }

  /**
   * Execute JavaScript code in a sandboxed environment using vm2
   * @param code JavaScript code to execute
   * @returns Result of the code execution as a string
   */
  async runJavaScriptCode(code: string): Promise<string> {
    console.log('[MCP] Running JavaScript code in sandbox')

    // Ensure data directory exists for file operations
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const dataDir = path.join(os.homedir(), '.config/zentrun');

    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`[MCP] Created data directory at ${dataDir}`);
      } catch (error) {
        console.error(`[MCP] Failed to create data directory: ${error.message}`);
      }
    }

    // Get LLM provider information
    let llmProviderName = '';
    let llmProviderType = '';
    let llmModelId = '';
    let llmBaseUrl = '';
    let llmApiKey = '';


    try {
      // First try to get settings from active conversation
      const activeConversation = await presenter.threadPresenter.getActiveConversation();
      if (activeConversation && activeConversation.settings) {
        const { providerId, modelId } = activeConversation.settings;

        // Get provider information
        const provider = this.configPresenter.getProviderById(providerId);
        if (provider) {
          llmProviderName = provider.name;
          llmProviderType = provider.apiType;
          llmBaseUrl = provider.baseUrl;
          llmApiKey = provider.apiKey;
          llmModelId = modelId;
        }
      } else {
        // Fallback to first enabled provider if no active conversation
        const enabledProviders = this.configPresenter.getEnabledProviders();
        if (enabledProviders.length > 0) {
          const provider = enabledProviders[0];
          llmProviderName = provider.name;
          llmProviderType = provider.apiType;
          llmBaseUrl = provider.baseUrl;
          llmApiKey = provider.apiKey;

          // Get the first enabled model for this provider
          const enabledModelsResult = await this.configPresenter.getAllEnabledModels();
          const providerModels = enabledModelsResult.find(item => item.providerId === provider.id);
          if (providerModels && providerModels.models.length > 0) {
            llmModelId = providerModels.models[0].id;
          }
        }
      }
    } catch (error) {
      console.error('[MCP] Error getting LLM provider information:', error);
    }
    let capturedLogs = [];
    try {
      // Create a new VM instance with sandbox
      const vm = new VM({
        timeout: 50 * 1000 * 1000, // 50 second timeout
        sandbox: {

            log: (...args) => {
              const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
              capturedLogs.push(msg);
            },

          console: {

            log: (...args) => {
              const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
              capturedLogs.push(msg);
            }
          },
          // console: {
          //   log: (...args: any[]) => {
          //     // Capture console.log output
          //     return args.map(arg =>
          //       typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          //     ).join(' ')
          //   }
          // },
          setTimeout: (callback: Function, ms: number) => {
            if (ms > 5000) ms = 5000 // Limit setTimeout to 5 seconds
            return setTimeout(callback, ms)
          },
          // Limited process object with safe properties
          process: {
            arch: process.arch,
            platform: process.platform,
            version: process.version,
            versions: process.versions,
            env: {
              NODE_ENV: process.env.NODE_ENV,
              LLM_PROVIDER_NAME: llmProviderName,
              LLM_PROVIDER_TYPE: llmProviderType,
              LLM_MODEL_ID: llmModelId,
              LLM_BASE_URL: llmBaseUrl,
              LLM_API_KEY: llmApiKey
            },
            cwd: () => process.cwd(),
            memoryUsage: process.memoryUsage,
            uptime: process.uptime
          },
          // Helper function to show available modules and functions
          help: () => {
            return {
              availableModules: [
                'fs - File system operations (restricted to safe directories)',
                'path - Path manipulation utilities',
                'os - Operating system information',
                'crypto - Cryptographic functions',
                'buffer - Binary data handling',
                'better-sqlite3 - SQLite database for Node.js',
                'sqlite3 - SQLite database for Node.js',
                'mysql2 - MySQL client for Node.js',
                'pg - PostgreSQL client for Node.js',
                'knex - SQL query builder',
                'fs-extra - Enhanced file system operations',
                'dotenv - Load environment variables from .env files',
                'uuid - Generate UUIDs',
                'dayjs - Date manipulation library',
                'csv-parse - CSV parsing library',
                'json2csv - Convert JSON to CSV',
                'vm2 - Sandbox for running untrusted code',
                'execa - Process execution library',
                'lodash - Utility library',
                'chart.js - Chart generation library',
                'csv-parser - CSV parse library',
                'quickchart-js - Chart generation library',
                'mathjs - Math library'
              ],
              fsModule: {
                description: 'File system operations (restricted to safe directories)',
                allowedDirectories: ['/tmp', path.join(os.homedir(), '.config/zentrun')],
                functions: [
                  'readFileSync(path, options) - Read a file synchronously',
                  'writeFileSync(path, data, options) - Write to a file synchronously',
                  'readdirSync(path, options) - Read directory contents synchronously',
                  'existsSync(path) - Check if a file exists',
                  'listAllowedDirectories() - List directories that can be accessed'
                ]
              },
              processObject: {
                description: 'Limited process object with safe properties',
                properties: [
                  'arch - Process architecture',
                  'platform - Operating system platform',
                  'version - Node.js version',
                  'versions - Versions of Node.js and its dependencies',
                  'env - Limited environment variables (only NODE_ENV)',
                  'cwd() - Current working directory',
                  'memoryUsage() - Memory usage information',
                  'uptime() - Process uptime in seconds'
                ]
              },
              databaseExamples: [
                "// SQLite example",
                "const sqlite = require('better-sqlite3');",
                "const db = sqlite(':memory:');",
                "db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');",
                "const insert = db.prepare('INSERT INTO users (name) VALUES (?)');",
                "insert.run('John Doe');",
                "const users = db.prepare('SELECT * FROM users').all();",
                "console.log(users);",
                "",
                "// Knex example",
                "const knex = require('knex')({",
                "  client: 'better-sqlite3',",
                "  connection: { filename: ':memory:' },",
                "  useNullAsDefault: true",
                "});",
                "async function setupDb() {",
                "  await knex.schema.createTable('books', table => {",
                "    table.increments('id');",
                "    table.string('title');",
                "    table.string('author');",
                "  });",
                "  await knex('books').insert({ title: 'Dune', author: 'Frank Herbert' });",
                "  const books = await knex('books').select('*');",
                "  console.log(books);",
                "}",
                "setupDb();"
              ],
              utilityExamples: [
                "// UUID example",
                "const { v4: uuidv4 } = require('uuid');",
                "console.log('Generated UUID:', uuidv4());",
                "",
                "// DayJS example",
                "const dayjs = require('dayjs');",
                "console.log('Current date:', dayjs().format('YYYY-MM-DD'));",
                "console.log('Date in 7 days:', dayjs().add(7, 'day').format('YYYY-MM-DD'));",
                "",
                "// Lodash example",
                "const _ = require('lodash');",
                "const users = [",
                "  { 'user': 'fred',   'age': 48 },",
                "  { 'user': 'barney', 'age': 36 },",
                "  { 'user': 'fred',   'age': 40 }",
                "];",
                "console.log(_.sortBy(users, ['user', 'age']));",
                "",
                "// Math.js example",
                "const math = require('mathjs');",
                "console.log('Evaluate expression:', math.evaluate('2 + 3 * 4'));",
                "console.log('Calculate derivative:', math.derivative('x^2 + x', 'x').toString());"
              ],
              dataProcessingExamples: [
                "// CSV parsing example",
                "const { parse } = require('csv-parse/sync');",
                "const csvData = 'id,name\\n1,John\\n2,Jane';",
                "const records = parse(csvData, { columns: true });",
                "console.log(records);",
                "",
                "// JSON to CSV example",
                "const { Parser } = require('json2csv');",
                "const jsonData = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];",
                "const parser = new Parser();",
                "const csv = parser.parse(jsonData);",
                "console.log(csv);"
              ],
              fileSystemExamples: [
                "// Write a file to the config directory",
                "const fs = require('fs');",
                "const path = require('path');",
                "const os = require('os');",
                "const filePath = path.join(os.homedir(), '.config/zentrun', 'test.txt');",
                "fs.writeFileSync(filePath, 'Hello, world!');",
                "console.log(fs.readFileSync(filePath, 'utf8'));",
                "",
                "// Use fs-extra for enhanced file operations",
                "const fse = require('fs-extra');",
                "const dataDir = path.join(os.homedir(), '.config/zentrun');",
                "fse.ensureDirSync(path.join(dataDir, 'subdir'));",
                "fse.writeJsonSync(path.join(dataDir, 'config.json'), { setting: 'value' });",
                "console.log(fse.readJsonSync(path.join(dataDir, 'config.json')));"
              ],
              cryptoExamples: [
                "// Use crypto to create a hash",
                "const crypto = require('crypto');",
                "const hash = crypto.createHash('sha256').update('hello world').digest('hex');",
                "console.log(hash);",
                "",
                "// Get system information",
                "const os = require('os');",
                "console.log('Platform:', os.platform());",
                "console.log('Memory:', os.freemem() / 1024 / 1024, 'MB free of', os.totalmem() / 1024 / 1024, 'MB');"
              ]
            };
          },
          // Mock require function to handle require calls safely
          require: (moduleName: string) => {
            // Import real fs module
            const fs = require('fs');
            const path = require('path');

            // List of allowed modules that could be safely mocked
            const safeModules: Record<string, any> = {
              // Safe wrapper around fs module with limited functionality
              // 'fs': {
              //   // Only allow reading files from specific directories
              //   readFileSync: (filePath: string, options?: any) => {
              //     // Convert to absolute path
              //     const absPath = path.resolve(filePath);
              //
              //     // Define allowed directories (can be expanded as needed)
              //     const allowedDirs = [
              //       '/tmp',
              //       path.join(os.homedir(), '.config/zentrun')
              //     ];
              //
              //     // Check if the path is within allowed directories
              //     const isAllowed = allowedDirs.some(dir => absPath.startsWith(dir));
              //
              //     if (!isAllowed) {
              //       throw new Error(`Access denied: Cannot read from '${filePath}'. Only files in allowed directories can be accessed.`);
              //     }
              //
              //     // If allowed, perform the actual read
              //     return fs.readFileSync(absPath, options);
              //   },
              //
              //   // Only allow writing files to specific directories
              //   writeFileSync: (filePath: string, data: any, options?: any) => {
              //     // Convert to absolute path
              //     const absPath = path.resolve(filePath);
              //
              //     // Define allowed directories for writing
              //     const allowedDirs = [
              //       '/tmp',
              //       path.join(os.homedir(), '.config/zentrun')
              //     ];
              //
              //     // Check if the path is within allowed directories
              //     const isAllowed = allowedDirs.some(dir => absPath.startsWith(dir));
              //
              //     if (!isAllowed) {
              //       throw new Error(`Access denied: Cannot write to '${filePath}'. Only files in allowed directories can be modified.`);
              //     }
              //
              //     // If allowed, perform the actual write
              //     return fs.writeFileSync(absPath, data, options);
              //   },
              //
              //   // List files in a directory (only in allowed directories)
              //   readdirSync: (dirPath: string, options?: any) => {
              //     // Convert to absolute path
              //     const absPath = path.resolve(dirPath);
              //
              //     // Define allowed directories
              //     const allowedDirs = [
              //       '/tmp',
              //       path.join(os.homedir(), '.config/zentrun')
              //     ];
              //
              //     // Check if the path is within allowed directories
              //     const isAllowed = allowedDirs.some(dir => absPath.startsWith(dir));
              //
              //     if (!isAllowed) {
              //       throw new Error(`Access denied: Cannot read directory '${dirPath}'. Only allowed directories can be accessed.`);
              //     }
              //
              //     // If allowed, perform the actual directory read
              //     return fs.readdirSync(absPath, options);
              //   },
              //
              //   // Check if a file exists (only in allowed directories)
              //   existsSync: (path: string) => {
              //     // Convert to absolute path
              //     const absPath = path.resolve(path);
              //
              //     // Define allowed directories
              //     const allowedDirs = [
              //       '/tmp',
              //       path.join(os.homedir(), '.config/zentrun')
              //     ];
              //
              //     // Check if the path is within allowed directories
              //     const isAllowed = allowedDirs.some(dir => absPath.startsWith(dir));
              //
              //     if (!isAllowed) {
              //       throw new Error(`Access denied: Cannot check existence of '${path}'. Only files in allowed directories can be accessed.`);
              //     }
              //
              //     // If allowed, perform the actual check
              //     return fs.existsSync(absPath);
              //   },
              //
              //   // List allowed directories for user reference
              //   listAllowedDirectories: () => {
              //     return [
              //       '/tmp',
              //       path.join(os.homedir(), '.config/zentrun')
              //     ];
              //   }
              // },
              //
              // // Safe wrapper around path module
              // 'path': {
              //   join: path.join,
              //   resolve: path.resolve,
              //   basename: path.basename,
              //   dirname: path.dirname,
              //   extname: path.extname,
              //   parse: path.parse,
              //   format: path.format,
              //   isAbsolute: path.isAbsolute,
              //   relative: path.relative,
              //   normalize: path.normalize,
              //   sep: path.sep
              // },
              //
              // // Safe wrapper around os module with limited functionality
              // 'os': {
              //   platform: require('os').platform,
              //   arch: require('os').arch,
              //   cpus: require('os').cpus,
              //   freemem: require('os').freemem,
              //   totalmem: require('os').totalmem,
              //   homedir: require('os').homedir,
              //   tmpdir: require('os').tmpdir,
              //   hostname: require('os').hostname,
              //   type: require('os').type,
              //   release: require('os').release,
              //   EOL: require('os').EOL
              // },

              // Safe wrapper around crypto module with limited functionality
              'crypto': {
                createHash: require('crypto').createHash,
                createHmac: require('crypto').createHmac,
                randomBytes: require('crypto').randomBytes,
                randomUUID: require('crypto').randomUUID
              },

              // Safe wrapper around buffer module
              'buffer': {
                Buffer: Buffer
              },
              'fs': require('fs'),
              'path': require('path'),
              'os': require('os'),

              // Additional libraries as requested
              'better-sqlite3': require('better-sqlite3'),
              'sqlite3': require('sqlite3'),
              'mysql2': require('mysql2'),
              'pg': require('pg'),
              'knex': require('knex'),
              'fs-extra': require('fs-extra'),
              'dotenv': require('dotenv'),
              'uuid': require('uuid'),
              'dayjs': require('dayjs'),
              'csv-parse': require('csv-parse'),
              'json2csv': require('json2csv'),
              'vm2': require('vm2'),
              'fs': require('fs'),
              'execa': require('execa'),
              'lodash': require('lodash'),
              'chart.js': require('chart.js'),
              'csv-parser': require('csv-parser'),
              'quickchart-js': require('quickchart-js'),
              'mathjs': require('mathjs')
            };

            if (safeModules[moduleName]) {
              return safeModules[moduleName];
            }

            // For unsupported modules, throw a helpful error
            throw new Error(`Module '${moduleName}' is not available in this sandbox environment. External modules cannot be loaded for security reasons.`);
          }
        },
        eval: false,      // Don't allow eval
        wasm: false,      // Don't allow WebAssembly
        allowAsync: true,  // Allow async/await
      })

      // Wrap the code to capture console.log output and handle errors properly
      const wrappedCode = code;

      // Run the code in the VM and await the result
      // const result = await vm.run(wrappedCode);
      await vm.run(wrappedCode);
      const result = capturedLogs;
      console.log('Result:', result);
      // Format the result
      let formattedResult = '';
      if (Array.isArray(result)) {
        formattedResult = result.join('\n');
      } else if (result !== undefined) {
        formattedResult = typeof result === 'object'
          ? JSON.stringify(result, null, 2)
          : String(result);
      } else {
        formattedResult = 'Code executed successfully with no output';
      }

      // Check if a figure was captured
      const hasFigure = formattedResult.includes('__FIGURE_CAPTURED__');
      formattedResult = formattedResult.replace('__FIGURE_CAPTURED__', '').trim();

      // If there's no text output but a figure was captured
      if (!formattedResult && hasFigure) {
        formattedResult = 'Figure generated successfully';
      }

      // If a figure was captured, read it and convert to base64
      const outputImageFile = path.join(dataDir, 'output_figure.png');
      if (hasFigure && fs.existsSync(outputImageFile)) {
        try {
          const imageData = fs.readFileSync(outputImageFile);
          const base64Image = imageData.toString('base64');

          // Append the base64 image data to the result with a special marker
          formattedResult += `\n\n__IMAGE_DATA__:data:image/png;base64,${base64Image}`;
        } catch (imageError) {
          console.error(`[MCP] Failed to process output image: ${imageError.message}`);
        }
      }

      return formattedResult;
    } catch (error) {
      console.error('[MCP] Error executing JavaScript code:', error);
      return `Error executing code: ${error.message}`;
    }
  }

  /**
   * Execute Python code using the configured Python interpreter
   * @param code Python code to execute
   * @returns Result of the code execution as a string
   */
  async runPythonCode(code: string): Promise<string> {
    console.log('[MCP] Running Python code')

    // Ensure data directory exists for file operations
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { exec } = require('child_process');
    const { promisify } = require('util');

    // Get Python interpreter path from settings
    let pythonInterpreterPath = await this.configPresenter.getSetting('pythonInterpreterPath');

    if (!pythonInterpreterPath) {
      console.log('[MCP] Python interpreter path not configured, setting default based on OS');

      // Get app path
      const app = require('electron').app;
      const appPath = app.getAppPath().replace('app.asar', 'app.asar.unpacked');

      // Determine OS-specific path to python executable
      const platform = process.platform;
      const pythonInterpreterDir = path.join(appPath, 'resources', 'python_interpreter');

      if (platform === 'win32') {
        pythonInterpreterPath = path.join(pythonInterpreterDir, 'win', 'miniconda3', 'python.exe');
      } else if (platform === 'darwin') {
        pythonInterpreterPath = path.join(pythonInterpreterDir, 'mac', 'miniconda3', 'bin', 'python');
      } else if (platform === 'linux') {
        pythonInterpreterPath = path.join(pythonInterpreterDir, 'linux', 'miniconda3', 'bin', 'python');
      }

      // Save the path to settings
      // await this.configPresenter.setSetting('pythonInterpreterPath', pythonInterpreterPath);
      console.log(`[MCP] Set Python interpreter path to: ${pythonInterpreterPath}`);
    }

    const execPromise = promisify(exec);

    const dataDir = path.join(os.homedir(), '.config/zentrun');
    const tempPythonFile = path.join(dataDir, 'temp_script.py');
    const outputImageFile = path.join(dataDir, 'output_figure.png');

    // Get active conversation ID for image file naming
    let chat_id = 'default';
    try {
      const activeConversation = await presenter.threadPresenter.getActiveConversation();
      if (activeConversation) {
        chat_id = activeConversation.id;
      }
    } catch (error) {
      console.error('[MCP] Error getting active conversation ID:', error);
    }

    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`[MCP] Created data directory at ${dataDir}`);
      } catch (error) {
        console.error(`[MCP] Failed to create data directory: ${error.message}`);
        return `Error creating data directory: ${error.message}`;
      }
    }

    // Get LLM provider information
    let llmProviderName = '';
    let llmProviderType = '';
    let llmModelId = '';
    let llmBaseUrl = '';
    let llmApiKey = '';
    let stdout = '';
    let stderr = '';
    try {
      // First try to get settings from active conversation
      const activeConversation = await presenter.threadPresenter.getActiveConversation();

      if (activeConversation && activeConversation.settings) {
        const { providerId, modelId } = activeConversation.settings;

        // Get provider information
        const provider = this.configPresenter.getProviderById(providerId);
        if (provider) {
          llmProviderName = provider.name;
          llmProviderType = provider.apiType;
          llmBaseUrl = provider.baseUrl;
          llmApiKey = provider.apiKey || activeConversation?.settings?.userApptoken;
          llmModelId = modelId;
        }
      } else {
        // Fallback to first enabled provider if no active conversation
        const enabledProviders = this.configPresenter.getEnabledProviders();
        if (enabledProviders.length > 0) {
          const provider = enabledProviders[0];
          llmProviderName = provider.name;
          llmProviderType = provider.apiType;
          llmBaseUrl = provider.baseUrl;
          llmApiKey = provider.apiKey;

          // Get the first enabled model for this provider
          const enabledModelsResult = await this.configPresenter.getAllEnabledModels();
          const providerModels = enabledModelsResult.find(item => item.providerId === provider.id);
          if (providerModels && providerModels.models.length > 0) {
            llmModelId = providerModels.models[0].id;
          }
        }
      }
    } catch (error) {
      console.error('[MCP] Error getting LLM provider information:', error);
    }

    try {
      const modifiedCode = code;
      console.log("code");
      console.log(code);
      console.log("modifiedCode");
      console.log(modifiedCode);

      // Write the modified Python code to a temporary file
      fs.writeFileSync(tempPythonFile, modifiedCode);
      console.log(`[MCP] Wrote modified Python code to ${tempPythonFile}`);

      console.log("LLM_PROVIDER_NAME");
      console.log("LLM_PROVIDER_NAME", llmProviderName);
      console.log("LLM_PROVIDER_TYPE", llmProviderType);
      console.log("LLM_MODEL_ID", llmModelId);
      console.log("LLM_BASE_URL", llmBaseUrl);
      console.log("LLM_API_KEY", llmApiKey);


      // Execute the Python code using the configured interpreter with LLM environment variables
      try {
        const {stdout: stdoutUpdated, stderr: stderrUpdated} = await execPromise(`"${pythonInterpreterPath}" "${tempPythonFile}"`, {
          timeout: 50000 * 1000, // 50 second timeout
          env: {
            ...process.env,
            LLM_PROVIDER_NAME: llmProviderName,
            LLM_PROVIDER_TYPE: llmProviderType,
            LLM_MODEL_ID: llmModelId,
            LLM_BASE_URL: llmBaseUrl,
            LLM_API_KEY: llmApiKey
          }
        });
        stdout = stdoutUpdated;
        stderr = stderrUpdated;
      } catch (execError) {
        // When execPromise fails, it still contains stdout and stderr in the error object
        stdout = execError.stdout || '';
        stderr = execError.stderr || '';
        throw execError; // Re-throw to be caught by the outer try-catch
      }


      console.log("stdout", stdout);
      console.log("stderr", stderr);

      // Check if a figure was captured
      const hasFigure = stdout.includes('__FIGURE_CAPTURED__');
      let result = stdout.replace('__FIGURE_CAPTURED__', '').trim();

      // If there's no text output but a figure was captured
      if (!result && hasFigure) {
        result = 'Figure generated successfully';
      }

      // If a figure was captured, read it and convert to base64
      if (hasFigure && fs.existsSync(outputImageFile)) {
        try {
          const imageData = fs.readFileSync(outputImageFile);
          const base64Image = imageData.toString('base64');

          // Append the base64 image data to the result with a special marker
          result += `\n\n__IMAGE_DATA__:data:image/png;base64,${base64Image}`;

          // // Clean up the image file
          // fs.unlinkSync(outputImageFile);
        } catch (imageError) {
          console.error(`[MCP] Failed to process output image: ${imageError.message}`);
        }
      }

      // // Clean up the temporary file
      // try {
      //   fs.unlinkSync(tempPythonFile);
      // } catch (cleanupError) {
      //   console.error(`[MCP] Failed to clean up temporary Python file: ${cleanupError.message}`);
      // }

      // // Return the result
      // if (stderr) {
      //   return `${stderr}`;
      // }

      console.log("result");
      console.log(result);

      return result || 'Code executed successfully with no output';
    } catch (error) {
      console.error('[MCP] Error executing Python code:', error);

      // Check if this is a ModuleNotFoundError
      const moduleNotFoundRegex = /ModuleNotFoundError: No module named '([^']+)'/;
      let moduleMatch = null;

      // Check in stderr first
      if (stderr) {
        moduleMatch = stderr.match(moduleNotFoundRegex);
      }

      // If not found in stderr, check in error.stderr
      if (!moduleMatch && error.stderr) {
        moduleMatch = error.stderr.match(moduleNotFoundRegex);
      }

      // If not found in error.stderr, check in error.message
      if (!moduleMatch && error.message) {
        moduleMatch = error.message.match(moduleNotFoundRegex);
      }

      // If we found a missing module, try to install it and retry
      if (moduleMatch && moduleMatch[1]) {
        const missingModule = moduleMatch[1];
        console.log(`[MCP] Detected missing module: ${missingModule}. Attempting to install...`);

        try {
          // Keep the temporary file for retry
          // Install the missing module
          const { stdout: installStdout, stderr: installStderr } = await execPromise(
            `"${pythonInterpreterPath}" -m pip install ${missingModule}`,
            { timeout: 60000 } // 60 second timeout for installation
          );

          console.log(`[MCP] Module installation result: ${installStdout}`);
          if (installStderr) {
            console.error(`[MCP] Module installation error: ${installStderr}`);
          }

          // If installation was successful, retry running the code
          if (!installStderr || !installStderr.includes('ERROR')) {
            console.log(`[MCP] Retrying Python code execution after installing ${missingModule}`);

            // Retry executing the Python code
            try {
              const { stdout: retryStdout, stderr: retryStderr } = await execPromise(
                `"${pythonInterpreterPath}" "${tempPythonFile}"`,
                {
                  timeout: 50000 * 1000, // 50 second timeout
                  env: {
                    ...process.env,
                    LLM_PROVIDER_NAME: llmProviderName,
                    LLM_PROVIDER_TYPE: llmProviderType,
                    LLM_MODEL_ID: llmModelId,
                    LLM_BASE_URL: llmBaseUrl,
                    LLM_API_KEY: llmApiKey
                  }
                }
              );

              // // Clean up the temporary files after successful retry
              // try {
              //   if (fs.existsSync(tempPythonFile)) {
              //     fs.unlinkSync(tempPythonFile);
              //   }
              //   if (fs.existsSync(outputImageFile)) {
              //     fs.unlinkSync(outputImageFile);
              //   }
              // } catch (cleanupError) {
              //   console.error(`[MCP] Failed to clean up temporary files: ${cleanupError.message}`);
              // }

              // Check if a figure was captured in the retry
              const hasFigure = retryStdout.includes('__FIGURE_CAPTURED__');
              let result = retryStdout.replace('__FIGURE_CAPTURED__', '').trim();

              // If there's no text output but a figure was captured
              if (!result && hasFigure) {
                result = 'Figure generated successfully3';
              }

              // If a figure was captured, read it and convert to base64
              if (hasFigure && fs.existsSync(outputImageFile)) {
                try {
                  const imageData = fs.readFileSync(outputImageFile);
                  const base64Image = imageData.toString('base64');

                  // Append the base64 image data to the result with a special marker
                  result += `\n\n__IMAGE_DATA__:data:image/png;base64,${base64Image}`;

                  // // Clean up the image file
                  // fs.unlinkSync(outputImageFile);
                } catch (imageError) {
                  console.error(`[MCP] Failed to process output image: ${imageError.message}`);
                }
              }

              // Return the result of the retry
              if (retryStderr) {
                return `${retryStderr}`;
              }

              return result || 'Code executed successfully with no output';
            } catch (retryError) {
              // If retry fails, continue with normal error handling
              console.error('[MCP] Retry after module installation failed:', retryError);
              stdout = retryError.stdout || stdout;
              stderr = retryError.stderr || stderr;
              error = retryError;
            }
          }
        } catch (installError) {
          console.error(`[MCP] Failed to install module ${missingModule}:`, installError);
        }
      }

      // Clean up the temporary files in case of error
      try {
        // if (fs.existsSync(tempPythonFile)) {
        //   fs.unlinkSync(tempPythonFile);
        // }
        // if (fs.existsSync(outputImageFile)) {
        //   fs.unlinkSync(outputImageFile);
        // }
      } catch (cleanupError) {
        console.error(`[MCP] Failed to clean up temporary files: ${cleanupError.message}`);
      }

      // Extract and return the full error message
      if (error.stderr) {
        // Format the error message to be more readable
        return `${stdout}\n${stderr}\n`;
      } else if (error.message) {
        // For child_process errors, the actual error message might be in the error object
        const fullErrorMessage = error.message;

        // Check if this is a child_process error with a specific format
        if (fullErrorMessage.includes('Command failed:')) {
          // Extract the actual Python error from the message
          const pythonErrorMatch = fullErrorMessage.match(/Command failed:.*?\n([\s\S]*)/);
          if (pythonErrorMatch && pythonErrorMatch[1]) {
            return `${stdout}\n${stderr}\n\n${pythonErrorMatch[1].trim()}`;
          }
        }

        return `${stdout}\n${stderr}\n${fullErrorMessage}`;
      }

      return `${stdout}\n${stderr}\nUnknown error`;
    }
  }
}
