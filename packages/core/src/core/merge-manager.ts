import simpleGit, { SimpleGit } from 'simple-git'
import type {
  MergeOptions,
  RebaseOptions,
  CherryPickOptions,
  ConflictInfo,
  MergeResult,
  GitOptions
} from '../types'

/**
 * 合并管理器 - 管理 Git 合并、变基等操作
 */
export class MergeManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 合并分支
   * @param branchName 要合并的分支名
   * @param options 合并选项
   */
  async merge(branchName: string, options: MergeOptions = {}): Promise<MergeResult> {
    const args: string[] = []

    if (options.noFastForward) {
      args.push('--no-ff')
    }

    if (options.fastForwardOnly) {
      args.push('--ff-only')
    }

    if (options.squash) {
      args.push('--squash')
    }

    if (options.message) {
      args.push('-m', options.message)
    }

    if (options.strategy) {
      args.push('-s', options.strategy)
    }

    args.push(branchName)

    try {
      await this.git.merge(args)

      return {
        success: true,
        conflicts: [],
        mergedFiles: [],
        message: '合并成功'
      }
    } catch (error) {
      // 检查是否是冲突
      const conflicts = await this.getConflicts()

      if (conflicts.length > 0) {
        return {
          success: false,
          conflicts,
          mergedFiles: [],
          message: '合并产生冲突，需要手动解决'
        }
      }

      throw error
    }
  }

  /**
   * 中止合并
   */
  async abortMerge(): Promise<void> {
    await this.git.merge(['--abort'])
  }

  /**
   * 继续合并（在解决冲突后）
   */
  async continueMerge(): Promise<void> {
    await this.git.merge(['--continue'])
  }

  /**
   * 变基操作
   * @param branch 目标分支
   * @param options 变基选项
   */
  async rebase(branch: string, options: RebaseOptions = {}): Promise<void> {
    const args: string[] = []

    if (options.interactive) {
      args.push('-i')
    }

    if (options.onto) {
      args.push('--onto', options.onto)
    }

    if (options.preserveMerges) {
      args.push('--preserve-merges')
    }

    if (options.autosquash) {
      args.push('--autosquash')
    }

    args.push(branch)

    await this.git.rebase(args)
  }

  /**
   * 中止变基
   */
  async abortRebase(): Promise<void> {
    await this.git.rebase(['--abort'])
  }

  /**
   * 继续变基（在解决冲突后）
   */
  async continueRebase(): Promise<void> {
    await this.git.rebase(['--continue'])
  }

  /**
   * 跳过当前变基提交
   */
  async skipRebase(): Promise<void> {
    await this.git.rebase(['--skip'])
  }

  /**
   * Cherry-pick 提交
   * @param commitHash 提交哈希
   * @param options Cherry-pick 选项
   */
  async cherryPick(commitHash: string, options: CherryPickOptions = {}): Promise<void> {
    const args: string[] = []

    if (options.noCommit) {
      args.push('-n')
    }

    if (options.mainline !== undefined) {
      args.push('-m', options.mainline.toString())
    }

    args.push(commitHash)

    await this.git.raw(['cherry-pick', ...args])
  }

  /**
   * 中止 cherry-pick
   */
  async abortCherryPick(): Promise<void> {
    await this.git.raw(['cherry-pick', '--abort'])
  }

  /**
   * 继续 cherry-pick（在解决冲突后）
   */
  async continueCherryPick(): Promise<void> {
    await this.git.raw(['cherry-pick', '--continue'])
  }

  /**
   * 获取冲突文件列表
   */
  async getConflicts(): Promise<ConflictInfo[]> {
    const status = await this.git.status()
    const conflicts: ConflictInfo[] = []

    status.conflicted.forEach(file => {
      conflicts.push({
        file,
        status: 'both-modified'
      })
    })

    return conflicts
  }

  /**
   * 检查是否存在冲突
   */
  async hasConflicts(): Promise<boolean> {
    const status = await this.git.status()
    return status.conflicted.length > 0
  }

  /**
   * 获取冲突文件的内容
   * @param filePath 文件路径
   */
  async getConflictContent(filePath: string): Promise<string> {
    const result = await this.git.show([`:0:${filePath}`])
    return result
  }

  /**
   * 解决冲突 - 使用我们的版本
   * @param filePath 文件路径
   */
  async resolveWithOurs(filePath: string): Promise<void> {
    await this.git.raw(['checkout', '--ours', filePath])
    await this.git.add(filePath)
  }

  /**
   * 解决冲突 - 使用他们的版本
   * @param filePath 文件路径
   */
  async resolveWithTheirs(filePath: string): Promise<void> {
    await this.git.raw(['checkout', '--theirs', filePath])
    await this.git.add(filePath)
  }

  /**
   * 检查是否正在进行合并
   */
  async isMerging(): Promise<boolean> {
    try {
      const result = await this.git.raw(['rev-parse', '-q', '--verify', 'MERGE_HEAD'])
      return result.trim() !== ''
    } catch (error) {
      return false
    }
  }

  /**
   * 检查是否正在进行变基
   */
  async isRebasing(): Promise<boolean> {
    try {
      const result = await this.git.raw(['rev-parse', '-q', '--verify', 'REBASE_HEAD'])
      return result.trim() !== ''
    } catch (error) {
      return false
    }
  }

  /**
   * 检查是否正在进行 cherry-pick
   */
  async isCherryPicking(): Promise<boolean> {
    try {
      const result = await this.git.raw(['rev-parse', '-q', '--verify', 'CHERRY_PICK_HEAD'])
      return result.trim() !== ''
    } catch (error) {
      return false
    }
  }

  /**
   * 快进合并
   * @param branch 分支名
   */
  async fastForward(branch: string): Promise<void> {
    await this.git.merge(['--ff-only', branch])
  }

  /**
   * Squash 合并
   * @param branch 分支名
   * @param message 提交消息
   */
  async squashMerge(branch: string, message?: string): Promise<void> {
    const args = ['--squash', branch]
    await this.git.merge(args)

    // Squash 合并后需要手动提交
    if (message) {
      await this.git.commit(message)
    }
  }
}


