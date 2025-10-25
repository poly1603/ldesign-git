export interface GitOptions {
  baseDir?: string
}

export interface RepositoryInfo {
  currentBranch: string
  modified: string[]
  created: string[]
  deleted: string[]
  renamed: Array<{ from: string; to: string }>
  staged: string[]
  ahead: number
  behind: number
}

export interface CommitInfo {
  hash: string
  message: string
  author: string
  date: string
  body?: string
  refs?: string
}

export interface CommitStats {
  total: number
  latest: CommitInfo | null
  authors: number
  commits: CommitInfo[]
}

// ==================== 分支管理 ====================

export interface BranchInfo {
  name: string
  current: boolean
  commit: string
  label?: string
  linkedWorkTree?: boolean
}

export interface BranchSummary {
  all: string[]
  branches: Record<string, BranchInfo>
  current: string
  detached: boolean
}

export interface BranchCompareResult {
  ahead: number
  behind: number
  commits: CommitInfo[]
}

export interface CheckoutOptions {
  createBranch?: boolean
  force?: boolean
  track?: string
}

// ==================== 标签管理 ====================

export interface TagInfo {
  name: string
  commit: string
  date?: string
  message?: string
  type: 'lightweight' | 'annotated'
}

export interface CreateTagOptions {
  annotated?: boolean
  message?: string
  force?: boolean
}

// ==================== 暂存区管理 ====================

export interface StashInfo {
  index: number
  name: string
  message: string
  date: string
}

export interface StashOptions {
  includeUntracked?: boolean
  keepIndex?: boolean
  message?: string
}

// ==================== 合并与变基 ====================

export interface MergeOptions {
  noFastForward?: boolean
  fastForwardOnly?: boolean
  squash?: boolean
  message?: string
  strategy?: 'ours' | 'theirs' | 'recursive' | 'octopus' | 'resolve' | 'subtree'
}

export interface RebaseOptions {
  interactive?: boolean
  onto?: string
  preserveMerges?: boolean
  autosquash?: boolean
}

export interface CherryPickOptions {
  noCommit?: boolean
  mainline?: number
}

export interface ConflictInfo {
  file: string
  ours?: string
  theirs?: string
  ancestor?: string
  status: 'both-modified' | 'deleted-by-us' | 'deleted-by-them' | 'added-by-us' | 'added-by-them'
}

export interface MergeResult {
  success: boolean
  conflicts: ConflictInfo[]
  mergedFiles: string[]
  message?: string
}

// ==================== 工作流 ====================

export type WorkflowType = 'git-flow' | 'github-flow' | 'gitlab-flow' | 'custom'

export interface WorkflowConfig {
  type: WorkflowType
  branches: {
    main?: string
    develop?: string
    feature?: string
    release?: string
    hotfix?: string
  }
  prefixes?: {
    feature?: string
    release?: string
    hotfix?: string
    bugfix?: string
  }
  versionTag?: {
    prefix?: string
    enabled?: boolean
  }
}

export interface FeatureOptions {
  name: string
  baseBranch?: string
  push?: boolean
}

export interface ReleaseOptions {
  version: string
  baseBranch?: string
  tag?: boolean
  push?: boolean
}

export interface HotfixOptions {
  name: string
  version?: string
  baseBranch?: string
  tag?: boolean
  push?: boolean
}

// ==================== 智能提交 ====================

export type CommitType = 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'chore' | 'revert'

export interface SmartCommitOptions {
  type?: CommitType
  scope?: string
  subject?: string
  body?: string
  footer?: string
  breaking?: boolean
  issues?: string[]
  autoDetect?: boolean
}

export interface CommitSuggestion {
  type: CommitType
  scope?: string
  subject: string
  confidence: number
  reason: string
}

export interface FileChange {
  path: string
  type: 'added' | 'modified' | 'deleted' | 'renamed'
  insertions: number
  deletions: number
}

// ==================== Hooks ====================

export type HookType =
  | 'applypatch-msg'
  | 'pre-applypatch'
  | 'post-applypatch'
  | 'pre-commit'
  | 'pre-merge-commit'
  | 'prepare-commit-msg'
  | 'commit-msg'
  | 'post-commit'
  | 'pre-rebase'
  | 'post-checkout'
  | 'post-merge'
  | 'pre-push'
  | 'pre-receive'
  | 'update'
  | 'proc-receive'
  | 'post-receive'
  | 'post-update'
  | 'reference-transaction'
  | 'push-to-checkout'
  | 'pre-auto-gc'
  | 'post-rewrite'
  | 'sendemail-validate'
  | 'fsmonitor-watchman'
  | 'p4-changelist'
  | 'p4-prepare-changelist'
  | 'p4-post-changelist'
  | 'p4-pre-submit'
  | 'post-index-change'

export interface HookConfig {
  type: HookType
  script: string
  enabled: boolean
}

export interface HookTemplate {
  name: string
  description: string
  hooks: HookConfig[]
}

// ==================== 子模块 ====================

