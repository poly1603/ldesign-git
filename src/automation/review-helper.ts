import simpleGit, { SimpleGit, DiffResult } from 'simple-git'
import type {
  ReviewData,
  FileChange,
  CommitInfo,
  DiffOptions,
  GitOptions
} from '../types'

/**
 * 代码审查辅助工具 - 生成变更摘要和影响分析
 */
export class ReviewHelper {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 生成代码审查数据
   * @param baseBranch 基准分支
   * @param compareBranch 对比分支（可选，默认为当前分支）
   */
  async generateReviewData(
    baseBranch: string,
    compareBranch?: string
  ): Promise<ReviewData> {
    const currentBranch = compareBranch || (await this.git.branch()).current

    // 获取提交差异
    const commits = await this.getCommitsDiff(baseBranch, currentBranch)

    // 获取文件变更
    const fileChanges = await this.getFileChanges(baseBranch, currentBranch)

    // 计算总变更统计
    const totalInsertions = fileChanges.reduce((sum, file) => sum + file.insertions, 0)
    const totalDeletions = fileChanges.reduce((sum, file) => sum + file.deletions, 0)

    // 分析影响
    const impact = this.analyzeImpact(fileChanges, totalInsertions, totalDeletions)

    // 生成建议
    const suggestions = this.generateSuggestions(fileChanges, commits, impact)

    return {
      title: `代码审查: ${currentBranch} -> ${baseBranch}`,
      description: `将 ${currentBranch} 合并到 ${baseBranch} 的变更审查`,
      changes: {
        files: fileChanges.length,
        insertions: totalInsertions,
        deletions: totalDeletions
      },
      commits,
      fileChanges,
      impact,
      suggestions
    }
  }

