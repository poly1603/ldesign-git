import type { GitOptions } from '../types'
import { GitLogger } from '../logger'

/**
 * 操作指标
 */
export interface OperationMetrics {
  /** 操作名称 */
  name: string
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 持续时间（毫秒） */
  duration?: number
  /** 是否成功 */
  success?: boolean
  /** 错误信息 */
  error?: string
  /** 附加元数据 */
  metadata?: Record<string, any>
}

/**
 * 性能报告
 */
export interface PerformanceReport {
  /** 总操作数 */
  totalOperations: number
  /** 成功操作数 */
  successfulOperations: number
  /** 失败操作数 */
  failedOperations: number
  /** 平均执行时间（毫秒） */
  averageDuration: number
  /** 最慢操作 */
  slowestOperation?: OperationMetrics
  /** 最快操作 */
  fastestOperation?: OperationMetrics
  /** 按操作名称分组的统计 */
  operationStats: Record<string, OperationStats>
  /** 总耗时 */
  totalDuration: number
}

/**
 * 操作统计
 */
export interface OperationStats {
  /** 操作名称 */
  name: string
  /** 调用次数 */
  count: number
  /** 成功次数 */
  successCount: number
  /** 失败次数 */
  failureCount: number
  /** 平均耗时 */
  averageDuration: number
  /** 最小耗时 */
  minDuration: number
  /** 最大耗时 */
  maxDuration: number
  /** 总耗时 */
  totalDuration: number
}

/**
 * 导出的性能数据
 */
export interface MetricsData {
  /** 报告生成时间 */
  timestamp: string
  /** 性能报告 */
  report: PerformanceReport
  /** 所有操作记录 */
  operations: OperationMetrics[]
}

/**
 * 性能监控器配置
 */
export interface PerformanceMonitorConfig extends GitOptions {
  /** 是否启用监控 */
  enabled?: boolean
  /** 最大保存的操作记录数 */
  maxOperations?: number
  /** 是否自动记录日志 */
  autoLog?: boolean
  /** 慢操作阈值（毫秒） */
  slowThreshold?: number
}

/**
 * 性能监控器
 * 
 * 用于追踪和分析 Git 操作的性能
 * 
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor({ slowThreshold: 1000 })
 * 
 * const tracker = monitor.startTracking('commit')
 * await git.commit('feat: new feature')
 * tracker.end()
 * 
 * const report = monitor.getPerformanceReport()
 * console.log('平均耗时:', report.averageDuration, 'ms')
 * ```
 */
export class PerformanceMonitor {
  private operations: OperationMetrics[] = []
  private enabled: boolean
  private maxOperations: number
  private autoLog: boolean
  private slowThreshold: number
  private logger?: GitLogger

  constructor(config: PerformanceMonitorConfig = {}) {
    this.enabled = config.enabled ?? true
    this.maxOperations = config.maxOperations ?? 1000
    this.autoLog = config.autoLog ?? false
    this.slowThreshold = config.slowThreshold ?? 5000

    if (this.autoLog) {
      this.logger = new GitLogger({})
    }
  }

  /**
   * 开始追踪操作
   * 
   * @param name - 操作名称
   * @param metadata - 附加元数据
   * @returns 操作追踪器
   * 
   * @example
   * ```typescript
   * const tracker = monitor.startTracking('push', { remote: 'origin' })
   * await git.push()
   * tracker.end(true)
   * ```
   */
  startTracking(
    name: string,
    metadata?: Record<string, any>
  ): OperationTracker {
    if (!this.enabled) {
      return new NoOpTracker()
    }

    const metrics: OperationMetrics = {
      name,
      startTime: Date.now(),
      metadata,
    }

    return new OperationTracker(metrics, (finalMetrics) => {
      this.recordOperation(finalMetrics)
    })
  }

