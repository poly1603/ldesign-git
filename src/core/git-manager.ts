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
}


