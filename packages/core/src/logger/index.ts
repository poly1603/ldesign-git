/**
 * Git 日志系统
 * @module logger
 */

/**
 * 日志级别
 */
export enum LogLevel {
  /** 调试信息 */
  DEBUG = 0,
  /** 一般信息 */
  INFO = 1,
  /** 警告信息 */
  WARN = 2,
  /** 错误信息 */
  ERROR = 3,
  /** 静默模式 */
  SILENT = 4
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  /** 日志级别 */
  level: LogLevel
  /** 日志消息 */
  message: string
  /** 时间戳 */
  timestamp: Date
  /** 额外数据 */
  data?: any
  /** 错误对象 */
  error?: Error
}

/**
 * 日志器配置接口
 */
export interface LoggerConfig {
  /** 最小日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** 自定义日志处理器 */
  handler?: (entry: LogEntry) => void
  /** 是否包含时间戳 */
  includeTimestamp?: boolean
  /** 是否包含级别标签 */
  includeLevelLabel?: boolean
}

/**
 * Git 日志器
 * 
 * 提供结构化的日志记录功能，支持不同的日志级别和自定义输出
 */
export class GitLogger {
  private config: Required<LoggerConfig>
  private logs: LogEntry[] = []

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enabled: config.enabled ?? true,
      handler: config.handler ?? this.defaultHandler.bind(this),
      includeTimestamp: config.includeTimestamp ?? true,
      includeLevelLabel: config.includeLevelLabel ?? true
    }
  }

  /**
   * 记录调试信息
   * 
   * @param message - 日志消息
   * @param data - 额外数据
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * 记录一般信息
   * 
   * @param message - 日志消息
   * @param data - 额外数据
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * 记录警告信息
   * 
   * @param message - 日志消息
   * @param data - 额外数据
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * 记录错误信息
   * 
   * @param message - 日志消息
   * @param error - 错误对象或额外数据
   */
  error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, undefined, error)
    } else {
      this.log(LogLevel.ERROR, message, error)
    }
  }

  /**
   * 记录日志
   * 
   * @param level - 日志级别
   * @param message - 日志消息
   * @param data - 额外数据
   * @param error - 错误对象
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    // 检查是否启用且级别足够
    if (!this.config.enabled || level < this.config.level) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      error
    }

    // 保存日志
    this.logs.push(entry)

    // 调用处理器
    this.config.handler(entry)
  }

  /**
   * 默认日志处理器
   * 
   * @param entry - 日志条目
   */
  private defaultHandler(entry: LogEntry): void {
    const parts: string[] = []

    // 时间戳
    if (this.config.includeTimestamp) {
      const timestamp = entry.timestamp.toISOString()
      parts.push(`[${timestamp}]`)
    }

    // 级别标签
    if (this.config.includeLevelLabel) {
      const levelLabel = this.getLevelLabel(entry.level)
      parts.push(`[${levelLabel}]`)
    }

    // 消息
    parts.push(entry.message)

    // 组合消息
    const message = parts.join(' ')

    // 根据级别选择输出方式
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '')
        break
      case LogLevel.INFO:
        console.info(message, entry.data || '')
        break
      case LogLevel.WARN:
        console.warn(message, entry.data || '')
        break
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.data || '')
        if (entry.error?.stack) {
          console.error(entry.error.stack)
        }
        break
    }
  }

  /**
   * 获取级别标签
   * 
   * @param level - 日志级别
   * @returns 级别标签
   */
  private getLevelLabel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG'
      case LogLevel.INFO:
        return 'INFO '
      case LogLevel.WARN:
        return 'WARN '
      case LogLevel.ERROR:
        return 'ERROR'
      default:
        return 'UNKNOWN'
    }
  }

  /**
   * 设置日志级别
   * 
   * @param level - 日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  /**
   * 获取当前日志级别
   * 
   * @returns 当前日志级别
   */
  getLevel(): LogLevel {
    return this.config.level
  }

  /**
   * 启用日志
   */
  enable(): void {
    this.config.enabled = true
  }

  /**
   * 禁用日志
   */
  disable(): void {
    this.config.enabled = false
  }

  /**
   * 检查是否启用
   * 
   * @returns 是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * 获取所有日志
   * 
   * @returns 日志条目数组
   */
  getLogs(): ReadonlyArray<LogEntry> {
    return this.logs
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * 获取指定级别的日志
   * 
   * @param level - 日志级别
   * @returns 日志条目数组
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * 导出日志为 JSON 字符串
   * 
   * @returns JSON 字符串
   */
  exportLogsAsJSON(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 创建子日志器
   * 
   * 子日志器会在消息前添加前缀
   * 
   * @param prefix - 日志前缀
   * @returns 新的日志器实例
   */
  createChild(prefix: string): GitLogger {
    const childLogger = new GitLogger({
      ...this.config,
      handler: (entry) => {
        const prefixedEntry = {
          ...entry,
          message: `[${prefix}] ${entry.message}`
        }
        this.config.handler(prefixedEntry)
      }
    })
    return childLogger
  }
}

/**
 * 默认全局日志器实例
 */
export const defaultLogger = new GitLogger()

/**
 * 创建新的日志器实例
 * 
 * @param config - 日志器配置
 * @returns 日志器实例
 */
export function createLogger(config?: LoggerConfig): GitLogger {
  return new GitLogger(config)
}


