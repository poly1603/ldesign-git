import simpleGit, { SimpleGit } from 'simple-git'
import type { SubmoduleInfo, SubmoduleOptions, GitOptions } from '../types'

/**
 * 子模块管理器 - 管理 Git 子模块
 */
export class SubmoduleManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 添加子模块
   * @param url 子模块 URL
   * @param path 子模块路径
   * @param options 选项
   */
  async addSubmodule(
    url: string,
    path: string,
    options: SubmoduleOptions = {}
  ): Promise<void> {
    const args: string[] = ['add']

    if (options.branch) {
      args.push('-b', options.branch)
    }

    if (options.force) {
      args.push('--force')
    }

    if (options.depth) {
      args.push('--depth', options.depth.toString())
    }

    args.push(url, path)

    await this.git.subModule(args)
  }

  /**
   * 初始化子模块
   * @param recursive 是否递归初始化
   */
  async initSubmodules(recursive = false): Promise<void> {
    const args = ['init']

    if (recursive) {
      await this.git.subModule(['update', '--init', '--recursive'])
    } else {
      await this.git.subModule(args)
    }
  }

  /**
   * 更新子模块
   * @param options 选项
   */
  async updateSubmodules(options: SubmoduleOptions = {}): Promise<void> {
    const args = ['update']

    if (options.recursive) {
      args.push('--recursive')
    }

    if (options.force) {
      args.push('--force')
    }

    await this.git.subModule(args)
  }

  /**
   * 更新指定子模块
   * @param path 子模块路径
   * @param options 选项
   */
  async updateSubmodule(path: string, options: SubmoduleOptions = {}): Promise<void> {
    const args = ['update']

    if (options.recursive) {
      args.push('--recursive')
    }

    if (options.force) {
      args.push('--force')
    }

    args.push(path)

    await this.git.subModule(args)
  }

  /**
   * 删除子模块
   * @param path 子模块路径
   */
  async removeSubmodule(path: string): Promise<void> {
    // 1. 取消注册子模块
    await this.git.subModule(['deinit', '-f', path])

    // 2. 删除 .git/modules 中的子模块
    await this.git.raw(['rm', '-rf', `.git/modules/${path}`])

    // 3. 删除工作树中的子模块
    await this.git.raw(['rm', '-f', path])
  }

  /**
   * 列出所有子模块
   */
  async listSubmodules(): Promise<SubmoduleInfo[]> {
    try {
      const result = await this.git.subModule(['status'])
      const submodules: SubmoduleInfo[] = []

      if (result) {
        const lines = result.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          // 格式: " abc1234 path/to/submodule (branch)"
          // 或: "-abc1234 path/to/submodule"
          // 或: "+abc1234 path/to/submodule (branch)"

          const match = line.match(/^([ +-])([a-f0-9]+)\s+(.+?)(\s+\((.+)\))?$/)
          if (match) {
            const statusChar = match[1]
            const commit = match[2]
            const modulePath = match[3]
            const refs = match[5]

            let status: SubmoduleInfo['status'] = 'up-to-date'
            if (statusChar === '-') {
              status = 'uninitialized'
            } else if (statusChar === '+') {
              status = 'modified'
            } else if (statusChar === ' ') {
              status = 'initialized'
            }

            // 获取子模块配置
            const url = await this.getSubmoduleUrl(modulePath)

            submodules.push({
              name: modulePath.split('/').pop() || modulePath,
              path: modulePath,
              url: url || '',
              branch: refs,
              commit,
              status
            })
          }
        }
      }

      return submodules
    } catch (error) {
      return []
    }
  }

  /**
   * 获取子模块的 URL
   * @param path 子模块路径
   */
  async getSubmoduleUrl(path: string): Promise<string | null> {
    try {
      const result = await this.git.raw([
        'config',
        '--file',
        '.gitmodules',
        `submodule.${path}.url`
      ])
      return result.trim()
    } catch {
      return null
    }
  }

  /**
   * 获取子模块的分支
   * @param path 子模块路径
   */
  async getSubmoduleBranch(path: string): Promise<string | null> {
    try {
      const result = await this.git.raw([
        'config',
        '--file',
        '.gitmodules',
        `submodule.${path}.branch`
      ])
      return result.trim()
    } catch {
      return null
    }
  }

  /**
   * 设置子模块的分支
   * @param path 子模块路径
   * @param branch 分支名
   */
  async setSubmoduleBranch(path: string, branch: string): Promise<void> {
    await this.git.raw([
      'config',
      '--file',
      '.gitmodules',
      `submodule.${path}.branch`,
      branch
    ])
  }

  /**
   * 同步子模块（更新 URL）
   */
  async syncSubmodules(): Promise<void> {
    await this.git.subModule(['sync', '--recursive'])
  }

  /**
   * 遍历子模块执行命令
   * @param command Git 命令
   */
  async foreachSubmodule(command: string): Promise<string> {
    const result = await this.git.subModule(['foreach', command])
    return result
  }

  /**
   * 检查子模块是否有未提交的更改
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const result = await this.git.subModule(['foreach', 'git status --porcelain'])
    return result.trim() !== ''
  }

  /**
   * 拉取所有子模块的最新代码
   */
  async pullAllSubmodules(): Promise<void> {
    await this.git.subModule(['foreach', 'git pull'])
  }

  /**
   * 检出子模块的特定分支
   * @param path 子模块路径
   * @param branch 分支名
   */
  async checkoutSubmoduleBranch(path: string, branch: string): Promise<void> {
    await this.git.subModule(['foreach', `cd ${path} && git checkout ${branch}`])
  }

  /**
   * 递归克隆包含子模块的仓库
   * @param url 仓库 URL
   * @param localPath 本地路径
   */
  async cloneWithSubmodules(url: string, localPath: string): Promise<void> {
    await this.git.clone(url, localPath, ['--recurse-submodules'])
  }

  /**
   * 获取子模块的状态摘要
   */
  async getSubmodulesSummary(): Promise<string> {
    const result = await this.git.subModule(['summary'])
    return result
  }

  /**
   * 吸收子模块的 .git 目录到主仓库
   */
  async absorbGitDirs(): Promise<void> {
    await this.git.subModule(['absorbgitdirs'])
  }

  /**
   * 批量更新子模块到最新提交
   */
  async updateSubmodulesToLatest(): Promise<void> {
    await this.git.subModule(['update', '--remote', '--recursive'])
  }

  /**
   * 检查子模块是否存在
   * @param path 子模块路径
   */
  async submoduleExists(path: string): Promise<boolean> {
    const submodules = await this.listSubmodules()
    return submodules.some(sub => sub.path === path)
  }
}


