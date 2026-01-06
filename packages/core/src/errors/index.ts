/**
 * Git 错误处理系统
 * @module errors
 */

// 导出错误码枚举
export { GitErrorCode, GitErrorMessages, getErrorMessage, isValidErrorCode } from './codes'

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number
  /** 重试间隔（毫秒） */
  delay: number
  /** 是否指数退避 */
  exponentialBackoff?: boolean
  /** 重试条件 */
  shouldRetry?: (error: Error, attempt: number) => boolean
}

/**
 * Git 错误基类
 *
 * 所有 Git 相关错误的基类，提供统一的错误处理接口
 *
 * @example
 * ```ts
 * try {
 *   await git.push()
 * } catch (error) {
 *   if (isGitError(error)) {
 *     console.log('错误码:', error.code)
 *     console.log('可重试:', error.isRetryable)
 *   }
 * }
 * ```
 */
export class GitError extends Error {
  /**
   * 错误代码
   */
  public readonly code: string

  /**
   * 原始错误对象
   */
  public readonly originalError?: Error

  /**
   * 错误上下文信息
   */
  public readonly context?: Record<string, any>

  /**
   * 错误链（用于追踪错误来源）
   */
  public readonly cause?: Error

  /**
   * 错误时间戳
   */
  public readonly timestamp: Date

  /**
   * 是否可重试
   */
  public readonly isRetryable: boolean

  /**
   * 重试配置
   */
  public readonly retryConfig?: RetryConfig

  /**
   * 建议的解决方案
   */
  public readonly suggestions?: string[]

  constructor(
    message: string,
    code: string = 'GIT_ERROR',
    originalError?: Error,
    context?: Record<string, any>,
    options?: {
      isRetryable?: boolean
      retryConfig?: RetryConfig
      cause?: Error
      suggestions?: string[]
    }
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.originalError = originalError
    this.context = context
    this.timestamp = new Date()
    this.isRetryable = options?.isRetryable ?? false
    this.retryConfig = options?.retryConfig
    this.cause = options?.cause ?? originalError
    this.suggestions = options?.suggestions

    // 保持正确的原型链
    Object.setPrototypeOf(this, new.target.prototype)

    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError?.message,
      timestamp: this.timestamp.toISOString(),
      isRetryable: this.isRetryable,
      suggestions: this.suggestions
    }
  }

  /**
   * 获取完整的错误链
   *
   * @returns 错误链数组
   */
  getErrorChain(): Error[] {
    const chain: Error[] = [this]
    let current: Error | undefined = this.cause

    while (current) {
      chain.push(current)
      current = (current as GitError).cause
    }

    return chain
  }

  /**
   * 格式化错误消息
   *
   * @param includeStack - 是否包含堆栈
   * @returns 格式化的错误消息
   */
  format(includeStack = false): string {
    const parts: string[] = [
      `[${this.code}] ${this.message}`,
      `时间: ${this.timestamp.toISOString()}`
    ]

    if (this.context && Object.keys(this.context).length > 0) {
      parts.push(`上下文: ${JSON.stringify(this.context)}`)
    }

    if (this.suggestions && this.suggestions.length > 0) {
      parts.push(`建议:\n  - ${this.suggestions.join('\n  - ')}`)
    }

    if (includeStack && this.stack) {
      parts.push(`堆栈:\n${this.stack}`)
    }

    return parts.join('\n')
  }

  /**
   * 包装错误为 GitError
   *
   * @param error - 原始错误
   * @param code - 错误码
   * @param context - 上下文
   * @returns GitError 实例
   */
  static wrap(error: unknown, code?: string, context?: Record<string, any>): GitError {
    if (error instanceof GitError) {
      return error
    }

    if (error instanceof Error) {
      return new GitError(
        error.message,
        code || 'GIT_ERROR',
        error,
        context,
        { cause: error }
      )
    }

    return new GitError(
      String(error),
      code || 'GIT_ERROR',
      undefined,
      { ...context, originalValue: error }
    )
  }
}

/**
 * Git 操作错误
 * 
 * 当 Git 操作失败时抛出此错误
 */
export class GitOperationError extends GitError {
  /**
   * 失败的操作类型
   */
  public readonly operation: string

