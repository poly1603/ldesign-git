import simpleGit, { SimpleGit } from 'simple-git'
import type { CommitStats, CommitAnalytics, CommitType, GitOptions } from '../types'

/**
 * 提交分析器 - 分析提交历史
 */
export class CommitAnalyzer {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 分析提交历史（基础）
   */
  async analyzeCommits(maxCount = 100): Promise<CommitStats> {
    const log = await this.git.log({ maxCount })

    const stats: CommitStats = {
      total: log.total,
      latest: log.latest ? {
        hash: log.latest.hash,
        message: log.latest.message,
        author: log.latest.author_name,
        date: log.latest.date,
        body: log.latest.body,
        refs: log.latest.refs
      } : null,
      authors: new Set(log.all.map(c => c.author_name)).size,
      commits: log.all.map(c => ({
        hash: c.hash,
        message: c.message,
        author: c.author_name,
        date: c.date,
        body: c.body,
        refs: c.refs
      }))
    }

    return stats
  }

  /**
   * 详细的提交分析
   */
  async analyzeCommitsDetailed(maxCount = 1000): Promise<CommitAnalytics> {
    const log = await this.git.log({ maxCount })

    const commitsByAuthor: Record<string, number> = {}
    const commitsByType: Record<CommitType | 'other', number> = {
      feat: 0,
      fix: 0,
      docs: 0,
      style: 0,
      refactor: 0,
      perf: 0,
      test: 0,
      build: 0,
      ci: 0,
      chore: 0,
      revert: 0,
      other: 0
    }
    const commitsByDate: Record<string, number> = {}
    const commitsByHour: Record<number, number> = {}
    const commitsByDayOfWeek: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    }

    let totalMessageLength = 0
    let withBody = 0
    let withoutBody = 0

    log.all.forEach(commit => {
      // 按作者统计
      commitsByAuthor[commit.author_name] = (commitsByAuthor[commit.author_name] || 0) + 1

      // 按类型统计
      const typeMatch = commit.message.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)/)
      if (typeMatch) {
        const type = typeMatch[1] as CommitType
        commitsByType[type]++
      } else {
        commitsByType.other++
      }

      // 按日期统计
      const date = new Date(commit.date)
      const dateStr = date.toISOString().split('T')[0]
      commitsByDate[dateStr] = (commitsByDate[dateStr] || 0) + 1

      // 按小时统计
      const hour = date.getHours()
      commitsByHour[hour] = (commitsByHour[hour] || 0) + 1

      // 按星期统计
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayName = dayNames[date.getDay()]
      commitsByDayOfWeek[dayName]++

      // 提交信息统计
      totalMessageLength += commit.message.length
      if (commit.body && commit.body.trim() !== '') {
        withBody++
      } else {
        withoutBody++
      }
    })

    // 计算平均值
    const totalCommits = log.all.length
    const avgCommitsPerDay = totalCommits / Object.keys(commitsByDate).length
    const avgCommitsPerAuthor = totalCommits / Object.keys(commitsByAuthor).length

    // 按贡献排序
    const topContributors = Object.entries(commitsByAuthor)
      .map(([author, commits]) => ({
        author,
        commits,
        percentage: (commits / totalCommits) * 100
      }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10)

    // 最近活动（最近 30 天）
    const recentDates = Object.entries(commitsByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
      .map(([date, commits]) => ({ date, commits }))

    return {
      totalCommits,
      commitsByAuthor,
      commitsByType,
      commitsByDate,
      commitsByHour,
      commitsByDayOfWeek,
      avgCommitsPerDay,
      avgCommitsPerAuthor,
      topContributors,
      recentActivity: recentDates,
      commitMessages: {
        avgLength: totalMessageLength / totalCommits,
        withBody,
        withoutBody
      }
    }
  }

  /**
   * 按作者分析提交
   * @param author 作者名称
   */
  async analyzeByAuthor(author: string, maxCount = 1000): Promise<CommitStats> {
    const log = await this.git.log({ maxCount, author })

    return {
      total: log.total,
      latest: log.latest ? {
        hash: log.latest.hash,
        message: log.latest.message,
        author: log.latest.author_name,
        date: log.latest.date
      } : null,
      authors: 1,
      commits: log.all.map(c => ({
        hash: c.hash,
        message: c.message,
        author: c.author_name,
        date: c.date
      }))
    }
  }

  /**
   * 按时间范围分析提交
   * @param from 开始日期
   * @param to 结束日期
   */
  async analyzeByTimeRange(from: Date, to: Date): Promise<CommitStats> {
    const log = await this.git.log({
      from: from.toISOString(),
      to: to.toISOString()
    })

    return {
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
  }

  /**
   * 获取提交类型分布
   */
  async getCommitTypeDistribution(maxCount = 1000): Promise<Record<CommitType | 'other', number>> {
    const analytics = await this.analyzeCommitsDetailed(maxCount)
    return analytics.commitsByType
  }

  /**
   * 获取最活跃的贡献者
   * @param limit 数量限制
   */
  async getTopContributors(limit = 10): Promise<Array<{ author: string; commits: number; percentage: number }>> {
    const analytics = await this.analyzeCommitsDetailed()
    return analytics.topContributors.slice(0, limit)
  }
}


