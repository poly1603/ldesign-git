import simpleGit, { SimpleGit } from 'simple-git'
import type { StashInfo, StashOptions, GitOptions } from '../types'

/**
 * 暂存区管理器 - 管理 Git stash
 */
export class StashManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 保存当前工作区到 stash
   * @param options 暂存选项
   */
  async stash(options: StashOptions = {}): Promise<void> {
    const args: string[] = ['push']

    if (options.message) {
      args.push('-m', options.message)
    }

    if (options.includeUntracked) {
      args.push('-u')
    }

    if (options.keepIndex) {
      args.push('--keep-index')
    }

    await this.git.stash(args)
  }

  /**
   * 快速保存（不带消息）
   */
  async stashQuick(): Promise<void> {
    await this.git.stash()
  }

  /**
   * 保存并包含未跟踪的文件
   * @param message 暂存消息
   */
  async stashIncludeUntracked(message?: string): Promise<void> {
    await this.stash({ includeUntracked: true, message })
  }

  /**
   * 应用最新的 stash（保留 stash）
   * @param index stash 索引（可选，默认为最新）
   */
  async apply(index?: number): Promise<void> {
    const args = ['apply']
    if (index !== undefined) {
      args.push(`stash@{${index}}`)
    }
    await this.git.stash(args)
  }

  /**
   * 应用最新的 stash 并删除
   * @param index stash 索引（可选，默认为最新）
   */
  async pop(index?: number): Promise<void> {
    const args = ['pop']
    if (index !== undefined) {
      args.push(`stash@{${index}}`)
    }
    await this.git.stash(args)
  }

  /**
   * 列出所有 stash
   */
  async list(): Promise<StashInfo[]> {
    const result = await this.git.stash(['list'])
    const stashes: StashInfo[] = []

    if (result) {
      const lines = result.split('\n').filter(line => line.trim() !== '')

      lines.forEach((line, index) => {
        // 格式: stash@{0}: WIP on main: abc1234 commit message
        const match = line.match(/stash@\{(\d+)\}:\s*(.+?):?\s*(.*)/)
        if (match) {
          stashes.push({
            index: parseInt(match[1]),
            name: `stash@{${match[1]}}`,
            message: match[3] || match[2],
            date: '' // Git stash list 不直接提供日期，需要额外查询
          })
        }
      })
    }

    return stashes
  }

  /**
   * 获取 stash 的详细信息
   * @param index stash 索引
   */
  async show(index = 0): Promise<string> {
    const result = await this.git.stash(['show', `stash@{${index}}`, '-p'])
    return result
  }

  /**
   * 删除指定的 stash
   * @param index stash 索引
   */
  async drop(index = 0): Promise<void> {
    await this.git.stash(['drop', `stash@{${index}}`])
  }

  /**
   * 清空所有 stash
   */
  async clear(): Promise<void> {
    await this.git.stash(['clear'])
  }

  /**
   * 从 stash 创建新分支
   * @param branchName 分支名
   * @param index stash 索引
   */
  async branch(branchName: string, index = 0): Promise<void> {
    await this.git.stash(['branch', branchName, `stash@{${index}}`])
  }

  /**
   * 获取 stash 数量
   */
  async count(): Promise<number> {
    const stashes = await this.list()
    return stashes.length
  }

  /**
   * 检查是否有 stash
   */
  async hasStashes(): Promise<boolean> {
    const count = await this.count()
    return count > 0
  }

  /**
   * 获取最新的 stash 信息
   */
  async getLatest(): Promise<StashInfo | null> {
    const stashes = await this.list()
    return stashes.length > 0 ? stashes[0] : null
  }
}


