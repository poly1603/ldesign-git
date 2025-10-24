import simpleGit, { SimpleGit } from 'simple-git'
import type {
  RepositoryMetrics,
  BranchAnalytics,
  FileAnalytics,
  GitOptions
} from '../types'
import { BranchManager } from '../core/branch-manager'
import { TagManager } from '../core/tag-manager'

/**
 * 仓库分析器 - 分析仓库的整体指标
 */
export class RepositoryAnalyzer {
  private git: SimpleGit
  private branchManager: BranchManager
  private tagManager: TagManager

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
    this.branchManager = new BranchManager(options)
    this.tagManager = new TagManager(options)
  }

  /**
   * 分析仓库整体指标
   */
  async analyzeRepository(): Promise<RepositoryMetrics> {
    const [
      branches,
      tags,
      fileStats,
      branchMetrics,
      contributorStats
    ] = await Promise.all([
      this.branchManager.listBranches(),
      this.tagManager.listTags(),
      this.analyzeFiles(),
      this.analyzeBranchMetrics(),
      this.analyzeContributors()
    ])

    return {
      totalFiles: fileStats.totalFiles,
      totalLines: fileStats.totalLines,
      languageDistribution: fileStats.languageDistribution,
      filesByType: fileStats.filesByType,
      largestFiles: fileStats.largestFiles,
      mostChangedFiles: fileStats.mostChangedFiles,
      codeChurn: fileStats.codeChurn,
      branchMetrics,
      contributors: contributorStats
    }
  }

  /**
   * 分析文件统计
   */
  private async analyzeFiles(): Promise<{
    totalFiles: number
    totalLines: number
    languageDistribution: Record<string, number>
    filesByType: Record<string, number>
    largestFiles: Array<{ path: string; lines: number }>
    mostChangedFiles: FileAnalytics[]
    codeChurn: { total: number; byPeriod: Record<string, number> }
  }> {
    // 获取所有跟踪的文件
    const lsFiles = await this.git.raw(['ls-files'])
    const files = lsFiles.split('\n').filter(f => f.trim() !== '')

    const languageDistribution: Record<string, number> = {}
    const filesByType: Record<string, number> = {}

    files.forEach(file => {
      const ext = file.split('.').pop()?.toLowerCase() || 'no-ext'
      filesByType[ext] = (filesByType[ext] || 0) + 1

      // 语言分类
      const language = this.getLanguage(ext)
      languageDistribution[language] = (languageDistribution[language] || 0) + 1
    })

    // 获取最常变更的文件
    const mostChangedFiles = await this.getMostChangedFiles(10)

    // 代码流失率（简化版）
    const churnData = await this.calculateCodeChurn()

    return {
      totalFiles: files.length,
      totalLines: 0, // 需要额外计算
      languageDistribution,
      filesByType,
      largestFiles: [],
      mostChangedFiles,
      codeChurn: churnData
    }
  }

  /**
   * 获取最常变更的文件
   */
  private async getMostChangedFiles(limit = 10): Promise<FileAnalytics[]> {
    try {
      const log = await this.git.raw(['log', '--format=%H', '--name-only'])
      const lines = log.split('\n')

      const fileChanges: Record<string, number> = {}
      const fileAuthors: Record<string, Set<string>> = {}

      let currentCommit = ''

      for (const line of lines) {
        if (line.match(/^[a-f0-9]{40}$/)) {
          currentCommit = line
        } else if (line.trim() !== '') {
          fileChanges[line] = (fileChanges[line] || 0) + 1

          if (!fileAuthors[line]) {
            fileAuthors[line] = new Set()
          }
        }
      }

      const sortedFiles = Object.entries(fileChanges)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)

      return sortedFiles.map(([path, changeCount]) => ({
        path,
        changeCount,
        authors: Array.from(fileAuthors[path] || []),
        lastModified: '',
        insertions: 0,
        deletions: 0,
        churnRate: changeCount
      }))
    } catch (error) {
      return []
    }
  }

  /**
   * 计算代码流失率
   */
  private async calculateCodeChurn(): Promise<{ total: number; byPeriod: Record<string, number> }> {
    try {
      const diffStats = await this.git.diffSummary(['HEAD~10', 'HEAD'])
      const total = diffStats.insertions + diffStats.deletions

      return {
        total,
        byPeriod: {}
      }
    } catch (error) {
      return {
        total: 0,
        byPeriod: {}
      }
    }
  }

  /**
   * 分析分支指标
   */
  private async analyzeBranchMetrics(): Promise<RepositoryMetrics['branchMetrics']> {
    const branches = await this.branchManager.listBranches()
    const allBranches = branches.all

    // 判断活跃分支（最近 30 天有提交）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let activeBranches = 0
    let staleBranches = 0

    for (const branch of allBranches) {
      try {
        const log = await this.git.log(['-1', branch])
        if (log.latest) {
          const lastCommitDate = new Date(log.latest.date)
          if (lastCommitDate >= thirtyDaysAgo) {
            activeBranches++
          } else {
            staleBranches++
          }
        }
      } catch {
        staleBranches++
      }
    }

    return {
      total: allBranches.length,
      active: activeBranches,
      stale: staleBranches,
      avgLifetime: 0 // 需要更详细的计算
    }
  }

  /**
   * 分析贡献者
   */
  private async analyzeContributors(): Promise<RepositoryMetrics['contributors']> {
    const log = await this.git.log()
    const authors = new Set(log.all.map(c => c.author_name))

    // 最近 30 天活跃的贡献者
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentAuthors = new Set(
      log.all
        .filter(c => new Date(c.date) >= thirtyDaysAgo)
        .map(c => c.author_name)
    )

    // 核心贡献者（贡献超过总提交10%的人）
    const authorCommits: Record<string, number> = {}
    log.all.forEach(c => {
      authorCommits[c.author_name] = (authorCommits[c.author_name] || 0) + 1
    })

    const threshold = log.total * 0.1
    const coreContributors = Object.entries(authorCommits)
      .filter(([, count]) => count >= threshold)
      .map(([author]) => author)

    return {
      total: authors.size,
      active: recentAuthors.size,
      coreContributors
    }
  }

  /**
   * 分析分支的详细信息
   */
  async analyzeBranch(branchName: string): Promise<BranchAnalytics> {
    const log = await this.git.log([branchName])

    const authors = new Set(log.all.map(c => c.author_name))

    const firstCommit = log.all[log.all.length - 1]
    const lastCommit = log.latest

    const createdDate = firstCommit?.date || ''
    const lastCommitDate = lastCommit?.date || ''

    // 计算生命周期（天数）
    const created = new Date(createdDate)
    const lastUpdate = new Date(lastCommitDate)
    const lifetime = Math.floor((lastUpdate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    // 判断是否陈旧（超过 90 天没有更新）
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const isStale = lastUpdate < ninetyDaysAgo

    // 检查是否已合并
    let mergedInto: string | undefined
    try {
      const merged = await this.branchManager.isMerged(branchName, 'main')
      if (merged) {
        mergedInto = 'main'
      }
    } catch {
      // 忽略错误
    }

    return {
      name: branchName,
      createdDate,
      lastCommitDate,
      lifetime,
      commits: log.total,
      authors: Array.from(authors),
      isStale,
      mergedInto
    }
  }

  /**
   * 分析所有分支
   */
  async analyzeAllBranches(): Promise<BranchAnalytics[]> {
    const branches = await this.branchManager.listBranches()
    const analytics: BranchAnalytics[] = []

    for (const branchName of branches.all) {
      try {
        const branchAnalytics = await this.analyzeBranch(branchName)
        analytics.push(branchAnalytics)
      } catch (error) {
        // 跳过错误的分支
      }
    }

    return analytics
  }

  /**
   * 根据文件扩展名获取语言
   */
  private getLanguage(ext: string): string {
    const languageMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript',
      vue: 'Vue',
      py: 'Python',
      java: 'Java',
      go: 'Go',
      rs: 'Rust',
      c: 'C',
      cpp: 'C++',
      cs: 'C#',
      rb: 'Ruby',
      php: 'PHP',
      swift: 'Swift',
      kt: 'Kotlin',
      md: 'Markdown',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      less: 'LESS',
      sql: 'SQL',
      sh: 'Shell'
    }

    return languageMap[ext] || 'Other'
  }

  /**
   * 获取仓库年龄（天数）
   */
  async getRepositoryAge(): Promise<number> {
    try {
      const firstCommit = await this.git.raw(['rev-list', '--max-parents=0', 'HEAD'])
      const log = await this.git.show([firstCommit.trim(), '--format=%ai', '--no-patch'])
      const firstDate = new Date(log.trim())
      const now = new Date()

      return Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
    } catch {
      return 0
    }
  }
}


