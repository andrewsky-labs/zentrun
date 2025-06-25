import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport'
import { ContentEnricher } from '@/presenter/threadPresenter/contentEnricher'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { nanoid } from 'nanoid'
import { runCode, type CodeFile } from '../pythonRunner'

// Schema 定义
const GetTimeArgsSchema = z.object({
  offset: z
    .number()
    .optional()
    .default(0)
    .describe('Millisecond offset relative to current time, positive for future, negative for past')
})

const GetWebInfoArgsSchema = z.object({
  url: z.string().url().describe('URL of the webpage to retrieve detailed information')
})

const RunNodeCodeArgsSchema = z.object({
  code: z
    .string()
    .describe(
      'Node.js code to execute, should not contain file operations, system settings modification, or external code execution'
    ),
  timeout: z
    .number()
    .optional()
    .default(5000)
    .describe('Code execution timeout in milliseconds, default 5 seconds')
})

const RunPythonCodeArgsSchema = z.object({
  python_code: z
    .string()
    .describe(
      'Python code to execute, should not contain file operations, system settings modification, or external code execution'
    ),
  timeout: z
    .number()
    .optional()
    .default(5000)
    .describe('Code execution timeout in milliseconds, default 5 seconds')
})

// 限制和安全配置
const CODE_EXECUTION_FORBIDDEN_PATTERNS = [
  // 允许os模块用于系统信息读取，但仍然禁止其他危险模块
  /require\s*\(\s*['"](fs|child_process|path|dgram|cluster|v8|vm|module|worker_threads|repl|tls)['"]\s*\)/gi,
  // 允许安全的只读操作，禁止危险的修改操作
  /process\.(exit|kill|abort|chdir|cwd|binding|dlopen|abort)/gi,
  // 禁止动态代码执行
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /new\s+Function/gi,
  /require\s*\(\s*[^'"]/gi,
  /import\s*\(/gi,
  /globalThis/gi,
  /global\./gi,
  /__dirname/gi,
  /__filename/gi,
  /process\.env/gi
]

export class PowerpackServer {
  private server: Server
  private nodeRuntimePath: string | null = null

  constructor() {
    // 查找内置的Node运行时路径
    this.setupNodeRuntime()

    // 创建服务器实例
    this.server = new Server(
      {
        name: 'zentrun-inmemory/powerpack-server',
        version: '0.2.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    )

    // 设置请求处理器
    this.setupRequestHandlers()
  }

  // 设置Node运行时路径
  private setupNodeRuntime(): void {
    const runtimePath = path
      .join(app.getAppPath(), 'runtime', 'node')
      .replace('app.asar', 'app.asar.unpacked')

    if (process.platform === 'win32') {
      const nodeExe = path.join(runtimePath, 'node.exe')
      if (fs.existsSync(nodeExe)) {
        this.nodeRuntimePath = runtimePath
      }
    } else {
      const nodeBin = path.join(runtimePath, 'bin', 'node')
      if (fs.existsSync(nodeBin)) {
        this.nodeRuntimePath = path.join(runtimePath, 'bin')
      }
    }

    if (!this.nodeRuntimePath) {
      console.warn('未找到内置Node运行时，代码执行功能将不可用')
    }
  }

  // 启动服务器
  public startServer(transport: Transport): void {
    this.server.connect(transport)
  }

  // 检查代码的安全性
  private checkCodeSafety(code: string): boolean {
    for (const pattern of CODE_EXECUTION_FORBIDDEN_PATTERNS) {
      if (pattern.test(code)) {
        return false
      }
    }
    return true
  }

  // 格式化相对时间
  private formatRelativeTime(userQuery: string, actualTime: string): string {
    return `${userQuery}的时间是：${actualTime}`
  }

  // 执行Node代码
  private async executeNodeCode(code: string, timeout: number): Promise<string> {
    if (!this.nodeRuntimePath) {
      throw new Error('Node运行时未找到，无法执行代码')
    }

    // 检查代码安全性
    if (!this.checkCodeSafety(code)) {
      throw new Error('代码包含不安全的操作，已被拒绝执行')
    }

    // 创建临时文件
    const tempDir = app.getPath('temp')
    const tempFile = path.join(tempDir, `powerpack_${nanoid()}.js`)

    try {
      // 写入代码到临时文件
      fs.writeFileSync(tempFile, code)

      // 准备执行命令
      const nodeExecutable =
        process.platform === 'win32'
          ? path.join(this.nodeRuntimePath, 'node.exe')
          : path.join(this.nodeRuntimePath, 'node')

      // 执行代码并添加超时控制
      const execPromise = promisify(execFile)(nodeExecutable, [tempFile], {
        timeout,
        windowsHide: true
      })

      const { stdout, stderr } = await execPromise

      if (stderr && stderr.length > 0) {
        return `Execution error: ${stderr}`
      }

      return stdout
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Code execution failed: ${errorMessage}`)
    } finally {
      // 清理临时文件
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile)
        }
      } catch (cleanupError) {
        console.error('Failed to clean up temporary file:', cleanupError)
      }
    }
  }

  // 执行Python代码
  private async executePythonCode(code: string): Promise<string> {
    const files: CodeFile[] = [
      {
        name: 'main.py',
        content: code,
        active: true
      }
    ]

    const result = await runCode(files, (level, data) => {
      console.log(`[${level}] ${data}`)
    })

    if (result.status === 'success') {
      return result.output.join('\n')
    } else {
      throw new Error(result.error)
    }
  }

  // 设置请求处理器
  private setupRequestHandlers(): void {
    // 设置工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // 准备基本工具列表
      const tools = [
        {
          name: 'get_time',
          description:
            'Get formatted time with specified offset from current time. Calculate any time point relative to the current time. ' +
            "For example, get current time, yesterday's time, tomorrow's time, etc. " +
            'Use the offset parameter (milliseconds) to specify the offset relative to the current time, positive for future, negative for past.',
          inputSchema: zodToJsonSchema(GetTimeArgsSchema)
        },
        {
          name: 'get_web_info',
          description:
            'Get detailed content information from a specified webpage. Extract title, description, main content, and other information. ' +
            'This tool is useful for analyzing webpage content, obtaining article summaries or details. ' +
            'Just provide a valid HTTP or HTTPS URL to get complete webpage content analysis.',
          inputSchema: zodToJsonSchema(GetWebInfoArgsSchema)
        }
      ]

      // 只有在Node运行时可用时才添加代码执行工具
      if (this.nodeRuntimePath) {
        tools.push({
          name: 'run_node_code',
          description:
            'Execute simple Node.js code in a secure sandbox environment. Suitable for calculations, data transformations, encryption/decryption, and network operations. ' +
            'The code needs to be output to the console, and the output content needs to be formatted as a string. ' +
            'For security reasons, the code cannot perform file operations, modify system settings, spawn child processes, or execute external code from network. ' +
            'Code execution has a timeout limit, default is 5 seconds, you can adjust it based on the estimated time of the code, generally not recommended to exceed 2 minutes. ' +
            'When a problem can be solved by a simple and secure Node.js code or you have generated a simple code for the user and want to execute it, please use this tool, providing more reliable information to the user.',
          inputSchema: zodToJsonSchema(RunNodeCodeArgsSchema)
        })
      }

      // 添加Python代码执行工具
      tools.push({
        name: 'run_python_code',
        description:
          'Execute simple Python code in a secure sandbox environment. Suitable for calculations, data analysis, and scientific computing. ' +
          'The code needs to be output to the print function, and the output content needs to be formatted as a string. ' +
          'The code will be executed with Python 3.12. ' +
          'Code execution has a timeout limit, default is 5 seconds, you can adjust it based on the estimated time of the code, generally not recommended to exceed 2 minutes. ' +
          'Dependencies may be defined via PEP 723 script metadata, e.g. to install "pydantic", the script should startwith a comment of the form:' +
          `# /// script\n` +
          `# dependencies = ['pydantic']\n ` +
          `# ///\n` +
          `print('hello world').`,
        inputSchema: zodToJsonSchema(RunPythonCodeArgsSchema)
      })

      return { tools }
    })

    // 设置工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params

        switch (name) {
          case 'get_time': {
            const parsed = GetTimeArgsSchema.safeParse(args)
            if (!parsed.success) {
              throw new Error(`无效的时间参数: ${parsed.error}`)
            }

            const { offset } = parsed.data
            const targetTime = new Date(Date.now() + offset)
            const formattedTime = targetTime.toLocaleString()

            // 根据偏移量判断是什么时间
            const timeDescription = 'The requested time is:'

            return {
              content: [
                {
                  type: 'text',
                  text: this.formatRelativeTime(timeDescription, formattedTime)
                }
              ]
            }
          }

          case 'get_web_info': {
            const parsed = GetWebInfoArgsSchema.safeParse(args)
            if (!parsed.success) {
              throw new Error(`无效的URL参数: ${parsed.error}`)
            }

            const { url } = parsed.data
            const enrichedData = await ContentEnricher.enrichUrl(url)

            // 格式化网页内容为易读的格式
            let formattedContent = `## Webpage Details\n\n`
            formattedContent += `### Title\n${enrichedData.title || 'No Title'}\n\n`
            formattedContent += `### URL\n${enrichedData.url}\n\n`

            if (enrichedData.description) {
              formattedContent += `### Description\n${enrichedData.description}\n\n`
            }

            if (enrichedData.content) {
              const truncatedContent =
                enrichedData.content.length > 1000
                  ? enrichedData.content.substring(0, 1000) + '...(Content truncated)'
                  : enrichedData.content
              formattedContent += `### Main Content\n${truncatedContent}\n\n`
            }

            return {
              content: [
                {
                  type: 'text',
                  text: formattedContent
                }
              ]
            }
          }

          case 'run_node_code': {
            // 再次检查Node运行时是否可用
            if (!this.nodeRuntimePath) {
              throw new Error('Node runtime is not available, cannot execute code')
            }

            const parsed = RunNodeCodeArgsSchema.safeParse(args)
            if (!parsed.success) {
              throw new Error(`无效的代码参数: ${parsed.error}`)
            }

            const { code, timeout } = parsed.data
            const result = await this.executeNodeCode(code, timeout)

            return {
              content: [
                {
                  type: 'text',
                  text: `代码执行结果:\n\n${result}`
                }
              ]
            }
          }

          case 'run_python_code': {
            const parsed = RunPythonCodeArgsSchema.safeParse(args)
            if (!parsed.success) {
              throw new Error(`无效的代码参数: ${parsed.error}`)
            }

            const { python_code } = parsed.data
            const result = await this.executePythonCode(python_code)

            return {
              content: [
                {
                  type: 'text',
                  text: `代码执行结果:\n\n${result}`
                }
              ]
            }
          }

          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          content: [{ type: 'text', text: `错误: ${errorMessage}` }],
          isError: true
        }
      }
    })
  }
}