  constructor(
    operation: string,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      `Git 操作失败 [${operation}]: ${message}`,
      'GIT_OPERATION_ERROR',
      originalError,
      { ...context, operation }
    )
    this.operation = operation
  }
}

/**
 * Git 冲突错误
 * 
 * 当检测到合并冲突时抛出此错误
 */
export class GitConflictError extends GitError {
  /**
   * 冲突的文件列表
   */
  public readonly conflictedFiles: string[]

  /**
   * 冲突类型
   */
  public readonly conflictType: 'merge' | 'rebase' | 'cherry-pick'

  constructor(
    conflictedFiles: string[],
    conflictType: 'merge' | 'rebase' | 'cherry-pick' = 'merge',
    message?: string
  ) {
    const defaultMessage = `检测到 ${conflictedFiles.length} 个冲突文件`
    super(
      message || defaultMessage,
      'GIT_CONFLICT_ERROR',
      undefined,
      { conflictedFiles, conflictType }
    )
    this.conflictedFiles = conflictedFiles
    this.conflictType = conflictType
  }
}

/**
 * Git 验证错误
 * 
 * 当输入验证失败时抛出此错误
 */
export class GitValidationError extends GitError {
  /**
   * 验证失败的字段
   */
  public readonly field: string

  /**
   * 验证错误列表
   */
  public readonly errors: string[]

  constructor(
    field: string,
    errors: string[],
    message?: string
  ) {
    const defaultMessage = `验证失败 [${field}]: ${errors.join(', ')}`
    super(
      message || defaultMessage,
      'GIT_VALIDATION_ERROR',
      undefined,
      { field, errors }
    )
    this.field = field
    this.errors = errors
  }
}

/**
 * Git 网络错误
 * 
 * 当网络操作（如 push、pull、fetch）失败时抛出此错误
 */
export class GitNetworkError extends GitError {
  /**
   * 远程仓库名称
   */
  public readonly remote: string

  /**
   * 网络操作类型
   */
  public readonly operation: 'push' | 'pull' | 'fetch' | 'clone'

  constructor(
    remote: string,
    operation: 'push' | 'pull' | 'fetch' | 'clone',
    message: string,
    originalError?: Error
  ) {
    super(
      `网络操作失败 [${operation} ${remote}]: ${message}`,
      'GIT_NETWORK_ERROR',
      originalError,
      { remote, operation }
    )
    this.remote = remote
    this.operation = operation
  }
}

/**
 * Git 配置错误
 * 
 * 当 Git 配置相关操作失败时抛出此错误
 */
export class GitConfigError extends GitError {
  /**
   * 配置键
   */
  public readonly key?: string

  constructor(
    message: string,
    key?: string,
    originalError?: Error
  ) {
    super(
      message,
      'GIT_CONFIG_ERROR',
      originalError,
      { key }
    )
    this.key = key
  }
}

/**
 * Git 仓库未找到错误
 * 
 * 当指定路径不是有效的 Git 仓库时抛出此错误
 */
export class GitRepositoryNotFoundError extends GitError {
  /**
   * 仓库路径
   */
  public readonly path: string

  constructor(path: string) {
    super(
      `未找到 Git 仓库: ${path}`,
      'GIT_REPOSITORY_NOT_FOUND',
      undefined,
      { path }
    )
    this.path = path
  }
}

/**
 * Git 分支错误
 * 
 * 当分支操作失败时抛出此错误
 */
export class GitBranchError extends GitError {
  /**
   * 分支名称
   */
  public readonly branch: string

  /**
   * 操作类型
   */
  public readonly operation: string

  constructor(
    branch: string,
    operation: string,
    message: string,
    originalError?: Error
  ) {
    super(
      `分支操作失败 [${operation}] ${branch}: ${message}`,
      'GIT_BRANCH_ERROR',
      originalError,
      { branch, operation }
    )
    this.branch = branch
    this.operation = operation
  }
}

/**
 * Git 提交错误
 *
 * 当提交操作失败时抛出此错误
 */
export class GitCommitError extends GitError {
  constructor(
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      `提交失败: ${message}`,
      'GIT_COMMIT_ERROR',
      originalError,
      context
    )
  }
}

/**
 * Git 标签错误
 *
 * 当标签操作失败时抛出此错误
 */
export class GitTagError extends GitError {
  /**
   * 标签名称
   */
  public readonly tag: string

