import simpleGit, { SimpleGit } from 'simple-git'
import type {
  BranchInfo,
  BranchSummary,
  BranchCompareResult,
  CheckoutOptions,
  CommitInfo,
  GitOptions
} from '../types'

/**
 * 分支管理器 - 管理 Git 分支
 */
export class BranchManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 获取所有分支信息
   */
  async listBranches(): Promise<BranchSummary> {
    const branchSummary = await this.git.branch()

    return {
      all: branchSummary.all,
      branches: branchSummary.branches as Record<string, BranchInfo>,
      current: branchSummary.current,
      detached: branchSummary.detached
    }
  }

  /**
   * 获取当前分支名
   */
  async getCurrentBranch(): Promise<string> {
    const branchSummary = await this.git.branch()
    return branchSummary.current
  }

  /**
   * 创建新分支
   * @param branchName 分支名
   * @param startPoint 起始点（可选，默认为当前 HEAD）
   */
  async createBranch(branchName: string, startPoint?: string): Promise<void> {
    if (startPoint) {
      await this.git.branch([branchName, startPoint])
    } else {
      await this.git.branch([branchName])
    }
  }

  /**
   * 切换分支
   * @param branchName 分支名
   * @param options 切换选项
   */
  async checkoutBranch(branchName: string, options: CheckoutOptions = {}): Promise<void> {
    const args: string[] = []

    if (options.createBranch) {
      args.push('-b')
    }

    if (options.force) {
      args.push('-f')
    }

    if (options.track) {
      args.push('--track', options.track)
    }

    args.push(branchName)

    await this.git.checkout(args)
  }

  /**
   * 删除分支
   * @param branchName 分支名
   * @param force 是否强制删除（删除未合并的分支）
   */
  async deleteBranch(branchName: string, force = false): Promise<void> {
    if (force) {
      await this.git.branch(['-D', branchName])
    } else {
      await this.git.branch(['-d', branchName])
    }
  }

  /**
   * 删除远程分支
   * @param remote 远程名称
   * @param branchName 分支名
   */
  async deleteRemoteBranch(remote: string, branchName: string): Promise<void> {
    await this.git.push(remote, branchName, ['--delete'])
  }

  /**
   * 重命名分支
   * @param oldName 旧分支名
   * @param newName 新分支名
   * @param force 是否强制重命名
   */
  async renameBranch(oldName: string, newName: string, force = false): Promise<void> {
    const flag = force ? '-M' : '-m'
    await this.git.branch([flag, oldName, newName])
  }

  /**
   * 重命名当前分支
   * @param newName 新分支名
   * @param force 是否强制重命名
   */
  async renameCurrentBranch(newName: string, force = false): Promise<void> {
    const flag = force ? '-M' : '-m'
    await this.git.branch([flag, newName])
  }

  /**
   * 检查分支是否存在
   * @param branchName 分支名
   */
  async branchExists(branchName: string): Promise<boolean> {
    const branches = await this.listBranches()
    return branches.all.includes(branchName)
  }

  /**
   * 获取远程分支列表
   */
  async listRemoteBranches(): Promise<string[]> {
    const branches = await this.git.branch(['-r'])
    return branches.all
  }

  /**
   * 获取所有分支（本地+远程）
   */
  async listAllBranches(): Promise<string[]> {
    const branches = await this.git.branch(['-a'])
    return branches.all
  }

  /**
   * 比较两个分支
   * @param branch1 分支1
   * @param branch2 分支2
   */
  async compareBranches(branch1: string, branch2: string): Promise<BranchCompareResult> {
    // 获取 branch1 相对于 branch2 的提交（ahead）
    const aheadLog = await this.git.log([`${branch2}..${branch1}`])

    // 获取 branch2 相对于 branch1 的提交（behind）
    const behindLog = await this.git.log([`${branch1}..${branch2}`])

    const commits: CommitInfo[] = aheadLog.all.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date,
      body: commit.body,
      refs: commit.refs
    }))

    return {
      ahead: aheadLog.total,
      behind: behindLog.total,
      commits
    }
  }

  /**
   * 检查分支是否已合并到目标分支
   * @param sourceBranch 源分支
   * @param targetBranch 目标分支（默认为当前分支）
   */
  async isMerged(sourceBranch: string, targetBranch?: string): Promise<boolean> {
    const target = targetBranch || await this.getCurrentBranch()
    const mergedBranches = await this.git.branch(['--merged', target])
    return mergedBranches.all.includes(sourceBranch)
  }

  /**
   * 获取已合并的分支列表
   * @param targetBranch 目标分支（默认为当前分支）
   */
  async getMergedBranches(targetBranch?: string): Promise<string[]> {
    const args = ['--merged']
    if (targetBranch) {
      args.push(targetBranch)
    }
    const branches = await this.git.branch(args)
    return branches.all.filter(branch => !branch.includes('*'))
  }

  /**
   * 获取未合并的分支列表
   * @param targetBranch 目标分支（默认为当前分支）
   */
  async getUnmergedBranches(targetBranch?: string): Promise<string[]> {
    const args = ['--no-merged']
    if (targetBranch) {
      args.push(targetBranch)
    }
    const branches = await this.git.branch(args)
    return branches.all
  }

  /**
   * 跟踪远程分支
   * @param localBranch 本地分支名
   * @param remoteBranch 远程分支名（格式：remote/branch）
   */
  async trackRemoteBranch(localBranch: string, remoteBranch: string): Promise<void> {
    await this.git.branch(['--set-upstream-to', remoteBranch, localBranch])
  }

  /**
   * 取消跟踪远程分支
   * @param branchName 分支名
   */
  async untrackRemoteBranch(branchName: string): Promise<void> {
    await this.git.branch(['--unset-upstream', branchName])
  }

  /**
   * 推送分支到远程
   * @param branchName 分支名
   * @param remote 远程名称（默认为 origin）
   * @param setUpstream 是否设置上游跟踪
   */
  async pushBranch(branchName: string, remote = 'origin', setUpstream = false): Promise<void> {
    if (setUpstream) {
      await this.git.push(remote, branchName, ['--set-upstream'])
    } else {
      await this.git.push(remote, branchName)
    }
  }

  /**
   * 清理已删除的远程分支引用
   */
  async pruneRemoteBranches(remote = 'origin'): Promise<void> {
    await this.git.remote(['prune', remote])
  }
}


