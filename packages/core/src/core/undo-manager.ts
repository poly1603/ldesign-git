import simpleGit, { SimpleGit } from 'simple-git'

/**
 * 撤销操作类型
 */
export type UndoActionType = 
  | 'unstage'           // 取消暂存
  | 'discard_changes'   // 丢弃更改
  | 'amend_commit'      // 修改提交
  | 'reset_soft'        // 软重置
  | 'reset_mixed'       // 混合重置
  | 'reset_hard'        // 硬重置
  | 'revert_commit'     // 回退提交
  | 'restore_file'      // 恢复文件
  | 'abort_merge'       // 中止合并
  | 'abort_rebase'      // 中止变基
  | 'abort_cherry_pick' // 中止 cherry-pick

/**
 * 撤销操作建议
 */
export interface UndoSuggestion {
  action: UndoActionType
  description: string
  command: string
  dangerous: boolean
  applicable: boolean
}

/**
 * 当前状态分析
 */
export interface StateAnalysis {
  hasUnstagedChanges: boolean
  hasStagedChanges: boolean
  hasUncommittedChanges: boolean
  isInMerge: boolean
  isInRebase: boolean
  isInCherryPick: boolean
  lastCommit?: {
    hash: string
    message: string
    date: Date
  }
  suggestions: UndoSuggestion[]
}

/**
 * Git 撤销管理器
 * 
 * 提供智能撤销向导和各种撤销操作
 * 
 * @example
 * ```ts
 * const undo = new UndoManager()
 * const analysis = await undo.analyzeState()
 * console.log(analysis.suggestions)
 * ```
 */
export class UndoManager {
  private git: SimpleGit

  constructor(baseDir?: string) {
    this.git = simpleGit(baseDir || process.cwd())
  }

  /**
   * 分析当前状态并提供撤销建议
   */
  async analyzeState(): Promise<StateAnalysis> {
    const status = await this.git.status()
    
    // 检查是否在特殊状态
    const isInMerge = await this.isInMergeState()
    const isInRebase = await this.isInRebaseState()
    const isInCherryPick = await this.isInCherryPickState()

    // 获取最后一次提交
    let lastCommit: StateAnalysis['lastCommit'] | undefined
    try {
      const log = await this.git.log({ maxCount: 1 })
      if (log.latest) {
        lastCommit = {
          hash: log.latest.hash,
          message: log.latest.message,
          date: new Date(log.latest.date)
        }
      }
    } catch {}

    const hasUnstagedChanges = status.modified.length > 0 || status.deleted.length > 0
    const hasStagedChanges = status.staged.length > 0 || status.created.length > 0
    const hasUncommittedChanges = !status.isClean()

    // 生成建议
    const suggestions: UndoSuggestion[] = []

    // 中止特殊状态
    if (isInMerge) {
      suggestions.push({
        action: 'abort_merge',
        description: '中止当前合并操作',
        command: 'git merge --abort',
        dangerous: false,
        applicable: true
      })
    }

    if (isInRebase) {
      suggestions.push({
        action: 'abort_rebase',
        description: '中止当前变基操作',
        command: 'git rebase --abort',
        dangerous: false,
        applicable: true
      })
    }

    if (isInCherryPick) {
      suggestions.push({
        action: 'abort_cherry_pick',
        description: '中止当前 cherry-pick 操作',
        command: 'git cherry-pick --abort',
        dangerous: false,
        applicable: true
      })
    }

    // 取消暂存
    if (hasStagedChanges) {
      suggestions.push({
        action: 'unstage',
        description: '取消暂存的文件（保留更改）',
        command: 'git reset HEAD',
        dangerous: false,
        applicable: true
      })
    }

    // 丢弃更改
    if (hasUnstagedChanges) {
      suggestions.push({
        action: 'discard_changes',
        description: '丢弃工作区的更改',
        command: 'git checkout -- .',
        dangerous: true,
        applicable: true
      })
    }

    // 提交相关
    if (lastCommit) {
      suggestions.push({
        action: 'amend_commit',
        description: '修改最后一次提交（修改信息或添加文件）',
        command: 'git commit --amend',
        dangerous: false,
        applicable: true
      })

      suggestions.push({
        action: 'reset_soft',
        description: '撤销最后一次提交（保留更改在暂存区）',
        command: 'git reset --soft HEAD~1',
        dangerous: false,
        applicable: true
      })

      suggestions.push({
        action: 'reset_mixed',
        description: '撤销最后一次提交（保留更改在工作区）',
        command: 'git reset HEAD~1',
        dangerous: false,
        applicable: true
      })

      suggestions.push({
        action: 'reset_hard',
        description: '完全撤销最后一次提交（丢弃所有更改）',
        command: 'git reset --hard HEAD~1',
        dangerous: true,
        applicable: true
      })

      suggestions.push({
        action: 'revert_commit',
        description: '创建一个新提交来撤销指定提交',
        command: `git revert ${lastCommit.hash.substring(0, 7)}`,
        dangerous: false,
        applicable: true
      })
    }

    return {
      hasUnstagedChanges,
      hasStagedChanges,
      hasUncommittedChanges,
      isInMerge,
      isInRebase,
      isInCherryPick,
      lastCommit,
      suggestions
    }
  }

  /**
   * 检查是否在合并状态
   */
  async isInMergeState(): Promise<boolean> {
    try {
      await this.git.raw(['rev-parse', '--verify', 'MERGE_HEAD'])
      return true
    } catch {
      return false
    }
  }