  /**
   * 获取两个分支之间的提交差异
   */
  async getCommitsDiff(baseBranch: string, compareBranch: string): Promise<CommitInfo[]> {
    const log = await this.git.log([`${baseBranch}..${compareBranch}`])

    return log.all.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date,
      body: commit.body,
      refs: commit.refs
    }))
  }

  /**
   * 获取文件变更详情
   */
  async getFileChanges(baseBranch: string, compareBranch: string): Promise<FileChange[]> {
    const diffSummary = await this.git.diffSummary([`${baseBranch}...${compareBranch}`])
    const changes: FileChange[] = []

    for (const file of diffSummary.files) {
      let type: FileChange['type'] = 'modified'
      const insertions = 'insertions' in file ? file.insertions : 0
      const deletions = 'deletions' in file ? file.deletions : 0

      if (insertions > 0 && deletions === 0) {
        type = 'added'
      } else if (insertions === 0 && deletions > 0) {
        type = 'deleted'
      } else if (file.file.includes('=>')) {
        type = 'renamed'
      }

      changes.push({
        path: file.file,
        type,
        insertions,
        deletions
      })
    }

    return changes
  }

  /**
   * 获取差异内容
   */
  async getDiff(options: DiffOptions = {}): Promise<string> {
    const args: string[] = []

    if (options.staged || options.cached) {
      args.push('--cached')
    }

    if (options.nameOnly) {
      args.push('--name-only')
    }

    if (options.stat) {
      args.push('--stat')
    }

    if (options.unified !== undefined) {
      args.push(`--unified=${options.unified}`)
    }

    const diff = await this.git.diff(args)
    return diff
  }

  /**
   * 分析变更影响
   */
  private analyzeImpact(
    fileChanges: FileChange[],
    totalInsertions: number,
    totalDeletions: number
  ): ReviewData['impact'] {
    const totalChanges = totalInsertions + totalDeletions
    const affectedAreas: string[] = []

    // 按文件路径分析影响区域
    const pathGroups: Record<string, number> = {}

    fileChanges.forEach(change => {
      const parts = change.path.split('/')
      if (parts.length > 1) {
        const area = parts[0]
        pathGroups[area] = (pathGroups[area] || 0) + 1
      }
    })

    // 找出主要影响区域
    Object.entries(pathGroups)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([area]) => {
        affectedAreas.push(area)
      })

    // 判断影响级别
    let level: ReviewData['impact']['level'] = 'low'
    let reason = ''

    if (totalChanges > 1000 || fileChanges.length > 50) {
      level = 'critical'
      reason = '变更量非常大，需要仔细审查'
    } else if (totalChanges > 500 || fileChanges.length > 20) {
      level = 'high'
      reason = '变更量较大，建议分批审查'
    } else if (totalChanges > 200 || fileChanges.length > 10) {
      level = 'medium'
      reason = '变更量中等，需要认真审查'
    } else {
      level = 'low'
      reason = '变更量较小，快速审查即可'
    }

    // 检查关键文件
    const criticalFiles = fileChanges.filter(change =>
      change.path.includes('package.json') ||
      change.path.includes('tsconfig') ||
      change.path.includes('webpack') ||
      change.path.includes('vite.config') ||
      change.path.includes('.config.')
    )

    if (criticalFiles.length > 0) {
      if (level === 'low') level = 'medium'
      reason += '；包含配置文件变更'
    }

    return {
      level,
      reason,
      affectedAreas
    }
  }

  /**
   * 生成审查建议
   */
  private generateSuggestions(
    fileChanges: FileChange[],
    commits: CommitInfo[],
    impact: ReviewData['impact']
  ): string[] {
    const suggestions: string[] = []

    // 根据影响级别给出建议
    if (impact.level === 'critical') {
      suggestions.push('建议进行深度代码审查，必要时可以分批审查')
      suggestions.push('关注核心业务逻辑的变更')
    } else if (impact.level === 'high') {
      suggestions.push('建议分模块进行审查')
      suggestions.push('重点关注接口变更和数据流变化')
    }

    // 检查测试文件
    const testFiles = fileChanges.filter(change =>
      /\.(test|spec)\.(ts|js|tsx|jsx)$/i.test(change.path)
    )

    if (testFiles.length === 0 && fileChanges.length > 5) {
      suggestions.push('⚠️ 未发现测试文件变更，建议添加相应测试')
    }

    // 检查文档
    const docFiles = fileChanges.filter(change =>
      /\.(md|txt)$/i.test(change.path) || change.path.includes('README')
    )

    if (docFiles.length === 0 && fileChanges.length > 10) {
      suggestions.push('建议更新相关文档')
    }

    // 检查提交信息质量
    const poorCommits = commits.filter(commit =>
      commit.message.length < 10 || !/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)/.test(commit.message)
    )

    if (poorCommits.length > commits.length / 2) {
      suggestions.push('部分提交信息不规范，建议遵循 Conventional Commits 规范')
    }

    // 检查大文件变更
    const largeChanges = fileChanges.filter(change =>
      (change.insertions + change.deletions) > 500
    )

    if (largeChanges.length > 0) {
      suggestions.push(`发现 ${largeChanges.length} 个大文件变更，建议重点审查：${largeChanges.map(c => c.path).join(', ')}`)
    }

    // 检查删除的代码
    const totalDeletions = fileChanges.reduce((sum, file) => sum + file.deletions, 0)
    const totalInsertions = fileChanges.reduce((sum, file) => sum + file.insertions, 0)

    if (totalDeletions > totalInsertions && totalDeletions > 100) {
      suggestions.push('删除了大量代码，请确认这些删除是必要的')
    }

    return suggestions
  }

  /**
   * 生成 Markdown 格式的审查报告
   */
  async generateMarkdownReport(
    baseBranch: string,
    compareBranch?: string
  ): Promise<string> {
    const reviewData = await this.generateReviewData(baseBranch, compareBranch)
    const lines: string[] = []

    lines.push(`# ${reviewData.title}`)
    lines.push('')
    lines.push(`**描述**: ${reviewData.description}`)
    lines.push('')

    // 变更概览
    lines.push('## 📊 变更概览')
    lines.push('')
    lines.push(`- **文件数**: ${reviewData.changes.files}`)
    lines.push(`- **新增行**: +${reviewData.changes.insertions}`)
    lines.push(`- **删除行**: -${reviewData.changes.deletions}`)
    lines.push(`- **提交数**: ${reviewData.commits.length}`)
    lines.push('')

    // 影响分析
    lines.push('## 🎯 影响分析')
    lines.push('')
    lines.push(`- **影响级别**: ${this.getImpactLevelEmoji(reviewData.impact.level)} ${reviewData.impact.level.toUpperCase()}`)
    lines.push(`- **原因**: ${reviewData.impact.reason}`)
    if (reviewData.impact.affectedAreas.length > 0) {
      lines.push(`- **影响区域**: ${reviewData.impact.affectedAreas.join(', ')}`)
    }
    lines.push('')

    // 提交列表
    lines.push('## 📝 提交列表')
    lines.push('')
    reviewData.commits.forEach(commit => {
      lines.push(`- \`${commit.hash.substring(0, 7)}\` ${commit.message} - ${commit.author}`)
    })
    lines.push('')

    // 文件变更
    lines.push('## 📁 文件变更')
    lines.push('')
    reviewData.fileChanges.forEach(change => {
      const icon = this.getFileChangeIcon(change.type)
      lines.push(`- ${icon} \`${change.path}\` (+${change.insertions}/-${change.deletions})`)
    })
    lines.push('')

    // 审查建议
    if (reviewData.suggestions.length > 0) {
      lines.push('## 💡 审查建议')
      lines.push('')
      reviewData.suggestions.forEach(suggestion => {
        lines.push(`- ${suggestion}`)
      })
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * 获取影响级别的 emoji
   */
  private getImpactLevelEmoji(level: string): string {
    const emojis: Record<string, string> = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    }
    return emojis[level] || '⚪'
  }

  /**
   * 获取文件变更类型的图标
   */
  private getFileChangeIcon(type: FileChange['type']): string {
    const icons: Record<FileChange['type'], string> = {
      added: '✅',
      modified: '✏️',
      deleted: '❌',
      renamed: '🔄'
    }
    return icons[type] || '📄'
  }

  /**
   * 比较两个提交
   */
  async compareCommits(commit1: string, commit2: string): Promise<ReviewData> {
    const commits = await this.git.log([`${commit1}..${commit2}`])
    const diffSummary = await this.git.diffSummary([commit1, commit2])

    const fileChanges: FileChange[] = diffSummary.files.map(file => {
      const insertions = 'insertions' in file ? file.insertions : 0
      const deletions = 'deletions' in file ? file.deletions : 0

      return {
        path: file.file,
        type: insertions > 0 && deletions === 0 ? 'added' :
          insertions === 0 && deletions > 0 ? 'deleted' :
            file.file.includes('=>') ? 'renamed' : 'modified',
        insertions,
        deletions
      }
    })

    const totalInsertions = fileChanges.reduce((sum, file) => sum + file.insertions, 0)
    const totalDeletions = fileChanges.reduce((sum, file) => sum + file.deletions, 0)

    const commitInfos: CommitInfo[] = commits.all.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date
    }))

    const impact = this.analyzeImpact(fileChanges, totalInsertions, totalDeletions)
    const suggestions = this.generateSuggestions(fileChanges, commitInfos, impact)

    return {
      title: `提交对比: ${commit1.substring(0, 7)} -> ${commit2.substring(0, 7)}`,
      description: `比较两个提交之间的变更`,
      changes: {
        files: fileChanges.length,
        insertions: totalInsertions,
        deletions: totalDeletions
      },
      commits: commitInfos,
      fileChanges,
      impact,
      suggestions
    }
  }
}

