import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { type Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { eventBus } from '@/eventbus'
import { MCP_EVENTS } from '@/events'
import path from 'path'
import { presenter } from '@/presenter'
import { app } from 'electron'
import fs from 'fs'
// import { NO_PROXY, proxyConfig } from '@/presenter/proxyConfig'
import { getInMemoryServer } from './inMemoryServers/builder'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  PromptListEntry,
  ToolCallResult,
  Tool,
  Prompt,
  ResourceListEntry,
  Resource
} from '@shared/presenter'
// TODO: resources 和 prompts 的类型,Notifactions 的类型 https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/examples/client/simpleStreamableHttp.ts
// 简单的 OAuth 提供者，用于处理 Bearer Token
class SimpleOAuthProvider {
  private token: string | null = null

  constructor(authHeader: string | undefined) {
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      this.token = authHeader.substring(7) // 移除 'Bearer ' 前缀
    }
  }

  async tokens(): Promise<{ access_token: string } | null> {
    if (this.token) {
      return { access_token: this.token }
    }
    return null
  }
}

// 确保 TypeScript 能够识别 SERVER_STATUS_CHANGED 属性
type MCPEventsType = typeof MCP_EVENTS & {
  SERVER_STATUS_CHANGED: string
}

// MCP 客户端类
export class McpClient {
  private client: Client | null = null
  private transport: Transport | null = null
  public serverName: string
  public serverConfig: Record<string, unknown>
  private isConnected: boolean = false
  private connectionTimeout: NodeJS.Timeout | null = null
  private nodeRuntimePath: string | null = null
  private npmRegistry: string | null = null

  // 缓存
  private cachedTools: Tool[] | null = null
  private cachedPrompts: PromptListEntry[] | null = null
  private cachedResources: ResourceListEntry[] | null = null

  // 处理PATH环境变量的函数
  private normalizePathEnv(paths: string[]): { key: string; value: string } {
    const isWindows = process.platform === 'win32'
    const separator = isWindows ? ';' : ':'
    const pathKey = isWindows ? 'Path' : 'PATH'

    // 合并所有路径
    const pathValue = paths.filter(Boolean).join(separator)

    return { key: pathKey, value: pathValue }
  }

  // 获取系统特定的默认路径
  private getDefaultPaths(homeDir: string): string[] {
    if (process.platform === 'darwin') {
      return [
        '/bin',
        '/usr/bin',
        '/usr/local/bin',
        '/usr/local/sbin',
        '/opt/homebrew/bin',
        '/opt/homebrew/sbin',
        '/usr/local/opt/node/bin',
        '/opt/local/bin',
        `${homeDir}/.cargo/bin`
      ]
    } else if (process.platform === 'linux') {
      return ['/bin', '/usr/bin', '/usr/local/bin', `${homeDir}/.cargo/bin`]
    } else {
      // Windows
      return [`${homeDir}\\.cargo\\bin`, `${homeDir}\\.local\\bin`]
    }
  }

  constructor(
    serverName: string,
    serverConfig: Record<string, unknown>,
    npmRegistry: string | null = null
  ) {
    this.serverName = serverName
    this.serverConfig = serverConfig
    this.npmRegistry = npmRegistry

    const runtimePath = path
      .join(app.getAppPath(), 'runtime', 'node')
      .replace('app.asar', 'app.asar.unpacked')
    console.info('runtimePath', runtimePath)
    // 检查运行时文件是否存在
    if (process.platform === 'win32') {
      const nodeExe = path.join(runtimePath, 'node.exe')
      const npxCmd = path.join(runtimePath, 'npx.cmd')
      if (fs.existsSync(nodeExe) && fs.existsSync(npxCmd)) {
        this.nodeRuntimePath = runtimePath
      } else {
        this.nodeRuntimePath = null
      }
    } else {
      const nodeBin = path.join(runtimePath, 'bin', 'node')
      const npxBin = path.join(runtimePath, 'bin', 'npx')
      if (fs.existsSync(nodeBin) && fs.existsSync(npxBin)) {
        this.nodeRuntimePath = runtimePath
      } else {
        this.nodeRuntimePath = null
      }
    }
  }

