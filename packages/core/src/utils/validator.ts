import type {
  BranchNameValidation,
  CommitMessageValidation,
  CommitType
} from '../types'

/**
 * 验证器 - 验证分支名、提交信息等
 */

/**
 * 验证分支名
 */
export function validateBranchName(branchName: string): BranchNameValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // 基本规则
  if (!branchName || branchName.trim() === '') {
    errors.push('分支名不能为空')
    return { valid: false, errors, warnings }
  }

  // Git 不允许的字符
  if (/[\s~^:?*\[\\]/.test(branchName)) {
    errors.push('分支名包含非法字符（空格、~、^、:、?、*、[、\\）')
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

  // 长度检查
  if (branchName.length > 255) {
    errors.push('分支名过长（超过 255 个字符）')
  }

  // 命名建议
  const conventionalPrefixes = ['feature/', 'bugfix/', 'hotfix/', 'release/', 'develop', 'main', 'master']
  const hasConventionalPrefix = conventionalPrefixes.some(prefix => branchName.startsWith(prefix))

  if (!hasConventionalPrefix && !errors.length) {
    warnings.push('建议使用约定的分支前缀（feature/、bugfix/、hotfix/、release/）')
  }

  // 建议使用小写和连字符
  if (branchName !== branchName.toLowerCase()) {
    warnings.push('建议使用小写字母')
  }

  if (branchName.includes('_')) {
    warnings.push('建议使用连字符（-）而不是下划线（_）')
  }

  const result: BranchNameValidation = {
    valid: errors.length === 0,
    errors,
    warnings
  }

  // 提供修正建议
  if (!result.valid || warnings.length > 0) {
    const suggestion = branchName
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/[^a-z0-9\-\/]/g, '-')
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
 */
export function validateCommitMessage(message: string): CommitMessageValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!message || message.trim() === '') {
    errors.push('提交信息不能为空')
    return { valid: false, errors, warnings }
  }

  const lines = message.split('\n')
  const header = lines[0]

  // 检查 Conventional Commits 格式
  const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?: (.+)$/
  const match = header.match(conventionalPattern)

  if (!match) {
    errors.push('提交信息不符合 Conventional Commits 规范')
    errors.push('格式应为: type(scope): subject')
    errors.push('类型: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert')

    return { valid: false, errors, warnings }
  }

  const [, type, , scope, subject] = match

  // 主题长度检查
  if (subject.length > 72) {
    warnings.push('主题行过长（建议不超过 72 个字符）')
  }

  if (subject.length < 10) {
    warnings.push('主题行过短（建议至少 10 个字符）')
  }

  // 主题应该以小写字母开头
  if (subject && /^[A-Z]/.test(subject)) {
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
    if (lines[i].length > 100) {
      warnings.push(`第 ${i + 1} 行过长（建议每行不超过 100 个字符）`)
      break
    }
  }

  // 检查 Breaking Changes
  const breaking = message.includes('BREAKING CHANGE:') || header.includes('!')

  // 解析结果
  const parsed: CommitMessageValidation['parsed'] = {
    type: type as CommitType,
    subject,
    breaking
  }

  if (scope) {
    parsed.scope = scope
  }

  if (lines.length > 2) {
    const bodyLines = []
    const footerLines = []
    let inFooter = false

    for (let i = 2; i < lines.length; i++) {
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
      parsed.body = bodyLines.join('\n')
    }

    if (footerLines.length > 0) {
      parsed.footer = footerLines.join('\n')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed
  }
}

/**
 * 验证标签名
 */
export function validateTagName(tagName: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (!tagName || tagName.trim() === '') {
    errors.push('标签名不能为空')
    return { valid: false, errors, warnings }
  }

  // Git 不允许的字符（与分支名类似）
  if (/[\s~^:?*\[\\]/.test(tagName)) {
    errors.push('标签名包含非法字符')
  }

  // 语义化版本检查
  const semverPattern = /^v?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/
  if (!semverPattern.test(tagName)) {
    warnings.push('建议使用语义化版本格式（如 v1.2.3）')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证远程 URL
 */
export function validateRemoteUrl(url: string): { valid: boolean; errors: string[]; type?: 'https' | 'ssh' | 'git' } {
  const errors: string[] = []

  if (!url || url.trim() === '') {
    errors.push('远程 URL 不能为空')
    return { valid: false, errors }
  }

  let type: 'https' | 'ssh' | 'git' | undefined

  // HTTPS URL
  if (url.startsWith('https://')) {
    type = 'https'
    if (!url.includes('.git')) {
      errors.push('HTTPS URL 应该以 .git 结尾')
    }
  }
  // SSH URL
  else if (url.startsWith('git@')) {
    type = 'ssh'
    if (!url.includes(':')) {
      errors.push('SSH URL 格式错误（应该包含 :）')
    }
  }
  // Git protocol
  else if (url.startsWith('git://')) {
    type = 'git'
  }
  // File path
  else if (url.startsWith('/') || url.startsWith('file://')) {
    type = 'git'
  }
  else {
    errors.push('无法识别的 URL 格式（支持 HTTPS、SSH、Git 协议）')
  }

  return {
    valid: errors.length === 0,
    errors,
    type
  }
}

/**
 * 验证提交哈希
 */
export function validateCommitHash(hash: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!hash || hash.trim() === '') {
    errors.push('提交哈希不能为空')
    return { valid: false, errors }
  }

  // 短哈希（至少 7 位）或完整哈希（40 位）
  if (!/^[a-f0-9]{7,40}$/.test(hash)) {
    errors.push('提交哈希格式错误（应为 7-40 位十六进制字符）')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}


