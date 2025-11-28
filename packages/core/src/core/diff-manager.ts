import simpleGit, { SimpleGit } from 'simple-git'
import type {
  FileDiff,
  CommitDiff,
  BranchDiff,
  DiffStats,
  ExtendedDiffOptions,
  CommitInfo,
  GitOptions
} from '../types'
import { GitOperationError } from '../errors'

/**
 * Diff 管理器 - 管理 Git 差异比较
 * 
 * 提供完整的 diff 操作，包括文件比较、提交比较、分支比较等
 * 
 * @example
 * ```ts
 * const diffManager = new DiffManager({ baseDir: './my-project' })
 * 
 * // 比较两个提交
 * const diff = await diffManager.diffCommits('HEAD~1', 'HEAD')
 * 
 * // 获取工作区变更
 * const workingDiff = await diffManager.diffWorkingDirectory()
 * ```
 */
export class DiffManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 比较两个提交
   * 
   * @param from - 起始提交
   * @param to - 结束提交
   * @param options - Diff 选项
   * @returns 提交 Diff 信息
   * 
   * @example
   * ```ts
   * const diff = await diffManager.diffCommits('HEAD~5', 'HEAD')
   * console.log(`变更了 ${diff.files.length} 个文件`)
   * ```
   */
  async diffCommits(
    from: string,
    to: string,
    options: ExtendedDiffOptions = {}
  ): Promise<CommitDiff> {
    try {
      const diffSummary = await this.git.diffSummary([from, to])

      const files: FileDiff[] = diffSummary.files.map((file) => {
        const fileDiff: FileDiff = {
          path: file.file,
          type: this.getChangeType(file),
          insertions: 'insertions' in file ? file.insertions : 0,
          deletions: 'deletions' in file ? file.deletions : 0,
          binary: file.binary || false
        }

        return fileDiff
      })

      return {
        from,
        to,
        files,
        totalInsertions: diffSummary.insertions,
        totalDeletions: diffSummary.deletions
      }
    } catch (error) {
      throw new GitOperationError(
        'diff commits',
        `比较提交 ${from}..${to} 失败`,
        error as Error,
        { from, to }
      )
    }
  }

  /**
   * 比较两个分支
   * 
   * @param sourceBranch - 源分支
   * @param targetBranch - 目标分支
   * @param options - Diff 选项
   * @returns 分支 Diff 信息
   * 
   * @example
   * ```ts
   * const diff = await diffManager.diffBranches('feature/login', 'main')
   * ```
   */
  async diffBranches(
    sourceBranch: string,
    targetBranch: string,
    options: ExtendedDiffOptions = {}
  ): Promise<BranchDiff> {
    try {
      // 获取文件差异
      const commitDiff = await this.diffCommits(targetBranch, sourceBranch, options)

      // 获取提交列表
      const log = await this.git.log([`${targetBranch}..${sourceBranch}`])

      const commits: CommitInfo[] = log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
        body: commit.body,
        refs: commit.refs
      }))

      return {
        ...commitDiff,
        sourceBranch,
        targetBranch,
        commits
      }
    } catch (error) {
      throw new GitOperationError(
        'diff branches',
        `比较分支 ${sourceBranch}..${targetBranch} 失败`,
        error as Error,
        { sourceBranch, targetBranch }
      )
    }
  }

  /**
   * 获取工作区的变更（相对于暂存区）
   * 
   * @param options - Diff 选项
   * @returns 文件 Diff 数组
   * 
   * @example
   * ```ts
   * const changes = await diffManager.diffWorkingDirectory()
   * ```
   */
  async diffWorkingDirectory(options: ExtendedDiffOptions = {}): Promise<FileDiff[]> {
    try {
      const diffSummary = await this.git.diffSummary()

      return diffSummary.files.map((file) => ({
        path: file.file,
        type: this.getChangeType(file),
        insertions: 'insertions' in file ? file.insertions : 0,
        deletions: 'deletions' in file ? file.deletions : 0,
        binary: file.binary || false
      }))
    } catch (error) {
      throw new GitOperationError(
        'diff working directory',
        '获取工作区变更失败',
        error as Error
      )
    }
  }

  /**
   * 获取暂存区的变更（相对于 HEAD）
   * 
   * @param options - Diff 选项
   * @returns 文件 Diff 数组
   * 
   * @example
   * ```ts
   * const staged = await diffManager.diffStaged()
   * ```
   */
  async diffStaged(options: ExtendedDiffOptions = {}): Promise<FileDiff[]> {
    try {
      const diffSummary = await this.git.diffSummary(['--cached'])

      return diffSummary.files.map((file) => ({
        path: file.file,
        type: this.getChangeType(file),
        insertions: 'insertions' in file ? file.insertions : 0,
        deletions: 'deletions' in file ? file.deletions : 0,
        binary: file.binary || false
      }))
    } catch (error) {
      throw new GitOperationError(
        'diff staged',
        '获取暂存区变更失败',
        error as Error
      )
    }
  }

  /**
   * 获取指定文件的 diff 内容
   * 
   * @param filePath - 文件路径
   * @param options - Diff 选项
   * @returns Diff 内容字符串
   * 
   * @example
   * ```ts
   * const diff = await diffManager.showFileDiff('src/index.ts')
   * console.log(diff)
   * ```
   */
  async showFileDiff(filePath: string, options: ExtendedDiffOptions = {}): Promise<string> {
    try {
      const args: string[] = []

      if (options.staged || options.cached) {
        args.push('--cached')
      }

      if (options.ignoreWhitespace) {
        args.push('-w')
      }

      if (options.wordDiff) {
        args.push('--word-diff')
      }

      if (options.color) {
        args.push('--color')
      }

      if (options.context !== undefined) {
        args.push(`-U${options.context}`)
      }

      args.push('--', filePath)

      const result = await this.git.diff(args)
      return result
    } catch (error) {
      throw new GitOperationError(
        'show file diff',
        `获取文件 ${filePath} 的 diff 失败`,
        error as Error,
        { filePath }
      )
    }
  }

  /**
   * 获取两个提交之间某个文件的 diff
   * 
   * @param filePath - 文件路径
   * @param from - 起始提交
   * @param to - 结束提交
   * @param options - Diff 选项
   * @returns Diff 内容字符串
   * 
   * @example
   * ```ts
   * const diff = await diffManager.showFileDiffBetweenCommits(
   *   'src/index.ts',
   *   'HEAD~1',
   *   'HEAD'
   * )
   * ```
   */
  async showFileDiffBetweenCommits(
    filePath: string,
    from: string,
    to: string,
    options: ExtendedDiffOptions = {}
  ): Promise<string> {
    try {
      const args: string[] = [from, to]

      if (options.ignoreWhitespace) {
        args.push('-w')
      }

      if (options.wordDiff) {
        args.push('--word-diff')
      }

      args.push('--', filePath)

      const result = await this.git.diff(args)
      return result
    } catch (error) {
      throw new GitOperationError(
        'show file diff between commits',
        `获取文件 ${filePath} 在提交 ${from}..${to} 之间的 diff 失败`,
        error as Error,
        { filePath, from, to }
      )
    }
  }

  /**
   * 获取 diff 统计信息
   * 
   * @param from - 起始提交（可选）
   * @param to - 结束提交（可选）
   * @returns Diff 统计信息
   * 
   * @example
   * ```ts
   * const stats = await diffManager.getDiffStats('HEAD~10', 'HEAD')
   * console.log(`变更了 ${stats.filesChanged} 个文件`)
   * ```
   */
  async getDiffStats(from?: string, to?: string): Promise<DiffStats> {
    try {
      const args: string[] = ['--stat']

      if (from && to) {
        args.unshift(from, to)
      } else if (from) {
        args.unshift(from)
      }

      const diffSummary = await this.git.diffSummary(args)

      return {
        filesChanged: diffSummary.files.length,
        insertions: diffSummary.insertions,
        deletions: diffSummary.deletions,
        files: diffSummary.files.map(file => ({
          path: file.file,
          insertions: 'insertions' in file ? file.insertions : 0,
          deletions: 'deletions' in file ? file.deletions : 0
        }))
      }
    } catch (error) {
      throw new GitOperationError(
        'get diff stats',
        '获取 diff 统计信息失败',
        error as Error,
        { from, to }
      )
    }
  }

  /**
   * 获取指定提交的变更统计
   * 
   * @param commitHash - 提交哈希
   * @returns Diff 统计信息
   * 
   * @example
   * ```ts
   * const stats = await diffManager.getCommitStats('abc123')
   * ```
   */
  async getCommitStats(commitHash: string): Promise<DiffStats> {
    return this.getDiffStats(`${commitHash}^`, commitHash)
  }

  /**
   * 比较工作区和指定提交
   * 
   * @param commitHash - 提交哈希
   * @param options - Diff 选项
   * @returns 提交 Diff 信息
   * 
   * @example
   * ```ts
   * const diff = await diffManager.diffWithCommit('HEAD~5')
   * ```
   */
  async diffWithCommit(
    commitHash: string,
    options: ExtendedDiffOptions = {}
  ): Promise<CommitDiff> {
    return this.diffCommits(commitHash, 'HEAD', options)
  }

  /**
   * 检查两个提交是否有差异
   * 
   * @param from - 起始提交
   * @param to - 结束提交
   * @returns 是否有差异
   * 
   * @example
   * ```ts
   * const hasDiff = await diffManager.hasDifferences('main', 'develop')
   * ```
   */
  async hasDifferences(from: string, to: string): Promise<boolean> {
    const diff = await this.diffCommits(from, to)
    return diff.files.length > 0
  }

  /**
   * 获取指定文件的历史变更
   * 
   * @param filePath - 文件路径
   * @param maxCount - 最大数量
   * @returns 提交列表
   * 
   * @example
   * ```ts
   * const history = await diffManager.getFileHistory('src/index.ts', 10)
   * ```
   */
  async getFileHistory(filePath: string, maxCount = 10): Promise<CommitInfo[]> {
    try {
      const log = await this.git.log({ file: filePath, maxCount })

      return log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
        body: commit.body,
        refs: commit.refs
      }))
    } catch (error) {
      throw new GitOperationError(
        'get file history',
        `获取文件 ${filePath} 的历史失败`,
        error as Error,
        { filePath }
      )
    }
  }

  /**
   * 获取变更类型
   * 
   * @param file - 文件对象
   * @returns 变更类型
   */
  private getChangeType(file: any): 'added' | 'modified' | 'deleted' | 'renamed' {
    if (file.binary && file.insertions === 0 && file.deletions === 0) {
      return 'modified'
    }

    if (file.insertions > 0 && file.deletions === 0) {
      return 'added'
    }

    if (file.insertions === 0 && file.deletions > 0) {
      return 'deleted'
    }

    // 检查文件名是否包含重命名标记
    if (file.file.includes(' => ')) {
      return 'renamed'
    }

    return 'modified'
  }
}