  // 连接到 MCP 服务器
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.info(`MCP server ${this.serverName} is already running`)
      return
    }

    try {
      console.info(`Starting MCP server ${this.serverName}...`, this.serverConfig)

      // 处理 customHeaders 和 AuthProvider
      let authProvider: SimpleOAuthProvider | null = null
      const customHeaders = this.serverConfig.customHeaders
        ? { ...(this.serverConfig.customHeaders as Record<string, string>) } // 创建副本以进行修改
        : {}

      if (customHeaders.Authorization) {
        authProvider = new SimpleOAuthProvider(customHeaders.Authorization)
        delete customHeaders.Authorization // 从 headers 中移除，因为它将由 AuthProvider 处理
      }

      if (this.serverConfig.type === 'inmemory') {
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
        const _args = Array.isArray(this.serverConfig.args) ? this.serverConfig.args : []
        const _env = this.serverConfig.env ? (this.serverConfig.env as Record<string, string>) : {}
        const _server = getInMemoryServer(this.serverName, _args, _env)
        _server.startServer(serverTransport)
        this.transport = clientTransport
      } else if (this.serverConfig.type === 'stdio') {
        // 创建合适的transport
        const command = this.serverConfig.command as string
        const HOME_DIR = app.getPath('home')

        // 定义允许的环境变量白名单
        const allowedEnvVars = [
          'PATH',
          'path',
          'Path',
          'npm_config_registry',
          'npm_config_cache',
          'npm_config_prefix',
          'npm_config_tmp',
          'NPM_CONFIG_REGISTRY',
          'NPM_CONFIG_CACHE',
          'NPM_CONFIG_PREFIX',
          'NPM_CONFIG_TMP'
          // 'GRPC_PROXY',
          // 'grpc_proxy'
        ]

        // 修复env类型问题
        const env: Record<string, string> = {}

        // 判断是否是 Node.js 相关命令
        const isNodeCommand = ['node', 'npm', 'npx'].some((cmd) => command.includes(cmd))

        if (isNodeCommand) {
          // Node.js 命令使用白名单处理
          if (process.env) {
            const existingPaths: string[] = []

            // 收集所有PATH相关的值
            Object.entries(process.env).forEach(([key, value]) => {
              if (value !== undefined) {
                if (['PATH', 'Path', 'path'].includes(key)) {
                  existingPaths.push(value)
                } else if (
                  allowedEnvVars.includes(key) &&
                  !['PATH', 'Path', 'path'].includes(key)
                ) {
                  env[key] = value
                }
              }
            })

            // 获取默认路径
            const defaultPaths = this.getDefaultPaths(HOME_DIR)

            // 合并所有路径
            const allPaths = [...existingPaths, ...defaultPaths]
            if (this.nodeRuntimePath) {
              allPaths.unshift(
                process.platform === 'win32' ? this.nodeRuntimePath : `${this.nodeRuntimePath}/bin`
              )
            }

            // 规范化并设置PATH
            const { key, value } = this.normalizePathEnv(allPaths)
            env[key] = value
          }
        } else {
          // 非 Node.js 命令，保留所有系统环境变量，只补充 PATH
          Object.entries(process.env).forEach(([key, value]) => {
            if (value !== undefined) {
              env[key] = value
            }
          })

          // 补充 PATH
          const existingPaths: string[] = []
          if (env.PATH) {
            existingPaths.push(env.PATH)
          }
          if (env.Path) {
            existingPaths.push(env.Path)
          }

          // 获取默认路径
          const defaultPaths = this.getDefaultPaths(HOME_DIR)

          // 合并所有路径
          const allPaths = [...existingPaths, ...defaultPaths]
          if (this.nodeRuntimePath) {
            allPaths.unshift(
              process.platform === 'win32' ? this.nodeRuntimePath : `${this.nodeRuntimePath}/bin`
            )
          }

          // 规范化并设置PATH
          const { key, value } = this.normalizePathEnv(allPaths)
          env[key] = value
        }

        // 添加自定义环境变量
        if (this.serverConfig.env) {
          Object.entries(this.serverConfig.env as Record<string, string>).forEach(
            ([key, value]) => {
              if (value !== undefined) {
                // 如果是PATH相关变量，合并到主PATH中
                if (['PATH', 'Path', 'path'].includes(key)) {
                  const currentPathKey = process.platform === 'win32' ? 'Path' : 'PATH'
                  const separator = process.platform === 'win32' ? ';' : ':'
                  env[currentPathKey] = env[currentPathKey]
                    ? `${value}${separator}${env[currentPathKey]}`
                    : value
                } else {
                  env[key] = value
                }
              }
            }
          )
        }

        if (this.npmRegistry) {
          env.npm_config_registry = this.npmRegistry
        }

        console.log('mcp env', env)
        this.transport = new StdioClientTransport({
          command,
          args: this.serverConfig.args as string[],
          env,
          stderr: 'pipe'
        })
      } else if (this.serverConfig.baseUrl && this.serverConfig.type === 'sse') {
        this.transport = new SSEClientTransport(new URL(this.serverConfig.baseUrl as string), {
          requestInit: { headers: customHeaders },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          authProvider: (authProvider ?? undefined) as any
        })
      } else if (this.serverConfig.baseUrl && this.serverConfig.type === 'http') {
        this.transport = new StreamableHTTPClientTransport(
          new URL(this.serverConfig.baseUrl as string),
          {
            requestInit: { headers: customHeaders },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            authProvider: (authProvider ?? undefined) as any
          }
        )
      } else {
        throw new Error(`不支持的传输类型: ${this.serverConfig.type}`)
      }

      // 创建 MCP 客户端
      this.client = new Client(
        { name: 'Zentrun', version: app.getVersion() },
        {
          capabilities: {
            resources: {},
            tools: {},
            prompts: {}
          }
        }
      )

      // 设置连接超时
      const timeoutPromise = new Promise<void>((_, reject) => {
        this.connectionTimeout = setTimeout(
          () => {
            console.error(`Connection to MCP server ${this.serverName} timed out`)
            reject(new Error(`Connection to MCP server ${this.serverName} timed out`))
          },
          5 * 60 * 1000
        ) // 5分钟
      })

      // 连接到服务器
      const connectPromise = this.client
        .connect(this.transport)
        .then(() => {
          // 清除超时
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout)
            this.connectionTimeout = null
          }

          this.isConnected = true
          console.info(`MCP server ${this.serverName} connected successfully`)

          // 触发服务器状态变更事件
          eventBus.emit((MCP_EVENTS as MCPEventsType).SERVER_STATUS_CHANGED, {
            name: this.serverName,
            status: 'running'
          })
        })
        .catch((error) => {
          console.error(`Failed to connect to MCP server ${this.serverName}:`, error)
          throw error
        })

      // 等待连接完成或超时
      await Promise.race([connectPromise, timeoutPromise])
    } catch (error) {
      // 清除超时
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout)
        this.connectionTimeout = null
      }

      // 清理资源
      this.cleanupResources()

      console.error(`Failed to connect to MCP server ${this.serverName}:`, error)

      // 触发服务器状态变更事件
      eventBus.emit((MCP_EVENTS as MCPEventsType).SERVER_STATUS_CHANGED, {
        name: this.serverName,
        status: 'stopped'
      })

      throw error
    }
  }

  // 断开与 MCP 服务器的连接
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return
    }

    try {
      // 清理资源
      this.cleanupResources()

      console.log(`Disconnected from MCP server: ${this.serverName}`)

      // 触发服务器状态变更事件
      eventBus.emit((MCP_EVENTS as MCPEventsType).SERVER_STATUS_CHANGED, {
        name: this.serverName,
        status: 'stopped'
      })
    } catch (error) {
      console.error(`Failed to disconnect from MCP server ${this.serverName}:`, error)
      throw error
    }
  }

  // 清理资源
  private cleanupResources(): void {
    // 清除超时定时器
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    // 关闭transport
    if (this.transport) {
      try {
        this.transport.close()
      } catch (error) {
        console.error(`Failed to close MCP transport:`, error)
      }
    }

    // 重置状态
    this.client = null
    this.transport = null
    this.isConnected = false

    // 清空缓存
    this.cachedTools = null
    this.cachedPrompts = null
    this.cachedResources = null
  }

  // 检查服务器是否正在运行
  isServerRunning(): boolean {
    return this.isConnected && !!this.client
  }

  // 调用 MCP 工具
  async callTool(toolName: string, args: Record<string, unknown>): Promise<ToolCallResult> {
    if (!this.isConnected) {
      await this.connect()
    }

    if (!this.client) {
      throw new Error(`MCP客户端 ${this.serverName} 未初始化`)
    }

    try {
      // 调用工具
      const result = (await this.client.callTool({
        name: toolName,
        arguments: args
      })) as ToolCallResult

      // 检查结果
      if (result.isError) {
        const errorText = result.content && result.content[0] ? result.content[0].text : '未知错误'
        // 如果调用失败，清空工具缓存，以便下次重新获取
        this.cachedTools = null
        return {
          isError: true,
          content: [{ type: 'error', text: errorText }]
        }
      }
      return result
    } catch (error) {
      console.error(`Failed to call MCP tool ${toolName}:`, error)
      // 调用失败，清空工具缓存
      this.cachedTools = null
      throw error
    }
  }

  // 列出可用工具
  async listTools(): Promise<Tool[]> {
    // 检查缓存
    if (this.cachedTools !== null) {
      return this.cachedTools
    }

    if (!this.isConnected) {
      await this.connect()
    }

    if (!this.client) {
      throw new Error(`MCP客户端 ${this.serverName} 未初始化`)
    }

    try {
      const response = await this.client.listTools()
      // 检查响应格式
      if (response && typeof response === 'object' && 'tools' in response) {
        const toolsArray = response.tools
        if (Array.isArray(toolsArray)) {
          // 缓存结果
          this.cachedTools = toolsArray as Tool[]
          return this.cachedTools
        }
      }
      throw new Error('无效的工具响应格式')
    } catch (error) {
      // 尝试从错误对象中提取更多信息
      const errorMessage = error instanceof Error ? error.message : String(error)
      // 如果错误表明不支持，则缓存空数组
      if (errorMessage.includes('Method not found') || errorMessage.includes('not supported')) {
        console.warn(`Server ${this.serverName} does not support listTools`)
        this.cachedTools = []
        return this.cachedTools
      } else {
        console.error(`Failed to list MCP tools:`, error)
        // 发生其他错误，不清空缓存（保持null），以便下次重试
        throw error
      }
    }
  }

  // 列出可用提示
  async listPrompts(): Promise<PromptListEntry[]> {
    // 检查缓存
    if (this.cachedPrompts !== null) {
      return this.cachedPrompts
    }

    if (!this.isConnected) {
      await this.connect()
    }

    if (!this.client) {
      throw new Error(`MCP客户端 ${this.serverName} 未初始化`)
    }

    try {
      // SDK可能没有 listPrompts 方法，需要使用通用的 request
      const response = await this.client.listPrompts()

      // 检查响应格式
      if (response && typeof response === 'object' && 'prompts' in response) {
        const promptsArray = (response as { prompts: unknown }).prompts
        // console.log('promptsArray', JSON.stringify(promptsArray, null, 2))
        if (Array.isArray(promptsArray)) {
          // 需要确保每个元素都符合 Prompt 接口
          const validPrompts = promptsArray.map((p) => ({
            name: typeof p === 'object' && p !== null && 'name' in p ? String(p.name) : 'unknown',
            description:
              typeof p === 'object' && p !== null && 'description' in p
                ? String(p.description)
                : undefined,
            arguments:
              typeof p === 'object' && p !== null && 'arguments' in p ? p.arguments : undefined
          })) as PromptListEntry[]
          // 缓存结果
          this.cachedPrompts = validPrompts
          return this.cachedPrompts
        }
      }
      throw new Error('无效的提示响应格式')
    } catch (error) {
      // 尝试从错误对象中提取更多信息
      const errorMessage = error instanceof Error ? error.message : String(error)
      // 如果错误表明不支持，则缓存空数组
      if (errorMessage.includes('Method not found') || errorMessage.includes('not supported')) {
        console.warn(`Server ${this.serverName} does not support listPrompts`)
        this.cachedPrompts = []
        return this.cachedPrompts
      } else {
        console.error(`Failed to list MCP prompts:`, error)
        // 发生其他错误，不清空缓存（保持null），以便下次重试
        throw error
      }
    }
  }

  // 获取指定提示
  async getPrompt(name: string, args?: Record<string, unknown>): Promise<Prompt> {
    if (!this.isConnected) {
      await this.connect()
    }

    if (!this.client) {
      throw new Error(`MCP客户端 ${this.serverName} 未初始化`)
    }

    try {
      // SDK可能没有 getPrompt 方法，需要使用通用的 request
      const response = await this.client.getPrompt({
        name,
        arguments: (args as Record<string, string>) || {}
      })
      // 检查响应格式并转换为 Prompt 类型
      if (
        response &&
        typeof response === 'object' &&
        'messages' in response &&
        Array.isArray(response.messages)
      ) {
        return {
          name: name, // 从请求参数中获取 name
          messages: response.messages as Array<{ role: string; content: { text: string } }>
        }
      }
      throw new Error('无效的获取提示响应格式')
    } catch (error) {
      console.error(`Failed to get MCP prompt ${name}:`, error)
      // 获取失败，清空提示缓存
      this.cachedPrompts = null
      throw error
    }
  }

  // 列出可用资源
  async listResources(): Promise<ResourceListEntry[]> {
    // 检查缓存
    if (this.cachedResources !== null) {
      return this.cachedResources
    }

    if (!this.isConnected) {
      await this.connect()
    }

    if (!this.client) {
      throw new Error(`MCP客户端 ${this.serverName} 未初始化`)
    }

    try {
      // SDK可能没有 listResources 方法，需要使用通用的 request
      const response = await this.client.listResources()

      // 检查响应格式
      if (response && typeof response === 'object' && 'resources' in response) {
        const resourcesArray = (response as { resources: unknown }).resources
        if (Array.isArray(resourcesArray)) {
          // 需要确保每个元素都符合 ResourceListEntry 接口
          const validResources = resourcesArray.map((r) => ({
            uri: typeof r === 'object' && r !== null && 'uri' in r ? String(r.uri) : 'unknown',
            name: typeof r === 'object' && r !== null && 'name' in r ? String(r.name) : undefined
          })) as ResourceListEntry[]
          // 缓存结果
          this.cachedResources = validResources
          return this.cachedResources
        }
      }
      throw new Error('无效的资源列表响应格式')
    } catch (error) {
      // 尝试从错误对象中提取更多信息
      const errorMessage = error instanceof Error ? error.message : String(error)
      // 如果错误表明不支持，则缓存空数组
      if (errorMessage.includes('Method not found') || errorMessage.includes('not supported')) {
        console.warn(`Server ${this.serverName} does not support listResources`)
        this.cachedResources = []
        return this.cachedResources
      } else {
        console.error(`Failed to list MCP resources:`, error)
        // 发生其他错误，不清空缓存（保持null），以便下次重试
        throw error
      }
    }
  }

  // 读取资源
  async readResource(resourceUri: string): Promise<Resource> {
    if (!this.isConnected) {
      await this.connect()
    }

    if (!this.client) {
      throw new Error(`MCP客户端 ${this.serverName} 未初始化`)
    }

    try {
      // 使用 unknown 作为中间类型进行转换
      const rawResource = await this.client.readResource({ uri: resourceUri })

      // 手动构造 Resource 对象
      const resource: Resource = {
        uri: resourceUri,
        text:
          typeof rawResource === 'object' && rawResource !== null && 'text' in rawResource
            ? String(rawResource['text'])
            : JSON.stringify(rawResource)
      }

      return resource
    } catch (error) {
      console.error(`Failed to read MCP resource ${resourceUri}:`, error)
      // 读取失败，清空资源缓存
      this.cachedResources = null
      throw error
    }
  }
}

// 工厂函数，用于创建 MCP 客户端
export async function createMcpClient(serverName: string): Promise<McpClient> {
  // 从configPresenter获取MCP服务器配置
  const servers = await presenter.configPresenter.getMcpServers()

  // 获取服务器配置
  const serverConfig = servers[serverName]
  if (!serverConfig) {
    throw new Error(`MCP server ${serverName} not found in configuration`)
  }

  // 创建并返回 MCP 客户端，传入null作为npmRegistry
  // 注意：这个函数应该只用于直接创建客户端实例的情况
  // 正常情况下应该通过ServerManager创建，以便使用测试后的npm registry
  return new McpClient(serverName, serverConfig as unknown as Record<string, unknown>, null)
}
