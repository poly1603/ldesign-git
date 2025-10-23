import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'

/**
 * Git 管理器 - 提供基础的 Git 操作
 */
export class GitManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 初始化 Git 仓库
   */
  async init(): Promise<void> {
    await this.git.init()
  }

  /**
   * 添加远程仓库
   */
  async addRemote(name: string, url: string): Promise<void> {
    await this.git.addRemote(name, url)
  }

  /**
   * 获取当前分支
   */
  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.branch()
    return branch.current
  }

  /**
   * 获取状态
   */
  async status() {
    return await this.git.status()
  }

  /**
   * 添加文件
   */
  async add(files: string | string[]): Promise<void> {
    await this.git.add(files)
  }

  /**
   * 提交
   */
  async commit(message: string): Promise<void> {
    await this.git.commit(message)
  }

  /**
   * 推送
   */
  async push(remote = 'origin', branch?: string): Promise<void> {
    await this.git.push(remote, branch)
  }

  /**
   * 拉取
   */
  async pull(remote = 'origin', branch?: string): Promise<void> {
    await this.git.pull(remote, branch)
  }

  /**
   * 克隆仓库
   */
  async clone(repoUrl: string, localPath: string): Promise<void> {
    await this.git.clone(repoUrl, localPath)
  }

  /**
   * 获取提交日志
   */
  async log(options?: { maxCount?: number }) {
    return await this.git.log(options)
  }
}