export interface SubmoduleInfo {
  name: string
  path: string
  url: string
  branch?: string
  commit: string
  status: 'initialized' | 'uninitialized' | 'modified' | 'up-to-date'
}

export interface SubmoduleOptions {
  branch?: string
  force?: boolean
  recursive?: boolean
  depth?: number
}

// ==================== 统计分析 ====================

export interface CommitAnalytics {
  totalCommits: number
  commitsByAuthor: Record<string, number>
  commitsByType: Record<CommitType | 'other', number>
  commitsByDate: Record<string, number>
  commitsByHour: Record<number, number>
  commitsByDayOfWeek: Record<string, number>
  avgCommitsPerDay: number
  avgCommitsPerAuthor: number
  topContributors: Array<{ author: string; commits: number; percentage: number }>
  recentActivity: Array<{ date: string; commits: number }>
  commitMessages: {
    avgLength: number
    withBody: number
    withoutBody: number
  }
}

export interface FileAnalytics {
  path: string
  changeCount: number
  authors: string[]
  lastModified: string
  insertions: number
  deletions: number
  churnRate: number
}

export interface RepositoryMetrics {
  totalFiles: number
  totalLines: number
  languageDistribution: Record<string, number>
  filesByType: Record<string, number>
  largestFiles: Array<{ path: string; lines: number }>
  mostChangedFiles: FileAnalytics[]
  codeChurn: {
    total: number
    byPeriod: Record<string, number>
  }
  branchMetrics: {
    total: number
    active: number
    stale: number
    avgLifetime: number
  }
  contributors: {
    total: number
    active: number
    coreContributors: string[]
  }
}

export interface BranchAnalytics {
  name: string
  createdDate: string
  lastCommitDate: string
  lifetime: number
  commits: number
  authors: string[]
  isStale: boolean
  mergedInto?: string
}

// ==================== 报告 ====================

export type ReportFormat = 'markdown' | 'json' | 'csv' | 'html'

export interface ReportOptions {
  format?: ReportFormat
  output?: string
  includeCharts?: boolean
  period?: {
    from?: string
    to?: string
  }
  authors?: string[]
  branches?: string[]
}

export interface Report {
  title: string
  generated: string
  period?: {
    from: string
    to: string
  }
  summary: {
    commits: number
    contributors: number
    branches: number
    tags: number
    files: number
  }
  commits?: CommitAnalytics
  repository?: RepositoryMetrics
  branches?: BranchAnalytics[]
  charts?: any[]
}

// ==================== 代码审查 ====================

export interface ReviewData {
  title: string
  description: string
  changes: {
    files: number
    insertions: number
    deletions: number
  }
  commits: CommitInfo[]
  fileChanges: FileChange[]
  impact: {
    level: 'low' | 'medium' | 'high' | 'critical'
    reason: string
    affectedAreas: string[]
  }
  suggestions: string[]
}

export interface DiffOptions {
  staged?: boolean
  cached?: boolean
  nameOnly?: boolean
  stat?: boolean
  unified?: number
}

// ==================== 批量操作 ====================

export interface BatchOperationResult<T = any> {
  success: boolean
  item: string
  result?: T
  error?: string
}

export interface BatchOperationSummary<T = any> {
  total: number
  succeeded: number
  failed: number
  results: BatchOperationResult<T>[]
}

// ==================== 配置 ====================

export interface UserConfig {
  workflow?: WorkflowConfig
  commitTemplate?: {
    types?: CommitType[]
    scopes?: string[]
    maxSubjectLength?: number
    maxBodyLength?: number
  }
  hooks?: HookConfig[]
  aliases?: Record<string, string>
  preferences?: {
    autoStash?: boolean
    autoFetch?: boolean
    defaultBranch?: string
    pullRebase?: boolean
  }
}

// ==================== 验证 ====================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface BranchNameValidation extends ValidationResult {
  suggestion?: string
}

export interface CommitMessageValidation extends ValidationResult {
  parsed?: {
    type?: CommitType
    scope?: string
    subject?: string
    body?: string
    footer?: string
    breaking?: boolean
  }
}

// ==================== 新增类型定义 ====================

/**
 * 远程仓库信息
 */
export interface RemoteInfo {
  /** 远程名称 */
  name: string
  /** 远程 URL */
  url: string
  /** 类型 */
  type: 'fetch' | 'push'
}

/**
 * 远程配置
 */
export interface RemoteConfig {
  /** 远程名称 */
  name: string
  /** Fetch URL */
  fetchUrl: string
  /** Push URL */
  pushUrl?: string
}

/**
 * Diff 选项（扩展）
 */
export interface ExtendedDiffOptions extends DiffOptions {
  /** 忽略空白符 */
  ignoreWhitespace?: boolean
  /** 单词级别的 diff */
  wordDiff?: boolean
  /** 颜色输出 */
  color?: boolean
  /** 上下文行数 */
  context?: number
}

/**
 * 文件 Diff 信息
 */