  /**
   * 操作类型
   */
  public readonly operation: string

  constructor(
    tag: string,
    operation: string,
    message: string,
    originalError?: Error
  ) {
    super(
      `标签操作失败 [${operation}] ${tag}: ${message}`,
      'GIT_TAG_ERROR',
      originalError,
      { tag, operation }
    )
    this.tag = tag
    this.operation = operation
  }
}

/**
 * Git Hook 错误
 *
 * 当 Git Hook 执行失败时抛出此错误
 */
export class GitHookError extends GitError {
  /**
   * Hook 类型
   */
  public readonly hookType: string

  /**
   * 退出码
   */
  public readonly exitCode?: number

  constructor(
    hookType: string,
    message: string,
    exitCode?: number,
    originalError?: Error
  ) {
    super(
      `Hook 执行失败 [${hookType}]: ${message}`,
      'GIT_HOOK_ERROR',
      originalError,
      { hookType, exitCode }
    )
    this.hookType = hookType
    this.exitCode = exitCode
  }
}

/**
 * Git LFS 错误
 *
 * 当 Git LFS 操作失败时抛出此错误
 */
export class GitLFSError extends GitError {
  /**
   * 操作类型
   */
  public readonly operation: string

  constructor(
    operation: string,
    message: string,
    originalError?: Error
  ) {
    super(
      `LFS 操作失败 [${operation}]: ${message}`,
      'GIT_LFS_ERROR',
      originalError,
      { operation }
    )
    this.operation = operation
  }
}

/**
 * Git 子模块错误
 *
 * 当子模块操作失败时抛出此错误
 */
export class GitSubmoduleError extends GitError {
  /**
   * 子模块名称
   */
  public readonly submodule: string

  /**
   * 操作类型
   */
  public readonly operation: string

  constructor(
    submodule: string,
    operation: string,
    message: string,
    originalError?: Error
  ) {
    super(
      `子模块操作失败 [${operation}] ${submodule}: ${message}`,
      'GIT_SUBMODULE_ERROR',
      originalError,
      { submodule, operation }
    )
    this.submodule = submodule
    this.operation = operation
  }
}

/**
 * Git Stash 错误
 *
 * 当 Stash 操作失败时抛出此错误
 */
export class GitStashError extends GitError {
  /**
   * 操作类型
   */
  public readonly operation: string

  /**
   * Stash 索引
   */
  public readonly stashIndex?: number

  constructor(
    operation: string,
    message: string,
    stashIndex?: number,
    originalError?: Error
  ) {
    super(
      `Stash 操作失败 [${operation}]: ${message}`,
      'GIT_STASH_ERROR',
      originalError,
      { operation, stashIndex }
    )
    this.operation = operation
    this.stashIndex = stashIndex
  }
}

/**
 * Git Worktree 错误
 *
 * 当 Worktree 操作失败时抛出此错误
 */
export class GitWorktreeError extends GitError {
  /**
   * Worktree 路径
   */
  public readonly path: string

  /**
   * 操作类型
   */
  public readonly operation: string

  constructor(
    path: string,
    operation: string,
    message: string,
    originalError?: Error
  ) {
    super(
      `Worktree 操作失败 [${operation}] ${path}: ${message}`,
      'GIT_WORKTREE_ERROR',
      originalError,
      { path, operation }
    )
    this.path = path
    this.operation = operation
  }
}

/**
 * Git 超时错误
 *
 * 当操作超时时抛出此错误
 */
export class GitTimeoutError extends GitError {
  /**
   * 操作名称
   */
  public readonly operation: string

  /**
   * 超时时间（毫秒）
   */
  public readonly timeout: number

  constructor(
    operation: string,
    timeout: number,
    originalError?: Error
  ) {
    super(
      `操作超时 [${operation}]: 超过 ${timeout}ms`,
      'GIT_TIMEOUT_ERROR',
      originalError,
      { operation, timeout },
      { isRetryable: true }
    )
    this.operation = operation
    this.timeout = timeout
  }
}

/**
 * Git 认证错误
 *
 * 当认证失败时抛出此错误
 */
export class GitAuthenticationError extends GitError {
  /**
   * 远程仓库
   */
  public readonly remote: string

