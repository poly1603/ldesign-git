import * as fs from 'fs/promises'
import * as path from 'path'
import type { UserConfig, WorkflowConfig, GitOptions } from '../types'
import { WorkflowAutomation } from '../automation/workflow-automation'

/**
 * 配置管理器 - 管理用户配置
 */
export class ConfigManager {
  private configPath: string
  private config: UserConfig | null = null

  constructor(private options: GitOptions = {}) {
    const baseDir = options.baseDir || process.cwd()
    this.configPath = path.join(baseDir, '.git-config.json')
  }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<UserConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const content = await fs.readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(content)
      return this.config!
    } catch (error) {
      // 配置文件不存在，返回默认配置
      this.config = this.getDefaultConfig()
      return this.config
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(config: UserConfig): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8')
    this.config = config
  }

  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<UserConfig>): Promise<UserConfig> {
    const current = await this.loadConfig()
    const updated = { ...current, ...updates }
    await this.saveConfig(updated)
    return updated
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(): UserConfig {
    return {
      workflow: WorkflowAutomation.getDefaultConfig('git-flow'),
      commitTemplate: {
        types: ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
        scopes: [],
        maxSubjectLength: 72,
        maxBodyLength: 100
      },
      hooks: [],
      aliases: {
        st: 'status',
        co: 'checkout',
        br: 'branch',
        ci: 'commit',
        unstage: 'reset HEAD --'
      },
      preferences: {
        autoStash: false,
        autoFetch: false,
        defaultBranch: 'main',
        pullRebase: false
      }
    }
  }

  /**
   * 重置为默认配置
   */
  async resetConfig(): Promise<UserConfig> {
    const defaultConfig = this.getDefaultConfig()
    await this.saveConfig(defaultConfig)
    return defaultConfig
  }

  /**
   * 获取工作流配置
   */
  async getWorkflowConfig(): Promise<WorkflowConfig | undefined> {
    const config = await this.loadConfig()
    return config.workflow
  }

  /**
   * 设置工作流配置
   */
  async setWorkflowConfig(workflow: WorkflowConfig): Promise<void> {
    await this.updateConfig({ workflow })
  }

  /**
   * 添加自定义作用域
   */
  async addScope(scope: string): Promise<void> {
    const config = await this.loadConfig()
    if (!config.commitTemplate) {
      config.commitTemplate = this.getDefaultConfig().commitTemplate
    }

    if (!config.commitTemplate!.scopes) {
      config.commitTemplate!.scopes = []
    }

    if (!config.commitTemplate!.scopes.includes(scope)) {
      config.commitTemplate!.scopes.push(scope)
      await this.saveConfig(config)
    }
  }

  /**
   * 删除自定义作用域
   */
  async removeScope(scope: string): Promise<void> {
    const config = await this.loadConfig()
    if (config.commitTemplate?.scopes) {
      config.commitTemplate.scopes = config.commitTemplate.scopes.filter(s => s !== scope)
      await this.saveConfig(config)
    }
  }

  /**
   * 添加别名
   */
  async addAlias(alias: string, command: string): Promise<void> {
    const config = await this.loadConfig()
    if (!config.aliases) {
      config.aliases = {}
    }

    config.aliases[alias] = command
    await this.saveConfig(config)
  }

  /**
   * 删除别名
   */
  async removeAlias(alias: string): Promise<void> {
    const config = await this.loadConfig()
    if (config.aliases) {
      delete config.aliases[alias]
      await this.saveConfig(config)
    }
  }

  /**
   * 检查配置文件是否存在
   */
  async configExists(): Promise<boolean> {
    try {
      await fs.access(this.configPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 导出配置
   */
  async exportConfig(exportPath: string): Promise<void> {
    const config = await this.loadConfig()
    await fs.writeFile(exportPath, JSON.stringify(config, null, 2), 'utf-8')
  }

  /**
   * 导入配置
   */
  async importConfig(importPath: string): Promise<void> {
    const content = await fs.readFile(importPath, 'utf-8')
    const config = JSON.parse(content)
    await this.saveConfig(config)
  }
}


