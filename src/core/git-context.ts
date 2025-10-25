/**
 * Git 上下文 - 依赖注入容器
 * @module core/git-context
 */

import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'
import { GitLogger, LogLevel, createLogger } from '../logger'
import { LRUCache, createLRUCache } from '../cache'

/**
 * Git 上下文配置
 */
export interface GitContextConfig extends GitOptions {
  /** 日志级别 */
  logLevel?: LogLevel
  /** 是否启用日志 */
  enableLogging?: boolean
  /** 是否启用缓存 */
  enableCache?: boolean
  /** 缓存最大容量 */
  cacheMaxSize?: number
  /** 缓存默认 TTL（毫秒） */
  cacheTTL?: number
}

/**
 * Git 上下文
 * 
 * 提供共享的 Git 实例、日志器和缓存，支持依赖注入
 * 
 * @example
 * ```ts
 * const context = new GitContext({ baseDir: './my-project' })
 * const git = context.getGit()
 * const logger = context.getLogger()
 * ```
 */
export class GitContext {
  private readonly config: GitContextConfig
  private gitInstance: SimpleGit | null = null
  private loggerInstance: GitLogger | null = null
  private cacheInstance: LRUCache<string, any> | null = null

  constructor(config: GitContextConfig = {}) {
    this.config = {
      baseDir: config.baseDir || process.cwd(),
      logLevel: config.logLevel ?? LogLevel.INFO,
      enableLogging: config.enableLogging ?? true,
      enableCache: config.enableCache ?? true,
      cacheMaxSize: config.cacheMaxSize ?? 100,
      cacheTTL: config.cacheTTL ?? 60000 // 默认 1 分钟
    }
  }

  /**
   * 获取 SimpleGit 实例（单例）
   * 
   * @returns SimpleGit 实例
   */
  getGit(): SimpleGit {
    if (!this.gitInstance) {
      this.gitInstance = simpleGit(this.config.baseDir)
    }
    return this.gitInstance
  }

  /**
   * 获取日志器实例（单例）
   * 
   * @returns GitLogger 实例
   */
  getLogger(): GitLogger {
    if (!this.loggerInstance) {
      this.loggerInstance = createLogger({
        level: this.config.logLevel,
        enabled: this.config.enableLogging
      })
    }
    return this.loggerInstance
  }

  /**
   * 获取缓存实例（单例）
   * 
   * @returns LRUCache 实例
   */
  getCache<T = any>(): LRUCache<string, T> {
    if (!this.cacheInstance) {
      this.cacheInstance = createLRUCache<string, T>({
        maxSize: this.config.cacheMaxSize,
        defaultTTL: this.config.cacheTTL
      })
    }
    return this.cacheInstance as LRUCache<string, T>
  }

  /**
   * 获取基础目录
   * 
   * @returns 基础目录路径
   */
  getBaseDir(): string {
    return this.config.baseDir || process.cwd()
  }

  /**
   * 获取配置
   * 
   * @returns 上下文配置
   */
  getConfig(): Readonly<GitContextConfig> {
    return this.config
  }

  /**
   * 创建子上下文
   * 
   * 子上下文继承父上下文的配置，但可以覆盖部分配置
   * 
   * @param config - 子上下文配置
   * @returns 新的 GitContext 实例
   */
  createChild(config: Partial<GitContextConfig> = {}): GitContext {
    return new GitContext({
      ...this.config,
      ...config
    })
  }

  /**
   * 清理资源
   * 
   * 清空缓存并重置实例
   */
  cleanup(): void {
    if (this.cacheInstance) {
      this.cacheInstance.clear()
    }
    if (this.loggerInstance) {
      this.loggerInstance.clearLogs()
    }
  }

  /**
   * 重置上下文
   * 
   * 清空所有实例，下次调用时会重新创建
   */
  reset(): void {
    this.cleanup()
    this.gitInstance = null
    this.loggerInstance = null
    this.cacheInstance = null
  }

  /**
   * 检查缓存是否启用
   * 
   * @returns 是否启用缓存
   */
  isCacheEnabled(): boolean {
    return this.config.enableCache ?? true
  }

  /**
   * 检查日志是否启用
   * 
   * @returns 是否启用日志
   */
  isLoggingEnabled(): boolean {
    return this.config.enableLogging ?? true
  }

  /**
   * 设置日志级别
   * 
   * @param level - 日志级别
   */
  setLogLevel(level: LogLevel): void {
    const logger = this.getLogger()
    logger.setLevel(level)
  }

  /**
   * 获取缓存统计信息
   * 
   * @returns 缓存统计信息
   */
  getCacheStats() {
    if (!this.cacheInstance) {
      return null
    }
    return this.cacheInstance.getStats()
  }

  /**
   * 获取日志
   * 
   * @returns 日志条目数组
   */
  getLogs() {
    if (!this.loggerInstance) {
      return []
    }
    return this.loggerInstance.getLogs()
  }
}

/**
 * 默认全局上下文实例
 */
export const defaultContext = new GitContext()

/**
 * 创建新的 Git 上下文
 * 
 * @param config - 上下文配置
 * @returns GitContext 实例
 */
export function createContext(config?: GitContextConfig): GitContext {
  return new GitContext(config)
}


