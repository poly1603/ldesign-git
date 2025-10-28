import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * Bisect 状态
 */
export interface BisectStatus {
  /** 是否正在进行 bisect */
  active: boolean
  /** 当前提交 */
  current?: string
  /** 好的提交 */
  good?: string[]
  /** 坏的提交 */
  bad?: string[]
  /** 剩余步骤数 */
  stepsRemaining?: number
}

/**
 * Bisect 结果
 */
export interface BisectResult {
  /** 找到的提交 */
  commit: string
  /** 提交信息 */
  message: string
  /** 提交者 */
  author: string
  /** 提交时间 */
  date: Date
}

/**
 * Bisect 管理器
 * 
 * 用于自动化二分查找问题提交
 * 
 * @example
 * ```typescript
 * const bisect = new BisectManager({ baseDir: './my-project' })
 * 
 * // 开始二分查找
 * await bisect.start('HEAD', 'v1.0.0')
 * 
 * // 标记当前提交为好/坏
 * await bisect.markGood()
 * await bisect.markBad()
 * 
 * // 自动运行测试
 * await bisect.run('npm test')
 * ```
 */
export class BisectManager {
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
   * 开始二分查找
   * 
   * @param bad - 坏的提交
   * @param good - 好的提交
   * 
   * @example
   * ```typescript
   * await bisect.start('HEAD', 'v1.0.0')
   * ```
   */
  async start(bad: string, good: string): Promise<void> {
    try {
      await this.git.raw(['bisect', 'start'])
      await this.git.raw(['bisect', 'bad', bad])
      await this.git.raw(['bisect', 'good', good])
    } catch (error) {
      throw new GitOperationError(
        `开始 bisect 失败: ${error instanceof Error ? error.message : String(error)}`,
        'BISECT_START_FAILED',
        'start',
        error as Error
      )
    }
  }

  /**
   * 标记当前提交为好的
   * 
   * @example
   * ```typescript
   * await bisect.markGood()
   * ```
   */
  async markGood(): Promise<void> {
    try {
      await this.git.raw(['bisect', 'good'])
    } catch (error) {
      throw new GitOperationError(
        `标记提交失败: ${error instanceof Error ? error.message : String(error)}`,
        'BISECT_MARK_FAILED',
        'markGood',
        error as Error
      )
    }
  }

  /**
   * 标记当前提交为坏的
   * 
   * @example
   * ```typescript
   * await bisect.markBad()
   * ```
   */
  async markBad(): Promise<void> {
    try {
      await this.git.raw(['bisect', 'bad'])
    } catch (error) {
      throw new GitOperationError(
        `标记提交失败: ${error instanceof Error ? error.message : String(error)}`,
        'BISECT_MARK_FAILED',
        'markBad',
        error as Error
      )
    }
  }

  /**
   * 跳过当前提交
   * 
   * @example
   * ```typescript
   * await bisect.skip()
   * ```
   */
  async skip(): Promise<void> {
    try {
      await this.git.raw(['bisect', 'skip'])
    } catch (error) {
      throw new GitOperationError(
        `跳过提交失败: ${error instanceof Error ? error.message : String(error)}`,
        'BISECT_SKIP_FAILED',
        'skip',
        error as Error
      )
    }
  }

  /**
   * 重置 bisect
   * 
   * @example
   * ```typescript
   * await bisect.reset()
   * ```
   */
  async reset(): Promise<void> {
    try {
      await this.git.raw(['bisect', 'reset'])
    } catch (error) {
      throw new GitOperationError(
        `重置 bisect 失败: ${error instanceof Error ? error.message : String(error)}`,
        'BISECT_RESET_FAILED',
        'reset',
        error as Error
      )
    }
  }

  /**
   * 自动运行 bisect
   * 
   * @param command - 测试命令，返回 0 表示好，非 0 表示坏
   * @returns Bisect 结果
   * 
   * @example
   * ```typescript
   * const result = await bisect.run('npm test')
   * console.log('问题提交:', result.commit)
   * ```
   */
  async run(command: string): Promise<BisectResult> {
    try {
      const output = await this.git.raw(['bisect', 'run', ...command.split(' ')])
      
      // 解析输出找到问题提交
      const commitMatch = output.match(/^([a-f0-9]{40})\s+is the first bad commit/m)
      if (!commitMatch) {
        throw new Error('未找到问题提交')
      }

      const commitHash = commitMatch[1]
      const log = await this.git.show([commitHash, '--format=%s|%an|%at', '--no-patch'])
      const [message, author, timestamp] = log.split('|')

      return {
        commit: commitHash,
        message: message.trim(),
        author: author.trim(),
        date: new Date(parseInt(timestamp) * 1000),
      }
    } catch (error) {
      throw new GitOperationError(
        `运行 bisect 失败: ${error instanceof Error ? error.message : String(error)}`,
        'BISECT_RUN_FAILED',
        'run',
        error as Error
      )
    }
  }

  /**
   * 获取 bisect 状态
   * 
   * @returns Bisect 状态
   * 
   * @example
   * ```typescript
   * const status = await bisect.getStatus()
   * if (status.active) {
   *   console.log('剩余步骤:', status.stepsRemaining)
   * }
   * ```
   */
  async getStatus(): Promise<BisectStatus> {
    try {
      const logOutput = await this.git.raw(['bisect', 'log']).catch(() => '')
      const active = logOutput.length > 0

      if (!active) {
        return { active: false }
      }

      const good: string[] = []
      const bad: string[] = []

      const goodMatches = logOutput.matchAll(/git bisect good ([a-f0-9]+)/g)
      for (const match of goodMatches) {
        good.push(match[1])
      }

      const badMatches = logOutput.matchAll(/git bisect bad ([a-f0-9]+)/g)
      for (const match of badMatches) {
        bad.push(match[1])
      }

      const currentBranch = await this.git.revparse(['HEAD'])
      
      return {
        active,
        current: currentBranch.trim(),
        good,
        bad,
      }
    } catch (error) {
      throw new GitOperationError(
        `获取 bisect 状态失败: ${error instanceof Error ? error.message : String(error)}`,
        'BISECT_STATUS_FAILED',
        'getStatus',
        error as Error
      )
    }
  }

  /**
   * 可视化 bisect 日志
   * 
   * @returns 日志内容
   * 
   * @example
   * ```typescript
   * const log = await bisect.visualize()
   * console.log(log)
   * ```
   */
  async visualize(): Promise<string> {
    try {
      return await this.git.raw(['bisect', 'visualize', '--oneline'])
    } catch (error) {
      throw new GitOperationError(
        `可视化 bisect 失败: ${error instanceof Error ? error.message : String(error)}`,
        'BISECT_VISUALIZE_FAILED',
        'visualize',
        error as Error
      )
    }
  }
}
