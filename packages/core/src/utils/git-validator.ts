/**
 * Git 统一验证器
 * @module utils/git-validator
 */

import type {
  CommitType,
  BranchNameValidation,
  CommitMessageValidation,
  ValidationResult
} from '../types'

/**
 * 验证选项
 */
export interface ValidatorOptions {
  /** 是否严格模式（警告也视为错误） */
  strict?: boolean
  /** 自定义提交类型 */
  commitTypes?: string[]
  /** 自定义分支前缀 */
  branchPrefixes?: string[]
  /** 最大主题长度 */
  maxSubjectLength?: number
  /** 最大正文行长度 */
  maxBodyLineLength?: number
}

/**
 * 默认验证选项
 */
const DEFAULT_OPTIONS: Required<ValidatorOptions> = {
  strict: false,
  commitTypes: ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
  branchPrefixes: ['feature/', 'bugfix/', 'hotfix/', 'release/', 'develop', 'main', 'master'],
  maxSubjectLength: 72,
  maxBodyLineLength: 100
}

/**
 * Git 统一验证器
 *
 * 提供完整的 Git 相关数据验证功能，包括分支名、提交信息、标签名等
 *
 * @example
 * ```ts
 * const validator = new GitValidator({ strict: true })
 *
 * // 验证分支名
 * const branchResult = validator.validateBranchName('feature/login')
 *
 * // 验证提交信息
 * const commitResult = validator.validateCommitMessage('feat(user): add login')
 *
 * // 验证标签名
 * const tagResult = validator.validateTagName('v1.0.0')
 * ```
 */
export class GitValidator {
  private options: Required<ValidatorOptions>

  constructor(options: ValidatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * 验证分支名
   *
   * @param branchName - 分支名称
   * @returns 验证结果
   */
  validateBranchName(branchName: string): BranchNameValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // 基本规则
    if (!branchName || branchName.trim() === '') {
      errors.push('分支名不能为空')
      return { valid: false, errors, warnings }
    }

    // Git 不允许的字符
    if (/[\s~^:?*[\]\\]/.test(branchName)) {
      errors.push('分支名包含非法字符（空格、~、^、:、?、*、[、]、\\）')
    }

    // 不能以 / 开头或结尾
    if (branchName.startsWith('/') || branchName.endsWith('/')) {
      errors.push('分支名不能以 / 开头或结尾')
    }

    // 不能包含连续的点
    if (branchName.includes('..')) {
      errors.push('分支名不能包含连续的点 (..)')
    }

    // 不能以 . 结尾
    if (branchName.endsWith('.')) {
      errors.push('分支名不能以点结尾')
    }

    // 不能包含 @{
    if (branchName.includes('@{')) {
      errors.push('分支名不能包含 @{')
    }

    // 不能连续的 /
    if (branchName.includes('//')) {
      errors.push('分支名不能包含连续的 /')
    }

    // 长度检查
    if (branchName.length > 255) {
      errors.push('分支名过长（超过 255 个字符）')
    }

    // 命名建议
    const hasConventionalPrefix = this.options.branchPrefixes.some(
      prefix => branchName.startsWith(prefix) || branchName === prefix.replace('/', '')
    )

    if (!hasConventionalPrefix && errors.length === 0) {
      warnings.push(`建议使用约定的分支前缀（${this.options.branchPrefixes.join('、')}）`)
    }

    // 建议使用小写和连字符
    if (branchName !== branchName.toLowerCase()) {
      warnings.push('建议使用小写字母')
    }

    if (branchName.includes('_')) {
      warnings.push('建议使用连字符（-）而不是下划线（_）')
    }

    const result: BranchNameValidation = {
      valid: this.options.strict ? errors.length === 0 && warnings.length === 0 : errors.length === 0,
      errors,
      warnings
    }

    // 提供修正建议
    if (!result.valid || warnings.length > 0) {
      const suggestion = branchName
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/[^a-z0-9\-/]/g, '-')
        .replace(/\/+/g, '/')
        .replace(/-+/g, '-')
        .replace(/^\/|\/$/g, '')

      if (suggestion !== branchName) {
        result.suggestion = suggestion
      }
    }

