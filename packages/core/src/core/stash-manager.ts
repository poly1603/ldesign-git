import simpleGit, { SimpleGit } from 'simple-git'
import type { StashInfo, StashOptions, GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * Stash 管理器 - 管理 Git Stash
 * 
 * 提供完整的 stash 操作，包括保存、应用、弹出、删除等
 * 
 * @example
 * ```ts
 * const stashManager = new StashManager({ baseDir: './my-project' })
 * 
 * // 保存当前更改
 * await stashManager.save({ message: '临时保存' })
 * 
 * // 列出所有 stash
 * const stashes = await stashManager.list()
 * 
 * // 应用最新的 stash
 * await stashManager.apply()
 * ```
 */
export class StashManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 保存当前更改到 stash
   * 
   * @param options - Stash 选项
   * @returns Stash 信息
   * 
   * @example
   * ```ts
   * await stashManager.save({
   *   message: 'WIP: 临时保存',
   *   includeUntracked: true
   * })
   * ```
   */
  async save(options: StashOptions = {}): Promise<void> {
    try {
      const args: string[] = []

      if (options.includeUntracked) {
        args.push('--include-untracked')
      }

      if (options.keepIndex) {
        args.push('--keep-index')
      }

      if (options.message) {
        args.push('save', options.message)
      } else {
        args.push('save')
      }

      await this.git.stash(args)
    } catch (error) {
      throw new GitOperationError(
        'stash save',
        '保存 stash 失败',
        error as Error
      )
    }
  }

  /**
   * 保存当前更改（推荐使用的新方法）
   * 
   * @param options - Stash 选项
   * @returns Stash 信息
   */
  async push(options: StashOptions = {}): Promise<void> {
    try {
      const args: string[] = ['push']

      if (options.includeUntracked) {
        args.push('--include-untracked')
      }

      if (options.keepIndex) {
        args.push('--keep-index')
      }

      if (options.message) {
        args.push('-m', options.message)
      }

      await this.git.stash(args)
    } catch (error) {
      throw new GitOperationError(
        'stash push',
        '保存 stash 失败',
        error as Error
      )
    }
  }

  /**
   * 列出所有 stash
   * 
   * @returns Stash 信息数组
   * 
   * @example
   * ```ts
   * const stashes = await stashManager.list()
   * stashes.forEach(stash => {
   *   console.log(`${stash.index}: ${stash.message}`)
   * })
   * ```
   */
  async list(): Promise<StashInfo[]> {
    try {
      const result = await this.git.stashList()

      return result.all.map((stash, index) => ({
        index,
        name: `stash@{${index}}`,
        message: stash.message || '',
        date: stash.date || ''
      }))
    } catch (error) {
      throw new GitOperationError(
        'stash list',
        '获取 stash 列表失败',
        error as Error
      )
    }
  }

  /**
   * 应用指定的 stash（保留 stash）
   * 
   * @param index - Stash 索引（默认为 0，即最新的）
   * 
   * @example
   * ```ts
   * // 应用最新的 stash
   * await stashManager.apply()
   * 
   * // 应用特定的 stash
   * await stashManager.apply(2)
   * ```
   */
  async apply(index = 0): Promise<void> {
    try {
      const stashName = `stash@{${index}}`
      await this.git.stash(['apply', stashName])
    } catch (error) {
      throw new GitOperationError(
        'stash apply',
        `应用 stash ${index} 失败`,
        error as Error
      )
    }
  }

  /**
   * 弹出指定的 stash（应用并删除）
   * 
   * @param index - Stash 索引（默认为 0，即最新的）
   * 
   * @example
   * ```ts
   * // 弹出最新的 stash
   * await stashManager.pop()
   * ```
   */
  async pop(index = 0): Promise<void> {
    try {
      const stashName = `stash@{${index}}`
      await this.git.stash(['pop', stashName])
    } catch (error) {
      throw new GitOperationError(
        'stash pop',
        `弹出 stash ${index} 失败`,
        error as Error
      )
    }
  }

  /**
   * 删除指定的 stash
   * 
   * @param index - Stash 索引
   * 
   * @example
   * ```ts
   * await stashManager.drop(1)
   * ```
   */
  async drop(index: number): Promise<void> {
    try {
      const stashName = `stash@{${index}}`
      await this.git.stash(['drop', stashName])
    } catch (error) {
      throw new GitOperationError(
        'stash drop',
        `删除 stash ${index} 失败`,
        error as Error
      )
    }
  }

  /**
   * 清空所有 stash
   * 
   * @example
   * ```ts
   * await stashManager.clear()
   * ```
   */
  async clear(): Promise<void> {
    try {
      await this.git.stash(['clear'])
    } catch (error) {
      throw new GitOperationError(
        'stash clear',
        '清空 stash 失败',
        error as Error
      )
    }
  }

  /**
   * 查看指定 stash 的内容
   * 
   * @param index - Stash 索引（默认为 0）
   * @returns Stash 内容
   * 
   * @example
   * ```ts
   * const content = await stashManager.show(0)
   * console.log(content)
   * ```
   */
  async show(index = 0): Promise<string> {
    try {
      const stashName = `stash@{${index}}`
      const result = await this.git.stash(['show', '-p', stashName])
      return result
    } catch (error) {
      throw new GitOperationError(
        'stash show',
        `查看 stash ${index} 失败`,
        error as Error
      )
    }
  }

  /**
   * 创建一个分支并应用 stash
   * 
   * @param branchName - 分支名称
   * @param index - Stash 索引（默认为 0）
   * 
   * @example
   * ```ts
   * await stashManager.branch('feature/from-stash', 0)
   * ```
   */
  async branch(branchName: string, index = 0): Promise<void> {
    try {
      const stashName = `stash@{${index}}`
      await this.git.stash(['branch', branchName, stashName])
    } catch (error) {
      throw new GitOperationError(
        'stash branch',
        `从 stash ${index} 创建分支失败`,
        error as Error
      )
    }
  }

  /**
   * 检查是否存在 stash
   * 
   * @returns 是否存在 stash
   */
  async hasStashes(): Promise<boolean> {
    const stashes = await this.list()
    return stashes.length > 0
  }

  /**
   * 获取 stash 数量
   * 
   * @returns Stash 数量
   */
  async count(): Promise<number> {
    const stashes = await this.list()
    return stashes.length
  }

  /**
   * 获取最新的 stash 信息
   * 
   * @returns 最新的 stash 信息，如果没有则返回 null
   */
  async getLatest(): Promise<StashInfo | null> {
    const stashes = await this.list()
    return stashes.length > 0 ? stashes[0] : null
  }

  /**
   * 应用 stash 并保留索引
   * 
   * @param index - Stash 索引
   */
  async applyKeepIndex(index = 0): Promise<void> {
    try {
      const stashName = `stash@{${index}}`
      await this.git.stash(['apply', '--index', stashName])
    } catch (error) {
      throw new GitOperationError(
        'stash apply --index',
        `应用 stash ${index} 失败`,
        error as Error
      )
    }
  }
}
