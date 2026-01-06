/**
 * 操作队列管理器
 * @module core/operation-queue
 */

/**
 * 操作优先级
 */
export enum OperationPriority {
  /** 低优先级 */
  LOW = 0,
  /** 普通优先级 */
  NORMAL = 1,
  /** 高优先级 */
  HIGH = 2,
  /** 紧急优先级 */
  URGENT = 3
}

/**
 * 操作状态
 */
export type QueuedOperationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'

/**
 * 队列中的操作
 */
export interface QueuedOperation<T = unknown> {
  /** 操作 ID */
  id: string
  /** 操作名称 */
  name: string
  /** 优先级 */
  priority: OperationPriority
  /** 状态 */
  status: QueuedOperationStatus
  /** 执行函数 */
  execute: () => Promise<T>
  /** 结果 */
  result?: T
  /** 错误 */
  error?: Error
  /** 创建时间 */
  createdAt: Date
  /** 开始时间 */
  startedAt?: Date
  /** 完成时间 */
  completedAt?: Date
  /** 超时时间（毫秒） */
  timeout?: number
  /** 重试次数 */
  retryCount?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 取消令牌 */
  cancelToken?: AbortController
}

/**
 * 队列配置
 */
export interface OperationQueueConfig {
  /** 最大并发数 */
  concurrency?: number
  /** 默认超时时间（毫秒） */
  defaultTimeout?: number
  /** 默认最大重试次数 */
  defaultMaxRetries?: number
  /** 默认重试延迟（毫秒） */
  defaultRetryDelay?: number
  /** 是否自动启动 */
  autoStart?: boolean
  /** 进度回调 */
  onProgress?: (stats: QueueStats) => void
  /** 操作完成回调 */
  onOperationComplete?: (operation: QueuedOperation) => void
  /** 操作失败回调 */
  onOperationFailed?: (operation: QueuedOperation, error: Error) => void
}

/**
 * 队列统计信息
 */
export interface QueueStats {
  /** 待处理数量 */
  pending: number
  /** 运行中数量 */
  running: number
  /** 已完成数量 */
  completed: number
  /** 失败数量 */
  failed: number
  /** 已取消数量 */
  cancelled: number
  /** 总数量 */
  total: number
  /** 平均执行时间（毫秒） */
  avgExecutionTime: number
  /** 成功率 */
  successRate: number
}

/**
 * 添加操作选项
 */
export interface AddOperationOptions {
  /** 操作名称 */
  name?: string
  /** 优先级 */
  priority?: OperationPriority
  /** 超时时间（毫秒） */
  timeout?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
}

/**
 * 操作队列管理器
 *
 * 提供并发控制、优先级排序、自动重试等功能
 *
 * @example
 * ```ts
 * const queue = new OperationQueue({ concurrency: 3 })
 *
 * // 添加操作
 * const result = await queue.add(
 *   () => git.push(),
 *   { name: 'push', priority: OperationPriority.HIGH }
 * )
 *
 * // 批量添加
 * const results = await queue.addBatch([
 *   { execute: () => git.fetch('origin'), name: 'fetch' },
 *   { execute: () => git.pull(), name: 'pull' }
 * ])
 * ```
 */
export class OperationQueue {
  private queue: QueuedOperation[] = []
  private running: Map<string, QueuedOperation> = new Map()
  private completed: QueuedOperation[] = []
  private config: Required<OperationQueueConfig>
  private isRunning = false
  private idCounter = 0
  private totalExecutionTime = 0
  private totalOperations = 0

  constructor(config: OperationQueueConfig = {}) {
    this.config = {
      concurrency: config.concurrency ?? 4,
      defaultTimeout: config.defaultTimeout ?? 30000,
      defaultMaxRetries: config.defaultMaxRetries ?? 0,
      defaultRetryDelay: config.defaultRetryDelay ?? 1000,
      autoStart: config.autoStart ?? true,
      onProgress: config.onProgress ?? (() => {}),
      onOperationComplete: config.onOperationComplete ?? (() => {}),
      onOperationFailed: config.onOperationFailed ?? (() => {})
    }
  }