  /**
   * 检查是否在变基状态
   */
  async isInRebaseState(): Promise<boolean> {
    try {
      const result = await this.git.raw(['rev-parse', '--git-dir'])
      const gitDir = result.trim()
      const { existsSync } = await import('fs')
      const { join } = await import('path')
      return existsSync(join(gitDir, 'rebase-merge')) || existsSync(join(gitDir, 'rebase-apply'))
    } catch {
      return false
    }
  }

  /**
   * 检查是否在 cherry-pick 状态
   */
  async isInCherryPickState(): Promise<boolean> {
    try {
      await this.git.raw(['rev-parse', '--verify', 'CHERRY_PICK_HEAD'])
      return true
    } catch {
      return false
    }
  }

  /**
   * 取消暂存所有文件
   */
  async unstageAll(): Promise<void> {
    await this.git.reset(['HEAD'])
  }

  /**
   * 取消暂存指定文件
   */
  async unstageFiles(files: string[]): Promise<void> {
    await this.git.reset(['HEAD', '--', ...files])
  }

  /**
   * 丢弃工作区的所有更改
   */
  async discardAllChanges(): Promise<void> {
    await this.git.checkout(['--', '.'])
  }

  /**
   * 丢弃指定文件的更改
   */
  async discardFileChanges(files: string[]): Promise<void> {
    await this.git.checkout(['--', ...files])
  }

  /**
   * 软重置到指定提交
   */
  async resetSoft(target = 'HEAD~1'): Promise<void> {
    await this.git.reset(['--soft', target])
  }

  /**
   * 混合重置到指定提交
   */
  async resetMixed(target = 'HEAD~1'): Promise<void> {
    await this.git.reset(['--mixed', target])
  }

  /**
   * 硬重置到指定提交
   */
  async resetHard(target = 'HEAD~1'): Promise<void> {
    await this.git.reset(['--hard', target])
  }

  /**
   * 回退指定提交
   */
  async revertCommit(commit: string, options?: { noCommit?: boolean }): Promise<void> {
    const args = ['revert', commit]
    if (options?.noCommit) {
      args.push('--no-commit')
    }
    await this.git.raw(args)
  }

  /**
   * 恢复文件到指定版本
   */
  async restoreFile(file: string, commit = 'HEAD'): Promise<void> {
    await this.git.raw(['checkout', commit, '--', file])
  }

  /**
   * 中止合并
   */
  async abortMerge(): Promise<void> {
    await this.git.merge(['--abort'])
  }

  /**
   * 中止变基
   */
  async abortRebase(): Promise<void> {
    await this.git.rebase(['--abort'])
  }

  /**
   * 中止 cherry-pick
   */
  async abortCherryPick(): Promise<void> {
    await this.git.raw(['cherry-pick', '--abort'])
  }

  /**
   * 执行撤销操作
   */
  async executeUndo(action: UndoActionType, options?: { target?: string; files?: string[] }): Promise<void> {
    switch (action) {
      case 'unstage':
        if (options?.files) {
          await this.unstageFiles(options.files)
        } else {
          await this.unstageAll()
        }
        break
      case 'discard_changes':
        if (options?.files) {
          await this.discardFileChanges(options.files)
        } else {
          await this.discardAllChanges()
        }
        break
      case 'reset_soft':
        await this.resetSoft(options?.target)
        break
      case 'reset_mixed':
        await this.resetMixed(options?.target)
        break
      case 'reset_hard':
        await this.resetHard(options?.target)
        break
      case 'revert_commit':
        if (options?.target) {
          await this.revertCommit(options.target)
        }
        break
      case 'restore_file':
        if (options?.files) {
          for (const file of options.files) {
            await this.restoreFile(file, options.target)
          }
        }
        break
      case 'abort_merge':
        await this.abortMerge()
        break
      case 'abort_rebase':
        await this.abortRebase()
        break
      case 'abort_cherry_pick':
        await this.abortCherryPick()
        break
    }
  }

  /**
   * 获取可恢复的已删除文件
   */
  async getDeletedFiles(commit = 'HEAD~10'): Promise<Array<{ path: string; commit: string; date: string }>> {
    try {
      const result = await this.git.raw([
        'log', '--diff-filter=D', '--summary', `${commit}..HEAD`, '--pretty=format:%H|%cd', '--date=short'
      ])
      
      const deletedFiles: Array<{ path: string; commit: string; date: string }> = []
      const lines = result.split('\n')
      
      let currentCommit = ''
      let currentDate = ''
      
      for (const line of lines) {
        if (line.includes('|')) {
          [currentCommit, currentDate] = line.split('|')
        } else if (line.includes('delete mode')) {
          const match = line.match(/delete mode \d+ (.+)/)
          if (match) {
            deletedFiles.push({
              path: match[1],
              commit: currentCommit.substring(0, 7),
              date: currentDate
            })
          }
        }
      }
      
      return deletedFiles
    } catch {
      return []
    }
  }

  /**
   * 恢复已删除的文件
   */
  async restoreDeletedFile(file: string, commit?: string): Promise<void> {
    if (commit) {
      await this.git.raw(['checkout', `${commit}^`, '--', file])
    } else {
      // 查找删除该文件的提交
      const result = await this.git.raw([
        'rev-list', '-n', '1', 'HEAD', '--', file
      ])
      const deleteCommit = result.trim()
      if (deleteCommit) {
        await this.git.raw(['checkout', `${deleteCommit}^`, '--', file])
      }
    }
  }
}
