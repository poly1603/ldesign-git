import simpleGit, { SimpleGit } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 备份信息
 */
export interface BackupInfo {
  id: string
  path: string
  timestamp: Date
  size: number
  branches: number
  tags: number
  commits: number
  type: 'full' | 'bundle' | 'mirror'
}

/**
 * 恢复结果
 */
export interface RestoreResult {
  success: boolean
  path: string
  branches: string[]
  tags: string[]
}

/**
 * Git 备份管理器
 * 
 * 创建和恢复 Git 仓库备份
 * 
 * @example
 * ```ts
 * const backup = new BackupManager()
 * await backup.createBundle('backup.bundle')
 * await backup.restore('backup.bundle', './restored')
 * ```
 */
export class BackupManager {
  private git: SimpleGit
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 创建 bundle 备份（推荐）
   */
  async createBundle(output?: string, options?: {
    refs?: string[]
    all?: boolean
  }): Promise<BackupInfo> {
    const timestamp = new Date()
    const repoName = path.basename(this.baseDir)
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '')
    const defaultOutput = `${repoName}-${dateStr}.bundle`
    const outputPath = output || defaultOutput

    const args = ['bundle', 'create', outputPath]
    
    if (options?.all || !options?.refs) {
      args.push('--all')
    } else if (options?.refs) {
      args.push(...options.refs)
    }

    await this.git.raw(args)

    const fullPath = path.isAbsolute(outputPath) 
      ? outputPath 
      : path.join(this.baseDir, outputPath)
    
    const stat = fs.statSync(fullPath)
    const branches = await this.git.branchLocal()
    const tags = await this.git.tags()
    const log = await this.git.log()

