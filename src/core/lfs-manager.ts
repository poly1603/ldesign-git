import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * LFS 跟踪信息
 */
export interface LFSTrackInfo {
  /** 文件模式 */
  pattern: string
  /** 跟踪的属性 */
  attributes: string[]
}

/**
 * LFS 文件信息
 */
export interface LFSFileInfo {
  /** 文件路径 */
  path: string
  /** OID */
  oid: string
  /** 文件大小 */
  size: number
}

/**
 * LFS 状态
 */
export interface LFSStatus {
  /** 是否已安装 */
  installed: boolean
  /** 是否在当前仓库启用 */
  enabled: boolean
  /** LFS 版本 */
  version?: string
  /** 跟踪的模式 */
  trackedPatterns: string[]
}

/**
 * LFS 配置选项
 */
export interface LFSConfig {
  /** 存储路径 */
  storagePath?: string
  /** 并发数 */
  concurrency?: number
  /** 批量大小 */
  batchSize?: number
}

/**
 * Git LFS 管理器
 * 
 * 用于管理 Git Large File Storage (LFS)
 * 
 * @example
 * ```typescript
 * const lfs = new LFSManager({ baseDir: './my-project' })
 * 
 * // 安装 LFS
 * await lfs.install()
 * 
 * // 跟踪大文件
 * await lfs.track('*.psd')
 * await lfs.track('*.mp4')
 * 
 * // 查看状态
 * const status = await lfs.getStatus()
 * console.log('跟踪的文件类型:', status.trackedPatterns)
 * ```
 */
export class LFSManager {
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
   * 检查 LFS 是否已安装
   * 
   * @returns 是否已安装
   * 
   * @example
   * ```typescript
   * const installed = await lfs.isInstalled()
   * if (!installed) {
   *   console.log('请先安装 Git LFS')
   * }
   * ```
   */
  async isInstalled(): Promise<boolean> {
    try {
      await this.git.raw(['lfs', 'version'])
      return true
    } catch {
      return false
    }
  }

  /**
   * 安装 Git LFS
   * 
   * 在当前仓库中启用 Git LFS
   * 
   * @throws {GitOperationError} LFS 未安装或安装失败
   * 
   * @example
   * ```typescript
   * await lfs.install()
   * console.log('Git LFS 已启用')
   * ```
   */
  async install(): Promise<void> {
    try {
      const installed = await this.isInstalled()
      if (!installed) {
        throw new GitOperationError(
          '未找到 Git LFS。请先安装 Git LFS: https://git-lfs.github.com/',
          'LFS_NOT_FOUND',
          'install'
        )
      }

      await this.git.raw(['lfs', 'install'])
    } catch (error) {
      if (error instanceof GitOperationError) {
        throw error
      }
      throw new GitOperationError(
        `安装 Git LFS 失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_INSTALL_FAILED',
        'install',
        error as Error
      )
    }
  }

  /**
   * 卸载 Git LFS
   * 
   * 从当前仓库中移除 Git LFS hooks
   * 
   * @example
   * ```typescript
   * await lfs.uninstall()
   * ```
   */
  async uninstall(): Promise<void> {
    try {
      await this.git.raw(['lfs', 'uninstall'])
    } catch (error) {
      throw new GitOperationError(
        `卸载 Git LFS 失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_UNINSTALL_FAILED',
        'uninstall',
        error as Error
      )
    }
  }

