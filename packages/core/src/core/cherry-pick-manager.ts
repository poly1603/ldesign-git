import simpleGit, { SimpleGit } from 'simple-git'

/**
 * Cherry-pick 状态
 */
export interface CherryPickStatus {
  inProgress: boolean
  currentCommit?: string
  remainingCommits: string[]
  conflicts: string[]
}

/**
 * Cherry-pick 结果
 */
export interface CherryPickResult {
  success: boolean
  commit?: string
  message?: string
  conflicts?: string[]
}

/**
 * Git Cherry-pick 管理器
 * 
 * 管理 cherry-pick 操作
 * 
 * @example
 * ```ts
 * const cp = new CherryPickManager()
 * await cp.pick('abc1234')
 * await cp.pickRange('feature/branch', 3)
 * ```
 */
export class CherryPickManager {
  private git: SimpleGit

  constructor(baseDir?: string) {
    this.git = simpleGit(baseDir || process.cwd())
  }

  /**
   * Cherry-pick 单个提交
   */
  async pick(commit: string, options?: {
    noCommit?: boolean
    edit?: boolean
    signoff?: boolean
    mainline?: number
  }): Promise<CherryPickResult> {
    try {
      const args = ['cherry-pick']
      
      if (options?.noCommit) args.push('-n')
      if (options?.edit) args.push('-e')
      if (options?.signoff) args.push('-s')
      if (options?.mainline) args.push('-m', options.mainline.toString())
      
      args.push(commit)
      
      await this.git.raw(args)
      
      return {
        success: true,
        commit,
        message: `成功 cherry-pick 提交 ${commit}`
      }
    } catch (error: any) {
      if (error.message.includes('conflict')) {
        const conflicts = await this.getConflicts()
        return {
          success: false,
          commit,
          message: '存在冲突',
          conflicts
        }
      }
      throw error
    }
  }

  /**
   * Cherry-pick 多个提交
   */
  async pickMultiple(commits: string[], options?: {
    noCommit?: boolean
    signoff?: boolean
  }): Promise<CherryPickResult[]> {
    const results: CherryPickResult[] = []
    
    for (const commit of commits) {
      const result = await this.pick(commit, options)
      results.push(result)
      
      if (!result.success) {
        break // 遇到冲突停止
      }
    }
    
    return results
  }

  /**
   * Cherry-pick 提交范围
   */
  async pickRange(source: string, count: number, options?: {
    noCommit?: boolean
    signoff?: boolean
  }): Promise<CherryPickResult[]> {
    // 获取要 pick 的提交
    const log = await this.git.log({ from: `${source}~${count}`, to: source })
    const commits = log.all.map(c => c.hash).reverse()
    
    return this.pickMultiple(commits, options)
  }

  /**
   * 从分支 cherry-pick
   */
  async pickFromBranch(branch: string, commits: string[], options?: {
    noCommit?: boolean
    signoff?: boolean
  }): Promise<CherryPickResult[]> {
    // 验证提交是否在指定分支
    for (const commit of commits) {
      try {
        await this.git.raw(['merge-base', '--is-ancestor', commit, branch])
      } catch {
        throw new Error(`提交 ${commit} 不在分支 ${branch} 上`)
      }
    }
    
    return this.pickMultiple(commits, options)
  }

  /**
   * 继续 cherry-pick
   */
  async continue(): Promise<CherryPickResult> {
    try {
      await this.git.raw(['cherry-pick', '--continue'])
      return {
        success: true,
        message: 'Cherry-pick 继续成功'
      }
    } catch (error: any) {
      const conflicts = await this.getConflicts()
      return {
        success: false,
        message: '仍有冲突需要解决',
        conflicts
      }
    }
  }

  /**
   * 中止 cherry-pick
   */
  async abort(): Promise<void> {
    await this.git.raw(['cherry-pick', '--abort'])
  }

  /**
   * 跳过当前提交
   */
  async skip(): Promise<void> {
    await this.git.raw(['cherry-pick', '--skip'])
  }

