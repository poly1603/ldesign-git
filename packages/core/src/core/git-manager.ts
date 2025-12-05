import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions, StatusResult } from '../types'
import { GitOperationError, GitNetworkError, GitCommitError } from '../errors'

/**
 * Git 管理器 - 提供基础的 Git 操作
 * 
 * 核心的 Git 操作类，封装了常用的 Git 命令，提供类型安全和错误处理
 * 
 * @example
 * ```ts
 * const git = new GitManager({ baseDir: './my-project' })
 * 
 * await git.init()
 * await git.add('.')
 * await git.commit('feat: initial commit')
 * await git.push()
 * ```
 */
export class GitManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 初始化 Git 仓库
   * 
   * 在当前目录创建一个新的 Git 仓库
   * 
   * @throws {GitOperationError} 当初始化失败时
   * 
   * @example
   * ```ts
   * await git.init()
   * ```
   */
  async init(): Promise<void> {
    try {
      await this.git.init()
    } catch (error) {
      throw new GitOperationError('init', '初始化仓库失败', error as Error)
    }
  }

  /**
   * 添加远程仓库
   * 
   * @param name - 远程仓库名称（通常为 'origin'）
   * @param url - 远程仓库 URL
   * @throws {GitOperationError} 当添加远程仓库失败时
   * 
   * @example
   * ```ts
   * await git.addRemote('origin', 'https://github.com/user/repo.git')
   * ```
   */
  async addRemote(name: string, url: string): Promise<void> {
    try {
      await this.git.addRemote(name, url)
    } catch (error) {
      throw new GitOperationError(
        'add remote',
        `添加远程仓库 ${name} 失败`,
        error as Error,
        { name, url }
      )
    }
  }

  /**
   * 获取当前分支名
   * 
   * @returns 当前分支名称
   * @throws {GitOperationError} 当获取分支失败时
   * 
   * @example
   * ```ts
   * const branch = await git.getCurrentBranch()
   * console.log(`当前分支: ${branch}`)
   * ```
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.branch()
      return branch.current
    } catch (error) {
      throw new GitOperationError('get current branch', '获取当前分支失败', error as Error)
    }
  }

  /**
   * 获取仓库状态
   * 
   * @returns 仓库状态信息，包含修改、新增、删除的文件等
   * @throws {GitOperationError} 当获取状态失败时
   * 
   * @example
   * ```ts
   * const status = await git.status()
   * console.log(`修改的文件: ${status.modified.length}`)
   * console.log(`新增的文件: ${status.created.length}`)
   * ```
   */
  async status(): Promise<StatusResult> {
    try {
      const result = await this.git.status()
      // 转换 simple-git 的 status 结果，将 isClean() 方法转换为 isClean 属性
      return {
        ...result,
        isClean: result.isClean(),
      } as StatusResult
    } catch (error) {
      throw new GitOperationError('status', '获取仓库状态失败', error as Error)
    }
  }

  /**
   * 添加文件到暂存区
   * 
   * @param files - 要添加的文件路径或路径数组，使用 '.' 添加所有文件
   * @throws {GitOperationError} 当添加文件失败时
   * 
   * @example
   * ```ts
   * // 添加单个文件
   * await git.add('src/index.ts')
   * 
   * // 添加多个文件
   * await git.add(['file1.ts', 'file2.ts'])
   * 
   * // 添加所有文件
   * await git.add('.')
   * ```
   */
  async add(files: string | string[]): Promise<void> {
    try {
      await this.git.add(files)
    } catch (error) {
      throw new GitOperationError(
        'add',
        `添加文件失败`,
        error as Error,
        { files }
      )
    }
  }

  /**
   * 提交更改
   * 
   * @param message - 提交信息
   * @throws {GitCommitError} 当提交失败时
   * 
   * @example
   * ```ts
   * await git.commit('feat(user): add login feature')
   * ```
   */
  async commit(message: string): Promise<void> {
    try {
      await this.git.commit(message)
    } catch (error) {
      throw new GitCommitError('提交失败', error as Error, { message })
    }
  }

  /**
   * 推送到远程仓库
   * 
   * @param remote - 远程仓库名称（默认为 'origin'）
   * @param branch - 分支名称（可选）
   * @throws {GitNetworkError} 当推送失败时
   * 
   * @example
   * ```ts
   * // 推送当前分支
   * await git.push()
   * 
   * // 推送到指定远程和分支
   * await git.push('origin', 'main')
   * ```
   */
  async push(remote = 'origin', branch?: string): Promise<void> {
    try {
      await this.git.push(remote, branch)
    } catch (error) {
      throw new GitNetworkError(
        remote,
        'push',
        `推送到 ${remote}${branch ? `/${branch}` : ''} 失败`,
        error as Error
      )
    }
  }

  /**
   * 从远程仓库拉取
   * 
   * @param remote - 远程仓库名称（默认为 'origin'）
   * @param branch - 分支名称（可选）
   * @throws {GitNetworkError} 当拉取失败时
   * 
   * @example
   * ```ts
   * // 拉取当前分支
   * await git.pull()
   * 
   * // 拉取指定远程和分支
   * await git.pull('origin', 'main')
   * ```
   */
  async pull(remote = 'origin', branch?: string): Promise<void> {
    try {
      await this.git.pull(remote, branch)
    } catch (error) {
      throw new GitNetworkError(
        remote,
        'pull',
        `从 ${remote}${branch ? `/${branch}` : ''} 拉取失败`,
        error as Error
      )
    }
  }

  /**
   * 检查是否是 Git 仓库
   * 
   * @returns 是否是 Git 仓库
   * 
   * @example
   * ```ts
   * const isRepo = await git.isRepository()
   * if (!isRepo) {
   *   await git.init()
   * }
   * ```
   */
  async isRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree'])
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取仓库根目录
   * 
   * @returns 仓库根目录路径
   * @throws {GitOperationError} 当不是 Git 仓库时
   * 
   * @example
   * ```ts
   * const root = await git.getRepositoryRoot()
   * console.log(`仓库根目录: ${root}`)
   * ```
   */
  async getRepositoryRoot(): Promise<string> {
    try {
      const result = await this.git.revparse(['--show-toplevel'])
      return result.trim()
    } catch (error) {
      throw new GitOperationError(
        'get repository root',
        '获取仓库根目录失败（可能不是 Git 仓库）',
        error as Error
      )
    }
  }

  /**
   * 重置仓库状态
   * 
   * @param mode - 重置模式: 'soft' | 'mixed' | 'hard'
   * @param commit - 目标提交（默认为 'HEAD'）
   * @throws {GitOperationError} 当重置失败时
   * 
   * @example
   * ```ts
   * // 软重置到上一个提交
   * await git.reset('soft', 'HEAD~1')
   * 
   * // 硬重置到指定提交
   * await git.reset('hard', 'abc1234')
   * ```
   */
  async reset(mode: 'soft' | 'mixed' | 'hard' = 'mixed', commit = 'HEAD'): Promise<void> {
    try {
      await this.git.reset([`--${mode}`, commit])
    } catch (error) {
      throw new GitOperationError(
        'reset',
        `重置到 ${commit} 失败`,
        error as Error,
        { mode, commit }
      )
    }
  }

  /**
   * 回退指定提交
   * 
   * @param commit - 要回退的提交哈希
   * @throws {GitOperationError} 当回退失败时
   * 
   * @example
   * ```ts
   * await git.revert('abc1234')
   * ```
   */
  async revert(commit: string): Promise<void> {
    try {
      await this.git.revert(commit)
    } catch (error) {
      throw new GitOperationError(
        'revert',
        `回退提交 ${commit} 失败`,
        error as Error,
        { commit }
      )
    }
  }

  /**
   * 克隆仓库
   * 
   * @param url - 仓库 URL
   * @param localPath - 本地路径
   * @param options - 克隆选项
   * @throws {GitNetworkError} 当克隆失败时
   * 
   * @example
   * ```ts
   * await git.clone('https://github.com/user/repo.git', './my-repo')
   * ```
   */
  async clone(url: string, localPath: string, options?: { depth?: number; branch?: string; recursive?: boolean }): Promise<void> {
    try {
      const args: string[] = []
      
      if (options?.depth) {
        args.push('--depth', options.depth.toString())
      }
      if (options?.branch) {
        args.push('--branch', options.branch)
      }
      if (options?.recursive) {
        args.push('--recurse-submodules')
      }
      
      await this.git.clone(url, localPath, args)
    } catch (error) {
      throw new GitNetworkError(
        url,
        'clone',
        `克隆仓库 ${url} 失败`,
        error as Error
      )
    }
  }

  /**
   * 检出分支或文件
   * 
   * @param target - 分支名或文件路径
   * @param options - 检出选项
   * @throws {GitOperationError} 当检出失败时
   * 
   * @example
   * ```ts
   * // 切换分支
   * await git.checkout('develop')
   * 
   * // 创建并切换分支
   * await git.checkout('feature/new', { createBranch: true })
   * 
   * // 丢弃文件更改
   * await git.checkout('src/index.ts')
   * ```
   */
  async checkout(target: string, options?: { createBranch?: boolean }): Promise<void> {
    try {
      if (options?.createBranch) {
        await this.git.checkoutBranch(target, 'HEAD')
      } else {
        await this.git.checkout(target)
      }
    } catch (error) {
      throw new GitOperationError(
        'checkout',
        `检出 ${target} 失败`,
        error as Error,
        { target, options }
      )
    }
  }

  /**
   * 清理未跟踪的文件
   * 
   * @param options - 清理选项
   * @throws {GitOperationError} 当清理失败时
   * 
   * @example
   * ```ts
   * // 清理未跟踪文件
   * await git.clean({ force: true })
   * 
   * // 清理未跟踪文件和目录
   * await git.clean({ force: true, directories: true })
   * ```
   */
  async clean(options?: { force?: boolean; directories?: boolean; dryRun?: boolean }): Promise<void> {
    try {
      const args: string[] = []
      
      if (options?.force) {
        args.push('-f')
      }
      if (options?.directories) {
        args.push('-d')
      }
      if (options?.dryRun) {
        args.push('-n')
      }
      
      await this.git.clean(args)
    } catch (error) {
      throw new GitOperationError(
        'clean',
        '清理工作区失败',
        error as Error,
        { options }
      )
    }
  }

  /**
   * 从暂存区移除文件
   * 
   * @param files - 要移除的文件路径或路径数组
   * @throws {GitOperationError} 当移除失败时
   * 
   * @example
   * ```ts
   * await git.unstage('src/index.ts')
   * await git.unstage(['file1.ts', 'file2.ts'])
   * ```
   */
  async unstage(files: string | string[]): Promise<void> {
    try {
      const fileList = Array.isArray(files) ? files : [files]
      await this.git.reset(['HEAD', '--', ...fileList])
    } catch (error) {
      throw new GitOperationError(
        'unstage',
        '从暂存区移除文件失败',
        error as Error,
        { files }
      )
    }
  }

  /**
   * 删除文件
   * 
   * @param files - 要删除的文件路径或路径数组
   * @param options - 删除选项
   * @throws {GitOperationError} 当删除失败时
   * 
   * @example
   * ```ts
   * await git.rm('old-file.ts')
   * await git.rm(['file1.ts', 'file2.ts'], { cached: true })
   * ```
   */
  async rm(files: string | string[], options?: { cached?: boolean; force?: boolean }): Promise<void> {
    try {
      const fileList = Array.isArray(files) ? files : [files]
      const args: string[] = []
      
      if (options?.cached) {
        args.push('--cached')
      }
      if (options?.force) {
        args.push('-f')
      }
      
      await this.git.rm([...args, ...fileList])
    } catch (error) {
      throw new GitOperationError(
        'rm',
        '删除文件失败',
        error as Error,
        { files, options }
      )
    }
  }

  /**
   * 获取提交日志
   * 
   * @param options - 日志选项
   * @returns 提交日志列表
   * @throws {GitOperationError} 当获取日志失败时
   * 
   * @example
   * ```ts
   * const logs = await git.log({ maxCount: 10 })
   * logs.all.forEach(commit => console.log(commit.message))
   * ```
   */
  async log(options?: { maxCount?: number; from?: string; to?: string }): Promise<any> {
    try {
      const logOptions: any = {}
      
      if (options?.maxCount) {
        logOptions.maxCount = options.maxCount
      }
      if (options?.from) {
        logOptions.from = options.from
      }
      if (options?.to) {
        logOptions.to = options.to
      }
      
      return await this.git.log(logOptions)
    } catch (error) {
      throw new GitOperationError(
        'log',
        '获取提交日志失败',
        error as Error,
        { options }
      )
    }
  }

  /**
   * 获取原始 SimpleGit 实例（用于高级操作）
   * 
   * @returns SimpleGit 实例
   */
  getRawGit(): SimpleGit {
    return this.git
  }
}


