import simpleGit, { SimpleGit } from 'simple-git'
import type { RemoteInfo, GitOptions } from '../types'
import { GitOperationError, GitNetworkError } from '../errors'

/**
 * Remote 管理器 - 管理 Git 远程仓库
 * 
 * 提供完整的远程仓库操作，包括添加、删除、重命名、获取信息等
 * 
 * @example
 * ```ts
 * const remoteManager = new RemoteManager({ baseDir: './my-project' })
 * 
 * // 添加远程仓库
 * await remoteManager.add('origin', 'https://github.com/user/repo.git')
 * 
 * // 列出所有远程仓库
 * const remotes = await remoteManager.list()
 * ```
 */
export class RemoteManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 添加远程仓库
   * 
   * @param name - 远程名称
   * @param url - 远程 URL
   * 
   * @example
   * ```ts
   * await remoteManager.add('origin', 'https://github.com/user/repo.git')
   * ```
   */
  async add(name: string, url: string): Promise<void> {
    try {
      await this.git.addRemote(name, url)
    } catch (error) {
      throw new GitOperationError(
        'remote add',
        `添加远程仓库 ${name} 失败`,
        error as Error,
        { name, url }
      )
    }
  }

  /**
   * 删除远程仓库
   * 
   * @param name - 远程名称
   * 
   * @example
   * ```ts
   * await remoteManager.remove('origin')
   * ```
   */
  async remove(name: string): Promise<void> {
    try {
      await this.git.removeRemote(name)
    } catch (error) {
      throw new GitOperationError(
        'remote remove',
        `删除远程仓库 ${name} 失败`,
        error as Error,
        { name }
      )
    }
  }

  /**
   * 重命名远程仓库
   * 
   * @param oldName - 旧名称
   * @param newName - 新名称
   * 
   * @example
   * ```ts
   * await remoteManager.rename('origin', 'upstream')
   * ```
   */
  async rename(oldName: string, newName: string): Promise<void> {
    try {
      await this.git.raw(['remote', 'rename', oldName, newName])
    } catch (error) {
      throw new GitOperationError(
        'remote rename',
        `重命名远程仓库 ${oldName} -> ${newName} 失败`,
        error as Error,
        { oldName, newName }
      )
    }
  }

  /**
   * 列出所有远程仓库
   * 
   * @returns 远程仓库信息数组
   * 
   * @example
   * ```ts
   * const remotes = await remoteManager.list()
   * remotes.forEach(remote => {
   *   console.log(`${remote.name}: ${remote.url}`)
   * })
   * ```
   */
  async list(): Promise<RemoteInfo[]> {
    try {
      const remotes = await this.git.getRemotes(true)

      const result: RemoteInfo[] = []

      for (const remote of remotes) {
        // Fetch URL
        if (remote.refs.fetch) {
          result.push({
            name: remote.name,
            url: remote.refs.fetch,
            type: 'fetch'
          })
        }

        // Push URL（如果与 fetch 不同）
        if (remote.refs.push && remote.refs.push !== remote.refs.fetch) {
          result.push({
            name: remote.name,
            url: remote.refs.push,
            type: 'push'
          })
        }
      }

      return result
    } catch (error) {
      throw new GitOperationError(
        'remote list',
        '获取远程仓库列表失败',
        error as Error
      )
    }
  }

  /**
   * 获取远程仓库的 URL
   * 
   * @param name - 远程名称
   * @param type - URL 类型（fetch 或 push）
   * @returns 远程 URL
   * 
   * @example
   * ```ts
   * const url = await remoteManager.getUrl('origin')
   * console.log(url)
   * ```
   */
  async getUrl(name: string, type: 'fetch' | 'push' = 'fetch'): Promise<string> {
    try {
      const result = await this.git.remote(['get-url', name])
      if (!result) {
        throw new Error('No URL returned')
      }
      return result.trim()
    } catch (error) {
      throw new GitOperationError(
        'remote get-url',
        `获取远程仓库 ${name} 的 URL 失败`,
        error as Error,
        { name, type }
      )
    }
  }

  /**
   * 设置远程仓库的 URL
   * 
   * @param name - 远程名称
   * @param url - 新的 URL
   * @param type - URL 类型（默认同时设置 fetch 和 push）
   * 
   * @example
   * ```ts
   * await remoteManager.setUrl('origin', 'https://github.com/user/new-repo.git')
   * ```
   */
  async setUrl(name: string, url: string, type?: 'fetch' | 'push'): Promise<void> {
    try {
      const args = ['set-url', name, url]

      if (type === 'push') {
        args.splice(1, 0, '--push')
      }

      await this.git.remote(args)
    } catch (error) {
      throw new GitOperationError(
        'remote set-url',
        `设置远程仓库 ${name} 的 URL 失败`,
        error as Error,
        { name, url, type }
      )
    }
  }

  /**
   * 添加 push URL（多个 push 地址）
   * 
   * @param name - 远程名称
   * @param url - Push URL
   * 
   * @example
   * ```ts
   * await remoteManager.addPushUrl('origin', 'https://gitlab.com/user/repo.git')
   * ```
   */
  async addPushUrl(name: string, url: string): Promise<void> {
    try {
      await this.git.remote(['set-url', '--add', '--push', name, url])
    } catch (error) {
      throw new GitOperationError(
        'remote add push url',
        `添加远程仓库 ${name} 的 push URL 失败`,
        error as Error,
        { name, url }
      )
    }
  }

  /**
   * 清理远程分支引用（删除已不存在的远程分支）
   * 
   * @param name - 远程名称（默认为 'origin'）
   * 
   * @example
   * ```ts
   * await remoteManager.prune('origin')
   * ```
   */
  async prune(name = 'origin'): Promise<void> {
    try {
      await this.git.remote(['prune', name])
    } catch (error) {
      throw new GitOperationError(
        'remote prune',
        `清理远程仓库 ${name} 失败`,
        error as Error,
        { name }
      )
    }
  }

  /**
   * 显示远程仓库的详细信息
   * 
   * @param name - 远程名称
   * @returns 详细信息字符串
   * 
   * @example
   * ```ts
   * const info = await remoteManager.show('origin')
   * console.log(info)
   * ```
   */
  async show(name: string): Promise<string> {
    try {
      const result = await this.git.remote(['show', name])
      if (!result) {
        throw new Error('No information returned')
      }
      return result
    } catch (error) {
      throw new GitOperationError(
        'remote show',
        `获取远程仓库 ${name} 信息失败`,
        error as Error,
        { name }
      )
    }
  }

  /**
   * 检查远程仓库是否存在
   * 
   * @param name - 远程名称
   * @returns 是否存在
   * 
   * @example
   * ```ts
   * const exists = await remoteManager.exists('origin')
   * ```
   */
  async exists(name: string): Promise<boolean> {
    const remotes = await this.list()
    return remotes.some(remote => remote.name === name)
  }

  /**
   * 获取默认远程仓库名称
   * 
   * 优先级：origin > upstream > 第一个远程
   * 
   * @returns 默认远程名称，如果没有则返回 null
   */
  async getDefault(): Promise<string | null> {
    const remotes = await this.list()

    if (remotes.length === 0) {
      return null
    }

    // 检查是否有 origin
    if (remotes.some(r => r.name === 'origin')) {
      return 'origin'
    }

    // 检查是否有 upstream
    if (remotes.some(r => r.name === 'upstream')) {
      return 'upstream'
    }

    // 返回第一个
    return remotes[0].name
  }

  /**
   * Fetch 远程仓库
   * 
   * @param name - 远程名称（默认为 'origin'）
   * @param options - Fetch 选项
   * 
   * @example
   * ```ts
   * await remoteManager.fetch('origin', { prune: true })
   * ```
   */
  async fetch(
    name = 'origin',
    options: { prune?: boolean; tags?: boolean } = {}
  ): Promise<void> {
    try {
      const args: string[] = [name]

      if (options.prune) {
        args.push('--prune')
      }

      if (options.tags) {
        args.push('--tags')
      }

      await this.git.fetch(args)
    } catch (error) {
      throw new GitNetworkError(
        name,
        'fetch',
        `Fetch 远程仓库失败`,
        error as Error
      )
    }
  }

  /**
   * Fetch 所有远程仓库
   * 
   * @param options - Fetch 选项
   * 
   * @example
   * ```ts
   * await remoteManager.fetchAll({ prune: true })
   * ```
   */
  async fetchAll(options: { prune?: boolean; tags?: boolean } = {}): Promise<void> {
    try {
      const args: string[] = ['--all']

      if (options.prune) {
        args.push('--prune')
      }

      if (options.tags) {
        args.push('--tags')
      }

      await this.git.fetch(args)
    } catch (error) {
      throw new GitNetworkError(
        'all',
        'fetch',
        `Fetch 所有远程仓库失败`,
        error as Error
      )
    }
  }

  /**
   * 更新远程仓库信息
   * 
   * @param name - 远程名称
   * 
   * @example
   * ```ts
   * await remoteManager.update('origin')
   * ```
   */
  async update(name = 'origin'): Promise<void> {
    try {
      await this.git.remote(['update', name])
    } catch (error) {
      throw new GitNetworkError(
        name,
        'fetch',
        `更新远程仓库信息失败`,
        error as Error
      )
    }
  }

  /**
   * 验证远程 URL 是否可访问
   * 
   * @param url - 远程 URL
   * @returns 是否可访问
   */
  async validateUrl(url: string): Promise<boolean> {
    try {
      await this.git.raw(['ls-remote', '--exit-code', url, 'HEAD'])
      return true
    } catch {
      return false
    }
  }
}


