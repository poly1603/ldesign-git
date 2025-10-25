import simpleGit, { SimpleGit } from 'simple-git'
import type { WorktreeInfo, WorktreeOptions, GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * Worktree 管理器 - 管理 Git 工作树
 * 
 * Git worktree 允许在同一个仓库中检出多个分支到不同的目录
 * 
 * @example
 * ```ts
 * const worktreeManager = new WorktreeManager({ baseDir: './my-project' })
 * 
 * // 添加新的工作树
 * await worktreeManager.add('../my-project-feature', 'feature/new-feature')
 * 
 * // 列出所有工作树
 * const worktrees = await worktreeManager.list()
 * ```
 */
export class WorktreeManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 添加新的工作树
   * 
   * @param path - 工作树路径
   * @param branch - 分支名（可选）
   * @param options - 选项
   * 
   * @example
   * ```ts
   * // 创建新分支并检出到工作树
   * await worktreeManager.add('../my-project-feature', 'feature/new-feature')
   * 
   * // 检出现有分支到工作树
   * await worktreeManager.add('../my-project-bugfix', 'bugfix/issue-123')
   * ```
   */
  async add(path: string, branch?: string, options: WorktreeOptions = {}): Promise<void> {
    try {
      const args: string[] = ['add']

      if (options.force) {
        args.push('--force')
      }

      if (options.detach) {
        args.push('--detach')
      }

      if (options.checkout !== undefined) {
        args.push('-b', options.checkout)
      }

      args.push(path)

      if (branch) {
        args.push(branch)
      }

      await this.git.raw(['worktree', ...args])
    } catch (error) {
      throw new GitOperationError(
        'worktree add',
        `添加工作树 ${path} 失败`,
        error as Error,
        { path, branch }
      )
    }
  }

  /**
   * 列出所有工作树
   * 
   * @returns 工作树信息数组
   * 
   * @example
   * ```ts
   * const worktrees = await worktreeManager.list()
   * worktrees.forEach(wt => {
   *   console.log(`${wt.path} -> ${wt.branch}`)
   * })
   * ```
   */
  async list(): Promise<WorktreeInfo[]> {
    try {
      const result = await this.git.raw(['worktree', 'list', '--porcelain'])
      return this.parseWorktreeList(result)
    } catch (error) {
      throw new GitOperationError(
        'worktree list',
        '获取工作树列表失败',
        error as Error
      )
    }
  }

  /**
   * 删除工作树
   * 
   * @param path - 工作树路径
   * @param force - 是否强制删除
   * 
   * @example
   * ```ts
   * await worktreeManager.remove('../my-project-feature')
   * ```
   */
  async remove(path: string, force = false): Promise<void> {
    try {
      const args: string[] = ['remove']

      if (force) {
        args.push('--force')
      }

      args.push(path)

      await this.git.raw(['worktree', ...args])
    } catch (error) {
      throw new GitOperationError(
        'worktree remove',
        `删除工作树 ${path} 失败`,
        error as Error,
        { path }
      )
    }
  }

  /**
   * 清理工作树信息
   * 
   * 删除已不存在的工作树的引用
   * 
   * @example
   * ```ts
   * await worktreeManager.prune()
   * ```
   */
  async prune(): Promise<void> {
    try {
      await this.git.raw(['worktree', 'prune'])
    } catch (error) {
      throw new GitOperationError(
        'worktree prune',
        '清理工作树失败',
        error as Error
      )
    }
  }

  /**
   * 移动工作树
   * 
   * @param oldPath - 旧路径
   * @param newPath - 新路径
   * 
   * @example
   * ```ts
   * await worktreeManager.move('../old-path', '../new-path')
   * ```
   */
  async move(oldPath: string, newPath: string): Promise<void> {
    try {
      await this.git.raw(['worktree', 'move', oldPath, newPath])
    } catch (error) {
      throw new GitOperationError(
        'worktree move',
        `移动工作树 ${oldPath} -> ${newPath} 失败`,
        error as Error,
        { oldPath, newPath }
      )
    }
  }

  /**
   * 锁定工作树
   * 
   * @param path - 工作树路径
   * @param reason - 锁定原因（可选）
   * 
   * @example
   * ```ts
   * await worktreeManager.lock('../my-project-feature', '正在进行重要工作')
   * ```
   */
  async lock(path: string, reason?: string): Promise<void> {
    try {
      const args: string[] = ['lock']

      if (reason) {
        args.push('--reason', reason)
      }

      args.push(path)

      await this.git.raw(['worktree', ...args])
    } catch (error) {
      throw new GitOperationError(
        'worktree lock',
        `锁定工作树 ${path} 失败`,
        error as Error,
        { path, reason }
      )
    }
  }

  /**
   * 解锁工作树
   * 
   * @param path - 工作树路径
   * 
   * @example
   * ```ts
   * await worktreeManager.unlock('../my-project-feature')
   * ```
   */
  async unlock(path: string): Promise<void> {
    try {
      await this.git.raw(['worktree', 'unlock', path])
    } catch (error) {
      throw new GitOperationError(
        'worktree unlock',
        `解锁工作树 ${path} 失败`,
        error as Error,
        { path }
      )
    }
  }

  /**
   * 修复工作树
   * 
   * 修复由于工作树被移动或删除导致的问题
   * 
   * @param path - 工作树路径
   * 
   * @example
   * ```ts
   * await worktreeManager.repair('../my-project-feature')
   * ```
   */
  async repair(path: string): Promise<void> {
    try {
      await this.git.raw(['worktree', 'repair', path])
    } catch (error) {
      throw new GitOperationError(
        'worktree repair',
        `修复工作树 ${path} 失败`,
        error as Error,
        { path }
      )
    }
  }

  /**
   * 检查工作树是否存在
   * 
   * @param path - 工作树路径
   * @returns 是否存在
   */
  async exists(path: string): Promise<boolean> {
    const worktrees = await this.list()
    return worktrees.some(wt => wt.path === path)
  }

  /**
   * 获取主工作树
   * 
   * @returns 主工作树信息
   */
  async getMain(): Promise<WorktreeInfo | null> {
    const worktrees = await this.list()
    return worktrees.find(wt => wt.isPrimary) || null
  }

  /**
   * 获取指定分支的工作树
   * 
   * @param branch - 分支名
   * @returns 工作树信息，如果不存在则返回 null
   */
  async getByBranch(branch: string): Promise<WorktreeInfo | null> {
    const worktrees = await this.list()
    return worktrees.find(wt => wt.branch === branch) || null
  }

  /**
   * 解析工作树列表输出
   * 
   * @param output - Git worktree list --porcelain 的输出
   * @returns 工作树信息数组
   */
  private parseWorktreeList(output: string): WorktreeInfo[] {
    const worktrees: WorktreeInfo[] = []
    const lines = output.split('\n')

    let currentWorktree: Partial<WorktreeInfo> = {}

    for (const line of lines) {
      if (line.trim() === '') {
        if (currentWorktree.path) {
          worktrees.push(currentWorktree as WorktreeInfo)
        }
        currentWorktree = {}
        continue
      }

      if (line.startsWith('worktree ')) {
        currentWorktree.path = line.substring('worktree '.length)
      } else if (line.startsWith('HEAD ')) {
        currentWorktree.commit = line.substring('HEAD '.length)
      } else if (line.startsWith('branch ')) {
        currentWorktree.branch = line.substring('branch '.length).replace('refs/heads/', '')
      } else if (line === 'bare') {
        currentWorktree.isBare = true
      } else if (line === 'detached') {
        currentWorktree.branch = 'HEAD'
      } else if (line.startsWith('locked')) {
        currentWorktree.locked = true
      }
    }

    // 添加最后一个工作树
    if (currentWorktree.path) {
      worktrees.push(currentWorktree as WorktreeInfo)
    }

    // 标记主工作树
    if (worktrees.length > 0) {
      worktrees[0].isPrimary = true
      worktrees[0].isBare = worktrees[0].isBare || false
    }

    // 设置默认值
    worktrees.forEach(wt => {
      wt.isPrimary = wt.isPrimary || false
      wt.isBare = wt.isBare || false
    })

    return worktrees
  }
}


