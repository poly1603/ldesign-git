import simpleGit, { SimpleGit } from 'simple-git'
import type {
  WorkflowConfig,
  WorkflowType,
  FeatureOptions,
  ReleaseOptions,
  HotfixOptions,
  GitOptions
} from '../types'
import { BranchManager } from '../core/branch-manager'
import { TagManager } from '../core/tag-manager'
import { MergeManager } from '../core/merge-manager'

/**
 * 工作流自动化 - 支持 Git Flow、GitHub Flow、GitLab Flow
 */
export class WorkflowAutomation {
  private git: SimpleGit
  private branchManager: BranchManager
  private tagManager: TagManager
  private mergeManager: MergeManager

  constructor(
    private config: WorkflowConfig,
    private options: GitOptions = {}
  ) {
    this.git = simpleGit(options.baseDir || process.cwd())
    this.branchManager = new BranchManager(options)
    this.tagManager = new TagManager(options)
    this.mergeManager = new MergeManager(options)
  }

  /**
   * 获取默认的工作流配置
   */
  static getDefaultConfig(type: WorkflowType): WorkflowConfig {
    const configs: Record<WorkflowType, WorkflowConfig> = {
      'git-flow': {
        type: 'git-flow',
        branches: {
          main: 'main',
          develop: 'develop',
          feature: 'feature/',
          release: 'release/',
          hotfix: 'hotfix/'
        },
        prefixes: {
          feature: 'feature/',
          release: 'release/',
          hotfix: 'hotfix/',
          bugfix: 'bugfix/'
        },
        versionTag: {
          prefix: 'v',
          enabled: true
        }
      },
      'github-flow': {
        type: 'github-flow',
        branches: {
          main: 'main',
          feature: 'feature/'
        },
        prefixes: {
          feature: 'feature/'
        },
        versionTag: {
          prefix: 'v',
          enabled: true
        }
      },
      'gitlab-flow': {
        type: 'gitlab-flow',
        branches: {
          main: 'main',
          feature: 'feature/'
        },
        prefixes: {
          feature: 'feature/'
        },
        versionTag: {
          prefix: 'v',
          enabled: true
        }
      },
      'custom': {
        type: 'custom',
        branches: {
          main: 'main'
        },
        prefixes: {},
        versionTag: {
          enabled: false
        }
      }
    }

    return configs[type]
  }

  // ==================== Git Flow ====================

  /**
   * 初始化 Git Flow
   */
  async initGitFlow(): Promise<void> {
    const mainBranch = this.config.branches.main || 'main'
    const developBranch = this.config.branches.develop || 'develop'

    // 检查主分支是否存在
    const branches = await this.branchManager.listBranches()
    if (!branches.all.includes(mainBranch)) {
      await this.branchManager.createBranch(mainBranch)
    }

    // 创建 develop 分支
    if (!branches.all.includes(developBranch)) {
      await this.branchManager.checkoutBranch(mainBranch)
      await this.branchManager.createBranch(developBranch, mainBranch)
    }

    await this.branchManager.checkoutBranch(developBranch)
  }

  /**
   * 开始新功能（Git Flow）
   */
  async startFeature(options: FeatureOptions): Promise<string> {
    const prefix = this.config.prefixes?.feature || 'feature/'
    const featureBranch = `${prefix}${options.name}`
    const baseBranch = options.baseBranch || this.config.branches.develop || 'develop'

    // 切换到基础分支并更新
    await this.branchManager.checkoutBranch(baseBranch)
    await this.git.pull('origin', baseBranch)

    // 创建并切换到功能分支
    await this.branchManager.createBranch(featureBranch, baseBranch)
    await this.branchManager.checkoutBranch(featureBranch)

    if (options.push) {
      await this.branchManager.pushBranch(featureBranch, 'origin', true)
    }

    return featureBranch
  }

  /**
   * 完成功能（Git Flow）
   */
  async finishFeature(featureName: string, deleteBranch = true): Promise<void> {
    const prefix = this.config.prefixes?.feature || 'feature/'
    const featureBranch = `${prefix}${featureName}`
    const developBranch = this.config.branches.develop || 'develop'

    // 切换到 develop 分支
    await this.branchManager.checkoutBranch(developBranch)

    // 合并功能分支
    await this.mergeManager.merge(featureBranch, { noFastForward: true })

    // 删除功能分支
    if (deleteBranch) {
      await this.branchManager.deleteBranch(featureBranch)
      try {
        await this.branchManager.deleteRemoteBranch('origin', featureBranch)
      } catch (error) {
        // 远程分支可能不存在，忽略错误
      }
    }

    // 推送到远程
    await this.git.push('origin', developBranch)
  }

  /**
   * 开始发布（Git Flow）
   */
  async startRelease(options: ReleaseOptions): Promise<string> {
    const prefix = this.config.prefixes?.release || 'release/'
    const releaseBranch = `${prefix}${options.version}`
    const baseBranch = options.baseBranch || this.config.branches.develop || 'develop'

    // 切换到基础分支并更新
    await this.branchManager.checkoutBranch(baseBranch)
    await this.git.pull('origin', baseBranch)

    // 创建并切换到发布分支
    await this.branchManager.createBranch(releaseBranch, baseBranch)
    await this.branchManager.checkoutBranch(releaseBranch)

    if (options.push) {
      await this.branchManager.pushBranch(releaseBranch, 'origin', true)
    }

    return releaseBranch
  }

