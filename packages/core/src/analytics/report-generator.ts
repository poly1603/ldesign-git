import type {
  Report,
  ReportOptions,
  ReportFormat,
  GitOptions
} from '../types'
import { CommitAnalyzer } from '../core/commit-analyzer'
import { RepositoryAnalyzer } from './repository-analyzer'
import { BranchManager } from '../core/branch-manager'
import { TagManager } from '../core/tag-manager'

/**
 * 报告生成器 - 生成各种格式的 Git 报告
 */
export class ReportGenerator {
  private commitAnalyzer: CommitAnalyzer
  private repositoryAnalyzer: RepositoryAnalyzer
  private branchManager: BranchManager
  private tagManager: TagManager

  constructor(private options: GitOptions = {}) {
    this.commitAnalyzer = new CommitAnalyzer(options)
    this.repositoryAnalyzer = new RepositoryAnalyzer(options)
    this.branchManager = new BranchManager(options)
    this.tagManager = new TagManager(options)
  }

  /**
   * 生成完整报告
   */
  async generateReport(options: ReportOptions = {}): Promise<Report> {
    const [
      commitAnalytics,
      repositoryMetrics,
      branchAnalytics,
      branches,
      tags
    ] = await Promise.all([
      this.commitAnalyzer.analyzeCommitsDetailed(),
      this.repositoryAnalyzer.analyzeRepository(),
      this.repositoryAnalyzer.analyzeAllBranches(),
      this.branchManager.listBranches(),
      this.tagManager.listTags()
    ])

    const report: Report = {
      title: 'Git 仓库分析报告',
      generated: new Date().toISOString(),
      summary: {
        commits: commitAnalytics.totalCommits,
        contributors: Object.keys(commitAnalytics.commitsByAuthor).length,
        branches: branches.all.length,
        tags: tags.length,
        files: repositoryMetrics.totalFiles
      },
      commits: commitAnalytics,
      repository: repositoryMetrics,
      branches: branchAnalytics
    }

    if (options.period) {
      report.period = {
        from: options.period.from || '',
        to: options.period.to || ''
      }
    }

    return report
  }

  /**
   * 生成 Markdown 格式报告
   */
  async generateMarkdownReport(options: ReportOptions = {}): Promise<string> {
    const report = await this.generateReport(options)
    const lines: string[] = []

    // 标题
    lines.push(`# ${report.title}`)
    lines.push('')
    lines.push(`**生成时间**: ${new Date(report.generated).toLocaleString('zh-CN')}`)
    lines.push('')

    if (report.period) {
      lines.push(`**统计周期**: ${report.period.from} 至 ${report.period.to}`)
      lines.push('')
    }

    // 概览
    lines.push('## 📊 概览')
    lines.push('')
    lines.push(`| 指标 | 数值 |`)
    lines.push(`|------|------|`)
    lines.push(`| 总提交数 | ${report.summary.commits} |`)
    lines.push(`| 贡献者数 | ${report.summary.contributors} |`)
    lines.push(`| 分支数 | ${report.summary.branches} |`)
    lines.push(`| 标签数 | ${report.summary.tags} |`)
    lines.push(`| 文件数 | ${report.summary.files} |`)
    lines.push('')

    // 提交分析
    if (report.commits) {
      lines.push('## 📝 提交分析')
      lines.push('')

      lines.push('### 提交类型分布')
      lines.push('')
      Object.entries(report.commits.commitsByType).forEach(([type, count]) => {
        const percentage = ((count / report.commits!.totalCommits) * 100).toFixed(1)
        lines.push(`- **${type}**: ${count} (${percentage}%)`)
      })
      lines.push('')

      lines.push('### Top 10 贡献者')
      lines.push('')
      lines.push('| 排名 | 贡献者 | 提交数 | 占比 |')
      lines.push('|------|--------|--------|------|')
      report.commits.topContributors.forEach((contributor, index) => {
        lines.push(`| ${index + 1} | ${contributor.author} | ${contributor.commits} | ${contributor.percentage.toFixed(1)}% |`)
      })
      lines.push('')

      lines.push('### 提交活跃度')
      lines.push('')
      lines.push('**按星期统计**:')
      lines.push('')
      Object.entries(report.commits.commitsByDayOfWeek).forEach(([day, count]) => {
        lines.push(`- ${day}: ${count}`)
      })
      lines.push('')

      lines.push('**按小时统计 (Top 5)**:')
      lines.push('')
      const topHours = Object.entries(report.commits.commitsByHour)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
      topHours.forEach(([hour, count]) => {
        lines.push(`- ${hour}:00 - ${count} 次提交`)
      })
      lines.push('')
    }

    // 仓库分析
    if (report.repository) {
      lines.push('## 📦 仓库分析')
      lines.push('')

      lines.push('### 语言分布')
      lines.push('')
      Object.entries(report.repository.languageDistribution)
        .sort(([, a], [, b]) => b - a)
        .forEach(([language, count]) => {
          const percentage = ((count / report.repository!.totalFiles) * 100).toFixed(1)
          lines.push(`- **${language}**: ${count} 文件 (${percentage}%)`)
        })
      lines.push('')

      if (report.repository.mostChangedFiles.length > 0) {
        lines.push('### 最常变更的文件')
        lines.push('')
        lines.push('| 文件 | 变更次数 |')
        lines.push('|------|----------|')
        report.repository.mostChangedFiles.slice(0, 10).forEach(file => {
          lines.push(`| \`${file.path}\` | ${file.changeCount} |`)
        })
        lines.push('')
      }

      lines.push('### 分支统计')
      lines.push('')
      lines.push(`- **总分支数**: ${report.repository.branchMetrics.total}`)
      lines.push(`- **活跃分支**: ${report.repository.branchMetrics.active}`)
      lines.push(`- **陈旧分支**: ${report.repository.branchMetrics.stale}`)
      lines.push('')

      lines.push('### 贡献者统计')
      lines.push('')
      lines.push(`- **总贡献者**: ${report.repository.contributors.total}`)
      lines.push(`- **活跃贡献者**: ${report.repository.contributors.active}`)
      lines.push(`- **核心贡献者**: ${report.repository.contributors.coreContributors.join(', ')}`)
      lines.push('')
    }

    // 分支分析
    if (report.branches && report.branches.length > 0) {
      lines.push('## 🌿 分支分析')
      lines.push('')

      const staleBranches = report.branches.filter(b => b.isStale)
      if (staleBranches.length > 0) {
        lines.push('### 陈旧分支 (>90天未更新)')
        lines.push('')
        lines.push('| 分支 | 最后提交 | 提交数 |')
        lines.push('|------|----------|--------|')
        staleBranches.slice(0, 10).forEach(branch => {
          const lastCommit = new Date(branch.lastCommitDate).toLocaleDateString('zh-CN')
          lines.push(`| ${branch.name} | ${lastCommit} | ${branch.commits} |`)
        })
        lines.push('')
      }

      const activeBranches = report.branches.filter(b => !b.isStale).slice(0, 10)
      if (activeBranches.length > 0) {
        lines.push('### 活跃分支')
        lines.push('')
        lines.push('| 分支 | 最后提交 | 提交数 | 作者数 |')
        lines.push('|------|----------|--------|--------|')
        activeBranches.forEach(branch => {
          const lastCommit = new Date(branch.lastCommitDate).toLocaleDateString('zh-CN')
          lines.push(`| ${branch.name} | ${lastCommit} | ${branch.commits} | ${branch.authors.length} |`)
        })
        lines.push('')
      }
    }

    lines.push('---')
    lines.push('')
    lines.push('*报告由 @ldesign/git 自动生成*')

    return lines.join('\n')
  }

