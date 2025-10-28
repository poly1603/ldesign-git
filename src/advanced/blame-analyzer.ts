import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * Blame 行信息
 */
export interface BlameLine {
  /** 提交哈希 */
  commit: string
  /** 作者 */
  author: string
  /** 作者邮箱 */
  authorEmail: string
  /** 提交时间 */
  timestamp: Date
  /** 行号 */
  lineNumber: number
  /** 行内容 */
  content: string
}

/**
 * 作者统计
 */
export interface AuthorStats {
  /** 作者名称 */
  name: string
  /** 作者邮箱 */
  email: string
  /** 贡献的行数 */
  lines: number
  /** 贡献百分比 */
  percentage: number
  /** 提交列表 */
  commits: string[]
}

/**
 * Blame 报告
 */
export interface BlameReport {
  /** 文件路径 */
  filePath: string
  /** 总行数 */
  totalLines: number
  /** 作者统计 */
  authors: AuthorStats[]
  /** 最近修改时间 */
  lastModified: Date
  /** 最早修改时间 */
  firstModified: Date
}

/**
 * Blame 分析器
 * 
 * 用于分析文件的作者贡献和代码溯源
 * 
 * @example
 * ```typescript
 * const analyzer = new BlameAnalyzer({ baseDir: './my-project' })
 * 
 * // 分析文件
 * const blame = await analyzer.analyzeFile('src/index.ts')
 * 
 * // 获取作者统计
 * const stats = await analyzer.getAuthorStats('src/index.ts')
 * console.log('主要贡献者:', stats[0].name)
 * 
 * // 生成报告
 * const report = await analyzer.generateReport('src/index.ts')
 * ```
 */
export class BlameAnalyzer {
  private git: SimpleGit
  private baseDir: string

  constructor(options: GitOptions = {}) {
    this.baseDir = options.baseDir || process.cwd()
    this.git = simpleGit({
      baseDir: this.baseDir,
      binary: 'git',
      maxConcurrentProcesses: 6,
    })
  }

  /**
   * 分析文件
   * 
   * @param filePath - 文件路径
   * @returns Blame 行信息列表
   * 
   * @example
   * ```typescript
   * const lines = await analyzer.analyzeFile('src/index.ts')
   * lines.forEach(line => {
   *   console.log(`${line.lineNumber}: ${line.author} - ${line.content}`)
   * })
   * ```
   */
  async analyzeFile(filePath: string): Promise<BlameLine[]> {
    try {
      const output = await this.git.raw([
        'blame',
        '--line-porcelain',
        '--',
        filePath,
      ])

      return this.parseBlameOutput(output)
    } catch (error) {
      throw new GitOperationError(
        `分析文件失败: ${error instanceof Error ? error.message : String(error)}`,
        'BLAME_ANALYZE_FAILED',
        'analyzeFile',
        error as Error
      )
    }
  }

  /**
   * 获取作者统计
   * 
   * @param filePath - 文件路径
   * @returns 作者统计列表
   * 
   * @example
   * ```typescript
   * const stats = await analyzer.getAuthorStats('src/index.ts')
   * stats.forEach(author => {
   *   console.log(`${author.name}: ${author.lines} 行 (${author.percentage.toFixed(2)}%)`)
   * })
   * ```
   */
  async getAuthorStats(filePath: string): Promise<AuthorStats[]> {
    const lines = await this.analyzeFile(filePath)
    
    const authorMap = new Map<string, {
      name: string
      email: string
      lines: number
      commits: Set<string>
    }>()

    for (const line of lines) {
      const key = `${line.author}<${line.authorEmail}>`
      
      if (!authorMap.has(key)) {
        authorMap.set(key, {
          name: line.author,
          email: line.authorEmail,
          lines: 0,
          commits: new Set(),
        })
      }

      const author = authorMap.get(key)!
      author.lines++
      author.commits.add(line.commit)
    }

    const totalLines = lines.length
    const stats: AuthorStats[] = []

    for (const author of authorMap.values()) {
      stats.push({
        name: author.name,
        email: author.email,
        lines: author.lines,
        percentage: (author.lines / totalLines) * 100,
        commits: Array.from(author.commits),
      })
    }

    // 按行数降序排序
    return stats.sort((a, b) => b.lines - a.lines)
  }

  /**
   * 查找最近修改
   * 
   * @param filePath - 文件路径
   * @param days - 天数
   * @returns 最近修改的行
   * 
   * @example
   * ```typescript
   * const recentChanges = await analyzer.findRecentChanges('src/index.ts', 30)
   * console.log(`最近 30 天修改了 ${recentChanges.length} 行`)
   * ```
   */
  async findRecentChanges(filePath: string, days: number): Promise<BlameLine[]> {
    const lines = await this.analyzeFile(filePath)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return lines.filter(line => line.timestamp >= cutoffDate)
  }

