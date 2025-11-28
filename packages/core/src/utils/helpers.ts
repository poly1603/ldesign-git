/**
 * Git 辅助工具函数
 * @module utils/helpers
 */

import type { CommitType } from '../types'

/**
 * 解析语义化版本号
 * 
 * @param version - 版本字符串（如 'v1.2.3' 或 '1.2.3'）
 * @returns 解析后的版本对象，无效则返回 null
 * 
 * @example
 * ```ts
 * const version = parseSemver('v1.2.3-beta.1')
 * // { major: 1, minor: 2, patch: 3, prerelease: 'beta.1', build: undefined }
 * ```
 */
export function parseSemver(version: string): {
  major: number
  minor: number
  patch: number
  prerelease?: string
  build?: string
} | null {
  const pattern = /^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/
  const match = version.match(pattern)

  if (!match) {
    return null
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5]
  }
}

/**
 * 比较两个语义化版本号
 * 
 * @param version1 - 版本1
 * @param version2 - 版本2
 * @returns 1 (version1 > version2), 0 (相等), -1 (version1 < version2)
 * 
 * @example
 * ```ts
 * compareSemver('1.2.3', '1.2.2') // 1
 * compareSemver('1.0.0', '2.0.0') // -1
 * compareSemver('1.0.0', '1.0.0') // 0
 * ```
 */
export function compareSemver(version1: string, version2: string): number {
  const v1 = parseSemver(version1)
  const v2 = parseSemver(version2)

  if (!v1 || !v2) {
    return version1.localeCompare(version2)
  }

  if (v1.major !== v2.major) {
    return v1.major - v2.major
  }

  if (v1.minor !== v2.minor) {
    return v1.minor - v2.minor
  }

  if (v1.patch !== v2.patch) {
    return v1.patch - v2.patch
  }

  // 比较预发布版本
  if (v1.prerelease && !v2.prerelease) {
    return -1
  }

  if (!v1.prerelease && v2.prerelease) {
    return 1
  }

  if (v1.prerelease && v2.prerelease) {
    return v1.prerelease.localeCompare(v2.prerelease)
  }

  return 0
}

/**
 * 增加语义化版本号
 * 
 * @param version - 当前版本
 * @param type - 增加类型（major/minor/patch）
 * @returns 新版本号
 * 
 * @example
 * ```ts
 * incrementSemver('1.2.3', 'patch') // '1.2.4'
 * incrementSemver('1.2.3', 'minor') // '1.3.0'
 * incrementSemver('1.2.3', 'major') // '2.0.0'
 * ```
 */
export function incrementSemver(
  version: string,
  type: 'major' | 'minor' | 'patch'
): string {
  const parsed = parseSemver(version)

  if (!parsed) {
    throw new Error(`无效的版本号: ${version}`)
  }

  const hasPrefix = version.startsWith('v')

  switch (type) {
    case 'major':
      return `${hasPrefix ? 'v' : ''}${parsed.major + 1}.0.0`
    case 'minor':
      return `${hasPrefix ? 'v' : ''}${parsed.major}.${parsed.minor + 1}.0`
    case 'patch':
      return `${hasPrefix ? 'v' : ''}${parsed.major}.${parsed.minor}.${parsed.patch + 1}`
  }
}

/**
 * 缩短提交哈希
 * 
 * @param hash - 完整的提交哈希
 * @param length - 缩短后的长度（默认为 7）
 * @returns 缩短的哈希
 * 
 * @example
 * ```ts
 * shortenHash('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0') // 'a1b2c3d'
 * ```
 */
export function shortenHash(hash: string, length = 7): string {
  return hash.substring(0, length)
}

/**
 * 解析 Conventional Commits 格式的提交信息
 * 
 * @param message - 提交信息
 * @returns 解析结果
 * 
 * @example
 * ```ts
 * const parsed = parseConventionalCommit('feat(user): add login')
 * // { type: 'feat', scope: 'user', subject: 'add login', breaking: false }
 * ```
 */
