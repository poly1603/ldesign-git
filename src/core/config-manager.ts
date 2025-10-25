import simpleGit, { SimpleGit } from 'simple-git'
import type { ConfigScope, GitConfigItem, UserInfo, GitOptions } from '../types'
import { GitConfigError } from '../errors'

/**
 * Git Config 管理器 - 管理 Git 配置（git config）
 * 
 * 提供完整的 Git 配置操作，包括读取、设置、删除配置项
 * 支持 local/global/system 三个作用域
 * 
 * @example
 * ```ts
 * const configManager = new GitConfigManager({ baseDir: './my-project' })
 * 
 * // 设置用户信息
 * await configManager.setUserInfo('John Doe', 'john@example.com')
 * 
 * // 获取配置值
 * const email = await configManager.get('user.email')
 * ```
 */
export class GitConfigManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 获取配置值
   * 
   * @param key - 配置键
   * @param scope - 配置作用域（可选）
   * @returns 配置值，不存在则返回空字符串
   * 
   * @example
   * ```ts
   * const email = await configManager.get('user.email')
   * const globalEmail = await configManager.get('user.email', 'global')
   * ```
   */
  async get(key: string, scope?: ConfigScope): Promise<string> {
    try {
      const args: string[] = ['--get', key]

      if (scope === 'global') {
        args.unshift('--global')
      } else if (scope === 'system') {
        args.unshift('--system')
      } else if (scope === 'local') {
        args.unshift('--local')
      }

      const result = await this.git.raw(['config', ...args])
      return result.trim()
    } catch (error) {
      // 配置不存在时返回空字符串
      return ''
    }
  }

  /**
   * 设置配置值
   * 
   * @param key - 配置键
   * @param value - 配置值
   * @param scope - 配置作用域（默认为 local）
   * 
   * @example
   * ```ts
   * await configManager.set('user.name', 'John Doe')
   * await configManager.set('user.email', 'john@example.com', 'global')
   * ```
   */
  async set(key: string, value: string, scope: ConfigScope = 'local'): Promise<void> {
    try {
      const args: string[] = []

      if (scope === 'global') {
        args.push('--global')
      } else if (scope === 'system') {
        args.push('--system')
      } else {
        args.push('--local')
      }

      args.push(key, value)

      await this.git.raw(['config', ...args])
    } catch (error) {
      throw new GitConfigError(
        `设置配置 ${key} 失败`,
        key,
        error as Error
      )
    }
  }

  /**
   * 删除配置项
   * 
   * @param key - 配置键
   * @param scope - 配置作用域（默认为 local）
   * 
   * @example
   * ```ts
   * await configManager.unset('user.name')
   * ```
   */
  async unset(key: string, scope: ConfigScope = 'local'): Promise<void> {
    try {
      const args: string[] = []

      if (scope === 'global') {
        args.push('--global')
      } else if (scope === 'system') {
        args.push('--system')
      } else {
        args.push('--local')
      }

      args.push('--unset', key)

      await this.git.raw(['config', ...args])
    } catch (error) {
      throw new GitConfigError(
        `删除配置 ${key} 失败`,
        key,
        error as Error
      )
    }
  }

  /**
   * 列出所有配置项
   * 
   * @param scope - 配置作用域（可选，不指定则列出所有）
   * @returns 配置项对象
   * 
   * @example
   * ```ts
   * const configs = await configManager.list()
   * const globalConfigs = await configManager.list('global')
   * ```
   */
  async list(scope?: ConfigScope): Promise<Record<string, string>> {
    try {
      const args: string[] = ['--list']

      if (scope === 'global') {
        args.unshift('--global')
      } else if (scope === 'system') {
        args.unshift('--system')
      } else if (scope === 'local') {
        args.unshift('--local')
      }

      const result = await this.git.raw(['config', ...args])

      const configs: Record<string, string> = {}
      const lines = result.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        const [key, ...valueParts] = line.split('=')
        if (key) {
          configs[key.trim()] = valueParts.join('=').trim()
        }
      }

      return configs
    } catch (error) {
      throw new GitConfigError(
        '获取配置列表失败',
        undefined,
        error as Error
      )
    }
  }

  /**
   * 列出所有配置项（带作用域信息）
   * 
   * @returns 配置项数组
   * 
   * @example
   * ```ts
   * const items = await configManager.listAll()
   * items.forEach(item => {
   *   console.log(`[${item.scope}] ${item.key} = ${item.value}`)
   * })
   * ```
   */
  async listAll(): Promise<GitConfigItem[]> {
    try {
      const result = await this.git.raw(['config', '--list', '--show-origin', '--show-scope'])

      const items: GitConfigItem[] = []
      const lines = result.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        // 格式: scope\torigin\tkey=value
        const parts = line.split('\t')
        if (parts.length >= 3) {
          const scope = parts[0].trim() as ConfigScope
          const keyValue = parts[2]
          const [key, ...valueParts] = keyValue.split('=')

          items.push({
            key: key.trim(),
            value: valueParts.join('=').trim(),
            scope
          })
        }
      }

      return items
    } catch (error) {
      // 如果不支持 --show-scope，使用简化版本
      const configs = await this.list()
      return Object.entries(configs).map(([key, value]) => ({
        key,
        value,
        scope: 'local' as ConfigScope
      }))
    }
  }

  /**
   * 获取用户信息
   * 
   * @param scope - 配置作用域（默认为 local）
   * @returns 用户信息
   * 
   * @example
   * ```ts
   * const userInfo = await configManager.getUserInfo()
   * console.log(`${userInfo.name} <${userInfo.email}>`)
   * ```
   */
  async getUserInfo(scope?: ConfigScope): Promise<UserInfo> {
    const name = await this.get('user.name', scope)
    const email = await this.get('user.email', scope)

    return { name, email }
  }

  /**
   * 设置用户信息
   * 
   * @param name - 用户名
   * @param email - 邮箱
   * @param scope - 配置作用域（默认为 local）
   * 
   * @example
   * ```ts
   * await configManager.setUserInfo('John Doe', 'john@example.com')
   * await configManager.setUserInfo('Jane Doe', 'jane@example.com', 'global')
   * ```
   */
  async setUserInfo(name: string, email: string, scope: ConfigScope = 'local'): Promise<void> {
    await this.set('user.name', name, scope)
    await this.set('user.email', email, scope)
  }

  /**
   * 获取配置文件路径
   * 
   * @param scope - 配置作用域
   * @returns 配置文件路径
   * 
   * @example
   * ```ts
   * const globalConfigPath = await configManager.getConfigPath('global')
   * ```
   */
  async getConfigPath(scope: ConfigScope): Promise<string> {
    try {
      let args: string[] = []

      if (scope === 'global') {
        args = ['--global', '--list', '--show-origin']
      } else if (scope === 'system') {
        args = ['--system', '--list', '--show-origin']
      } else {
        args = ['--local', '--list', '--show-origin']
      }

      const result = await this.git.raw(['config', ...args])

      // 提取第一行的文件路径
      const firstLine = result.split('\n')[0]
      if (firstLine) {
        const match = firstLine.match(/^file:(.*?)\t/)
        if (match) {
          return match[1]
        }
      }

      return ''
    } catch (error) {
      throw new GitConfigError(
        `获取 ${scope} 配置文件路径失败`,
        undefined,
        error as Error
      )
    }
  }

  /**
   * 添加配置值（支持多值）
   * 
   * @param key - 配置键
   * @param value - 配置值
   * @param scope - 配置作用域（默认为 local）
   * 
   * @example
   * ```ts
   * await configManager.add('remote.origin.url', 'https://github.com/user/repo2.git')
   * ```
   */
  async add(key: string, value: string, scope: ConfigScope = 'local'): Promise<void> {
    try {
      const args: string[] = []

      if (scope === 'global') {
        args.push('--global')
      } else if (scope === 'system') {
        args.push('--system')
      } else {
        args.push('--local')
      }

      args.push('--add', key, value)

      await this.git.raw(['config', ...args])
    } catch (error) {
      throw new GitConfigError(
        `添加配置 ${key} 失败`,
        key,
        error as Error
      )
    }
  }

  /**
   * 获取所有匹配的配置值（多值）
   * 
   * @param key - 配置键
   * @param scope - 配置作用域（可选）
   * @returns 配置值数组
   * 
   * @example
   * ```ts
   * const urls = await configManager.getAll('remote.origin.url')
   * ```
   */
  async getAll(key: string, scope?: ConfigScope): Promise<string[]> {
    try {
      const args: string[] = ['--get-all', key]

      if (scope === 'global') {
        args.unshift('--global')
      } else if (scope === 'system') {
        args.unshift('--system')
      } else if (scope === 'local') {
        args.unshift('--local')
      }

      const result = await this.git.raw(['config', ...args])
      return result.split('\n').filter(line => line.trim() !== '')
    } catch (error) {
      return []
    }
  }

  /**
   * 检查配置项是否存在
   * 
   * @param key - 配置键
   * @param scope - 配置作用域（可选）
   * @returns 是否存在
   * 
   * @example
   * ```ts
   * const hasEmail = await configManager.has('user.email')
   * ```
   */
  async has(key: string, scope?: ConfigScope): Promise<boolean> {
    const value = await this.get(key, scope)
    return value !== ''
  }

  /**
   * 重命名配置段
   * 
   * @param oldName - 旧段名
   * @param newName - 新段名
   * @param scope - 配置作用域（默认为 local）
   * 
   * @example
   * ```ts
   * await configManager.renameSection('branch.old-name', 'branch.new-name')
   * ```
   */
  async renameSection(oldName: string, newName: string, scope: ConfigScope = 'local'): Promise<void> {
    try {
      const args: string[] = []

      if (scope === 'global') {
        args.push('--global')
      } else if (scope === 'system') {
        args.push('--system')
      } else {
        args.push('--local')
      }

      args.push('--rename-section', oldName, newName)

      await this.git.raw(['config', ...args])
    } catch (error) {
      throw new GitConfigError(
        `重命名配置段 ${oldName} -> ${newName} 失败`,
        undefined,
        error as Error
      )
    }
  }

  /**
   * 删除配置段
   * 
   * @param sectionName - 段名
   * @param scope - 配置作用域（默认为 local）
   * 
   * @example
   * ```ts
   * await configManager.removeSection('branch.old-branch')
   * ```
   */
  async removeSection(sectionName: string, scope: ConfigScope = 'local'): Promise<void> {
    try {
      const args: string[] = []

      if (scope === 'global') {
        args.push('--global')
      } else if (scope === 'system') {
        args.push('--system')
      } else {
        args.push('--local')
      }

      args.push('--remove-section', sectionName)

      await this.git.raw(['config', ...args])
    } catch (error) {
      throw new GitConfigError(
        `删除配置段 ${sectionName} 失败`,
        undefined,
        error as Error
      )
    }
  }
}


