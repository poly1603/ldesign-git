import simpleGit, { SimpleGit } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 清理结果
 */
export interface CleanupResult {
  type: string
  items: string[]
  count: number
  freed?: number // 释放的字节数
}

/**
 * 分支清理选项
 */
export interface BranchCleanupOptions {
  merged?: boolean
  stale?: boolean
  remote?: boolean
  dryRun?: boolean
  protect?: string[] // 保护的分支
}

/**
 * Git 清理管理器
 * 
 * 清理 Git 仓库中的废弃数据
 * 
 * @example
 * ```ts
 * const cleanup = new CleanupManager()
 * await cleanup.cleanupBranches({ merged: true })
 * await cleanup.gc()
 * ```
 */
export class CleanupManager {
  private git: SimpleGit
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 清理已合并的分支
   */
  async cleanupMergedBranches(options: BranchCleanupOptions = {}): Promise<CleanupResult> {
    const protect = options.protect || ['main', 'master', 'develop', 'dev']
    const deleted: string[] = []

    // 获取当前分支
    const current = await this.git.branch()
    protect.push(current.current)

    // 获取已合并的分支
    const result = await this.git.raw(['branch', '--merged'])
    const branches = result.split('\n')
      .map(b => b.trim().replace('* ', ''))
      .filter(b => b && !protect.includes(b))

    if (options.dryRun) {
      return {
        type: 'merged_branches',
        items: branches,
        count: branches.length
      }
    }

    for (const branch of branches) {
      try {
        await this.git.deleteLocalBranch(branch, true)
        deleted.push(branch)
      } catch {}
    }

    return {
      type: 'merged_branches',
      items: deleted,
      count: deleted.length
    }
  }

  /**
   * 清理远程已删除的分支
   */
  async cleanupStaleBranches(remote = 'origin', options?: { dryRun?: boolean }): Promise<CleanupResult> {
    // Prune 远程引用
    if (!options?.dryRun) {
      await this.git.raw(['remote', 'prune', remote])
    }

    // 获取所有远程跟踪分支
    const result = await this.git.raw(['branch', '-r'])
    const remoteBranches = result.split('\n')
      .map(b => b.trim())
      .filter(b => b.startsWith(`${remote}/`))

    // 找出本地分支对应的远程分支已不存在的
    const localBranches = await this.git.branchLocal()
    const stale: string[] = []

    for (const local of localBranches.all) {
      if (local === localBranches.current) continue
      
      // 检查是否有对应的远程分支
      const tracking = await this.getTrackingBranch(local)
      if (tracking && !remoteBranches.includes(tracking)) {
        stale.push(local)
      }
    }

    if (options?.dryRun) {
      return {
        type: 'stale_branches',
        items: stale,
        count: stale.length
      }
    }

    const deleted: string[] = []
    for (const branch of stale) {
      try {
        await this.git.deleteLocalBranch(branch, true)
        deleted.push(branch)
      } catch {}
    }

    return {
      type: 'stale_branches',
      items: deleted,
      count: deleted.length
    }
  }

  /**
   * 获取分支的跟踪分支
   */
  private async getTrackingBranch(branch: string): Promise<string | null> {
    try {
      const result = await this.git.raw([
        'config', `branch.${branch}.remote`
      ])
      const remote = result.trim()
      
      const mergeResult = await this.git.raw([
        'config', `branch.${branch}.merge`
      ])
      const merge = mergeResult.trim().replace('refs/heads/', '')
      
      return `${remote}/${merge}`
    } catch {
      return null
    }
  }

  /**
   * 清理远程跟踪分支
   */
  async pruneRemote(remote = 'origin'): Promise<CleanupResult> {
    const beforeResult = await this.git.raw(['branch', '-r'])
    const before = beforeResult.split('\n').filter(b => b.trim()).length

    await this.git.raw(['remote', 'prune', remote])

    const afterResult = await this.git.raw(['branch', '-r'])
    const after = afterResult.split('\n').filter(b => b.trim()).length

    const pruned = before - after

    return {
      type: 'remote_prune',
      items: [],
      count: pruned
    }
  }

  /**
   * 运行 Git GC
   */
  async gc(options?: { aggressive?: boolean; prune?: string }): Promise<CleanupResult> {
    const args = ['gc']
    
    if (options?.aggressive) {
      args.push('--aggressive')
    }
    if (options?.prune) {
      args.push(`--prune=${options.prune}`)
    }

    const before = await this.getGitDirSize()
    await this.git.raw(args)
    const after = await this.getGitDirSize()

    return {
      type: 'gc',
      items: [],
      count: 1,
      freed: before - after
    }
  }