  /**
   * 跟踪文件模式
   * 
   * @param pattern - 文件模式（如 "*.psd", "*.zip"）
   * @param options - 选项
   * 
   * @example
   * ```typescript
   * // 跟踪所有 PSD 文件
   * await lfs.track('*.psd')
   * 
   * // 跟踪所有视频文件
   * await lfs.track('videos/*.mp4')
   * 
   * // 不锁定文件
   * await lfs.track('*.zip', { lockable: false })
   * ```
   */
  async track(
    pattern: string,
    options: { lockable?: boolean } = {}
  ): Promise<void> {
    try {
      const args = ['lfs', 'track', pattern]
      if (options.lockable !== undefined) {
        args.push(options.lockable ? '--lockable' : '--not-lockable')
      }
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `跟踪 LFS 文件失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_TRACK_FAILED',
        'track',
        error as Error
      )
    }
  }

  /**
   * 取消跟踪文件模式
   * 
   * @param pattern - 文件模式
   * 
   * @example
   * ```typescript
   * await lfs.untrack('*.psd')
   * ```
   */
  async untrack(pattern: string): Promise<void> {
    try {
      await this.git.raw(['lfs', 'untrack', pattern])
    } catch (error) {
      throw new GitOperationError(
        `取消跟踪 LFS 文件失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_UNTRACK_FAILED',
        'untrack',
        error as Error
      )
    }
  }

  /**
   * 列出跟踪的文件模式
   * 
   * @returns 跟踪的文件模式列表
   * 
   * @example
   * ```typescript
   * const patterns = await lfs.listTracked()
   * console.log('LFS 跟踪的文件类型:', patterns)
   * ```
   */
  async listTracked(): Promise<string[]> {
    try {
      const result = await this.git.raw(['lfs', 'track'])
      const lines = result.split('\n').filter((line) => line.trim())
      
      // 解析输出，提取文件模式
      const patterns: string[] = []
      for (const line of lines) {
        // 跳过标题行
        if (line.includes('Listing tracked patterns') || line.includes('Listing')) {
          continue
        }
        // 提取模式（通常在行的开头）
        const match = line.trim().match(/^(.+?)\s+\(/)
        if (match) {
          patterns.push(match[1])
        }
      }
      
      return patterns
    } catch (error) {
      throw new GitOperationError(
        `列出 LFS 跟踪失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_LIST_FAILED',
        'listTracked',
        error as Error
      )
    }
  }

  /**
   * 拉取 LFS 对象
   * 
   * @param options - 选项
   * 
   * @example
   * ```typescript
   * // 拉取所有 LFS 对象
   * await lfs.pull()
   * 
   * // 只拉取指定引用的对象
   * await lfs.pull({ include: ['main'] })
   * ```
   */
  async pull(options: {
    include?: string[]
    exclude?: string[]
  } = {}): Promise<void> {
    try {
      const args = ['lfs', 'pull']
      
      if (options.include) {
        args.push('--include', options.include.join(','))
      }
      if (options.exclude) {
        args.push('--exclude', options.exclude.join(','))
      }
      
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `拉取 LFS 对象失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_PULL_FAILED',
        'pull',
        error as Error
      )
    }
  }

  /**
   * 推送 LFS 对象
   * 
   * @param remote - 远程名称
   * @param options - 选项
   * 
   * @example
   * ```typescript
   * await lfs.push('origin')
   * ```
   */
  async push(
    remote: string = 'origin',
    options: { all?: boolean } = {}
  ): Promise<void> {
    try {
      const args = ['lfs', 'push', remote]
      
      if (options.all) {
        args.push('--all')
      } else {
        // 推送当前分支
        const branch = await this.git.revparse(['--abbrev-ref', 'HEAD'])
        args.push(branch.trim())
      }
      
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `推送 LFS 对象失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_PUSH_FAILED',
        'push',
        error as Error
      )
    }
  }

  /**
   * 获取 LFS 对象
   * 
   * 下载但不检出 LFS 对象
   * 
   * @example
   * ```typescript
   * await lfs.fetch()
   * ```
   */
  async fetch(options: {
    remote?: string
    include?: string[]
    exclude?: string[]
  } = {}): Promise<void> {
    try {
      const args = ['lfs', 'fetch']
      
      if (options.remote) {
        args.push(options.remote)
      }
      if (options.include) {
        args.push('--include', options.include.join(','))
      }
      if (options.exclude) {
        args.push('--exclude', options.exclude.join(','))
      }
      
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `获取 LFS 对象失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_FETCH_FAILED',
        'fetch',
        error as Error
      )
    }
  }

  /**
   * 清理旧的 LFS 对象
   * 
   * @param options - 选项
   * 
   * @example
   * ```typescript
   * // 删除超过 7 天的对象
   * await lfs.prune({ olderThan: '7d' })
   * 
   * // 预览模式
   * await lfs.prune({ dryRun: true })
   * ```
   */
  async prune(options: {
    dryRun?: boolean
    olderThan?: string
    verifyRemote?: boolean
  } = {}): Promise<void> {
    try {
      const args = ['lfs', 'prune']
      
      if (options.dryRun) {
        args.push('--dry-run')
      }
      if (options.olderThan) {
        args.push('--older-than', options.olderThan)
      }
      if (options.verifyRemote) {
        args.push('--verify-remote')
      }
      
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `清理 LFS 对象失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_PRUNE_FAILED',
        'prune',
        error as Error
      )
    }
  }

  /**
   * 列出 LFS 文件
   * 
   * @returns LFS 文件列表
   * 
   * @example
   * ```typescript
   * const files = await lfs.listFiles()
   * console.log(`仓库中有 ${files.length} 个 LFS 文件`)
   * ```
   */
  async listFiles(): Promise<LFSFileInfo[]> {
    try {
      const result = await this.git.raw(['lfs', 'ls-files', '-l'])
      const lines = result.split('\n').filter((line) => line.trim())
      
      const files: LFSFileInfo[] = []
      for (const line of lines) {
        // 格式: OID - path (size)
        const match = line.match(/^([a-f0-9]+)\s+\*?\s+(.+?)\s+\(([^)]+)\)/)
        if (match) {
          const [, oid, path, sizeStr] = match
          const size = this.parseSize(sizeStr)
          files.push({ oid, path, size })
        }
      }
      
      return files
    } catch (error) {
      throw new GitOperationError(
        `列出 LFS 文件失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_LIST_FILES_FAILED',
        'listFiles',
        error as Error
      )
    }
  }

  /**
   * 获取 LFS 状态
   * 
   * @returns LFS 状态
   * 
   * @example
   * ```typescript
   * const status = await lfs.getStatus()
   * if (status.installed && status.enabled) {
   *   console.log('LFS 版本:', status.version)
   *   console.log('跟踪的模式:', status.trackedPatterns)
   * }
   * ```
   */
  async getStatus(): Promise<LFSStatus> {
    const installed = await this.isInstalled()
    
    if (!installed) {
      return {
        installed: false,
        enabled: false,
        trackedPatterns: [],
      }
    }

    let version: string | undefined
    try {
      const versionOutput = await this.git.raw(['lfs', 'version'])
      const match = versionOutput.match(/git-lfs\/([^\s]+)/)
      version = match ? match[1] : undefined
    } catch {
      // Ignore
    }

    let enabled = false
    try {
      await this.git.raw(['lfs', 'env'])
      enabled = true
    } catch {
      // LFS not enabled in this repo
    }

    const trackedPatterns = enabled ? await this.listTracked() : []

    return {
      installed,
      enabled,
      version,
      trackedPatterns,
    }
  }

  /**
   * 迁移已有文件到 LFS
   * 
   * @param pattern - 文件模式
   * @param options - 选项
   * 
   * @example
   * ```typescript
   * // 将历史中的所有 PSD 文件迁移到 LFS
   * await lfs.migrate('*.psd', { include: ['main'] })
   * ```
   */
  async migrate(
    pattern: string,
    options: {
      include?: string[]
      exclude?: string[]
      everything?: boolean
    } = {}
  ): Promise<void> {
    try {
      const args = ['lfs', 'migrate', 'import', '--include', pattern]
      
      if (options.include) {
        args.push('--include-ref', options.include.join(','))
      }
      if (options.exclude) {
        args.push('--exclude-ref', options.exclude.join(','))
      }
      if (options.everything) {
        args.push('--everything')
      }
      
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `迁移到 LFS 失败: ${error instanceof Error ? error.message : String(error)}`,
        'LFS_MIGRATE_FAILED',
        'migrate',
        error as Error
      )
    }
  }

  /**
   * 解析文件大小字符串
   */
  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    }

    const match = sizeStr.trim().match(/^([\d.]+)\s*([A-Z]+)$/)
    if (!match) {
      return 0
    }

    const [, value, unit] = match
    const multiplier = units[unit] || 1
    return parseFloat(value) * multiplier
  }
}
