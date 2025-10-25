import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs/promises'
import * as path from 'path'
import type {
  ChangelogOptions,
  ChangelogData,
  CommitInfo,
  CommitType,
  GitOptions
} from '../types'
import { GitOperationError } from '../errors'

/**
 * Changelog 生成器 - 自动生成变更日志
 * 
 * 基于 Conventional Commits 规范生成格式化的变更日志
 * 
 * @example
 * ```ts
 * const generator = new ChangelogGenerator({ baseDir: './my-project' })
 * 
 * // 生成从上个版本到现在的 changelog
 * const changelog = await generator.generate({
 *   from: 'v1.0.0',
 *   to: 'HEAD'
 * })
 * ```
 */
export class ChangelogGenerator {
  private git: SimpleGit
  private baseDir: string

  constructor(private options: GitOptions = {}) {
    this.baseDir = options.baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 生成 Changelog
   * 
   * @param options - 生成选项
   * @returns Changelog 字符串
   * 
   * @example
   * ```ts
   * const changelog = await generator.generate({
   *   from: 'v1.0.0',
   *   to: 'v1.1.0',
   *   outputFile: 'CHANGELOG.md'
   * })
   * ```
   */
  async generate(options: ChangelogOptions = {}): Promise<string> {
    try {
      const data = await this.getChangelogData(options)
      const markdown = this.generateMarkdown(data, options)

      // 如果指定了输出文件，写入文件
      if (options.outputFile) {
        await this.writeToFile(markdown, options.outputFile)
      }

      return markdown
    } catch (error) {
      throw new GitOperationError(
        'changelog generate',
        '生成 Changelog 失败',
        error as Error
      )
    }
  }

  /**
   * 为指定版本生成 Changelog
   * 
   * @param version - 版本号
   * @returns Changelog 字符串
   * 
   * @example
   * ```ts
   * const changelog = await generator.generateForVersion('1.1.0')
   * ```
   */
  async generateForVersion(version: string): Promise<string> {
    // 获取上一个版本标签
    const prevVersion = await this.getPreviousVersion(version)

    return this.generate({
      from: prevVersion || undefined,
      to: version,
      grouped: true
    })
  }

  /**
   * 更新 CHANGELOG.md 文件
   * 
   * @param version - 版本号
   * @param changes - 变更内容（可选，不指定则自动生成）
   * 
   * @example
   * ```ts
   * await generator.update('1.1.0')
   * ```
   */
  async update(version: string, changes?: string): Promise<void> {
    const changelogPath = path.join(this.baseDir, 'CHANGELOG.md')

    try {
      // 生成新的变更内容
      const newChanges = changes || await this.generateForVersion(version)

      // 读取现有的 CHANGELOG.md
      let existingContent = ''
      try {
        existingContent = await fs.readFile(changelogPath, 'utf-8')
      } catch {
        // 文件不存在，创建新的
        existingContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n'
      }

      // 在标题后插入新内容
      const lines = existingContent.split('\n')
      let insertIndex = 0

      // 找到插入位置（在标题和说明之后）
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## ')) {
          insertIndex = i
          break
        }
      }

      if (insertIndex === 0) {
        // 没有找到现有版本，添加到文件末尾
        insertIndex = lines.length
      }

      // 插入新内容
      lines.splice(insertIndex, 0, newChanges, '')

      // 写入文件
      await fs.writeFile(changelogPath, lines.join('\n'), 'utf-8')
    } catch (error) {
      throw new GitOperationError(
        'changelog update',
        '更新 CHANGELOG.md 失败',
        error as Error
      )
    }
  }

  /**
   * 解析现有的 CHANGELOG.md 文件
   * 
   * @param file - 文件路径（默认为 'CHANGELOG.md'）
   * @returns 解析后的 Changelog 数据
   */
  async parse(file = 'CHANGELOG.md'): Promise<ChangelogData[]> {
    const filePath = path.join(this.baseDir, file)

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return this.parseMarkdown(content)
    } catch (error) {
      throw new GitOperationError(
        'changelog parse',
        `解析 ${file} 失败`,
        error as Error
      )
    }
  }

  /**
   * 获取 Changelog 数据
   * 
   * @param options - 选项
   * @returns Changelog 数据
   */
  private async getChangelogData(options: ChangelogOptions): Promise<ChangelogData> {
    const { from, to = 'HEAD' } = options

    // 获取提交范围
    const range = from ? `${from}..${to}` : to
    const log = await this.git.log([range])

    // 解析提交
    const commits: CommitInfo[] = log.all.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date,
      body: commit.body,
      refs: commit.refs
    }))

    // 分类提交
    const features: string[] = []
    const fixes: string[] = []
    const breaking: string[] = []
    const others: string[] = []

    for (const commit of commits) {
      const parsed = this.parseCommitMessage(commit.message)

      if (parsed.breaking) {
        breaking.push(this.formatCommit(commit, parsed))
      }

      if (parsed.type === 'feat') {
        features.push(this.formatCommit(commit, parsed))
      } else if (parsed.type === 'fix') {
        fixes.push(this.formatCommit(commit, parsed))
      } else if (parsed.type && ['docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore'].includes(parsed.type)) {
        others.push(this.formatCommit(commit, parsed))
      }
    }

    // 获取版本号和日期
    const version = to === 'HEAD' ? 'Unreleased' : to.replace(/^v/, '')
    const date = new Date().toISOString().split('T')[0]

    return {
      version,
      date,
      changes: {
        features,
        fixes,
        breaking,
        others
      },
      commits
    }
  }

  /**
   * 生成 Markdown 格式的 Changelog
   * 
   * @param data - Changelog 数据
   * @param options - 选项
   * @returns Markdown 字符串
   */
  private generateMarkdown(data: ChangelogData, options: ChangelogOptions): string {
    const lines: string[] = []

    // 版本标题
    lines.push(`## [${data.version}] - ${data.date}`)
    lines.push('')

    // 重大变更
    if (data.changes.breaking.length > 0) {
      lines.push('### ⚠ BREAKING CHANGES')
      lines.push('')
      data.changes.breaking.forEach(change => lines.push(`- ${change}`))
      lines.push('')
    }

    // 新功能
    if (data.changes.features.length > 0) {
      lines.push('### ✨ Features')
      lines.push('')
      data.changes.features.forEach(change => lines.push(`- ${change}`))
      lines.push('')
    }

    // Bug 修复
    if (data.changes.fixes.length > 0) {
      lines.push('### 🐛 Bug Fixes')
      lines.push('')
      data.changes.fixes.forEach(change => lines.push(`- ${change}`))
      lines.push('')
    }

    // 其他变更
    if (options.grouped && data.changes.others.length > 0) {
      lines.push('### 🔧 Other Changes')
      lines.push('')
      data.changes.others.forEach(change => lines.push(`- ${change}`))
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * 解析提交信息
   * 
   * @param message - 提交信息
   * @returns 解析结果
   */
  private parseCommitMessage(message: string): {
    type?: CommitType
    scope?: string
    subject?: string
    breaking?: boolean
  } {
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?(!)?:\s*(.+)$/
    const match = message.match(conventionalPattern)

    if (!match) {
      return {}
    }

    return {
      type: match[1] as CommitType,
      scope: match[3],
      subject: match[5],
      breaking: !!match[4] || message.includes('BREAKING CHANGE')
    }
  }

  /**
   * 格式化提交信息
   * 
   * @param commit - 提交信息
   * @param parsed - 解析后的提交信息
   * @returns 格式化后的字符串
   */
  private formatCommit(commit: CommitInfo, parsed: any): string {
    const scope = parsed.scope ? `**${parsed.scope}**: ` : ''
    const subject = parsed.subject || commit.message
    const hash = commit.hash.substring(0, 7)

    return `${scope}${subject} (${hash})`
  }

  /**
   * 解析 Markdown 格式的 Changelog
   * 
   * @param content - Markdown 内容
   * @returns Changelog 数据数组
   */
  private parseMarkdown(content: string): ChangelogData[] {
    const versions: ChangelogData[] = []
    const lines = content.split('\n')

    let currentVersion: ChangelogData | null = null
    let currentSection: 'features' | 'fixes' | 'breaking' | 'others' | null = null

    for (const line of lines) {
      // 版本标题
      const versionMatch = line.match(/^##\s+\[(.+?)\]\s+-\s+(.+)$/)
      if (versionMatch) {
        if (currentVersion) {
          versions.push(currentVersion)
        }

        currentVersion = {
          version: versionMatch[1],
          date: versionMatch[2],
          changes: {
            features: [],
            fixes: [],
            breaking: [],
            others: []
          }
        }
        currentSection = null
        continue
      }

      // 分类标题
      if (line.includes('BREAKING CHANGES')) {
        currentSection = 'breaking'
      } else if (line.includes('Features')) {
        currentSection = 'features'
      } else if (line.includes('Bug Fixes')) {
        currentSection = 'fixes'
      } else if (line.includes('Other Changes')) {
        currentSection = 'others'
      }

      // 变更项
      if (line.startsWith('- ') && currentVersion && currentSection) {
        const change = line.substring(2)
        currentVersion.changes[currentSection].push(change)
      }
    }

    if (currentVersion) {
      versions.push(currentVersion)
    }

    return versions
  }

  /**
   * 获取上一个版本标签
   * 
   * @param currentVersion - 当前版本
   * @returns 上一个版本标签
   */
  private async getPreviousVersion(currentVersion: string): Promise<string | null> {
    try {
      const tags = await this.git.tags(['--sort=-version:refname'])
      const allTags = tags.all

      const currentIndex = allTags.indexOf(currentVersion)
      if (currentIndex !== -1 && currentIndex < allTags.length - 1) {
        return allTags[currentIndex + 1]
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * 写入文件
   * 
   * @param content - 内容
   * @param filePath - 文件路径
   */
  private async writeToFile(content: string, filePath: string): Promise<void> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath)
    await fs.writeFile(fullPath, content, 'utf-8')
  }
}