  /**
   * 清理未引用的对象
   */
  async pruneObjects(): Promise<CleanupResult> {
    const before = await this.getGitDirSize()
    
    await this.git.raw(['prune'])
    
    const after = await this.getGitDirSize()

    return {
      type: 'prune',
      items: [],
      count: 1,
      freed: before - after
    }
  }

  /**
   * 清理 reflog
   */
  async expireReflog(options?: { expire?: string; all?: boolean }): Promise<CleanupResult> {
    const args = ['reflog', 'expire']
    
    if (options?.expire) {
      args.push(`--expire=${options.expire}`)
    } else {
      args.push('--expire=now')
    }
    
    if (options?.all) {
      args.push('--all')
    }

    await this.git.raw(args)

    return {
      type: 'reflog_expire',
      items: [],
      count: 1
    }
  }

  /**
   * 清理 worktree
   */
  async pruneWorktrees(): Promise<CleanupResult> {
    const beforeResult = await this.git.raw(['worktree', 'list', '--porcelain'])
    const before = beforeResult.split('worktree').length - 1

    await this.git.raw(['worktree', 'prune'])

    const afterResult = await this.git.raw(['worktree', 'list', '--porcelain'])
    const after = afterResult.split('worktree').length - 1

    return {
      type: 'worktree_prune',
      items: [],
      count: before - after
    }
  }

  /**
   * 清理 stash
   */
  async cleanupStash(options?: { keep?: number }): Promise<CleanupResult> {
    const keep = options?.keep || 10
    
    const stashList = await this.git.stashList()
    const toDelete = stashList.all.slice(keep)

    for (let i = toDelete.length - 1; i >= 0; i--) {
      await this.git.raw(['stash', 'drop', `stash@{${keep + i}}`])
    }

    return {
      type: 'stash_cleanup',
      items: toDelete.map(s => s.message),
      count: toDelete.length
    }
  }

  /**
   * 完整清理
   */
  async fullCleanup(options?: {
    branches?: boolean
    stash?: boolean
    gc?: boolean
    aggressive?: boolean
  }): Promise<CleanupResult[]> {
    const results: CleanupResult[] = []

    if (options?.branches !== false) {
      results.push(await this.cleanupMergedBranches())
      results.push(await this.pruneRemote())
    }

    if (options?.stash) {
      results.push(await this.cleanupStash())
    }

    if (options?.gc !== false) {
      results.push(await this.expireReflog({ all: true }))
      results.push(await this.pruneObjects())
      results.push(await this.gc({ aggressive: options?.aggressive }))
    }

    return results
  }

  /**
   * 获取 .git 目录大小
   */
  private async getGitDirSize(): Promise<number> {
    const gitDir = path.join(this.baseDir, '.git')
    return this.getDirSize(gitDir)
  }

  /**
   * 递归获取目录大小
   */
  private getDirSize(dir: string): number {
    let size = 0
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isFile()) {
          try {
            size += fs.statSync(fullPath).size
          } catch {}
        } else if (entry.isDirectory()) {
          size += this.getDirSize(fullPath)
        }
      }
    } catch {}
    
    return size
  }

  /**
   * 获取可清理项目的预览
   */
  async preview(): Promise<{
    mergedBranches: string[]
    staleBranches: string[]
    gitDirSize: number
    stashCount: number
  }> {
    const merged = await this.cleanupMergedBranches({ dryRun: true })
    const stale = await this.cleanupStaleBranches('origin', { dryRun: true })
    const stashList = await this.git.stashList()
    const gitDirSize = await this.getGitDirSize()

    return {
      mergedBranches: merged.items,
      staleBranches: stale.items,
      gitDirSize,
      stashCount: stashList.total
    }
  }

  /**
   * 清理未跟踪的文件
   */
  async cleanUntracked(options?: {
    directories?: boolean
    force?: boolean
    dryRun?: boolean
    ignored?: boolean
  }): Promise<CleanupResult> {
    const args = ['clean']
    
    if (options?.dryRun) {
      args.push('-n')
    } else if (options?.force) {
      args.push('-f')
    }
    
    if (options?.directories) {
      args.push('-d')
    }
    
    if (options?.ignored) {
      args.push('-x')
    }

    const result = await this.git.raw(args)
    const lines = result.split('\n').filter(l => l.trim())
    const files = lines.map(l => l.replace(/^(Would remove|Removing)\s+/, '').trim())

    return {
      type: 'clean_untracked',
      items: files,
      count: files.length
    }
  }

  /**
   * 格式化大小
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
}
