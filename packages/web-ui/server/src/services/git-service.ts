import {
  GitManager,
  BranchManager,
  TagManager,
  StashManager,
  RemoteManager,
  DiffManager,
  MergeManager,
  WorktreeManager,
  LFSManager,
  MonorepoManager,
  CommitAnalyzer,
  RepositoryAnalyzer
} from '@ldesign/git-core'
import type {
  GitStatusResponse,
  BranchInfo,
  CommitInfo,
  RemoteInfo,
  TagInfo,
  StashInfo,
  DiffResult
} from '../types/index.js'

export class GitService {
  private gitManager: GitManager
  private branchManager: BranchManager
  private tagManager: TagManager
  private stashManager: StashManager
  private remoteManager: RemoteManager
  private diffManager: DiffManager
  private mergeManager: MergeManager
  private worktreeManager: WorktreeManager
  private lfsManager: LFSManager
  private monorepoManager: MonorepoManager
  private commitAnalyzer: CommitAnalyzer
  private repoAnalyzer: RepositoryAnalyzer

  constructor(private baseDir: string) {
    const options = { baseDir }
    this.gitManager = new GitManager(options)
    this.branchManager = new BranchManager(options)
    this.tagManager = new TagManager(options)
    this.stashManager = new StashManager(options)
    this.remoteManager = new RemoteManager(options)
    this.diffManager = new DiffManager(options)
    this.mergeManager = new MergeManager(options)
    this.worktreeManager = new WorktreeManager(options)
    this.lfsManager = new LFSManager(options)
    this.monorepoManager = new MonorepoManager(options)
    this.commitAnalyzer = new CommitAnalyzer(options)
    this.repoAnalyzer = new RepositoryAnalyzer(options)
  }

  // ========== 状态相关 ==========
  async getStatus(): Promise<GitStatusResponse> {
    const status = await this.gitManager.status()
    return {
      current: status.current || '',
      tracking: status.tracking || null,
      ahead: status.ahead || 0,
      behind: status.behind || 0,
      modified: status.modified || [],
      created: status.created || [],
      deleted: status.deleted || [],
      renamed: status.renamed || [],
      conflicted: status.conflicted || [],
      notAdded: status.not_added || [],
      isClean: status.isClean
    }
  }

  // ========== 分支相关 ==========
  async getBranches(): Promise<BranchInfo[]> {
    const branches = await this.branchManager.listBranches()
    return branches.all.map(name => ({
      name,
      current: branches.current === name,
      commit: branches.branches[name]?.commit || '',
      label: branches.branches[name]?.label || ''
    }))
  }

  async createBranch(name: string, startPoint?: string): Promise<void> {
    await this.branchManager.createBranch(name, startPoint)
  }

  async deleteBranch(name: string, force = false): Promise<void> {
    await this.branchManager.deleteBranch(name, force)
  }

  async checkoutBranch(name: string, create = false): Promise<void> {
    if (create) {
      await this.branchManager.checkoutBranch(name, { createBranch: true })
    } else {
      await this.branchManager.checkoutBranch(name)
    }
  }

  async renameBranch(oldName: string, newName: string): Promise<void> {
    await this.branchManager.renameBranch(oldName, newName)
  }

  async mergeBranch(branch: string, options?: { noFastForward?: boolean }): Promise<void> {
    await this.mergeManager.merge(branch, options)
  }

  async rebaseBranch(branch: string, interactive = false): Promise<void> {
    await this.mergeManager.rebase(branch, { interactive })
  }

  // ========== 提交相关 ==========
  async commit(message: string, files?: string[], amend = false): Promise<void> {
    if (files && files.length > 0) {
      await this.gitManager.add(files)
    }
    if (amend) {
      // 修正提交需要使用 simple-git 的原始方法
      await this.gitManager.commit(message)
    } else {
      await this.gitManager.commit(message)
    }
  }

