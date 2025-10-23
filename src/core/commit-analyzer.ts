import { GitManager } from './git-manager'
import type { CommitStats } from '../types'

/**
 * 提交分析器 - 分析提交历史
 */
export class CommitAnalyzer {
  constructor(private gitManager: GitManager) { }

  /**
   * 分析提交历史
   */
  async analyzeCommits(maxCount = 100): Promise<CommitStats> {
    const log = await this.gitManager.log({ maxCount })

    const stats: CommitStats = {
      total: log.total,
      latest: log.latest ? {
        hash: log.latest.hash,
        message: log.latest.message,
        author: log.latest.author_name,
        date: log.latest.date
      } : null,
      authors: new Set(log.all.map(c => c.author_name)).size,
      commits: log.all.map(c => ({
        hash: c.hash,
        message: c.message,
        author: c.author_name,
        date: c.date
      }))
    }

    return stats
  }
}