  /**
   * 添加操作到队列
   *
   * @param execute - 执行函数
   * @param options - 选项
   * @returns 操作结果的 Promise
   */
  add<T>(
    execute: () => Promise<T>,
    options: AddOperationOptions = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const operation: QueuedOperation<T> = {
        id: this.generateId(),
        name: options.name ?? 'unnamed',
        priority: options.priority ?? OperationPriority.NORMAL,
        status: 'pending',
        execute,
        createdAt: new Date(),
        timeout: options.timeout ?? this.config.defaultTimeout,
        maxRetries: options.maxRetries ?? this.config.defaultMaxRetries,
        retryDelay: options.retryDelay ?? this.config.defaultRetryDelay,
        retryCount: 0,
        cancelToken: new AbortController()
      }

      // 包装执行函数以处理 resolve/reject
      const originalExecute = operation.execute
      operation.execute = async () => {
        try {
          const result = await originalExecute()
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      }

      this.insertByPriority(operation)

      if (this.config.autoStart) {
        this.start()
      }
    })
  }

  /**
   * 批量添加操作
   *
   * @param operations - 操作列表
   * @returns 所有操作结果的 Promise
   */
  async addBatch<T>(
    operations: Array<{
      execute: () => Promise<T>
      name?: string
      priority?: OperationPriority
    }>
  ): Promise<T[]> {
    const promises = operations.map(op =>
      this.add(op.execute, {
        name: op.name,
        priority: op.priority
      })
    )

    return Promise.all(promises)
  }

  /**
   * 启动队列处理
   */
  start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.processQueue()
  }

  /**
   * 暂停队列处理
   */
  pause(): void {
    this.isRunning = false
  }

  /**
   * 停止队列处理并取消所有待处理操作
   */
  stop(): void {
    this.isRunning = false

    // 取消所有待处理操作
    for (const operation of this.queue) {
      operation.status = 'cancelled'
      operation.cancelToken?.abort()
    }

    // 取消所有运行中的操作
    for (const operation of this.running.values()) {
      operation.status = 'cancelled'
      operation.cancelToken?.abort()
    }

    this.queue = []
    this.running.clear()
  }

  /**
   * 清空队列
   */
  clear(): void {
    for (const operation of this.queue) {
      operation.status = 'cancelled'
    }
    this.queue = []
  }

  /**
   * 取消特定操作
   *
   * @param id - 操作 ID
   * @returns 是否成功取消
   */
  cancel(id: string): boolean {
    // 检查待处理队列
    const queueIndex = this.queue.findIndex(op => op.id === id)
    if (queueIndex !== -1) {
      const operation = this.queue[queueIndex]
      operation.status = 'cancelled'
      operation.cancelToken?.abort()
      this.queue.splice(queueIndex, 1)
      return true
    }

    // 检查运行中的操作
    const runningOp = this.running.get(id)
    if (runningOp) {
      runningOp.status = 'cancelled'
      runningOp.cancelToken?.abort()
      return true
    }

    return false
  }

  /**
   * 获取操作状态
   *
   * @param id - 操作 ID
   * @returns 操作信息
   */
  getOperation(id: string): QueuedOperation | undefined {
    // 检查待处理队列
    const pending = this.queue.find(op => op.id === id)
    if (pending) return pending

    // 检查运行中的操作
    const running = this.running.get(id)
    if (running) return running

    // 检查已完成的操作
    return this.completed.find(op => op.id === id)
  }

  /**
   * 获取队列统计信息
   */
  getStats(): QueueStats {
    const completed = this.completed.filter(op => op.status === 'completed').length
    const failed = this.completed.filter(op => op.status === 'failed').length
    const cancelled = this.completed.filter(op => op.status === 'cancelled').length

    const total = this.queue.length + this.running.size + this.completed.length
    const finishedTotal = completed + failed

    return {
      pending: this.queue.length,
      running: this.running.size,
      completed,
      failed,
      cancelled,
      total,
      avgExecutionTime: this.totalOperations > 0
        ? this.totalExecutionTime / this.totalOperations
        : 0,
      successRate: finishedTotal > 0 ? completed / finishedTotal : 0
    }
  }

  /**
   * 等待所有操作完成
   */
  async waitForAll(): Promise<void> {
    while (this.queue.length > 0 || this.running.size > 0) {
      await this.delay(100)
    }
  }

  /**
   * 等待队列清空（所有操作完成或取消）
   *
   * @param timeout - 超时时间（毫秒）
   * @returns 是否在超时前完成
   */
  async waitForEmpty(timeout?: number): Promise<boolean> {
    const startTime = Date.now()

    while (this.queue.length > 0 || this.running.size > 0) {
      if (timeout && Date.now() - startTime > timeout) {
        return false
      }
      await this.delay(100)
    }

    return true
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    while (this.isRunning && (this.queue.length > 0 || this.running.size > 0)) {
      // 启动新的操作
      while (
        this.isRunning &&
        this.running.size < this.config.concurrency &&
        this.queue.length > 0
      ) {
        const operation = this.queue.shift()
        if (operation) {
          this.executeOperation(operation)
        }
      }

      // 等待一段时间再检查
      await this.delay(10)
    }
  }

  /**
   * 执行单个操作
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    operation.status = 'running'
    operation.startedAt = new Date()
    this.running.set(operation.id, operation)

    this.notifyProgress()

    try {
      // 设置超时
      const timeoutPromise = operation.timeout
        ? this.createTimeout(operation.timeout, operation.cancelToken?.signal)
        : null

      // 执行操作
      const executePromise = operation.execute()

      // 竞态：执行 vs 超时 vs 取消
      const result = timeoutPromise
        ? await Promise.race([executePromise, timeoutPromise])
        : await executePromise

      // 检查是否被取消
      if (operation.cancelToken?.signal.aborted) {
        operation.status = 'cancelled'
      } else {
        operation.status = 'completed'
        operation.result = result
      }
    } catch (error) {
      // 检查是否需要重试
      if (
        operation.maxRetries &&
        (operation.retryCount ?? 0) < operation.maxRetries &&
        !operation.cancelToken?.signal.aborted
      ) {
        operation.retryCount = (operation.retryCount ?? 0) + 1
        operation.status = 'pending'

        // 延迟后重新加入队列
        await this.delay(operation.retryDelay ?? this.config.defaultRetryDelay)
        this.insertByPriority(operation)
      } else {
        operation.status = 'failed'
        operation.error = error as Error
        this.config.onOperationFailed(operation, error as Error)
      }
    } finally {
      operation.completedAt = new Date()

      // 计算执行时间
      if (operation.startedAt && operation.completedAt) {
        const executionTime =
          operation.completedAt.getTime() - operation.startedAt.getTime()
        this.totalExecutionTime += executionTime
        this.totalOperations++
      }

      // 从运行中移除
      this.running.delete(operation.id)

      // 添加到已完成列表
      if (operation.status !== 'pending') {
        this.completed.push(operation)

        if (operation.status === 'completed') {
          this.config.onOperationComplete(operation)
        }
      }

      this.notifyProgress()
    }
  }

  /**
   * 按优先级插入队列
   */
  private insertByPriority(operation: QueuedOperation): void {
    // 找到第一个优先级低于当前操作的位置
    const index = this.queue.findIndex(
      op => op.priority < operation.priority
    )

    if (index === -1) {
      this.queue.push(operation)
    } else {
      this.queue.splice(index, 0, operation)
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `op_${Date.now()}_${++this.idCounter}`
  }

  /**
   * 创建超时 Promise
   */
  private createTimeout(
    ms: number,
    signal?: AbortSignal
  ): Promise<never> {
    return new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`操作超时: ${ms}ms`))
      }, ms)

      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId)
      })
    })
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 通知进度
   */
  private notifyProgress(): void {
    this.config.onProgress(this.getStats())
  }
}

/**
 * 创建操作队列实例
 *
 * @param config - 队列配置
 * @returns 操作队列实例
 */
export function createOperationQueue(
  config?: OperationQueueConfig
): OperationQueue {
  return new OperationQueue(config)
}