  constructor(
    remote: string,
    message: string,
    originalError?: Error
  ) {
    super(
      `认证失败 [${remote}]: ${message}`,
      'GIT_AUTHENTICATION_ERROR',
      originalError,
      { remote },
      {
        suggestions: [
          '检查您的凭据是否正确',
          '确保 SSH 密钥已正确配置',
          '尝试使用个人访问令牌 (PAT)',
          '检查网络连接'
        ]
      }
    )
    this.remote = remote
  }
}

// ==================== 类型守卫 ====================

/**
 * 检查是否是 GitError
 */
export function isGitError(error: unknown): error is GitError {
  return error instanceof GitError
}

/**
 * 检查是否是 GitOperationError
 */
export function isGitOperationError(error: unknown): error is GitOperationError {
  return error instanceof GitOperationError
}

/**
 * 检查是否是 GitConflictError
 */
export function isGitConflictError(error: unknown): error is GitConflictError {
  return error instanceof GitConflictError
}

/**
 * 检查是否是 GitValidationError
 */
export function isGitValidationError(error: unknown): error is GitValidationError {
  return error instanceof GitValidationError
}

/**
 * 检查是否是 GitNetworkError
 */
export function isGitNetworkError(error: unknown): error is GitNetworkError {
  return error instanceof GitNetworkError
}

/**
 * 检查是否是 GitConfigError
 */
export function isGitConfigError(error: unknown): error is GitConfigError {
  return error instanceof GitConfigError
}

/**
 * 检查是否是 GitRepositoryNotFoundError
 */
export function isGitRepositoryNotFoundError(error: unknown): error is GitRepositoryNotFoundError {
  return error instanceof GitRepositoryNotFoundError
}

/**
 * 检查是否是 GitBranchError
 */
export function isGitBranchError(error: unknown): error is GitBranchError {
  return error instanceof GitBranchError
}

/**
 * 检查是否是 GitCommitError
 */
export function isGitCommitError(error: unknown): error is GitCommitError {
  return error instanceof GitCommitError
}

/**
 * 检查是否是 GitTagError
 */
export function isGitTagError(error: unknown): error is GitTagError {
  return error instanceof GitTagError
}

/**
 * 检查是否是 GitHookError
 */
export function isGitHookError(error: unknown): error is GitHookError {
  return error instanceof GitHookError
}

/**
 * 检查是否是 GitLFSError
 */
export function isGitLFSError(error: unknown): error is GitLFSError {
  return error instanceof GitLFSError
}

/**
 * 检查是否是 GitSubmoduleError
 */
export function isGitSubmoduleError(error: unknown): error is GitSubmoduleError {
  return error instanceof GitSubmoduleError
}

/**
 * 检查是否是 GitStashError
 */
export function isGitStashError(error: unknown): error is GitStashError {
  return error instanceof GitStashError
}

/**
 * 检查是否是 GitWorktreeError
 */
export function isGitWorktreeError(error: unknown): error is GitWorktreeError {
  return error instanceof GitWorktreeError
}

/**
 * 检查是否是 GitTimeoutError
 */
export function isGitTimeoutError(error: unknown): error is GitTimeoutError {
  return error instanceof GitTimeoutError
}

/**
 * 检查是否是 GitAuthenticationError
 */
export function isGitAuthenticationError(error: unknown): error is GitAuthenticationError {
  return error instanceof GitAuthenticationError
}

/**
 * 检查错误是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  if (isGitError(error)) {
    return error.isRetryable
  }
  return false
}

// ==================== 错误处理工具 ====================

/**
 * 将未知错误转换为 GitError
 * 
 * @param error - 未知错误对象
 * @param defaultMessage - 默认错误消息
 * @returns GitError 实例
 */
export function toGitError(error: unknown, defaultMessage = '未知错误'): GitError {
  if (isGitError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new GitError(error.message, 'GIT_ERROR', error)
  }

  if (typeof error === 'string') {
    return new GitError(error)
  }

  return new GitError(defaultMessage, 'GIT_ERROR', undefined, { originalError: error })
}

/**
 * 包装异步函数，自动捕获并转换错误
 * 
 * @param fn - 要包装的异步函数
 * @param errorMessage - 错误消息
 * @returns 包装后的函数
 */
export function wrapGitOperation<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      throw toGitError(error, errorMessage)
    }
  }) as T
}