export interface FileDiff {
  /** 文件路径 */
  path: string
  /** 变更类型 */
  type: 'added' | 'modified' | 'deleted' | 'renamed'
  /** 旧路径（重命名时） */
  oldPath?: string
  /** 新增行数 */
  insertions: number
  /** 删除行数 */
  deletions: number
  /** Diff 内容 */
  diff?: string
  /** 是否是二进制文件 */
  binary?: boolean
}

/**
 * 提交 Diff 信息
 */
export interface CommitDiff {
  /** 起始提交 */
  from: string
  /** 结束提交 */
  to: string
  /** 文件变更列表 */
  files: FileDiff[]
  /** 总新增行数 */
  totalInsertions: number
  /** 总删除行数 */
  totalDeletions: number
}

/**
 * 分支 Diff 信息
 */
export interface BranchDiff extends CommitDiff {
  /** 源分支 */
  sourceBranch: string
  /** 目标分支 */
  targetBranch: string
  /** 提交列表 */
  commits: CommitInfo[]
}

/**
 * Diff 统计信息
 */
export interface DiffStats {
  /** 变更文件数 */
  filesChanged: number
  /** 新增行数 */
  insertions: number
  /** 删除行数 */
  deletions: number
  /** 文件统计 */
  files: Array<{
    path: string
    insertions: number
    deletions: number
  }>
}

/**
 * Worktree 信息
 */
export interface WorktreeInfo {
  /** 工作树路径 */
  path: string
  /** 关联的分支 */
  branch: string
  /** 提交哈希 */
  commit: string
  /** 是否是主工作树 */
  isPrimary: boolean
  /** 是否是裸仓库 */
  isBare: boolean
  /** 是否被锁定 */
  locked?: boolean
}

/**
 * Worktree 选项
 */
export interface WorktreeOptions {
  /** 是否强制 */
  force?: boolean
  /** 是否 detach */
  detach?: boolean
  /** 检出分支 */
  checkout?: string
}

/**
 * Changelog 选项
 */
export interface ChangelogOptions {
  /** 起始版本/标签 */
  from?: string
  /** 结束版本/标签 */
  to?: string
  /** 是否包含未发布的变更 */
  includeUnreleased?: boolean
  /** 输出文件路径 */
  outputFile?: string
  /** 模板 */
  template?: string
  /** 是否分组 */
  grouped?: boolean
}

/**
 * Changelog 数据
 */
export interface ChangelogData {
  /** 版本号 */
  version: string
  /** 发布日期 */
  date: string
  /** 变更列表 */
  changes: {
    /** 新功能 */
    features: string[]
    /** Bug 修复 */
    fixes: string[]
    /** 重大变更 */
    breaking: string[]
    /** 其他变更 */
    others: string[]
  }
  /** 提交列表 */
  commits?: CommitInfo[]
}

/**
 * Config 作用域
 */
export type ConfigScope = 'local' | 'global' | 'system'

/**
 * Git 配置项
 */
export interface GitConfigItem {
  /** 配置键 */
  key: string
  /** 配置值 */
  value: string
  /** 作用域 */
  scope: ConfigScope
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户名 */
  name: string
  /** 邮箱 */
  email: string
}

/**
 * Reflog 条目
 */
export interface ReflogEntry {
  /** 索引 */
  index: number
  /** 提交哈希 */
  hash: string
  /** 操作类型 */
  operation: string
  /** 消息 */
  message: string
  /** 日期 */
  date: string
}

/**
 * Bisect 状态
 */
export interface BisectStatus {
  /** 是否正在进行 bisect */
  isBisecting: boolean
  /** 当前提交 */
  current?: string
  /** 好的提交 */
  good?: string[]
  /** 坏的提交 */
  bad?: string
  /** 剩余步骤 */
  remaining?: number
}

/**
 * 状态结果（完整类型）
 */
export interface StatusResult {
  /** 当前分支 */
  current: string
  /** 跟踪的远程分支 */
  tracking: string | null
  /** 修改的文件 */
  modified: string[]
  /** 新增的文件 */
  created: string[]
  /** 删除的文件 */
  deleted: string[]
  /** 重命名的文件 */
  renamed: Array<{ from: string; to: string }>
  /** 暂存的文件 */
  staged: string[]
  /** 冲突的文件 */
  conflicted: string[]
  /** 未跟踪的文件 */
  not_added: string[]
  /** 领先远程的提交数 */
  ahead: number
  /** 落后远程的提交数 */
  behind: number
  /** 是否干净 */
  isClean: boolean
}

/**
 * 批量操作进度回调
 */
export interface BatchOperationProgress {
  /** 总数 */
  total: number
  /** 已完成 */
  completed: number
  /** 成功数 */
  succeeded: number
  /** 失败数 */
  failed: number
  /** 当前项 */
  current: string
}

/**
 * 批量操作配置
 */
export interface BatchOperationConfig {
  /** 是否并发执行 */
  concurrent?: boolean
  /** 并发数量 */
  concurrency?: number
  /** 进度回调 */
  onProgress?: (progress: BatchOperationProgress) => void
  /** 失败时是否继续 */
  continueOnError?: boolean
}


