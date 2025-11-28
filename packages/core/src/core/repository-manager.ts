import { GitManager } from './git-manager'
import type { RepositoryInfo } from '../types'

/**
 * 仓库管理器 - 管理 Git 仓库信息
 */
export class RepositoryManager {
  constructor(private gitManager: GitManager) { }

  /**
   * 获取仓库信息
   */
  async getRepositoryInfo(): Promise<RepositoryInfo> {
    const status = await this.gitManager.status()
    const currentBranch = await this.gitManager.getCurrentBranch()

    return {
      currentBranch,
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
      renamed: status.renamed,
      staged: status.staged,
      ahead: status.ahead,
      behind: status.behind
    }
  }

  /**
   * 检查是否有未提交的更改
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.gitManager.status()
    return !status.isClean
  }
}


