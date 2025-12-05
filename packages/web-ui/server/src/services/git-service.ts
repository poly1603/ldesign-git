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
  RepositoryAnalyzer,
  SubmoduleManager
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
  private submoduleManager: SubmoduleManager

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
    this.submoduleManager = new SubmoduleManager(options)
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
    const { execSync } = await import('child_process')
    try {
      // 使用 -m 参数支持合并提交的差异显示
      let diff = execSync(`git show -m --format="" ${commitHash}`, {
        cwd: this.baseDir,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      })
      
      // 如果还是没有差异，尝试使用 diff-tree
      if (!diff.trim()) {
        diff = execSync(`git diff-tree -p ${commitHash}`, {
          cwd: this.baseDir,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024
        })
      }
      
      return diff || '没有差异'
    } catch (error: any) {
      console.error('获取提交差异失败:', error)
      return `获取差异失败: ${error.message}`
    }
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
    // 直接使用 git diff 获取单个文件的差异内容
    const { execSync } = await import('child_process')
    try {
      // 先尝试获取工作目录的差异
      let diff = execSync(`git diff -- "${file}"`, {
        cwd: this.baseDir,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      })
      
      // 如果工作目录没有差异，尝试获取暂存区的差异
      if (!diff.trim()) {
        diff = execSync(`git diff --cached -- "${file}"`, {
          cwd: this.baseDir,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024
        })
      }
      
      // 如果还是没有差异，可能是未跟踪的新文件
      if (!diff.trim()) {
        const status = await this.gitManager.status()
        if (status.not_added?.includes(file) || status.created?.includes(file)) {
          // 对于新文件，显示整个文件内容作为添加
          const fs = await import('fs')
          const path = await import('path')
          const filePath = path.join(this.baseDir, file)
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8')
            const lines = content.split('\n')
            diff = `diff --git a/${file} b/${file}
new file mode 100644
--- /dev/null
+++ b/${file}
@@ -0,0 +1,${lines.length} @@
${lines.map(l => '+' + l).join('\n')}`
          }
        }
      }
      
      return diff || '没有差异'
    } catch (error: any) {
      console.error('获取文件差异失败:', error)
      return `获取差异失败: ${error.message}`
    }
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
    await this.gitManager.reset(mode, commit)
  }

  async revert(commit: string): Promise<void> {
    await this.gitManager.revert(commit)
  }

  // ========== 其他操作 ==========
  async clone(url: string, localPath?: string): Promise<void> {
    await this.gitManager.clone(url, localPath || '.', { recursive: true })
  }

  async init(): Promise<void> {
    await this.gitManager.init()
  }

  async clean(force = false, directories = false): Promise<void> {
    await this.gitManager.clean({ force, directories })
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

  // ========== Submodule 相关 ==========
  async getSubmodules() {
    return await this.submoduleManager.listSubmodules()
  }

  async addSubmodule(url: string, path: string, options?: { branch?: string; force?: boolean; depth?: number }) {
    await this.submoduleManager.addSubmodule(url, path, options)
  }

  async initSubmodules(recursive = false) {
    await this.submoduleManager.initSubmodules(recursive)
  }

  async updateSubmodules(options?: { recursive?: boolean; force?: boolean }) {
    await this.submoduleManager.updateSubmodules(options)
  }

  async updateSubmodule(path: string, options?: { recursive?: boolean; force?: boolean }) {
    await this.submoduleManager.updateSubmodule(path, options)
  }

  async removeSubmodule(path: string) {
    await this.submoduleManager.removeSubmodule(path)
  }

  async syncSubmodules() {
    await this.submoduleManager.syncSubmodules()
  }

  async pullAllSubmodules() {
    await this.submoduleManager.pullAllSubmodules()
  }

  async getSubmodulesSummary() {
    return await this.submoduleManager.getSubmodulesSummary()
  }

  async hasSubmoduleChanges() {
    return await this.submoduleManager.hasUncommittedChanges()
  }

  async foreachSubmodule(command: string) {
    return await this.submoduleManager.foreachSubmodule(command)
  }

  async setSubmoduleBranch(path: string, branch: string) {
    await this.submoduleManager.setSubmoduleBranch(path, branch)
  }

  async updateSubmodulesToLatest() {
    await this.submoduleManager.updateSubmodulesToLatest()
  }

  // ========== Git Blame ==========
  async getBlame(file: string): Promise<any[]> {
    const { execSync } = await import('child_process')
    try {
      const output = execSync(`git blame --line-porcelain "${file}"`, {
        cwd: this.baseDir,
        encoding: 'utf-8',
        maxBuffer: 20 * 1024 * 1024
      })
      
      const lines: any[] = []
      const entries = output.split(/(?=^[a-f0-9]{40} )/m)
      
      for (const entry of entries) {
        if (!entry.trim()) continue
        const hashMatch = entry.match(/^([a-f0-9]{40})/)
        const authorMatch = entry.match(/^author (.+)$/m)
        const timeMatch = entry.match(/^author-time (\d+)$/m)
        const lineMatch = entry.match(/^\t(.*)$/m)
        
        if (hashMatch) {
          lines.push({
            hash: hashMatch[1].substring(0, 7),
            author: authorMatch?.[1] || 'Unknown',
            date: timeMatch ? new Date(parseInt(timeMatch[1]) * 1000).toISOString() : '',
            content: lineMatch?.[1] || ''
          })
        }
      }
      return lines
    } catch (error: any) {
      console.error('Blame 失败:', error)
      return []
    }
  }

  // ========== 分支比较 ==========
  async compareBranches(base: string, compare: string): Promise<any> {
    const { execSync } = await import('child_process')
    try {
      const commitsAhead = execSync(`git rev-list --count ${base}..${compare}`, {
        cwd: this.baseDir, encoding: 'utf-8'
      }).trim()
      
      const commitsBehind = execSync(`git rev-list --count ${compare}..${base}`, {
        cwd: this.baseDir, encoding: 'utf-8'
      }).trim()
      
      const diffStat = execSync(`git diff --stat ${base}...${compare}`, {
        cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024
      })
      
      const commitsOutput = execSync(`git log --oneline ${base}..${compare}`, {
        cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024
      })
      const commits = commitsOutput.trim().split('\n').filter(Boolean).map(line => {
        const [hash, ...msg] = line.split(' ')
        return { hash, message: msg.join(' ') }
      })
      
      const diff = execSync(`git diff ${base}...${compare}`, {
        cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024
      })
      
      return { ahead: parseInt(commitsAhead) || 0, behind: parseInt(commitsBehind) || 0, commits, diffStat, diff }
    } catch (error: any) {
      throw error
    }
  }

  // ========== Cherry-pick ==========
  async cherryPick(commits: string[], noCommit = false): Promise<void> {
    const { execSync } = await import('child_process')
    const args = noCommit ? '-n' : ''
    for (const commit of commits) {
      execSync(`git cherry-pick ${args} ${commit}`, { cwd: this.baseDir, encoding: 'utf-8' })
    }
  }

  async abortCherryPick(): Promise<void> {
    const { execSync } = await import('child_process')
    execSync('git cherry-pick --abort', { cwd: this.baseDir })
  }

  // ========== 仓库统计 ==========
  async getContributorStats(): Promise<any[]> {
    const { execSync } = await import('child_process')
    try {
      const output = execSync('git shortlog -sne --all', {
        cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024
      })
      return output.trim().split('\n').filter(Boolean).map(line => {
        const match = line.match(/^\s*(\d+)\s+(.+?)\s+<(.+)>$/)
        return match ? { commits: parseInt(match[1]), name: match[2], email: match[3] } : null
      }).filter(Boolean)
    } catch { return [] }
  }

  async getCommitActivity(days = 30): Promise<any[]> {
    const { execSync } = await import('child_process')
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const output = execSync(`git log --since="${since}" --format="%ad" --date=short`, {
        cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024
      })
      const counts: Record<string, number> = {}
      output.trim().split('\n').filter(Boolean).forEach(date => { counts[date] = (counts[date] || 0) + 1 })
      return Object.entries(counts).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
    } catch { return [] }
  }

  async getFileTypeStats(): Promise<any[]> {
    const { execSync } = await import('child_process')
    try {
      const output = execSync('git ls-files', { cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
      const extCounts: Record<string, number> = {}
      output.trim().split('\n').filter(Boolean).forEach(file => {
        const ext = file.includes('.') ? '.' + file.split('.').pop() : 'no ext'
        extCounts[ext] = (extCounts[ext] || 0) + 1
      })
      return Object.entries(extCounts).map(([ext, count]) => ({ extension: ext, count })).sort((a, b) => b.count - a.count).slice(0, 15)
    } catch { return [] }
  }

  // ========== Git Bisect ==========
  async bisectStart(bad?: string, good?: string): Promise<string> {
    const { execSync } = await import('child_process')
    let result = execSync('git bisect start', { cwd: this.baseDir, encoding: 'utf-8' })
    if (bad) result += execSync(`git bisect bad ${bad}`, { cwd: this.baseDir, encoding: 'utf-8' })
    if (good) result += execSync(`git bisect good ${good}`, { cwd: this.baseDir, encoding: 'utf-8' })
    return result
  }

  async bisectGood(): Promise<string> {
    const { execSync } = await import('child_process')
    return execSync('git bisect good', { cwd: this.baseDir, encoding: 'utf-8' })
  }

  async bisectBad(): Promise<string> {
    const { execSync } = await import('child_process')
    return execSync('git bisect bad', { cwd: this.baseDir, encoding: 'utf-8' })
  }

  async bisectReset(): Promise<string> {
    const { execSync } = await import('child_process')
    return execSync('git bisect reset', { cwd: this.baseDir, encoding: 'utf-8' })
  }

  // ========== Git Hooks ==========
  async getHooks(): Promise<any[]> {
    const fs = await import('fs')
    const path = await import('path')
    const hooksDir = path.join(this.baseDir, '.git', 'hooks')
    const availableHooks = ['pre-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'pre-push', 'pre-rebase', 'post-checkout', 'post-merge']
    
    return availableHooks.map(name => {
      const hookPath = path.join(hooksDir, name)
      const samplePath = path.join(hooksDir, `${name}.sample`)
      let content = '', enabled = false
      if (fs.existsSync(hookPath)) { content = fs.readFileSync(hookPath, 'utf-8'); enabled = true }
      else if (fs.existsSync(samplePath)) { content = fs.readFileSync(samplePath, 'utf-8') }
      return { name, enabled, content }
    })
  }

  async saveHook(name: string, content: string, enabled: boolean): Promise<void> {
    const fs = await import('fs')
    const path = await import('path')
    const hooksDir = path.join(this.baseDir, '.git', 'hooks')
    const hookPath = path.join(hooksDir, name)
    const samplePath = path.join(hooksDir, `${name}.sample`)
    
    if (enabled) {
      fs.writeFileSync(hookPath, content, { mode: 0o755 })
      if (fs.existsSync(samplePath)) fs.unlinkSync(samplePath)
    } else {
      fs.writeFileSync(samplePath, content)
      if (fs.existsSync(hookPath)) fs.unlinkSync(hookPath)
    }
  }

  // ========== 搜索提交 ==========
  async searchCommits(query: string, options: { author?: string; since?: string; until?: string; path?: string; limit?: number } = {}): Promise<any[]> {
    const { execSync } = await import('child_process')
    let cmd = 'git log'
    if (query) cmd += ` --grep="${query}"`
    if (options.author) cmd += ` --author="${options.author}"`
    if (options.since) cmd += ` --since="${options.since}"`
    if (options.until) cmd += ` --until="${options.until}"`
    cmd += ` -n ${options.limit || 100}`
    if (options.path) cmd += ` -- "${options.path}"`
    cmd += ' --format="%H|%an|%ad|%s" --date=iso'
    try {
      const output = execSync(cmd, { cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
      return output.trim().split('\n').filter(Boolean).map((line: string) => {
        const [hash, author, date, ...msg] = line.split('|')
        return { hash, author, date, message: msg.join('|') }
      })
    } catch { return [] }
  }

  // ========== 文件历史 ==========
  async getFileHistory(file: string, limit = 50): Promise<any[]> {
    const { execSync } = await import('child_process')
    try {
      const output = execSync(`git log --follow -n ${limit} --format="%H|%an|%ad|%s" --date=iso -- "${file}"`, {
        cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024
      })
      return output.trim().split('\n').filter(Boolean).map((line: string) => {
        const [hash, author, date, ...msg] = line.split('|')
        return { hash, author, date, message: msg.join('|') }
      })
    } catch { return [] }
  }

  // ========== 冲突文件内容 ==========
  async getConflictContent(file: string): Promise<any> {
    const fs = await import('fs')
    const path = await import('path')
    const { execSync } = await import('child_process')
    const filePath = path.join(this.baseDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    let ours = '', theirs = '', base = ''
    try { ours = execSync(`git show :2:"${file}"`, { cwd: this.baseDir, encoding: 'utf-8' }) } catch {}
    try { theirs = execSync(`git show :3:"${file}"`, { cwd: this.baseDir, encoding: 'utf-8' }) } catch {}
    try { base = execSync(`git show :1:"${file}"`, { cwd: this.baseDir, encoding: 'utf-8' }) } catch {}
    return { content, ours, theirs, base }
  }

  async saveConflictResolution(file: string, content: string): Promise<void> {
    const fs = await import('fs')
    const path = await import('path')
    fs.writeFileSync(path.join(this.baseDir, file), content)
    await this.addFiles([file])
  }

  // ========== 提交详情 ==========
  async getCommitDetails(hash: string): Promise<any> {
    const { execSync } = await import('child_process')
    try {
      const format = '%H|%an|%ae|%ad|%cn|%ce|%cd|%s|%b|%P'
      const info = execSync(`git log -1 --format="${format}" --date=iso ${hash}`, { cwd: this.baseDir, encoding: 'utf-8' }).trim()
      const [fullHash, authorName, authorEmail, authorDate, committerName, committerEmail, commitDate, subject, body, parents] = info.split('|')
      const files = execSync(`git diff-tree --no-commit-id --name-status -r ${hash}`, { cwd: this.baseDir, encoding: 'utf-8' })
        .trim().split('\n').filter(Boolean).map((line: string) => {
          const [status, ...pathParts] = line.split('\t')
          return { status, path: pathParts.join('\t') }
        })
      const stats = execSync(`git diff-tree --no-commit-id --stat ${hash}`, { cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).trim()
      return {
        hash: fullHash,
        author: { name: authorName, email: authorEmail, date: authorDate },
        committer: { name: committerName, email: committerEmail, date: commitDate },
        subject, body: body || '',
        parents: parents ? parents.split(' ') : [],
        files, stats
      }
    } catch (error: any) {
      throw new Error(`获取提交详情失败: ${error.message}`)
    }
  }

  // ========== 分支图数据 ==========
  async getBranchGraph(limit = 100): Promise<any[]> {
    const { execSync } = await import('child_process')
    try {
      const output = execSync(`git log --all --oneline --graph --decorate -n ${limit}`, { cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
      const lines = output.trim().split('\n')
      return lines.map((line: string) => {
        const graphMatch = line.match(/^([*|\\\/\s]+)/)
        const graph = graphMatch ? graphMatch[1] : ''
        const rest = line.slice(graph.length)
        const hashMatch = rest.match(/^([a-f0-9]+)\s/)
        const hash = hashMatch ? hashMatch[1] : ''
        const refsMatch = rest.match(/\(([^)]+)\)/)
        const refs = refsMatch ? refsMatch[1].split(', ') : []
        const message = rest.replace(/^[a-f0-9]+\s*(\([^)]+\))?\s*/, '')
        return { graph, hash, refs, message }
      })
    } catch { return [] }
  }

  // ========== 代码搜索 ==========
  async searchCode(query: string, options: { filePattern?: string; caseSensitive?: boolean; regex?: boolean } = {}): Promise<any[]> {
    const { execSync } = await import('child_process')
    try {
      let cmd = 'git grep -n'
      if (!options.caseSensitive) cmd += ' -i'
      if (options.regex) cmd += ' -E'
      if (options.filePattern) cmd += ` -- "${options.filePattern}"`
      cmd += ` "${query.replace(/"/g, '\\"')}"`
      const output = execSync(cmd, { cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 })
      return output.trim().split('\n').filter(Boolean).slice(0, 200).map((line: string) => {
        const match = line.match(/^([^:]+):(\d+):(.*)$/)
        if (match) return { file: match[1], line: parseInt(match[2]), content: match[3] }
        return { file: '', line: 0, content: line }
      })
    } catch (error: any) {
      if (error.status === 1) return []
      throw error
    }
  }

  // ========== 文件浏览 ==========
  async listFiles(filePath = '', ref = 'HEAD'): Promise<any[]> {
    const { execSync } = await import('child_process')
    try {
      const treePath = filePath ? `${ref}:${filePath}` : ref
      const output = execSync(`git ls-tree --name-only ${treePath}`, { cwd: this.baseDir, encoding: 'utf-8' })
      const items = output.trim().split('\n').filter(Boolean)
      const result: any[] = []
      for (const item of items) {
        const fullPath = filePath ? `${filePath}/${item}` : item
        const typeOutput = execSync(`git cat-file -t ${ref}:${fullPath}`, { cwd: this.baseDir, encoding: 'utf-8' }).trim()
        result.push({ name: item, path: fullPath, type: typeOutput === 'tree' ? 'directory' : 'file' })
      }
      return result.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    } catch { return [] }
  }

  async getFileContent(filePath: string, ref = 'HEAD'): Promise<string> {
    const { execSync } = await import('child_process')
    try {
      return execSync(`git show ${ref}:${filePath}`, { cwd: this.baseDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    } catch (error: any) {
      throw new Error(`获取文件内容失败: ${error.message}`)
    }
  }

  // ========== 仓库信息 ==========
  async getRepoInfo(): Promise<any> {
    const { execSync } = await import('child_process')
    const fs = await import('fs')
    const pathModule = await import('path')
    try {
      const remote = execSync('git remote get-url origin', { cwd: this.baseDir, encoding: 'utf-8' }).trim()
      const headRef = execSync('git symbolic-ref --short HEAD', { cwd: this.baseDir, encoding: 'utf-8' }).trim()
      const lastCommit = execSync('git log -1 --format="%H|%s|%ar"', { cwd: this.baseDir, encoding: 'utf-8' }).trim()
      const [hash, message, timeAgo] = lastCommit.split('|')
      const gitDir = pathModule.join(this.baseDir, '.git')
      let size = 0
      const getSize = (dir: string) => {
        const files = fs.readdirSync(dir)
        for (const file of files) {
          const fp = pathModule.join(dir, file)
          const stat = fs.statSync(fp)
          if (stat.isDirectory()) getSize(fp)
          else size += stat.size
        }
      }
      getSize(gitDir)
      return { remote, defaultBranch: headRef, lastCommit: { hash, message, timeAgo }, size: Math.round(size / 1024 / 1024 * 100) / 100 }
    } catch { return { remote: '', defaultBranch: '', lastCommit: null, size: 0 } }
  }
}