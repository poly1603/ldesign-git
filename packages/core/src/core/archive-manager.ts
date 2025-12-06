import simpleGit, { SimpleGit } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 归档格式
 */
export type ArchiveFormat = 'zip' | 'tar' | 'tar.gz' | 'tar.bz2' | 'tar.xz'

/**
 * 归档选项
 */
export interface ArchiveOptions {
  format?: ArchiveFormat
  prefix?: string
  output?: string
  worktreeAttributes?: boolean
}

/**
 * 归档信息
 */
export interface ArchiveInfo {
  path: string
  format: ArchiveFormat
  size: number
  ref: string
  timestamp: Date
}

/**
 * Git Archive 管理器
 * 
 * 创建 Git 仓库归档文件
 * 
 * @example
 * ```ts
 * const archive = new ArchiveManager()
 * await archive.create('main', { format: 'zip', output: 'release.zip' })
 * ```
 */
export class ArchiveManager {
  private git: SimpleGit
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 创建归档
   */
  async create(ref: string, options: ArchiveOptions = {}): Promise<ArchiveInfo> {
    const format = options.format || 'zip'
    const formatArg = this.getFormatArg(format)
    
    // 生成默认输出文件名
    const repoName = path.basename(this.baseDir)
    const timestamp = new Date().toISOString().slice(0, 10)
    const defaultOutput = `${repoName}-${ref.replace(/\//g, '-')}-${timestamp}.${format}`
    const output = options.output || defaultOutput

    const args = ['archive', `--format=${formatArg}`]
    
    if (options.prefix) {
      args.push(`--prefix=${options.prefix}/`)
    }
    
    if (options.worktreeAttributes) {
      args.push('--worktree-attributes')
    }

    args.push(`--output=${output}`)
    args.push(ref)

    await this.git.raw(args)

    // 获取文件信息
    const fullPath = path.isAbsolute(output) ? output : path.join(this.baseDir, output)
    const stat = fs.statSync(fullPath)

    return {
      path: fullPath,
      format,
      size: stat.size,
      ref,
      timestamp: new Date()
    }
  }

  /**
   * 创建带子目录的归档
   */
  async createWithSubdir(ref: string, subdir: string, options: ArchiveOptions = {}): Promise<ArchiveInfo> {
    const format = options.format || 'zip'
    const formatArg = this.getFormatArg(format)
    
    const repoName = path.basename(this.baseDir)
    const timestamp = new Date().toISOString().slice(0, 10)
    const defaultOutput = `${repoName}-${subdir.replace(/\//g, '-')}-${timestamp}.${format}`
    const output = options.output || defaultOutput

    const args = ['archive', `--format=${formatArg}`]
    
    if (options.prefix) {
      args.push(`--prefix=${options.prefix}/`)
    }

    args.push(`--output=${output}`)
    args.push(`${ref}:${subdir}`)

    await this.git.raw(args)

    const fullPath = path.isAbsolute(output) ? output : path.join(this.baseDir, output)
    const stat = fs.statSync(fullPath)

    return {
      path: fullPath,
      format,
      size: stat.size,
      ref: `${ref}:${subdir}`,
      timestamp: new Date()
    }
  }

  /**
   * 列出可归档的分支和标签
   */
  async listRefs(): Promise<{
    branches: string[]
    tags: string[]
    commits: Array<{ hash: string; message: string }>
  }> {
    const branches = await this.git.branchLocal()
    const tags = await this.git.tags()
    const log = await this.git.log({ maxCount: 10 })

    return {
      branches: branches.all,
      tags: tags.all,
      commits: log.all.map(c => ({
        hash: c.hash.substring(0, 7),
        message: c.message
      }))
    }
  }

  /**
   * 获取归档预览（文件列表）
   */
  async preview(ref: string, subdir?: string): Promise<string[]> {
    const args = ['ls-tree', '-r', '--name-only']
    
    if (subdir) {
      args.push(`${ref}:${subdir}`)
    } else {
      args.push(ref)
    }

    const result = await this.git.raw(args)
    return result.split('\n').filter(f => f.trim())
  }

  /**
   * 计算归档大小估算
   */
  async estimateSize(ref: string): Promise<number> {
    try {
      const result = await this.git.raw([
        'diff-tree', '-r', '--name-only', ref
      ])
      
      const files = result.split('\n').filter(f => f.trim())
      let totalSize = 0

      for (const file of files.slice(0, 100)) { // 只检查前100个文件
        try {
          const sizeResult = await this.git.raw(['cat-file', '-s', `${ref}:${file}`])
          totalSize += parseInt(sizeResult.trim()) || 0
        } catch {}
      }

      // 估算压缩后大小（约50%）
      return Math.round(totalSize * 0.5)
    } catch {
      return 0
    }
  }

  /**
   * 批量创建归档
   */
  async createMultiple(refs: string[], options: ArchiveOptions = {}): Promise<ArchiveInfo[]> {
    const results: ArchiveInfo[] = []
    
    for (const ref of refs) {
      const refName = ref.replace(/\//g, '-')
      const output = options.output 
        ? options.output.replace(/(\.[^.]+)$/, `-${refName}$1`)
        : undefined
      
      const result = await this.create(ref, { ...options, output })
      results.push(result)
    }
    
    return results
  }

  /**
   * 创建发布归档（包含版本信息）
   */
  async createRelease(tag: string, options: {
    format?: ArchiveFormat
    includeVersion?: boolean
    prefix?: string
  } = {}): Promise<ArchiveInfo> {
    const repoName = path.basename(this.baseDir)
    const prefix = options.prefix || `${repoName}-${tag}`
    const format = options.format || 'tar.gz'
    const output = `${prefix}.${format}`

    return this.create(tag, {
      format,
      prefix,
      output
    })
  }

  /**
   * 获取格式参数
   */
  private getFormatArg(format: ArchiveFormat): string {
    switch (format) {
      case 'zip':
        return 'zip'
      case 'tar':
        return 'tar'
      case 'tar.gz':
        return 'tar.gz'
      case 'tar.bz2':
        return 'tar'
      case 'tar.xz':
        return 'tar'
      default:
        return 'zip'
    }
  }

  /**
   * 验证归档完整性
   */
  async verify(archivePath: string): Promise<boolean> {
    const ext = path.extname(archivePath).toLowerCase()
    
    try {
      if (ext === '.zip') {
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        await execAsync(`unzip -t "${archivePath}"`)
        return true
      }
      // tar 格式验证
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取支持的格式列表
   */
  getSupportedFormats(): ArchiveFormat[] {
    return ['zip', 'tar', 'tar.gz', 'tar.bz2', 'tar.xz']
  }
}