export function parseConventionalCommit(message: string): {
  type?: CommitType
  scope?: string
  subject?: string
  breaking?: boolean
} {
  const pattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?(!)?:\s*(.+)$/
  const match = message.match(pattern)

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
 * 格式化文件大小
 * 
 * @param bytes - 字节数
 * @returns 格式化后的字符串
 * 
 * @example
 * ```ts
 * formatFileSize(1024) // '1.00 KB'
 * formatFileSize(1048576) // '1.00 MB'
 * ```
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 格式化相对时间
 * 
 * @param date - 日期对象或字符串
 * @returns 相对时间字符串
 * 
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 3600000)) // '1小时前'
 * formatRelativeTime(new Date(Date.now() - 86400000)) // '1天前'
 * ```
 */
export function formatRelativeTime(date: Date | string): string {
  const then = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) {
    return '刚刚'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  }

  if (diffHours < 24) {
    return `${diffHours}小时前`
  }

  if (diffDays < 7) {
    return `${diffDays}天前`
  }

  if (diffWeeks < 4) {
    return `${diffWeeks}周前`
  }

  if (diffMonths < 12) {
    return `${diffMonths}个月前`
  }

  return `${diffYears}年前`
}

/**
 * 清理分支名（移除远程前缀）
 * 
 * @param branchName - 分支名
 * @returns 清理后的分支名
 * 
 * @example
 * ```ts
 * cleanBranchName('origin/feature/login') // 'feature/login'
 * cleanBranchName('remotes/upstream/main') // 'main'
 * ```
 */
export function cleanBranchName(branchName: string): string {
  return branchName
    .replace(/^remotes?\//, '')
    .replace(/^[^/]+\//, '')
}

/**
 * 检查是否是有效的分支名
 * 
 * @param name - 分支名
 * @returns 是否有效
 * 
 * @example
 * ```ts
 * isValidBranchName('feature/login') // true
 * isValidBranchName('invalid branch') // false
 * ```
 */
export function isValidBranchName(name: string): boolean {
  if (!name || name.trim() === '') {
    return false
  }

  // Git 不允许的字符
  if (/[\s~^:?*\[\\]/.test(name)) {
    return false
  }

  // 不能以 / 开头或结尾
  if (name.startsWith('/') || name.endsWith('/')) {
    return false
  }

  // 不能包含连续的点
  if (name.includes('..')) {
    return false
  }

  // 不能以 . 结尾
  if (name.endsWith('.')) {
    return false
  }

  // 不能包含 @{
  if (name.includes('@{')) {
    return false
  }

  return true
}

/**
 * 检查是否是有效的提交哈希
 * 
 * @param hash - 提交哈希
 * @returns 是否有效
 * 
 * @example
 * ```ts
 * isValidCommitHash('a1b2c3d') // true
 * isValidCommitHash('abc123def456...') // true (40位)
 * isValidCommitHash('invalid') // false
 * ```
 */
export function isValidCommitHash(hash: string): boolean {
  return /^[a-f0-9]{7,40}$/.test(hash)
}

/**
 * 生成分支名建议
 * 
 * @param input - 输入字符串
 * @param prefix - 分支前缀（可选）
 * @returns 建议的分支名
 * 
 * @example
 * ```ts
 * suggestBranchName('Add User Login', 'feature')
 * // 'feature/add-user-login'
 * ```
 */
export function suggestBranchName(input: string, prefix?: string): string {
  let name = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (prefix) {
    name = `${prefix}/${name}`
  }

  return name
}

/**
 * 从提交信息中提取 issue 编号
 * 
 * @param message - 提交信息
 * @returns Issue 编号数组
 * 
 * @example
 * ```ts
 * extractIssueNumbers('fix: resolve #123 and #456')
 * // ['123', '456']
 * 
 * extractIssueNumbers('feat: add feature (closes #789)')
 * // ['789']
 * ```
 */
export function extractIssueNumbers(message: string): string[] {
  const patterns = [
    /#(\d+)/g,                    // #123
    /closes?\s+#?(\d+)/gi,        // closes #123
    /fixes?\s+#?(\d+)/gi,         // fixes #123
    /resolves?\s+#?(\d+)/gi       // resolves #123
  ]

  const issues = new Set<string>()

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(message)) !== null) {
      issues.add(match[1])
    }
  }

  return Array.from(issues)
}

/**
 * 格式化提交信息为 Conventional Commits 格式
 * 
 * @param type - 提交类型
 * @param scope - 作用域（可选）
 * @param subject - 主题
 * @param body - 正文（可选）
 * @param footer - 页脚（可选）
 * @param breaking - 是否是破坏性变更
 * @returns 格式化的提交信息
 * 
 * @example
 * ```ts
 * const message = formatConventionalCommit(
 *   'feat',
 *   'user',
 *   'add login feature',
 *   '添加了用户登录功能\n包括用户名和密码验证'
 * )
 * // 'feat(user): add login feature\n\n添加了用户登录功能\n包括用户名和密码验证'
 * ```
 */
export function formatConventionalCommit(
  type: CommitType,
  scope: string | undefined,
  subject: string,
  body?: string,
  footer?: string,
  breaking = false
): string {
  const parts: string[] = []

  // Header
  let header = type
  if (scope) {
    header += `(${scope})`
  }
  if (breaking) {
    header += '!'
  }
  header += `: ${subject}`
  parts.push(header)

  // Body
  if (body) {
    parts.push('')
    parts.push(body)
  }

  // Footer
  if (footer || breaking) {
    parts.push('')
    if (breaking && body) {
      parts.push(`BREAKING CHANGE: ${body}`)
    }
    if (footer) {
      parts.push(footer)
    }
  }

  return parts.join('\n')
}

/**
 * 检查分支名是否符合约定
 * 
 * @param branchName - 分支名
 * @returns 分支类型（feature/bugfix/hotfix/release等），不符合则返回 null
 * 
 * @example
 * ```ts
 * getBranchType('feature/login') // 'feature'
 * getBranchType('bugfix/issue-123') // 'bugfix'
 * getBranchType('random-branch') // null
 * ```
 */
export function getBranchType(branchName: string): string | null {
  const patterns = [
    { type: 'feature', regex: /^feature\// },
    { type: 'bugfix', regex: /^bugfix\// },
    { type: 'hotfix', regex: /^hotfix\// },
    { type: 'release', regex: /^release\// },
    { type: 'main', regex: /^(main|master)$/ },
    { type: 'develop', regex: /^develop$/ }
  ]

  for (const pattern of patterns) {
    if (pattern.regex.test(branchName)) {
      return pattern.type
    }
  }

  return null
}

/**
 * 将文件路径转换为模块名
 * 
 * @param filePath - 文件路径
 * @returns 模块名
 * 
 * @example
 * ```ts
 * filePathToModuleName('src/components/Button/index.ts')
 * // 'components/Button'
 * ```
 */
export function filePathToModuleName(filePath: string): string {
  return filePath
    .replace(/^src\//, '')
    .replace(/\.(ts|tsx|js|jsx|vue)$/, '')
    .replace(/\/index$/, '')
}

/**
 * 检测提交类型（基于文件路径）
 * 
 * @param files - 变更的文件路径数组
 * @returns 推荐的提交类型
 * 
 * @example
 * ```ts
 * detectCommitType(['README.md', 'docs/guide.md']) // 'docs'
 * detectCommitType(['package.json']) // 'chore'
 * detectCommitType(['src/index.ts']) // 'feat'
 * ```
 */
export function detectCommitType(files: string[]): CommitType {
  const fileTypes = {
    docs: /\.(md|txt|doc|docx)$|README|docs\//i,
    test: /\.(test|spec)\.(ts|js|tsx|jsx)$|__tests__|test\//i,
    style: /\.(css|scss|sass|less|styl)$/i,
    build: /webpack|vite|rollup|build|Dockerfile|\.github\/workflows/i,
    ci: /\.github|\.gitlab|circle\.yml|travis\.yml/i,
    chore: /package\.json|yarn\.lock|pnpm-lock\.yaml|\.gitignore|\.eslintrc|tsconfig/i
  }

  for (const [type, regex] of Object.entries(fileTypes)) {
    if (files.every(file => regex.test(file))) {
      return type as CommitType
    }
  }

  // 默认返回 feat
  return 'feat'
}

/**
 * 规范化远程 URL
 * 
 * @param url - 远程 URL
 * @returns 规范化的 URL
 * 
 * @example
 * ```ts
 * normalizeRemoteUrl('git@github.com:user/repo.git')
 * // 'https://github.com/user/repo.git'
 * ```
 */
export function normalizeRemoteUrl(url: string): string {
  // SSH 转 HTTPS
  if (url.startsWith('git@')) {
    return url
      .replace('git@', 'https://')
      .replace(':', '/')
  }

  return url
}

/**
 * 提取仓库信息从 URL
 * 
 * @param url - 远程 URL
 * @returns 仓库信息（owner 和 repo）
 * 
 * @example
 * ```ts
 * extractRepoInfo('https://github.com/user/repo.git')
 * // { owner: 'user', repo: 'repo' }
 * ```
 */
export function extractRepoInfo(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/,
    /gitlab\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/,
    /bitbucket\.org[:/]([^/]+)\/([^/.]+)(\.git)?$/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      }
    }
  }

  return null
}

/**
 * 计算代码行数变化百分比
 * 
 * @param insertions - 新增行数
 * @param deletions - 删除行数
 * @returns 变化百分比字符串
 * 
 * @example
 * ```ts
 * calculateChangePercentage(100, 50) // '+33%'
 * calculateChangePercentage(50, 100) // '-33%'
 * ```
 */
export function calculateChangePercentage(insertions: number, deletions: number): string {
  const total = insertions + deletions
  if (total === 0) return '0%'

  const netChange = insertions - deletions
  const percentage = Math.abs((netChange / total) * 100).toFixed(0)

  return netChange >= 0 ? `+${percentage}%` : `-${percentage}%`
}

/**
 * 生成提交范围字符串
 * 
 * @param from - 起始提交
 * @param to - 结束提交
 * @returns 范围字符串
 * 
 * @example
 * ```ts
 * getCommitRange('v1.0.0', 'v1.1.0') // 'v1.0.0..v1.1.0'
 * getCommitRange(undefined, 'HEAD') // 'HEAD'
 * ```
 */
export function getCommitRange(from?: string, to = 'HEAD'): string {
  return from ? `${from}..${to}` : to
}