  /**
   * 完成发布（Git Flow）
   */
  async finishRelease(version: string, deleteBranch = true): Promise<void> {
    const prefix = this.config.prefixes?.release || 'release/'
    const releaseBranch = `${prefix}${version}`
    const mainBranch = this.config.branches.main || 'main'
    const developBranch = this.config.branches.develop || 'develop'

    // 合并到 main 分支
    await this.branchManager.checkoutBranch(mainBranch)
    await this.mergeManager.merge(releaseBranch, { noFastForward: true })

    // 创建标签
    if (this.config.versionTag?.enabled) {
      const tagPrefix = this.config.versionTag.prefix || ''
      const tagName = `${tagPrefix}${version}`
      await this.tagManager.createAnnotatedTag(tagName, `Release ${version}`)
      await this.tagManager.pushTag(tagName)
    }

    // 推送 main
    await this.git.push('origin', mainBranch)

    // 合并到 develop 分支
    await this.branchManager.checkoutBranch(developBranch)
    await this.mergeManager.merge(releaseBranch, { noFastForward: true })
    await this.git.push('origin', developBranch)

    // 删除发布分支
    if (deleteBranch) {
      await this.branchManager.deleteBranch(releaseBranch)
      try {
        await this.branchManager.deleteRemoteBranch('origin', releaseBranch)
      } catch (error) {
        // 远程分支可能不存在，忽略错误
      }
    }
  }

  /**
   * 开始热修复（Git Flow）
   */
  async startHotfix(options: HotfixOptions): Promise<string> {
    const prefix = this.config.prefixes?.hotfix || 'hotfix/'
    const hotfixBranch = `${prefix}${options.name}`
    const baseBranch = options.baseBranch || this.config.branches.main || 'main'

    // 切换到基础分支并更新
    await this.branchManager.checkoutBranch(baseBranch)
    await this.git.pull('origin', baseBranch)

    // 创建并切换到热修复分支
    await this.branchManager.createBranch(hotfixBranch, baseBranch)
    await this.branchManager.checkoutBranch(hotfixBranch)

    if (options.push) {
      await this.branchManager.pushBranch(hotfixBranch, 'origin', true)
    }

    return hotfixBranch
  }

  /**
   * 完成热修复（Git Flow）
   */
  async finishHotfix(name: string, version?: string, deleteBranch = true): Promise<void> {
    const prefix = this.config.prefixes?.hotfix || 'hotfix/'
    const hotfixBranch = `${prefix}${name}`
    const mainBranch = this.config.branches.main || 'main'
    const developBranch = this.config.branches.develop || 'develop'

    // 合并到 main 分支
    await this.branchManager.checkoutBranch(mainBranch)
    await this.mergeManager.merge(hotfixBranch, { noFastForward: true })

    // 创建标签
    if (version && this.config.versionTag?.enabled) {
      const tagPrefix = this.config.versionTag.prefix || ''
      const tagName = `${tagPrefix}${version}`
      await this.tagManager.createAnnotatedTag(tagName, `Hotfix ${version}`)
      await this.tagManager.pushTag(tagName)
    }

    // 推送 main
    await this.git.push('origin', mainBranch)

    // 合并到 develop 分支
    await this.branchManager.checkoutBranch(developBranch)
    await this.mergeManager.merge(hotfixBranch, { noFastForward: true })
    await this.git.push('origin', developBranch)

    // 删除热修复分支
    if (deleteBranch) {
      await this.branchManager.deleteBranch(hotfixBranch)
      try {
        await this.branchManager.deleteRemoteBranch('origin', hotfixBranch)
      } catch (error) {
        // 远程分支可能不存在，忽略错误
      }
    }
  }

  // ==================== GitHub Flow ====================

  /**
   * 创建功能分支（GitHub Flow）
   */
  async createFeatureBranch(name: string, push = true): Promise<string> {
    const prefix = this.config.prefixes?.feature || 'feature/'
    const featureBranch = `${prefix}${name}`
    const mainBranch = this.config.branches.main || 'main'

    // 更新 main 分支
    await this.branchManager.checkoutBranch(mainBranch)
    await this.git.pull('origin', mainBranch)

    // 创建并切换到功能分支
    await this.branchManager.createBranch(featureBranch, mainBranch)
    await this.branchManager.checkoutBranch(featureBranch)

    if (push) {
      await this.branchManager.pushBranch(featureBranch, 'origin', true)
    }

    return featureBranch
  }

  /**
   * 合并到主分支（GitHub Flow）
   */
  async mergeToMain(featureBranch: string, deleteBranch = true): Promise<void> {
    const mainBranch = this.config.branches.main || 'main'

    // 切换到 main 分支
    await this.branchManager.checkoutBranch(mainBranch)
    await this.git.pull('origin', mainBranch)

    // 合并功能分支
    await this.mergeManager.merge(featureBranch, { noFastForward: true })

    // 推送到远程
    await this.git.push('origin', mainBranch)

    // 删除功能分支
    if (deleteBranch) {
      await this.branchManager.deleteBranch(featureBranch)
      try {
        await this.branchManager.deleteRemoteBranch('origin', featureBranch)
      } catch (error) {
        // 远程分支可能不存在，忽略错误
      }
    }
  }

  // ==================== 通用方法 ====================

  /**
   * 获取当前工作流类型
   */
  getWorkflowType(): WorkflowType {
    return this.config.type
  }

  /**
   * 获取工作流配置
   */
  getConfig(): WorkflowConfig {
    return this.config
  }

  /**
   * 更新工作流配置
   */
  updateConfig(config: Partial<WorkflowConfig>): void {
    this.config = { ...this.config, ...config }
  }
}


