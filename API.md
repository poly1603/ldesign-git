# @ldesign/git API 参考文档

本文档提供 @ldesign/git 的完整 API 参考。

## 目录

- [核心管理器](#核心管理器)
- [自动化工具](#自动化工具)
- [分析工具](#分析工具)
- [错误处理](#错误处理)
- [日志系统](#日志系统)
- [缓存系统](#缓存系统)
- [工具函数](#工具函数)

---

## 核心管理器

### GitManager

基础 Git 操作管理器。

```typescript
class GitManager {
  constructor(options?: GitOptions)
  
  // 基础操作
  init(): Promise<void>
  addRemote(name: string, url: string): Promise<void>
  getCurrentBranch(): Promise<string>
  status(): Promise<StatusResult>
  add(files: string | string[]): Promise<void>
  commit(message: string): Promise<void>
  push(remote?: string, branch?: string): Promise<void>
  pull(remote?: string, branch?: string): Promise<void>
  clone(repoUrl: string, localPath: string): Promise<void>
  log(options?: { maxCount?: number }): Promise<any>
  
  // 工具方法
  isRepository(): Promise<boolean>
  getRepositoryRoot(): Promise<string>
}
```

### BranchManager

分支管理器。

```typescript
class BranchManager {
  constructor(options?: GitOptions)
  
  // 分支操作
  listBranches(): Promise<BranchSummary>
  getCurrentBranch(): Promise<string>
  createBranch(name: string, startPoint?: string): Promise<void>
  checkoutBranch(name: string, options?: CheckoutOptions): Promise<void>
  deleteBranch(name: string, force?: boolean): Promise<void>
  deleteRemoteBranch(remote: string, name: string): Promise<void>
  renameBranch(oldName: string, newName: string, force?: boolean): Promise<void>
  renameCurrentBranch(newName: string, force?: boolean): Promise<void>
  
  // 查询方法
  branchExists(name: string): Promise<boolean>
  listRemoteBranches(): Promise<string[]>
  listAllBranches(): Promise<string[]>
  
  // 分支比较
  compareBranches(branch1: string, branch2: string): Promise<BranchCompareResult>
  isMerged(sourceBranch: string, targetBranch?: string): Promise<boolean>
  getMergedBranches(targetBranch?: string): Promise<string[]>
  getUnmergedBranches(targetBranch?: string): Promise<string[]>
  
  // 远程跟踪
  trackRemoteBranch(localBranch: string, remoteBranch: string): Promise<void>
  untrackRemoteBranch(branchName: string): Promise<void>
  pushBranch(name: string, remote?: string, setUpstream?: boolean): Promise<void>
  pruneRemoteBranches(remote?: string): Promise<void>
}
```

### StashManager ✨

Stash 管理器（新增）。

```typescript
class StashManager {
  constructor(options?: GitOptions)
  
  // Stash 操作
  save(options?: StashOptions): Promise<void>
  push(options?: StashOptions): Promise<void>
  list(): Promise<StashInfo[]>
  apply(index?: number): Promise<void>
  pop(index?: number): Promise<void>
  drop(index: number): Promise<void>
  clear(): Promise<void>
  show(index?: number): Promise<string>
  branch(branchName: string, index?: number): Promise<void>
  
  // 查询方法
  hasStashes(): Promise<boolean>
  count(): Promise<number>
  getLatest(): Promise<StashInfo | null>
  applyKeepIndex(index?: number): Promise<void>
}
```

### RemoteManager ✨

远程仓库管理器（新增）。

```typescript
class RemoteManager {
  constructor(options?: GitOptions)
  
  // Remote 操作
  add(name: string, url: string): Promise<void>
  remove(name: string): Promise<void>
  rename(oldName: string, newName: string): Promise<void>
  list(): Promise<RemoteInfo[]>
  getUrl(name: string, type?: 'fetch' | 'push'): Promise<string>
  setUrl(name: string, url: string, type?: 'fetch' | 'push'): Promise<void>
  addPushUrl(name: string, url: string): Promise<void>
  prune(name?: string): Promise<void>
  show(name: string): Promise<string>
  
  // 查询方法
  exists(name: string): Promise<boolean>
  getDefault(): Promise<string | null>
  
  // 网络操作
  fetch(name?: string, options?: { prune?: boolean; tags?: boolean }): Promise<void>
  fetchAll(options?: { prune?: boolean; tags?: boolean }): Promise<void>
  update(name?: string): Promise<void>
  validateUrl(url: string): Promise<boolean>
}
```

### DiffManager ✨

差异比较管理器（新增）。

```typescript
class DiffManager {
  constructor(options?: GitOptions)
  
  // Diff 操作
  diffCommits(from: string, to: string, options?: ExtendedDiffOptions): Promise<CommitDiff>
  diffBranches(source: string, target: string, options?: ExtendedDiffOptions): Promise<BranchDiff>
  diffWorkingDirectory(options?: ExtendedDiffOptions): Promise<FileDiff[]>
  diffStaged(options?: ExtendedDiffOptions): Promise<FileDiff[]>
  diffWithCommit(commitHash: string, options?: ExtendedDiffOptions): Promise<CommitDiff>
  
  // 文件 Diff
  showFileDiff(filePath: string, options?: ExtendedDiffOptions): Promise<string>
  showFileDiffBetweenCommits(filePath: string, from: string, to: string, options?: ExtendedDiffOptions): Promise<string>
  
  // 统计
  getDiffStats(from?: string, to?: string): Promise<DiffStats>
  getCommitStats(commitHash: string): Promise<DiffStats>
  
  // 查询
  hasDifferences(from: string, to: string): Promise<boolean>
  getFileHistory(filePath: string, maxCount?: number): Promise<CommitInfo[]>
}
```

### GitConfigManager ✨

Git 配置管理器（新增）。

```typescript
class GitConfigManager {
  constructor(options?: GitOptions)
  
  // 配置操作
  get(key: string, scope?: ConfigScope): Promise<string>
  set(key: string, value: string, scope?: ConfigScope): Promise<void>
  unset(key: string, scope?: ConfigScope): Promise<void>
  list(scope?: ConfigScope): Promise<Record<string, string>>
  listAll(): Promise<GitConfigItem[]>
  add(key: string, value: string, scope?: ConfigScope): Promise<void>
  getAll(key: string, scope?: ConfigScope): Promise<string[]>
  
  // 用户信息
  getUserInfo(scope?: ConfigScope): Promise<UserInfo>
  setUserInfo(name: string, email: string, scope?: ConfigScope): Promise<void>
  
  // 高级操作
  getConfigPath(scope: ConfigScope): Promise<string>
  has(key: string, scope?: ConfigScope): Promise<boolean>
  renameSection(oldName: string, newName: string, scope?: ConfigScope): Promise<void>
  removeSection(sectionName: string, scope?: ConfigScope): Promise<void>
}
```

### WorktreeManager ✨

工作树管理器（新增）。

```typescript
class WorktreeManager {
  constructor(options?: GitOptions)
  
  // Worktree 操作
  add(path: string, branch?: string, options?: WorktreeOptions): Promise<void>
  list(): Promise<WorktreeInfo[]>
  remove(path: string, force?: boolean): Promise<void>
  prune(): Promise<void>
  move(oldPath: string, newPath: string): Promise<void>
  lock(path: string, reason?: string): Promise<void>
  unlock(path: string): Promise<void>
  repair(path: string): Promise<void>
  
  // 查询方法
  exists(path: string): Promise<boolean>
  getMain(): Promise<WorktreeInfo | null>
  getByBranch(branch: string): Promise<WorktreeInfo | null>
}
```

### TagManager

标签管理器。

```typescript
class TagManager {
  constructor(options?: GitOptions)
  
  // 标签操作
  createLightweightTag(name: string, ref?: string): Promise<void>
  createAnnotatedTag(name: string, message: string, ref?: string): Promise<void>
  createTag(name: string, options?: CreateTagOptions): Promise<void>
  deleteTag(name: string): Promise<void>
  deleteTags(names: string[]): Promise<void>
  deleteRemoteTag(name: string, remote?: string): Promise<void>
  
  // 查询方法
  listTags(): Promise<string[]>
  listTagsWithPattern(pattern: string): Promise<string[]>
  listTagsSorted(): Promise<string[]>
  getTagInfo(name: string): Promise<TagInfo | null>
  getAllTagsInfo(): Promise<TagInfo[]>
  tagExists(name: string): Promise<boolean>
  getTagsForCommit(commitHash: string): Promise<string[]>
  getLatestTag(): Promise<string | null>
  
  // 推送操作
  pushTag(name: string, remote?: string): Promise<void>
  pushAllTags(remote?: string): Promise<void>
  checkoutTag(name: string): Promise<void>
}
```

### MergeManager

合并管理器。

```typescript
class MergeManager {
  constructor(options?: GitOptions)
  
  // 合并操作
  merge(branchName: string, options?: MergeOptions): Promise<MergeResult>
  abortMerge(): Promise<void>
  continueMerge(): Promise<void>
  fastForward(branch: string): Promise<void>
  squashMerge(branch: string, message?: string): Promise<void>
  
  // 变基操作
  rebase(branch: string, options?: RebaseOptions): Promise<void>
  abortRebase(): Promise<void>
  continueRebase(): Promise<void>
  skipRebase(): Promise<void>
  
  // Cherry-pick
  cherryPick(commitHash: string, options?: CherryPickOptions): Promise<void>
  abortCherryPick(): Promise<void>
  continueCherryPick(): Promise<void>
  
  // 冲突处理
  getConflicts(): Promise<ConflictInfo[]>
  hasConflicts(): Promise<boolean>
  getConflictContent(filePath: string): Promise<string>
  resolveWithOurs(filePath: string): Promise<void>
  resolveWithTheirs(filePath: string): Promise<void>
  
  // 状态查询
  isMerging(): Promise<boolean>
  isRebasing(): Promise<boolean>
  isCherryPicking(): Promise<boolean>
}
```

---

## 自动化工具

### SmartCommit

智能提交系统。

```typescript
class SmartCommit {
  constructor(options?: GitOptions)
  
  analyzeChanges(): Promise<CommitSuggestion[]>
  getFileChanges(): Promise<FileChange[]>
  generateCommitMessage(options: SmartCommitOptions): string
  smartCommit(options?: SmartCommitOptions): Promise<string>
  validateCommitMessage(message: string): { valid: boolean; errors: string[] }
  parseCommitMessage(message: string): ParsedCommit
}
```

### WorkflowAutomation

工作流自动化。

```typescript
class WorkflowAutomation {
  constructor(config: WorkflowConfig, options?: GitOptions)
  
  static getDefaultConfig(type: WorkflowType): WorkflowConfig
  
  // Git Flow
  initGitFlow(): Promise<void>
  startFeature(options: FeatureOptions): Promise<string>
  finishFeature(name: string, deleteBranch?: boolean): Promise<void>
  startRelease(options: ReleaseOptions): Promise<string>
  finishRelease(version: string, deleteBranch?: boolean): Promise<void>
  startHotfix(options: HotfixOptions): Promise<string>
  finishHotfix(name: string, version?: string, deleteBranch?: boolean): Promise<void>
  
  // GitHub Flow
  createFeatureBranch(name: string, push?: boolean): Promise<string>
  mergeToMain(featureBranch: string, deleteBranch?: boolean): Promise<void>
  
  // 配置
  getWorkflowType(): WorkflowType
  getConfig(): WorkflowConfig
  updateConfig(config: Partial<WorkflowConfig>): void
}
```

### BatchOperations

批量操作。

```typescript
class BatchOperations {
  constructor(options?: GitOptions)
  
  // 分支批量操作
  createBranches(names: string[], startPoint?: string, config?: BatchOperationConfig): Promise<BatchOperationSummary>
  deleteBranches(names: string[], force?: boolean): Promise<BatchOperationSummary>
  deleteRemoteBranches(names: string[], remote?: string): Promise<BatchOperationSummary>
  pushBranches(names: string[], remote?: string, setUpstream?: boolean): Promise<BatchOperationSummary>
  mergeBranches(names: string[], targetBranch?: string): Promise<BatchOperationSummary>
  
  // 标签批量操作
  createTags(tags: TagConfig[]): Promise<BatchOperationSummary>
  deleteTags(names: string[]): Promise<BatchOperationSummary>
  pushTags(names: string[], remote?: string): Promise<BatchOperationSummary>
  deleteRemoteTags(names: string[], remote?: string): Promise<BatchOperationSummary>
  
  // 清理操作
  cleanupMergedBranches(targetBranch?: string, exclude?: string[]): Promise<BatchOperationSummary>
  cleanupStaleBranches(remote?: string): Promise<void>
}
```

### ChangelogGenerator ✨

变更日志生成器（新增）。

```typescript
class ChangelogGenerator {
  constructor(options?: GitOptions)
  
  generate(options?: ChangelogOptions): Promise<string>
  generateForVersion(version: string): Promise<string>
  update(version: string, changes?: string): Promise<void>
  parse(file?: string): Promise<ChangelogData[]>
}
```

---

## 分析工具

### CommitAnalyzer

提交分析器。

```typescript
class CommitAnalyzer {
  constructor(options?: GitOptions)
  
  analyzeCommits(maxCount?: number): Promise<CommitStats>
  analyzeCommitsDetailed(maxCount?: number): Promise<CommitAnalytics>
  analyzeByAuthor(author: string, maxCount?: number): Promise<CommitStats>
  analyzeByTimeRange(from: Date, to: Date): Promise<CommitStats>
  getCommitTypeDistribution(maxCount?: number): Promise<Record<CommitType | 'other', number>>
  getTopContributors(limit?: number): Promise<TopContributor[]>
}
```

### RepositoryAnalyzer

仓库分析器。

```typescript
class RepositoryAnalyzer {
  constructor(options?: GitOptions)
  
  analyzeRepository(): Promise<RepositoryMetrics>
  analyzeBranch(branchName: string): Promise<BranchAnalytics>
  analyzeAllBranches(): Promise<BranchAnalytics[]>
  getRepositoryAge(): Promise<number>
}
```

---

## 错误处理

### 错误类

```typescript
// 基类
class GitError extends Error {
  code: string
  originalError?: Error
  context?: Record<string, any>
  
  toJSON(): Record<string, any>
}

// 派生类
class GitOperationError extends GitError {
  operation: string
}

class GitConflictError extends GitError {
  conflictedFiles: string[]
  conflictType: 'merge' | 'rebase' | 'cherry-pick'
}

class GitValidationError extends GitError {
  field: string
  errors: string[]
}

class GitNetworkError extends GitError {
  remote: string
  operation: 'push' | 'pull' | 'fetch' | 'clone'
}

class GitConfigError extends GitError {
  key?: string
}

class GitRepositoryNotFoundError extends GitError {
  path: string
}

class GitBranchError extends GitError {
  branch: string
  operation: string
}

class GitCommitError extends GitError {}
```

### 类型守卫

```typescript
function isGitError(error: unknown): error is GitError
function isGitOperationError(error: unknown): error is GitOperationError
function isGitConflictError(error: unknown): error is GitConflictError
function isGitValidationError(error: unknown): error is GitValidationError
function isGitNetworkError(error: unknown): error is GitNetworkError
function isGitConfigError(error: unknown): error is GitConfigError
function isGitRepositoryNotFoundError(error: unknown): error is GitRepositoryNotFoundError
function isGitBranchError(error: unknown): error is GitBranchError
function isGitCommitError(error: unknown): error is GitCommitError
```

### 错误工具

```typescript
function toGitError(error: unknown, defaultMessage?: string): GitError
function wrapGitOperation<T>(fn: T, errorMessage?: string): T
```

---

## 日志系统

### GitLogger ✨

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

class GitLogger {
  constructor(config?: LoggerConfig)
  
  // 日志记录
  debug(message: string, data?: any): void
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: Error | any): void
  
  // 配置
  setLevel(level: LogLevel): void
  getLevel(): LogLevel
  enable(): void
  disable(): void
  isEnabled(): boolean
  
  // 日志管理
  getLogs(): ReadonlyArray<LogEntry>
  clearLogs(): void
  getLogsByLevel(level: LogLevel): LogEntry[]
  exportLogsAsJSON(): string
  
  // 子日志器
  createChild(prefix: string): GitLogger
}

function createLogger(config?: LoggerConfig): GitLogger
```

---

## 缓存系统

### LRUCache ✨

```typescript
class LRUCache<K, V> {
  constructor(config?: LRUCacheConfig)
  
  // 基础操作
  get(key: K): V | undefined
  set(key: K, value: V, ttl?: number): void
  has(key: K): boolean
  delete(key: K): boolean
  clear(): void
  
  // 批量操作
  keys(): IterableIterator<K>
  values(): V[]
  entries(): Array<[K, V]>
  
  // 维护
  cleanup(): number
  
  // 统计
  getStats(): CacheStats
  resetStats(): void
  
  // 便捷方法
  getOrSet(key: K, factory: () => Promise<V>, ttl?: number): Promise<V>
  getOrSetSync(key: K, factory: () => V, ttl?: number): V
  
  // 属性
  get size(): number
}

function createLRUCache<K, V>(config?: LRUCacheConfig): LRUCache<K, V>
```

---

## GitContext ✨

依赖注入容器。

```typescript
class GitContext {
  constructor(config?: GitContextConfig)
  
  // 获取实例
  getGit(): SimpleGit
  getLogger(): GitLogger
  getCache<T>(): LRUCache<string, T>
  
  // 配置
  getBaseDir(): string
  getConfig(): Readonly<GitContextConfig>
  
  // 子上下文
  createChild(config?: Partial<GitContextConfig>): GitContext
  
  // 资源管理
  cleanup(): void
  reset(): void
  
  // 状态查询
  isCacheEnabled(): boolean
  isLoggingEnabled(): boolean
  getCacheStats(): CacheStats | null
  getLogs(): ReadonlyArray<LogEntry>
  
  // 配置更新
  setLogLevel(level: LogLevel): void
}

const defaultContext: GitContext
function createContext(config?: GitContextConfig): GitContext
```

---

## 工具函数

### 验证工具

```typescript
function validateBranchName(branchName: string): BranchNameValidation
function validateCommitMessage(message: string): CommitMessageValidation
function validateTagName(tagName: string): ValidationResult
function validateRemoteUrl(url: string): UrlValidation
function validateCommitHash(hash: string): ValidationResult
```

### 辅助工具 ✨

```typescript
// 版本工具
function parseSemver(version: string): SemverInfo | null
function compareSemver(version1: string, version2: string): number
function incrementSemver(version: string, type: 'major' | 'minor' | 'patch'): string

// 格式化工具
function shortenHash(hash: string, length?: number): string
function formatFileSize(bytes: number): string
function formatRelativeTime(date: Date | string): string

// 解析工具
function parseConventionalCommit(message: string): ParsedCommit
function extractIssueNumbers(message: string): string[]
function extractRepoInfo(url: string): RepoInfo | null

// 分支工具
function cleanBranchName(branchName: string): string
function isValidBranchName(name: string): boolean
function getBranchType(branchName: string): string | null
function suggestBranchName(input: string, prefix?: string): string

// 其他工具
function normalizeRemoteUrl(url: string): string
function filePathToModuleName(filePath: string): string
function detectCommitType(files: string[]): CommitType
function calculateChangePercentage(insertions: number, deletions: number): string
function getCommitRange(from?: string, to?: string): string
function isValidCommitHash(hash: string): boolean
function formatConventionalCommit(type, scope, subject, body?, footer?, breaking?): string
```

---

## 类型定义

完整的类型定义请参考 `src/types/index.ts`。

主要类型包括：

- `GitOptions` - Git 操作选项
- `BranchInfo`, `BranchSummary`, `BranchCompareResult`
- `TagInfo`, `CreateTagOptions`
- `StashInfo`, `StashOptions`
- `RemoteInfo`, `RemoteConfig`
- `FileDiff`, `CommitDiff`, `BranchDiff`, `DiffStats`
- `WorktreeInfo`, `WorktreeOptions`
- `ChangelogOptions`, `ChangelogData`
- `CommitInfo`, `CommitStats`, `CommitAnalytics`
- `MergeOptions`, `MergeResult`, `ConflictInfo`
- `ValidationResult`, `BranchNameValidation`, `CommitMessageValidation`
- 等等...

---

## 使用建议

### 基础使用

```typescript
import { GitManager, BranchManager } from '@ldesign/git'

const git = new GitManager()
const branchManager = new BranchManager()

await git.add('.')
await git.commit('feat: new feature')
await git.push()
```

### 使用 GitContext

```typescript
import { GitContext, BranchManager, LogLevel } from '@ldesign/git'

const context = new GitContext({
  baseDir: './project',
  logLevel: LogLevel.INFO,
  enableCache: true
})

const branchManager = new BranchManager(context.getConfig())
const logger = context.getLogger()

logger.info('开始操作')
await branchManager.createBranch('feature/new')
logger.info('操作完成')
```

### 错误处理

```typescript
import { isGitBranchError, isGitConflictError } from '@ldesign/git'

try {
  await operation()
} catch (error) {
  if (isGitBranchError(error)) {
    console.error(`分支 ${error.branch} 操作失败`)
  } else if (isGitConflictError(error)) {
    console.error(`检测到 ${error.conflictedFiles.length} 个冲突`)
  }
}
```

---

**版本**: v0.3.0  
**最后更新**: 2025-10-25  
**维护者**: LDesign Team

