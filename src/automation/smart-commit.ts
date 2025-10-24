import simpleGit, { SimpleGit } from 'simple-git'
import type {
  SmartCommitOptions,
  CommitSuggestion,
  CommitType,
  FileChange,
  GitOptions
} from '../types'

/**
 * 智能提交系统 - 自动分析变更并生成规范的提交信息
 */
export class SmartCommit {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 分析文件变更并建议提交类型
   */
  async analyzeChanges(): Promise<CommitSuggestion[]> {
    const status = await this.git.status()
    const suggestions: CommitSuggestion[] = []

    const allChangedFiles = [
      ...status.modified,
      ...status.created,
      ...status.deleted,
      ...status.renamed.map(r => r.to)
    ]

    // 按文件类型和路径分析
    const hasNewFiles = status.created.length > 0
    const hasDeletedFiles = status.deleted.length > 0
    const hasModifiedFiles = status.modified.length > 0

    // 检查文档文件
    const docFiles = allChangedFiles.filter(f =>
      /\.(md|txt|doc|docx|pdf)$/i.test(f) || f.includes('README') || f.includes('docs/')
    )

    // 检查测试文件
    const testFiles = allChangedFiles.filter(f =>
      /\.(test|spec)\.(ts|js|tsx|jsx)$/i.test(f) || f.includes('__tests__') || f.includes('test/')
    )

    // 检查配置文件
    const configFiles = allChangedFiles.filter(f =>
      /\.(json|yaml|yml|toml|ini|config|conf)$/i.test(f) ||
      f.includes('package.json') ||
      f.includes('.config.') ||
      f.includes('tsconfig') ||
      f.includes('eslint')
    )

    // 检查样式文件
    const styleFiles = allChangedFiles.filter(f =>
      /\.(css|scss|sass|less|styl)$/i.test(f)
    )

    // 检查构建相关文件
    const buildFiles = allChangedFiles.filter(f =>
      f.includes('webpack') ||
      f.includes('vite') ||
      f.includes('rollup') ||
      f.includes('build') ||
      f.includes('Dockerfile') ||
      f.includes('.github/workflows')
    )

    // 生成建议
    if (docFiles.length > 0 && docFiles.length === allChangedFiles.length) {
      suggestions.push({
        type: 'docs',
        subject: `更新文档`,
        confidence: 0.9,
        reason: '所有变更都是文档文件'
      })
    }

    if (testFiles.length > 0 && testFiles.length === allChangedFiles.length) {
      suggestions.push({
        type: 'test',
        subject: `添加/更新测试`,
        confidence: 0.9,
        reason: '所有变更都是测试文件'
      })
    }

    if (styleFiles.length > 0 && styleFiles.length === allChangedFiles.length) {
      suggestions.push({
        type: 'style',
        subject: `更新样式`,
        confidence: 0.85,
        reason: '所有变更都是样式文件'
      })
    }

    if (configFiles.length > 0 && configFiles.length === allChangedFiles.length) {
      suggestions.push({
        type: 'chore',
        subject: `更新配置`,
        confidence: 0.85,
        reason: '所有变更都是配置文件'
      })
    }

    if (buildFiles.length > 0) {
      suggestions.push({
        type: 'build',
        subject: `更新构建配置`,
        confidence: 0.8,
        reason: '包含构建相关文件'
      })
    }

    if (hasNewFiles && !hasModifiedFiles && !hasDeletedFiles) {
      suggestions.push({
        type: 'feat',
        subject: `添加新功能`,
        confidence: 0.75,
        reason: '只有新增文件'
      })
    }

    if (hasDeletedFiles && !hasNewFiles && !hasModifiedFiles) {
      suggestions.push({
        type: 'chore',
        subject: `删除文件`,
        confidence: 0.7,
        reason: '只有删除文件'
      })
    }

    if (hasModifiedFiles) {
      // 检查是否是性能优化相关
      const perfKeywords = allChangedFiles.some(f =>
        f.includes('performance') || f.includes('optimize') || f.includes('cache')
      )

      if (perfKeywords) {
        suggestions.push({
          type: 'perf',
          subject: `性能优化`,
          confidence: 0.75,
          reason: '文件名包含性能优化相关关键词'
        })
      } else {
        suggestions.push({
          type: 'refactor',
          subject: `代码重构`,
          confidence: 0.6,
          reason: '修改现有文件'
        })
      }
    }

    // 如果没有明确的建议，提供通用建议
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'feat',
        subject: `更新代码`,
        confidence: 0.5,
        reason: '无法明确判断变更类型'
      })
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * 获取文件变更详情
   */
  async getFileChanges(): Promise<FileChange[]> {
    const status = await this.git.status()
    const diffSummary = await this.git.diffSummary(['--cached'])

    const changes: FileChange[] = []

    // 处理新增文件
    status.created.forEach(file => {
      const fileStat = diffSummary.files.find(f => f.file === file)
      const insertions = fileStat && 'insertions' in fileStat ? fileStat.insertions : 0
      const deletions = fileStat && 'deletions' in fileStat ? fileStat.deletions : 0
      changes.push({
        path: file,
        type: 'added',
        insertions,
        deletions
      })
    })

    // 处理修改文件
    status.modified.forEach(file => {
      const fileStat = diffSummary.files.find(f => f.file === file)
      const insertions = fileStat && 'insertions' in fileStat ? fileStat.insertions : 0
      const deletions = fileStat && 'deletions' in fileStat ? fileStat.deletions : 0
      changes.push({
        path: file,
        type: 'modified',
        insertions,
        deletions
      })
    })

    // 处理删除文件
    status.deleted.forEach(file => {
      const fileStat = diffSummary.files.find(f => f.file === file)
      const deletions = fileStat && 'deletions' in fileStat ? fileStat.deletions : 0
      changes.push({
        path: file,
        type: 'deleted',
        insertions: 0,
        deletions
      })
    })

    // 处理重命名文件
    status.renamed.forEach(file => {
      const fileStat = diffSummary.files.find(f => f.file === file.to)
      const insertions = fileStat && 'insertions' in fileStat ? fileStat.insertions : 0
      const deletions = fileStat && 'deletions' in fileStat ? fileStat.deletions : 0
      changes.push({
        path: `${file.from} -> ${file.to}`,
        type: 'renamed',
        insertions,
        deletions
      })
    })

    return changes
  }

  /**
   * 生成提交信息
   * @param options 提交选项
   */
  generateCommitMessage(options: SmartCommitOptions): string {
    const parts: string[] = []

    // 类型和作用域
    let header = options.type || 'feat'
    if (options.scope) {
      header += `(${options.scope})`
    }
    header += ': '

    // 主题
    header += options.subject || '更新代码'

    // Breaking change 标记
    if (options.breaking) {
      header += ' [BREAKING CHANGE]'
    }

    parts.push(header)

    // 正文
    if (options.body) {
      parts.push('')
      parts.push(options.body)
    }

    // 页脚
    const footerParts: string[] = []

    if (options.breaking && options.body) {
      footerParts.push(`BREAKING CHANGE: ${options.body}`)
    }

    if (options.issues && options.issues.length > 0) {
      footerParts.push(`Closes: ${options.issues.join(', ')}`)
    }

    if (footerParts.length > 0) {
      parts.push('')
      parts.push(footerParts.join('\n'))
    }

    if (options.footer) {
      parts.push('')
      parts.push(options.footer)
    }

    return parts.join('\n')
  }

  /**
   * 智能提交（自动分析并提交）
   * @param options 提交选项
   */
  async smartCommit(options: SmartCommitOptions = {}): Promise<string> {
    // 如果启用自动检测且没有指定类型
    if (options.autoDetect && !options.type) {
      const suggestions = await this.analyzeChanges()
      if (suggestions.length > 0) {
        const bestSuggestion = suggestions[0]
        options.type = bestSuggestion.type
        if (!options.subject) {
          options.subject = bestSuggestion.subject
        }
      }
    }

    const message = this.generateCommitMessage(options)

    // 执行提交
    await this.git.commit(message)

    return message
  }

  /**
   * 验证提交信息格式
   * @param message 提交信息
   */
  validateCommitMessage(message: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查是否为空
    if (!message || message.trim() === '') {
      errors.push('提交信息不能为空')
      return { valid: false, errors }
    }

    // 检查格式：type(scope): subject
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+/
    const lines = message.split('\n')
    const header = lines[0]

    if (!conventionalPattern.test(header)) {
      errors.push('提交信息不符合 Conventional Commits 规范')
      errors.push('格式应为: type(scope): subject')
      errors.push('类型可以是: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert')
    }

    // 检查主题长度
    const subjectMatch = header.match(/: (.+)$/)
    if (subjectMatch && subjectMatch[1].length > 72) {
      errors.push('主题行不应超过 72 个字符')
    }

    // 检查是否有空行分隔
    if (lines.length > 1 && lines[1] !== '') {
      errors.push('主题行和正文之间应该有一个空行')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 解析提交信息
   * @param message 提交信息
   */
  parseCommitMessage(message: string): {
    type?: CommitType
    scope?: string
    subject?: string
    body?: string
    footer?: string
    breaking?: boolean
  } {
    const lines = message.split('\n')
    const header = lines[0]

    const headerMatch = header.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\((.+)\))?: (.+)$/)

    if (!headerMatch) {
      return {}
    }

    const result: any = {
      type: headerMatch[1] as CommitType,
      subject: headerMatch[4]
    }

    if (headerMatch[3]) {
      result.scope = headerMatch[3]
    }

    // 检查 breaking change
    result.breaking = header.includes('[BREAKING CHANGE]') || message.includes('BREAKING CHANGE:')

    // 提取正文
    let bodyStartIndex = 1
    if (lines.length > 1 && lines[1] === '') {
      bodyStartIndex = 2
    }

    const bodyLines: string[] = []
    const footerLines: string[] = []
    let inFooter = false

    for (let i = bodyStartIndex; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('BREAKING CHANGE:') || line.startsWith('Closes:') || line.startsWith('Refs:')) {
        inFooter = true
      }

      if (inFooter) {
        footerLines.push(line)
      } else if (line.trim() !== '') {
        bodyLines.push(line)
      }
    }

    if (bodyLines.length > 0) {
      result.body = bodyLines.join('\n')
    }

    if (footerLines.length > 0) {
      result.footer = footerLines.join('\n')
    }

    return result
  }
}