  /**
   * 追踪异步操作
   * 
   * @param name - 操作名称
   * @param fn - 异步函数
   * @param metadata - 附加元数据
   * @returns 函数执行结果
   * 
   * @example
   * ```typescript
   * const result = await monitor.track('fetch', async () => {
   *   return await git.fetch()
   * })
   * ```
   */
  async track<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const tracker = this.startTracking(name, metadata)
    try {
      const result = await fn()
      tracker.end(true)
      return result
    } catch (error) {
      tracker.end(false, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * 追踪同步操作
   * 
   * @param name - 操作名称
   * @param fn - 同步函数
   * @param metadata - 附加元数据
   * @returns 函数执行结果
   */
  trackSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const tracker = this.startTracking(name, metadata)
    try {
      const result = fn()
      tracker.end(true)
      return result
    } catch (error) {
      tracker.end(false, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * 记录操作
   */
  private recordOperation(metrics: OperationMetrics): void {
    this.operations.push(metrics)

    // 限制操作记录数量
    if (this.operations.length > this.maxOperations) {
      this.operations.shift()
    }

    // 自动日志
    if (this.autoLog && this.logger) {
      const duration = metrics.duration || 0
      const isSlow = duration > this.slowThreshold

      if (isSlow) {
        this.logger.warn(
          `慢操作: ${metrics.name} 耗时 ${duration}ms`,
          metrics
        )
      } else {
        this.logger.debug(
          `操作: ${metrics.name} 耗时 ${duration}ms`,
          metrics
        )
      }
    }
  }

  /**
   * 获取操作统计
   * 
   * @param name - 操作名称（可选）
   * @returns 操作统计
   * 
   * @example
   * ```typescript
   * const stats = monitor.getOperationStats('commit')
   * console.log(`提交操作平均耗时: ${stats.averageDuration}ms`)
   * ```
   */
  getOperationStats(name?: string): OperationStats[] {
    const operations = name
      ? this.operations.filter((op) => op.name === name)
      : this.operations

    const statsMap = new Map<string, OperationStats>()

    for (const op of operations) {
      if (!op.duration) continue

      const existing = statsMap.get(op.name)
      if (!existing) {
        statsMap.set(op.name, {
          name: op.name,
          count: 1,
          successCount: op.success ? 1 : 0,
          failureCount: op.success ? 0 : 1,
          averageDuration: op.duration,
          minDuration: op.duration,
          maxDuration: op.duration,
          totalDuration: op.duration,
        })
      } else {
        existing.count++
        existing.successCount += op.success ? 1 : 0
        existing.failureCount += op.success ? 0 : 1
        existing.totalDuration += op.duration
        existing.averageDuration = existing.totalDuration / existing.count
        existing.minDuration = Math.min(existing.minDuration, op.duration)
        existing.maxDuration = Math.max(existing.maxDuration, op.duration)
      }
    }

    return Array.from(statsMap.values())
  }

  /**
   * 获取性能报告
   * 
   * @returns 性能报告
   * 
   * @example
   * ```typescript
   * const report = monitor.getPerformanceReport()
   * console.log(`总操作数: ${report.totalOperations}`)
   * console.log(`成功率: ${(report.successfulOperations / report.totalOperations * 100).toFixed(2)}%`)
   * ```
   */
  getPerformanceReport(): PerformanceReport {
    const operationsWithDuration = this.operations.filter((op) => op.duration)
    const successfulOps = operationsWithDuration.filter((op) => op.success)
    const failedOps = operationsWithDuration.filter((op) => !op.success)

    const totalDuration = operationsWithDuration.reduce(
      (sum, op) => sum + (op.duration || 0),
      0
    )
    const averageDuration =
      operationsWithDuration.length > 0
        ? totalDuration / operationsWithDuration.length
        : 0

    const slowest = operationsWithDuration.reduce((prev, current) =>
      (current.duration || 0) > (prev.duration || 0) ? current : prev
    , operationsWithDuration[0])

    const fastest = operationsWithDuration.reduce((prev, current) =>
      (current.duration || 0) < (prev.duration || 0) ? current : prev
    , operationsWithDuration[0])

    const statsArray = this.getOperationStats()
    const operationStats: Record<string, OperationStats> = {}
    for (const stat of statsArray) {
      operationStats[stat.name] = stat
    }

    return {
      totalOperations: this.operations.length,
      successfulOperations: successfulOps.length,
      failedOperations: failedOps.length,
      averageDuration,
      slowestOperation: slowest,
      fastestOperation: fastest,
      operationStats,
      totalDuration,
    }
  }

  /**
   * 导出性能数据
   * 
   * @returns 性能数据
   * 
   * @example
   * ```typescript
   * const data = monitor.exportMetrics()
   * fs.writeFileSync('performance.json', JSON.stringify(data, null, 2))
   * ```
   */
  exportMetrics(): MetricsData {
    return {
      timestamp: new Date().toISOString(),
      report: this.getPerformanceReport(),
      operations: [...this.operations],
    }
  }

  /**
   * 清除所有操作记录
   * 
   * @example
   * ```typescript
   * monitor.clear()
   * ```
   */
  clear(): void {
    this.operations = []
  }

  /**
   * 启用监控
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * 禁用监控
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 获取慢操作
   * 
   * @param threshold - 阈值（毫秒），默认使用配置的阈值
   * @returns 慢操作列表
   */
  getSlowOperations(threshold?: number): OperationMetrics[] {
    const limit = threshold ?? this.slowThreshold
    return this.operations.filter(
      (op) => op.duration && op.duration > limit
    )
  }

  /**
   * 获取失败的操作
   * 
   * @returns 失败操作列表
   */
  getFailedOperations(): OperationMetrics[] {
    return this.operations.filter((op) => op.success === false)
  }
}

/**
 * 操作追踪器
 */
class OperationTracker {
  constructor(
    public metrics: OperationMetrics,
    public onEnd: (metrics: OperationMetrics) => void
  ) {}

  /**
   * 结束追踪
   *
   * @param success - 是否成功
   * @param error - 错误信息
   */
  end(success: boolean = true, error?: string): void {
    this.metrics.endTime = Date.now()
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime
    this.metrics.success = success
    if (error) {
      this.metrics.error = error
    }
    this.onEnd(this.metrics)
  }
}

/**
 * 空操作追踪器（禁用监控时使用）
 */
class NoOpTracker {
  metrics: OperationMetrics = {
    name: '',
    startTime: 0
  }
  
  onEnd = () => {}
  
  end(): void {
    // No operation
  }
}

/**
 * 创建性能监控器
 * 
 * @param config - 配置
 * @returns 性能监控器实例
 */
export function createPerformanceMonitor(
  config?: PerformanceMonitorConfig
): PerformanceMonitor {
  return new PerformanceMonitor(config)
}