    return {
      id: `bundle-${dateStr}`,
      path: fullPath,
      timestamp,
      size: stat.size,
      branches: branches.all.length,
      tags: tags.all.length,
      commits: log.total,
      type: 'bundle'
    }
  }

  /**
   * 创建镜像备份
   */
  async createMirror(targetDir: string): Promise<BackupInfo> {
    const timestamp = new Date()
    const repoName = path.basename(this.baseDir)
    
    // 获取远程 URL 或使用本地路径
    let sourceUrl = this.baseDir
    try {
      const remotes = await this.git.getRemotes(true)
      const origin = remotes.find(r => r.name === 'origin')
      if (origin?.refs.fetch) {
        sourceUrl = origin.refs.fetch
      }
    } catch {}

    // 创建镜像克隆
    const mirrorGit = simpleGit()
    await mirrorGit.clone(sourceUrl, targetDir, ['--mirror'])

    const branches = await this.git.branchLocal()
    const tags = await this.git.tags()
    const log = await this.git.log()

    // 计算目录大小
    const size = this.getDirectorySize(targetDir)

    return {
      id: `mirror-${timestamp.toISOString().slice(0, 10)}`,
      path: targetDir,
      timestamp,
      size,
      branches: branches.all.length,
      tags: tags.all.length,
      commits: log.total,
      type: 'mirror'
    }
  }

  /**
   * 创建完整备份（包含工作区）
   */
  async createFull(targetDir: string, options?: {
    excludeNodeModules?: boolean
  }): Promise<BackupInfo> {
    const timestamp = new Date()
    const repoName = path.basename(this.baseDir)
    
    // 创建目标目录
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // 复制整个目录
    await this.copyDirectory(this.baseDir, targetDir, {
      exclude: options?.excludeNodeModules 
        ? ['node_modules', '.git/objects/pack'] 
        : ['.git/objects/pack']
    })

    const branches = await this.git.branchLocal()
    const tags = await this.git.tags()
    const log = await this.git.log()
    const size = this.getDirectorySize(targetDir)

    return {
      id: `full-${timestamp.toISOString().slice(0, 10)}`,
      path: targetDir,
      timestamp,
      size,
      branches: branches.all.length,
      tags: tags.all.length,
      commits: log.total,
      type: 'full'
    }
  }

  /**
   * 从 bundle 恢复
   */
  async restoreFromBundle(bundlePath: string, targetDir: string): Promise<RestoreResult> {
    const fullBundlePath = path.isAbsolute(bundlePath) 
      ? bundlePath 
      : path.join(this.baseDir, bundlePath)

    // 验证 bundle
    await this.verifyBundle(fullBundlePath)

    // 克隆从 bundle
    const git = simpleGit()
    await git.clone(fullBundlePath, targetDir)

    // 获取恢复的信息
    const restoredGit = simpleGit(targetDir)
    const branches = await restoredGit.branchLocal()
    const tags = await restoredGit.tags()

    return {
      success: true,
      path: targetDir,
      branches: branches.all,
      tags: tags.all
    }
  }

  /**
   * 验证 bundle 文件
   */
  async verifyBundle(bundlePath: string): Promise<{ valid: boolean; refs?: string[] }> {
    try {
      const result = await this.git.raw(['bundle', 'verify', bundlePath])
      const refs = result.split('\n')
        .filter(l => l.trim() && !l.startsWith('The bundle'))
        .map(l => l.trim())
      
      return { valid: true, refs }
    } catch {
      return { valid: false }
    }
  }

  /**
   * 列出 bundle 内容
   */
  async listBundleRefs(bundlePath: string): Promise<string[]> {
    const result = await this.git.raw(['bundle', 'list-heads', bundlePath])
    return result.split('\n').filter(l => l.trim())
  }

  /**
   * 增量备份
   */
  async createIncremental(baseBranch: string, output?: string): Promise<BackupInfo> {
    const timestamp = new Date()
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '')
    const outputPath = output || `incremental-${dateStr}.bundle`

    // 获取自上次备份以来的提交
    const args = ['bundle', 'create', outputPath, `${baseBranch}..HEAD`]
    await this.git.raw(args)

    const fullPath = path.isAbsolute(outputPath) 
      ? outputPath 
      : path.join(this.baseDir, outputPath)
    
    const stat = fs.statSync(fullPath)

    return {
      id: `incremental-${dateStr}`,
      path: fullPath,
      timestamp,
      size: stat.size,
      branches: 1,
      tags: 0,
      commits: 0, // 增量不计数
      type: 'bundle'
    }
  }

  /**
   * 自动备份（检查是否需要备份）
   */
  async autoBackup(options: {
    maxAge?: number // 天数
    minCommits?: number
    backupDir?: string
  } = {}): Promise<BackupInfo | null> {
    const backupDir = options.backupDir || path.join(this.baseDir, '.git-backups')
    const maxAge = options.maxAge || 7
    const minCommits = options.minCommits || 10

    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // 检查最近的备份
    const backups = await this.listBackups(backupDir)
    const latestBackup = backups[0]

    if (latestBackup) {
      const ageInDays = (Date.now() - latestBackup.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      
      if (ageInDays < maxAge) {
        // 检查自上次备份以来的提交数
        const log = await this.git.log({ 
          from: latestBackup.timestamp.toISOString() 
        })
        
        if (log.total < minCommits) {
          return null // 不需要备份
        }
      }
    }

    // 创建新备份
    const repoName = path.basename(this.baseDir)
    const dateStr = new Date().toISOString().slice(0, 10)
    const output = path.join(backupDir, `${repoName}-${dateStr}.bundle`)

    return this.createBundle(output, { all: true })
  }

  /**
   * 列出备份
   */
  async listBackups(backupDir?: string): Promise<BackupInfo[]> {
    const dir = backupDir || path.join(this.baseDir, '.git-backups')
    
    if (!fs.existsSync(dir)) {
      return []
    }

    const files = fs.readdirSync(dir)
    const backups: BackupInfo[] = []

    for (const file of files) {
      if (file.endsWith('.bundle')) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        
        backups.push({
          id: file.replace('.bundle', ''),
          path: fullPath,
          timestamp: stat.mtime,
          size: stat.size,
          branches: 0,
          tags: 0,
          commits: 0,
          type: 'bundle'
        })
      }
    }

    // 按时间排序，最新的在前
    backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return backups
  }

  /**
   * 清理旧备份
   */
  async cleanupBackups(backupDir?: string, keepCount = 5): Promise<string[]> {
    const backups = await this.listBackups(backupDir)
    const toDelete = backups.slice(keepCount)
    const deleted: string[] = []

    for (const backup of toDelete) {
      fs.unlinkSync(backup.path)
      deleted.push(backup.path)
    }

    return deleted
  }

  /**
   * 获取目录大小
   */
  private getDirectorySize(dir: string): number {
    let size = 0
    
    const walkDir = (currentDir: string) => {
      const files = fs.readdirSync(currentDir)
      for (const file of files) {
        const filePath = path.join(currentDir, file)
        try {
          const stat = fs.statSync(filePath)
          if (stat.isFile()) {
            size += stat.size
          } else if (stat.isDirectory()) {
            walkDir(filePath)
          }
        } catch {}
      }
    }

    walkDir(dir)
    return size
  }

  /**
   * 复制目录
   */
  private async copyDirectory(src: string, dest: string, options?: { exclude?: string[] }): Promise<void> {
    const exclude = options?.exclude || []
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      const relativePath = path.relative(this.baseDir, srcPath)

      // 检查是否应该排除
      if (exclude.some(ex => relativePath.includes(ex))) {
        continue
      }

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, options)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  /**
   * 导出仓库统计信息
   */
  async exportStats(): Promise<{
    totalCommits: number
    branches: string[]
    tags: string[]
    contributors: Array<{ name: string; commits: number }>
    firstCommit: string
    lastCommit: string
  }> {
    const log = await this.git.log()
    const branches = await this.git.branchLocal()
    const tags = await this.git.tags()

    // 统计贡献者
    const contributorMap = new Map<string, number>()
    for (const commit of log.all) {
      const count = contributorMap.get(commit.author_name) || 0
      contributorMap.set(commit.author_name, count + 1)
    }

    const contributors = Array.from(contributorMap.entries())
      .map(([name, commits]) => ({ name, commits }))
      .sort((a, b) => b.commits - a.commits)

    return {
      totalCommits: log.total,
      branches: branches.all,
      tags: tags.all,
      contributors,
      firstCommit: log.all[log.all.length - 1]?.date || '',
      lastCommit: log.latest?.date || ''
    }
  }
}
