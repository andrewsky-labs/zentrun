import log from 'electron-log'
import { app } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'

// 配置日志文件路径
// 使用logger记录而不是console
const userData = app?.getPath('userData') || ''
if (userData) {
  log.transports.file.resolvePathFn = () => path.join(userData, 'logs/main.log')
}

// 获取日志开关状态
let loggingEnabled = false

// 导出设置日志开关的方法
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled
  // 如果禁用日志，将文件日志级别设置为 false
  log.transports.file.level = enabled ? 'info' : false
}

// 配置控制台日志
log.transports.console.level = is.dev ? 'debug' : 'info'

// 配置文件日志
log.transports.file.level = 'info'
log.transports.file.maxSize = 1024 * 1024 * 10 // 10MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// 创建不同级别的日志函数
const logger = {
  error: (...params: unknown[]) => log.error(...params),
  warn: (...params: unknown[]) => log.warn(...params),
  info: (...params: unknown[]) => log.info(...params),
  verbose: (...params: unknown[]) => log.verbose(...params),
  debug: (...params: unknown[]) => log.debug(...params),
  silly: (...params: unknown[]) => log.silly(...params),
  log: (...params: unknown[]) => log.info(...params)
}

// 拦截console方法，重定向到logger
function hookConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    trace: console.trace
  }

  // 替换console方法
  console.log = (...args: unknown[]) => {
    // 只有在启用日志或开发模式下才记录日志
    if (loggingEnabled || is.dev) {
      logger.info(...args)
    }
  }

  console.error = (...args: unknown[]) => {
    // 只有在启用日志或开发模式下才记录日志
    if (loggingEnabled || is.dev) {
      logger.error(...args)
    }
  }

  console.warn = (...args: unknown[]) => {
    // 只有在启用日志或开发模式下才记录日志
    if (loggingEnabled || is.dev) {
      logger.warn(...args)
    }
  }

  console.info = (...args: unknown[]) => {
    // 只有在启用日志或开发模式下才记录日志
    if (loggingEnabled || is.dev) {
      logger.info(...args)
    }
  }

  console.debug = (...args: unknown[]) => {
    // 只有在启用日志或开发模式下才记录日志
    if (loggingEnabled || is.dev) {
      logger.debug(...args)
    }
  }

  console.trace = (...args: unknown[]) => {
    // 只有在启用日志或开发模式下才记录日志
    if (loggingEnabled || is.dev) {
      logger.debug(...args)
    }
  }

  return originalConsole
}

// 导出原始console方法，以便需要时可以恢复
export const originalConsole = hookConsole()
export default logger