  /**
   * 生成报告
   * 
   * @param filePath - 文件路径
   * @returns Blame 报告
   * 
   * @example
   * ```typescript
   * const report = await analyzer.generateReport('src/index.ts')
   * console.log('文件:', report.filePath)
   * console.log('总行数:', report.totalLines)
   * console.log('贡献者数:', report.authors.length)
   * ```
   */
  async generateReport(filePath: string): Promise<BlameReport> {
    const lines = await this.analyzeFile(filePath)
    const authors = await this.getAuthorStats(filePath)

    const timestamps = lines.map(l => l.timestamp.getTime())
    const lastModified = new Date(Math.max(...timestamps))
    const firstModified = new Date(Math.min(...timestamps))

    return {
      filePath,
      totalLines: lines.length,
      authors,
      lastModified,
      firstModified,
    }
  }

  /**
   * 导出为 Markdown
   * 
   * @param filePath - 文件路径
   * @returns Markdown 格式的报告
   * 
   * @example
   * ```typescript
   * const markdown = await analyzer.exportMarkdown('src/index.ts')
   * console.log(markdown)
   * ```
   */
  async exportMarkdown(filePath: string): Promise<string> {
    const report = await this.generateReport(filePath)

    let md = `# Blame 报告: ${report.filePath}\n\n`
    md += `**总行数**: ${report.totalLines}\n`
    md += `**最近修改**: ${report.lastModified.toLocaleDateString()}\n`
    md += `**最早修改**: ${report.firstModified.toLocaleDateString()}\n\n`

    md += `## 作者贡献\n\n`
    md += `| 作者 | 行数 | 百分比 | 提交数 |\n`
    md += `|------|------|--------|--------|\n`

    for (const author of report.authors) {
      md += `| ${author.name} | ${author.lines} | ${author.percentage.toFixed(2)}% | ${author.commits.length} |\n`
    }

    return md
  }

  /**
   * 导出为 JSON
   * 
   * @param filePath - 文件路径
   * @returns JSON 格式的报告
   * 
   * @example
   * ```typescript
   * const json = await analyzer.exportJSON('src/index.ts')
   * fs.writeFileSync('blame-report.json', json)
   * ```
   */
  async exportJSON(filePath: string): Promise<string> {
    const report = await this.generateReport(filePath)
    return JSON.stringify(report, null, 2)
  }

  /**
   * 比较两个时间点的变更
   * 
   * @param filePath - 文件路径
   * @param fromDate - 起始时间
   * @param toDate - 结束时间
   * @returns 该时间段内的修改行
   * 
   * @example
   * ```typescript
   * const from = new Date('2024-01-01')
   * const to = new Date('2024-12-31')
   * const changes = await analyzer.compareTimeRange('src/index.ts', from, to)
   * ```
   */
  async compareTimeRange(
    filePath: string,
    fromDate: Date,
    toDate: Date
  ): Promise<BlameLine[]> {
    const lines = await this.analyzeFile(filePath)

    return lines.filter(
      line => line.timestamp >= fromDate && line.timestamp <= toDate
    )
  }

  /**
   * 解析 blame 输出
   */
  private parseBlameOutput(output: string): BlameLine[] {
    const lines: BlameLine[] = []
    const blocks = output.split('\n\n').filter(b => b.trim())

    for (const block of blocks) {
      const blockLines = block.split('\n')
      const firstLine = blockLines[0]
      
      if (!firstLine) continue

      const match = firstLine.match(/^([a-f0-9]{40})\s+(\d+)\s+(\d+)/)
      if (!match) continue

      const [, commit, , lineNumber] = match

      let author = ''
      let authorEmail = ''
      let timestamp = 0
      let content = ''

      for (const line of blockLines) {
        if (line.startsWith('author ')) {
          author = line.substring(7)
        } else if (line.startsWith('author-mail ')) {
          authorEmail = line.substring(12).replace(/[<>]/g, '')
        } else if (line.startsWith('author-time ')) {
          timestamp = parseInt(line.substring(12))
        } else if (line.startsWith('\t')) {
          content = line.substring(1)
        }
      }

      lines.push({
        commit,
        author,
        authorEmail,
        timestamp: new Date(timestamp * 1000),
        lineNumber: parseInt(lineNumber),
        content,
      })
    }

    return lines
  }
}