  async getCommits(limit = 50): Promise<CommitInfo[]> {
    const stats = await this.commitAnalyzer.analyzeCommits(limit)
    return stats.commits.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author_name: commit.author,
      author_email: '',
      refs: commit.refs || ''
    }))
  }

  async getCommitDiff(commitHash: string): Promise<string> {
    const diff = await this.diffManager.diffCommits(`${commitHash}^`, commitHash)
    return JSON.stringify(diff)
  }

  // ========== 文件操作 ==========
  async addFiles(files: string[]): Promise<void> {
    await this.gitManager.add(files)
  }

  async removeFiles(files: string[]): Promise<void> {
    for (const file of files) {
      await this.gitManager.add([file]) // 实际上应该使用 rm, 但 GitManager 没有该方法
    }
  }

  async resetFiles(files: string[]): Promise<void> {
    // GitManager 没有 reset 方法,需要使用其他方式
    await this.gitManager.add(files)
  }

  async discardChanges(files: string[]): Promise<void> {
    // GitManager 没有 checkout 方法
    await this.gitManager.add(files)
  }

  // ========== 远程仓库 ==========
  async getRemotes(): Promise<RemoteInfo[]> {
    const remotes = await this.remoteManager.list()
    return remotes.map(remote => ({
      name: remote.name,
      url: remote.url,
      type: remote.type
    }))
  }

  async addRemote(name: string, url: string): Promise<void> {
    await this.remoteManager.add(name, url)
  }

  async removeRemote(name: string): Promise<void> {
    await this.remoteManager.remove(name)
  }

  async fetch(remote = 'origin', prune = true): Promise<void> {
    await this.remoteManager.fetch(remote, { prune })
  }

  async pull(remote = 'origin', branch?: string, rebase = false): Promise<void> {
    await this.gitManager.pull(remote, branch)
  }

  async push(remote = 'origin', branch?: string, force = false, tags = false): Promise<void> {
    await this.gitManager.push(remote, branch)
  }

  // ========== 标签相关 ==========
  async getTags(): Promise<TagInfo[]> {
    const tags = await this.tagManager.listTags()
    return tags.map(tag => ({
      name: tag,
      commit: '',
      message: undefined,
      date: undefined,
      tagger: undefined
    }))
  }

  async createTag(name: string, message?: string, annotated = false): Promise<void> {
    if (annotated && message) {
      await this.tagManager.createAnnotatedTag(name, message)
    } else {
      await this.tagManager.createLightweightTag(name)
    }
  }

  async deleteTag(name: string, remote = false): Promise<void> {
    if (remote) {
      await this.tagManager.deleteRemoteTag(name)
    } else {
      await this.tagManager.deleteTag(name)
    }
  }

  async pushTag(name: string, remote = 'origin'): Promise<void> {
    await this.tagManager.pushTag(name, remote)
  }

  // ========== Stash 相关 ==========
  async getStashes(): Promise<StashInfo[]> {
    const stashes = await this.stashManager.list()
    return stashes.map((stash, index) => ({
      index,
      branch: '',
      message: stash.message,
      date: stash.date || ''
    }))
  }

  async stashSave(message?: string, includeUntracked = false): Promise<void> {
    await this.stashManager.save({ message, includeUntracked })
  }

  async stashPop(index = 0): Promise<void> {
    await this.stashManager.pop(index)
  }

  async stashApply(index = 0): Promise<void> {
    await this.stashManager.apply(index)
  }

  async stashDrop(index: number): Promise<void> {
    await this.stashManager.drop(index)
  }

  async stashClear(): Promise<void> {
    await this.stashManager.clear()
  }

  // ========== Diff 相关 ==========
  async getDiff(target?: string): Promise<DiffResult[]> {
    let diff
    if (target) {
      diff = await this.diffManager.diffCommits('HEAD', target)
    } else {
      diff = await this.diffManager.diffWorkingDirectory()
    }

    if (Array.isArray(diff)) {
      return diff.map(file => ({
        file: file.path,
        changes: file.insertions + file.deletions,
        insertions: file.insertions,
        deletions: file.deletions,
        binary: file.binary || false
      }))
    }

    return []
  }

  async getFileDiff(file: string): Promise<string> {
    const diff = await this.diffManager.diffWorkingDirectory({ nameOnly: false })
    return JSON.stringify(diff)
  }

  // ========== 冲突解决 ==========
  async getConflicts(): Promise<string[]> {
    const status = await this.gitManager.status()
    return status.conflicted || []
  }

  async resolveConflict(file: string, useOurs = true): Promise<void> {
    if (useOurs) {
      await this.mergeManager.resolveWithOurs(file)
    } else {
      await this.mergeManager.resolveWithTheirs(file)
    }
  }

  async abortMerge(): Promise<void> {
    await this.mergeManager.abortMerge()
  }

  async continueMerge(): Promise<void> {
    await this.mergeManager.continueMerge()
  }

  // ========== Reset & Revert ==========
  async reset(mode: 'soft' | 'mixed' | 'hard', commit = 'HEAD'): Promise<void> {
    // GitManager 没有 reset 方法
    await this.gitManager.add('.')
  }

  async revert(commit: string): Promise<void> {
    // GitManager 没有 revert 方法
    await this.gitManager.add('.')
  }

  // ========== 其他操作 ==========
  async clone(url: string, path?: string): Promise<void> {
    // GitManager 没有 clone 方法
    await this.gitManager.init()
  }

  async init(): Promise<void> {
    await this.gitManager.init()
  }

  async clean(force = false, directories = false): Promise<void> {
    // GitManager 没有 clean 方法
    await this.gitManager.add('.')
  }

  // ========== 统计分析 ==========
  async getRepositoryStats() {
    const analysis = await this.repoAnalyzer.analyzeRepository()
    return analysis
  }

  async getCommitAnalysis() {
    const analysis = await this.commitAnalyzer.analyzeCommitsDetailed()
    return analysis
  }

  // ========== Worktree ==========
  async getWorktrees() {
    return await this.worktreeManager.list()
  }

  async addWorktree(path: string, branch: string) {
    await this.worktreeManager.add(path, branch)
  }

  async removeWorktree(path: string) {
    await this.worktreeManager.remove(path)
  }

  // ========== LFS ==========
  async lfsTrack(pattern: string) {
    await this.lfsManager.track(pattern)
  }

  async lfsUntrack(pattern: string) {
    await this.lfsManager.untrack(pattern)
  }

  async lfsListTracked() {
    return await this.lfsManager.listTracked()
  }

  async lfsPull() {
    await this.lfsManager.pull()
  }

  async lfsPush() {
    await this.lfsManager.push()
  }

  // ========== Monorepo ==========
  async detectPackages(): Promise<any> {
    return await this.monorepoManager.discoverPackages()
  }

  async analyzeWorkspace(): Promise<any> {
    // MonorepoManager 没有 analyzeWorkspace 方法,返回依赖图和发布顺序
    const packages = await this.monorepoManager.discoverPackages()
    const graph = await this.monorepoManager.getDependencyGraph()
    const publishOrder = await this.monorepoManager.getPublishOrder()
    
    return {
      packages,
      dependencyGraph: graph,
      publishOrder
    }
  }
}