  /**
   * 获取 cherry-pick 状态
   */
  async getStatus(): Promise<CherryPickStatus> {
    const inProgress = await this.isInProgress()
    
    if (!inProgress) {
      return {
        inProgress: false,
        remainingCommits: [],
        conflicts: []
      }
    }

    const conflicts = await this.getConflicts()
    let currentCommit: string | undefined

    try {
      const result = await this.git.raw(['rev-parse', 'CHERRY_PICK_HEAD'])
      currentCommit = result.trim()
    } catch {}

    return {
      inProgress: true,
      currentCommit,
      remainingCommits: [], // Git 不保存待处理的提交列表
      conflicts
    }
  }

  /**
   * 检查是否在 cherry-pick 中
   */
  async isInProgress(): Promise<boolean> {
    try {
      await this.git.raw(['rev-parse', '--verify', 'CHERRY_PICK_HEAD'])
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取冲突文件
   */
  async getConflicts(): Promise<string[]> {
    const status = await this.git.status()
    return status.conflicted
  }

  /**
   * 查找可以 cherry-pick 的提交
   */
  async findCommits(options: {
    branch?: string
    author?: string
    since?: string
    until?: string
    grep?: string
    maxCount?: number
  }): Promise<Array<{
    hash: string
    message: string
    author: string
    date: string
  }>> {
    const args = ['log', '--pretty=format:%H|%s|%an|%ad', '--date=short']
    
    if (options.branch) {
      args.push(options.branch)
    }
    if (options.author) {
      args.push(`--author=${options.author}`)
    }
    if (options.since) {
      args.push(`--since=${options.since}`)
    }
    if (options.until) {
      args.push(`--until=${options.until}`)
    }
    if (options.grep) {
      args.push(`--grep=${options.grep}`)
    }
    if (options.maxCount) {
      args.push(`-n${options.maxCount}`)
    }

    const result = await this.git.raw(args)
    const lines = result.split('\n').filter(l => l.trim())
    
    return lines.map(line => {
      const [hash, message, author, date] = line.split('|')
      return { hash, message, author, date }
    })
  }

  /**
   * 预览 cherry-pick（不实际执行）
   */
  async preview(commit: string): Promise<{
    commit: string
    message: string
    author: string
    files: string[]
    additions: number
    deletions: number
  }> {
    // 获取提交信息
    const log = await this.git.log({ from: `${commit}~1`, to: commit })
    const commitInfo = log.latest

    if (!commitInfo) {
      throw new Error(`提交 ${commit} 不存在`)
    }

    // 获取变更统计
    const diffStat = await this.git.raw(['diff', '--stat', `${commit}~1`, commit])
    const files: string[] = []
    let additions = 0
    let deletions = 0

    const lines = diffStat.split('\n')
    for (const line of lines) {
      const fileMatch = line.match(/^\s*(.+?)\s*\|\s*(\d+)/)
      if (fileMatch) {
        files.push(fileMatch[1].trim())
      }
      const statMatch = line.match(/(\d+) insertions?.*?(\d+) deletions?/)
      if (statMatch) {
        additions = parseInt(statMatch[1])
        deletions = parseInt(statMatch[2])
      }
    }

    return {
      commit: commitInfo.hash,
      message: commitInfo.message,
      author: commitInfo.author_name,
      files,
      additions,
      deletions
    }
  }

  /**
   * 检查是否可以 cherry-pick（无冲突）
   */
  async canPick(commit: string): Promise<{ canPick: boolean; reason?: string }> {
    try {
      // 使用 --no-commit 测试
      await this.git.raw(['cherry-pick', '--no-commit', commit])
      // 回滚测试
      await this.git.reset(['--hard', 'HEAD'])
      
      return { canPick: true }
    } catch (error: any) {
      await this.git.raw(['cherry-pick', '--abort']).catch(() => {})
      
      if (error.message.includes('conflict')) {
        return { canPick: false, reason: '存在冲突' }
      }
      return { canPick: false, reason: error.message }
    }
  }
}