    return result
  }

  /**
   * 验证提交信息
   *
   * @param message - 提交信息
   * @returns 验证结果
   */
  validateCommitMessage(message: string): CommitMessageValidation {
    const errors: string[] = []
    const warnings: string[] = []

    if (!message || message.trim() === '') {
      errors.push('提交信息不能为空')
      return { valid: false, errors, warnings }
    }

    const lines = message.split('\n')
    const header = lines[0]

    // 检查 Conventional Commits 格式
    const typesPattern = this.options.commitTypes.join('|')
    const conventionalPattern = new RegExp(`^(${typesPattern})(\\(([^)]+)\\))?(!)?:\\s*(.+)$`)
    const match = header.match(conventionalPattern)

    if (!match) {
      errors.push('提交信息不符合 Conventional Commits 规范')
      errors.push('格式应为: type(scope): subject')
      errors.push(`类型: ${this.options.commitTypes.join(', ')}`)
      return { valid: false, errors, warnings }
    }

    const [, type, , scope, breaking, subject] = match

    // 主题长度检查
    if (subject.length > this.options.maxSubjectLength) {
      warnings.push(`主题行过长（建议不超过 ${this.options.maxSubjectLength} 个字符）`)
    }

    if (subject.length < 5) {
      warnings.push('主题行过短（建议至少 5 个字符）')
    }

    // 主题应该以小写字母开头
    if (/^[A-Z]/.test(subject)) {
      warnings.push('主题建议以小写字母开头')
    }

    // 主题不应该以句号结尾
    if (subject.endsWith('.')) {
      warnings.push('主题不应该以句号结尾')
    }

    // 检查空行
    if (lines.length > 1 && lines[1] !== '') {
      warnings.push('主题行和正文之间应该有一个空行')
    }

    // 检查正文行长度
    for (let i = 2; i < lines.length; i++) {
      if (lines[i].length > this.options.maxBodyLineLength) {
        warnings.push(`第 ${i + 1} 行过长（建议每行不超过 ${this.options.maxBodyLineLength} 个字符）`)
        break
      }
    }

    // 检查 Breaking Changes
    const isBreaking = !!breaking || message.includes('BREAKING CHANGE:')

    // 解析结果
    const parsed: CommitMessageValidation['parsed'] = {
      type: type as CommitType,
      subject,
      breaking: isBreaking
    }

    if (scope) {
      parsed.scope = scope
    }

    // 解析正文和页脚
    if (lines.length > 2) {
      const bodyLines: string[] = []
      const footerLines: string[] = []
      let inFooter = false

      for (let i = 2; i < lines.length; i++) {
        const line = lines[i]
        if (line.match(/^(BREAKING CHANGE|Closes|Refs|Fixes|See also):/i)) {
          inFooter = true
        }

        if (inFooter) {
          footerLines.push(line)
        } else if (line.trim() !== '') {
          bodyLines.push(line)
        }
      }

      if (bodyLines.length > 0) {
        parsed.body = bodyLines.join('\n')
      }

      if (footerLines.length > 0) {
        parsed.footer = footerLines.join('\n')
      }
    }

    return {
      valid: this.options.strict ? errors.length === 0 && warnings.length === 0 : errors.length === 0,
      errors,
      warnings,
      parsed
    }
  }

  /**
   * 验证标签名
   *
   * @param tagName - 标签名称
   * @returns 验证结果
   */
  validateTagName(tagName: string): ValidationResult & { isSemver?: boolean } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!tagName || tagName.trim() === '') {
      errors.push('标签名不能为空')
      return { valid: false, errors, warnings }
    }

    // Git 不允许的字符
    if (/[\s~^:?*[\]\\]/.test(tagName)) {
      errors.push('标签名包含非法字符')
    }

    // 语义化版本检查
    const semverPattern = /^v?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/
    const isSemver = semverPattern.test(tagName)

    if (!isSemver) {
      warnings.push('建议使用语义化版本格式（如 v1.2.3）')
    }

    return {
      valid: this.options.strict ? errors.length === 0 && warnings.length === 0 : errors.length === 0,
      errors,
      warnings,
      isSemver
    }
  }

  /**
   * 验证远程 URL
   *
   * @param url - 远程 URL
   * @returns 验证结果
   */
  validateRemoteUrl(url: string): ValidationResult & { urlType?: 'https' | 'ssh' | 'git' | 'file' } {
    const errors: string[] = []
    const warnings: string[] = []
    let urlType: 'https' | 'ssh' | 'git' | 'file' | undefined

    if (!url || url.trim() === '') {
      errors.push('远程 URL 不能为空')
      return { valid: false, errors, warnings }
    }

    // HTTPS URL
    if (url.startsWith('https://')) {
      urlType = 'https'
      if (!url.endsWith('.git') && !url.includes('github.com') && !url.includes('gitlab.com')) {
        warnings.push('HTTPS URL 建议以 .git 结尾')
      }
    }
    // SSH URL
    else if (url.startsWith('git@') || url.startsWith('ssh://')) {
      urlType = 'ssh'
      if (!url.includes(':') && !url.includes('/')) {
        errors.push('SSH URL 格式错误')
      }
    }
    // Git protocol
    else if (url.startsWith('git://')) {
      urlType = 'git'
      warnings.push('git:// 协议不加密，建议使用 HTTPS 或 SSH')
    }
    // File path
    else if (url.startsWith('/') || url.startsWith('file://') || /^[a-zA-Z]:/.test(url)) {
      urlType = 'file'
    }
    else {
      errors.push('无法识别的 URL 格式（支持 HTTPS、SSH、Git 协议）')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      urlType
    }
  }

  /**
   * 验证提交哈希
   *
   * @param hash - 提交哈希
   * @returns 验证结果
   */
  validateCommitHash(hash: string): ValidationResult & { isShort?: boolean } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!hash || hash.trim() === '') {
      errors.push('提交哈希不能为空')
      return { valid: false, errors, warnings }
    }

    // 短哈希（至少 7 位）或完整哈希（40 位）
    if (!/^[a-f0-9]{7,40}$/.test(hash)) {
      errors.push('提交哈希格式错误（应为 7-40 位十六进制字符）')
    }

    const isShort = hash.length < 40

    if (isShort && hash.length < 7) {
      warnings.push('哈希过短，可能导致歧义')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      isShort
    }
  }

  /**
   * 验证文件路径
   *
   * @param filePath - 文件路径
   * @returns 验证结果
   */
  validateFilePath(filePath: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!filePath || filePath.trim() === '') {
      errors.push('文件路径不能为空')
      return { valid: false, errors, warnings }
    }

    // 检查危险字符
    if (/[<>:"|?*]/.test(filePath)) {
      errors.push('文件路径包含非法字符')
    }

    // 检查路径注入
    if (filePath.includes('..')) {
      warnings.push('路径包含 ..，请确保不会造成路径注入')
    }

    // 检查空格开头/结尾
    if (filePath !== filePath.trim()) {
      warnings.push('路径包含首尾空格')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 批量验证
   *
   * @param items - 要验证的项
   * @returns 验证结果数组
   */
  validateBatch(items: Array<{
    type: 'branch' | 'commit' | 'tag' | 'url' | 'hash' | 'path'
    value: string
  }>): Array<ValidationResult & { type: string; value: string }> {
    return items.map(item => {
      let result: ValidationResult

      switch (item.type) {
        case 'branch':
          result = this.validateBranchName(item.value)
          break
        case 'commit':
          result = this.validateCommitMessage(item.value)
          break
        case 'tag':
          result = this.validateTagName(item.value)
          break
        case 'url':
          result = this.validateRemoteUrl(item.value)
          break
        case 'hash':
          result = this.validateCommitHash(item.value)
          break
        case 'path':
          result = this.validateFilePath(item.value)
          break
        default:
          result = { valid: false, errors: ['未知的验证类型'], warnings: [] }
      }

      return { ...result, type: item.type, value: item.value }
    })
  }

  /**
   * 更新验证选项
   *
   * @param options - 新的选项
   */
  updateOptions(options: Partial<ValidatorOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * 获取当前选项
   */
  getOptions(): Required<ValidatorOptions> {
    return { ...this.options }
  }
}

/**
 * 创建 Git 验证器实例
 *
 * @param options - 验证选项
 * @returns 验证器实例
 */
export function createGitValidator(options?: ValidatorOptions): GitValidator {
  return new GitValidator(options)
}

/**
 * 默认验证器实例
 */
export const defaultValidator = new GitValidator()
