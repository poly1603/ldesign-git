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