  /**
   * 生成 JSON 格式报告
   */
  async generateJsonReport(options: ReportOptions = {}): Promise<string> {
    const report = await this.generateReport(options)
    return JSON.stringify(report, null, 2)
  }

  /**
   * 生成 CSV 格式报告（提交统计）
   */
  async generateCsvReport(options: ReportOptions = {}): Promise<string> {
    const report = await this.generateReport(options)
    const lines: string[] = []

    // 提交统计 CSV
    lines.push('# 提交统计')
    lines.push('作者,提交数,占比')

    if (report.commits) {
      report.commits.topContributors.forEach(contributor => {
        lines.push(`"${contributor.author}",${contributor.commits},${contributor.percentage.toFixed(2)}%`)
      })
    }

    lines.push('')
    lines.push('# 提交类型分布')
    lines.push('类型,数量')

    if (report.commits) {
      Object.entries(report.commits.commitsByType).forEach(([type, count]) => {
        lines.push(`${type},${count}`)
      })
    }

    return lines.join('\n')
  }

  /**
   * 导出报告到文件
   */
  async exportReport(options: ReportOptions = {}): Promise<string> {
    const format = options.format || 'markdown'
    let content: string

    switch (format) {
      case 'markdown':
        content = await this.generateMarkdownReport(options)
        break
      case 'json':
        content = await this.generateJsonReport(options)
        break
      case 'csv':
        content = await this.generateCsvReport(options)
        break
      case 'html':
        content = await this.generateHtmlReport(options)
        break
      default:
        content = await this.generateMarkdownReport(options)
    }

    return content
  }

  /**
   * 生成 HTML 格式报告
   */
  async generateHtmlReport(options: ReportOptions = {}): Promise<string> {
    const markdown = await this.generateMarkdownReport(options)

    // 简单的 Markdown 到 HTML 转换
    let html = markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim() !== '')
        return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
      })
      .replace(/\n/g, '<br>')

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Git 仓库分析报告</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    h2 { color: #555; border-bottom: 2px solid #2196F3; padding-bottom: 8px; margin-top: 30px; }
    h3 { color: #666; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; background: white; }
    th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    strong { color: #2196F3; }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `.trim()
  }

  /**
   * 生成简要摘要
   */
  async generateSummary(): Promise<string> {
    const report = await this.generateReport()
    const lines: string[] = []

    lines.push('='.repeat(50))
    lines.push('Git 仓库概览')
    lines.push('='.repeat(50))
    lines.push('')
    lines.push(`总提交数: ${report.summary.commits}`)
    lines.push(`贡献者数: ${report.summary.contributors}`)
    lines.push(`分支数: ${report.summary.branches}`)
    lines.push(`标签数: ${report.summary.tags}`)
    lines.push(`文件数: ${report.summary.files}`)
    lines.push('')

    if (report.commits && report.commits.topContributors.length > 0) {
      lines.push('Top 3 贡献者:')
      report.commits.topContributors.slice(0, 3).forEach((c, i) => {
        lines.push(`  ${i + 1}. ${c.author} - ${c.commits} 次提交 (${c.percentage.toFixed(1)}%)`)
      })
      lines.push('')
    }

    lines.push('='.repeat(50))

    return lines.join('\n')
  }
}


