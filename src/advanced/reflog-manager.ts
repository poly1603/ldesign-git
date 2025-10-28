import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * Reflog 条目
 */
export interface ReflogEntry {
  /** 哈希 */
  hash: string
  /** 引用名称 */
  refName: string
  /** 操作 */
  action: string
  /** 提交者 */
  committer: string
  /** 提交者邮箱 */
  committerEmail: string
  /** 时间戳 */
  timestamp: Date
  /** 消息 */
  message: string
}

/**
 * Reflog 删除选项
 */
export interface ReflogDeleteOptions {
  /** 是否重写 */
  rewrite?: boolean
  /** 是否更新引用 */
  updateRef?: boolean
}

/**
 * Reflog 过期选项
 */
export interface ReflogExpireOptions {
  /** 过期时间 */
  expireTime?: string
  /** 未达到的过期时间 */
  expireUnreachable?: string
  /** 是否全部 */
  all?: boolean
  /** 是否更新引用 */
  updateRef?: boolean
  /** 是否重写 */
  rewrite?: boolean
  /** 是否详细模式 */
  verbose?: boolean
}

/**
 * Reflog 管理器
 * 
 * 用于管理 Git Reflog
 * 
 * @example
 * ```typescript
 * const reflog = new ReflogManager({ baseDir: './my-project' })
 * 
 * // 查看 reflog
 * const entries = await reflog.list('HEAD', 10)
 * for (const entry of entries) {
 *   console.log(`${entry.hash.substring(0, 7)} - ${entry.message}`)
 * }
 * 
 * // 过期旧条目
 * await reflog.expire({ expireTime: '30.days.ago' })
 * ```
 */
export class ReflogManager {
  private git: SimpleGit
  private baseDir: string

  constructor(options: GitOptions = {}) {
    this.baseDir = options.baseDir || process.cwd()
    this.git = simpleGit({
      baseDir: this.baseDir,
      binary: 'git',
      maxConcurrentProcesses: 6,
    })
  }

  /**
   * 列出 reflog 条目
   * 
   * @param ref - 引用名称，默认 HEAD
   * @param limit - 限制条数
   * @returns Reflog 条目列表
   * 
   * @example
   * ```typescript
   * const entries = await reflog.list('HEAD', 20)
   * console.log(`最近 ${entries.length} 次操作`)
   * ```
   */
  async list(ref: string = 'HEAD', limit?: number): Promise<ReflogEntry[]> {
    try {
      const args = ['reflog', 'show', ref, '--format=%H|%gd|%gs|%gn|%ge|%gt']
      if (limit) {
        args.push(`-n${limit}`)
      }

      const result = await this.git.raw(args)
      const lines = result.split('\n').filter((line) => line.trim())

      return lines.map((line) => {
        const [hash, refName, action, name, email, timestamp] = line.split('|')
        const actionMatch = action.match(/^(\w+)(?:\s*:\s*(.+))?$/)
        const actionType = actionMatch ? actionMatch[1] : action
        const message = actionMatch && actionMatch[2] ? actionMatch[2] : action

        return {
          hash,
          refName,
          action: actionType,
          committer: name,
          committerEmail: email,
          timestamp: new Date(parseInt(timestamp) * 1000),
          message,
        }
      })
    } catch (error) {
      throw new GitOperationError(
        `列出 reflog 失败: ${error instanceof Error ? error.message : String(error)}`,
        'REFLOG_LIST_FAILED',
        'list',
        error as Error
      )
    }
  }

  /**
   * 显示 reflog 详情
   * 
   * @param ref - 引用名称
   * @returns Reflog 详情
   * 
   * @example
   * ```typescript
   * const details = await reflog.show('HEAD@{0}')
   * console.log(details)
   * ```
   */
  async show(ref: string): Promise<string> {
    try {
      return await this.git.show([ref])
    } catch (error) {
      throw new GitOperationError(
        `显示 reflog 失败: ${error instanceof Error ? error.message : String(error)}`,
        'REFLOG_SHOW_FAILED',
        'show',
        error as Error
      )
    }
  }

  /**
   * 删除 reflog 条目
   * 
   * @param ref - 引用名称
   * @param options - 删除选项
   * 
   * @example
   * ```typescript
   * await reflog.delete('HEAD', { rewrite: true })
   * ```
   */
  async delete(ref: string, options: ReflogDeleteOptions = {}): Promise<void> {
    try {
      const args = ['reflog', 'delete']
      
      if (options.rewrite) {
        args.push('--rewrite')
      }
      if (options.updateRef) {
        args.push('--updateref')
      }
      
      args.push(ref)
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `删除 reflog 失败: ${error instanceof Error ? error.message : String(error)}`,
        'REFLOG_DELETE_FAILED',
        'delete',
        error as Error
      )
    }
  }

  /**
   * 过期 reflog 条目
   * 
   * @param options - 过期选项
   * 
   * @example
   * ```typescript
   * // 删除 30 天前的条目
   * await reflog.expire({ expireTime: '30.days.ago' })
   * 
   * // 删除所有不可达的条目
   * await reflog.expire({ expireUnreachable: 'now', all: true })
   * ```
   */
  async expire(options: ReflogExpireOptions = {}): Promise<void> {
    try {
      const args = ['reflog', 'expire']
      
      if (options.expireTime) {
        args.push(`--expire=${options.expireTime}`)
      }
      if (options.expireUnreachable) {
        args.push(`--expire-unreachable=${options.expireUnreachable}`)
      }
      if (options.all) {
        args.push('--all')
      }
      if (options.updateRef) {
        args.push('--updateref')
      }
      if (options.rewrite) {
        args.push('--rewrite')
      }
      if (options.verbose) {
        args.push('--verbose')
      }
      
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `过期 reflog 失败: ${error instanceof Error ? error.message : String(error)}`,
        'REFLOG_EXPIRE_FAILED',
        'expire',
        error as Error
      )
    }
  }

  /**
   * 检查引用是否存在
   * 
   * @param ref - 引用名称
   * @returns 是否存在
   * 
   * @example
   * ```typescript
   * if (await reflog.exists('HEAD@{5}')) {
   *   console.log('引用存在')
   * }
   * ```
   */
  async exists(ref: string): Promise<boolean> {
    try {
      await this.git.raw(['reflog', 'exists', ref])
      return true
    } catch {
      return false
    }
  }
}
