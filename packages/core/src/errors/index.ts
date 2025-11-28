/**
 * Git 错误处理系统
 * @module errors
 */

/**
 * Git 错误基类
 * 
 * 所有 Git 相关错误的基类，提供统一的错误处理接口
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

  constructor(
    message: string,
    code: string = 'GIT_ERROR',
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.originalError = originalError
    this.context = context

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
      originalError: this.originalError?.message
    }
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


