export { GitManager } from './git-manager'
export { RepositoryManager } from './repository-manager'
export { CommitAnalyzer } from './commit-analyzer'
export { BranchManager } from './branch-manager'
export { TagManager } from './tag-manager'
export { StashManager } from './stash-manager'
export { MergeManager } from './merge-manager'
export { RemoteManager } from './remote-manager'
export { DiffManager } from './diff-manager'
export { GitConfigManager } from './config-manager'
export { WorktreeManager } from './worktree-manager'
export { GitContext, createContext, defaultContext } from './git-context'
export { PerformanceMonitor, createPerformanceMonitor } from './performance-monitor'
export { LFSManager } from './lfs-manager'
export { MonorepoManager } from './monorepo-manager'

// 新增管理器
export { DoctorManager } from './doctor-manager'
export type { HealthCheckResult, DiagnosticReport } from './doctor-manager'

export { UndoManager } from './undo-manager'
export type { UndoActionType, UndoSuggestion, StateAnalysis } from './undo-manager'

export { AliasManager } from './alias-manager'
export type { GitAlias, AliasTemplate } from './alias-manager'

export { CherryPickManager } from './cherry-pick-manager'
export type { CherryPickStatus, CherryPickResult } from './cherry-pick-manager'

export { ArchiveManager } from './archive-manager'
export type { ArchiveFormat, ArchiveOptions, ArchiveInfo } from './archive-manager'

export { PatchManager } from './patch-manager'
export type { PatchInfo, ApplyResult } from './patch-manager'

export { BackupManager } from './backup-manager'
export type { BackupInfo, RestoreResult } from './backup-manager'

export { ScanManager } from './scan-manager'
export type { SecretFinding, LargeFileInfo, ScanResult } from './scan-manager'

export { CredentialManager } from './credential-manager'
export type { CredentialInfo, CredentialHelper } from './credential-manager'

export { CompletionManager } from './completion-manager'

export { CleanupManager } from './cleanup-manager'
export type { CleanupResult, BranchCleanupOptions } from './cleanup-manager'


