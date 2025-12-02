# @ldesign/git 优化和完善实施方案

## 📋 项目概述

**目标**: 为 @ldesign/git 添加完整的 Submodule 管理功能和现代化 Web UI 可视化界面

**需求**:
- ✅ 完整的 submodule 管理功能（添加、删除、更新、同步、递归支持）
- ✅ 完整的 Git 可视化界面（分支、提交、合并、submodule 等）
- ✅ 实时监控功能（WebSocket 实时状态更新）

## 🎯 核心功能设计

### 一、SubmoduleManager 核心功能

#### 1.1 类型定义 (`packages/core/src/types/submodule.ts`)

```typescript
/**
 * Submodule 信息
 */
export interface SubmoduleInfo {
  name: string              // submodule 名称
  path: string              // 本地路径
  url: string               // 远程仓库 URL
  branch?: string           // 跟踪的分支
  commit: string            // 当前 commit hash
  status: SubmoduleStatus   // 状态
  hasChanges: boolean       // 是否有未提交的变更
  hasUnpushed: boolean      // 是否有未推送的提交
  initialized: boolean      // 是否已初始化
  registered: boolean       // 是否已注册
}

/**
 * Submodule 状态
 */
export enum SubmoduleStatus {
  CLEAN = 'clean',           // 干净状态
  MODIFIED = 'modified',     // 有修改
  UNINITIALIZED = 'uninitialized', // 未初始化
  OUTDATED = 'outdated',     // 需要更新
  CONFLICT = 'conflict',     // 有冲突
  DETACHED = 'detached'      // HEAD 分离
}

/**
 * 添加 Submodule 选项
 */
export interface AddSubmoduleOptions {
  name?: string              // 自定义名称
  branch?: string            // 指定分支
  depth?: number             // 克隆深度
  force?: boolean            // 强制添加
  reference?: string         // 引用仓库路径
}

/**
 * 更新 Submodule 选项
 */
export interface UpdateSubmoduleOptions {
  init?: boolean             // 初始化未初始化的 submodule
  recursive?: boolean        // 递归更新
  remote?: boolean           // 从远程更新
  merge?: boolean            // 使用 merge 而非 checkout
  rebase?: boolean           // 使用 rebase
  force?: boolean            // 强制更新
  checkout?: boolean         // checkout 到记录的 commit
  jobs?: number              // 并行作业数
}

/**
 * 批量操作结果
 */
export interface SubmoduleBatchResult {
  total: number
  succeeded: string[]
  failed: Array<{
    name: string
    error: string
  }>
  skipped: string[]
}

/**
 * Submodule 摘要信息
 */
export interface SubmoduleSummary {
  total: number
  initialized: number
  uninitialized: number
  modified: number
  outdated: number
  clean: number
}
```

#### 1.2 SubmoduleManager 类 (`packages/core/src/core/submodule-manager.ts`)

```typescript
import { simpleGit, SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'
import type {
  SubmoduleInfo,
  AddSubmoduleOptions,
  UpdateSubmoduleOptions,
  SubmoduleBatchResult,
  SubmoduleSummary,
  SubmoduleStatus
} from '../types/submodule'
import { GitError, GitOperationError } from '../errors'
import { createLogger } from '../logger'

/**
 * Submodule 管理器
 * 提供完整的 Git Submodule 管理功能
 */
export class SubmoduleManager {
  private git: SimpleGit
  private logger = createLogger({ prefix: 'SubmoduleManager' })

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit({
      baseDir: options.baseDir || process.cwd(),
      binary: 'git',
      maxConcurrentProcesses: 6
    })
  }

  /**
   * 列出所有 submodules
   */
  async list(): Promise<SubmoduleInfo[]> {
    try {
      this.logger.info('列出所有 submodules')
      
      // 获取 .gitmodules 配置
      const configOutput = await this.git.raw(['config', '--file', '.gitmodules', '--list'])
      const submodules = this.parseGitmodulesConfig(configOutput)
      
      // 获取每个 submodule 的详细状态
      const results: SubmoduleInfo[] = []
      for (const sm of submodules) {
        const info = await this.getSubmoduleInfo(sm.path)
        results.push(info)
      }
      
      return results
    } catch (error) {
      throw new GitOperationError('列出 submodules 失败', 'list', error)
    }
  }

  /**
   * 添加 submodule
   */
  async add(
    url: string,
    path: string,
    options: AddSubmoduleOptions = {}
  ): Promise<void> {
    try {
      this.logger.info(`添加 submodule: ${url} -> ${path}`)
      
      const args = ['submodule', 'add']
      
      if (options.force) args.push('--force')
      if (options.name) args.push('--name', options.name)
      if (options.branch) args.push('--branch', options.branch)
      if (options.depth) args.push('--depth', String(options.depth))
      if (options.reference) args.push('--reference', options.reference)
      
      args.push(url, path)
      
      await this.git.raw(args)
      this.logger.info(`Submodule ${path} 添加成功`)
    } catch (error) {
      throw new GitOperationError(`添加 submodule ${path} 失败`, 'add', error)
    }
  }

  /**
   * 删除 submodule
   */
  async remove(path: string, options: { force?: boolean } = {}): Promise<void> {
    try {
      this.logger.info(`删除 submodule: ${path}`)
      
      // 1. deinit submodule
      const deinitArgs = ['submodule', 'deinit']
      if (options.force) deinitArgs.push('--force')
      deinitArgs.push(path)
      await this.git.raw(deinitArgs)
      
      // 2. 删除 .git/modules 中的目录
      await this.git.raw(['rm', '-rf', `.git/modules/${path}`])
      
      // 3. 从 git 中删除文件
      await this.git.raw(['rm', '-f', path])
      
      this.logger.info(`Submodule ${path} 删除成功`)
    } catch (error) {
      throw new GitOperationError(`删除 submodule ${path} 失败`, 'remove', error)
    }
  }

  /**
   * 初始化 submodule
   */
  async init(paths?: string[]): Promise<void> {
    try {
      const args = ['submodule', 'init']
      if (paths && paths.length > 0) {
        args.push(...paths)
      }
      
      await this.git.raw(args)
      this.logger.info('Submodules 初始化成功')
    } catch (error) {
      throw new GitOperationError('初始化 submodules 失败', 'init', error)
    }
  }

  /**
   * 更新 submodule
   */
  async update(
    paths?: string[],
    options: UpdateSubmoduleOptions = {}
  ): Promise<void> {
    try {
      this.logger.info('更新 submodules')
      
      const args = ['submodule', 'update']
      
      if (options.init) args.push('--init')
      if (options.recursive) args.push('--recursive')
      if (options.remote) args.push('--remote')
      if (options.merge) args.push('--merge')
      if (options.rebase) args.push('--rebase')
      if (options.force) args.push('--force')
      if (options.checkout) args.push('--checkout')
      if (options.jobs) args.push('--jobs', String(options.jobs))
      
      if (paths && paths.length > 0) {
        args.push(...paths)
      }
      
      await this.git.raw(args)
      this.logger.info('Submodules 更新成功')
    } catch (error) {
      throw new GitOperationError('更新 submodules 失败', 'update', error)
    }
  }

  /**
   * 同步 submodule URL
   */
  async sync(paths?: string[], recursive = false): Promise<void> {
    try {
      const args = ['submodule', 'sync']
      if (recursive) args.push('--recursive')
      if (paths && paths.length > 0) args.push(...paths)
      
      await this.git.raw(args)
      this.logger.info('Submodules 同步成功')
    } catch (error) {
      throw new GitOperationError('同步 submodules 失败', 'sync', error)
    }
  }

  /**
   * 批量更新所有 submodules
   */
  async updateAll(options: UpdateSubmoduleOptions = {}): Promise<SubmoduleBatchResult> {
    const submodules = await this.list()
    const result: SubmoduleBatchResult = {
      total: submodules.length,
      succeeded: [],
      failed: [],
      skipped: []
    }
    
    for (const sm of submodules) {
      try {
        await this.update([sm.path], options)
        result.succeeded.push(sm.name)
      } catch (error) {
        result.failed.push({
          name: sm.name,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    return result
  }

  /**
   * 获取单个 submodule 的详细信息
   */
  async getSubmoduleInfo(path: string): Promise<SubmoduleInfo> {
    try {
      const statusOutput = await this.git.raw(['submodule', 'status', path])
      const status = this.parseSubmoduleStatus(statusOutput)
      
      // 获取 URL
      const url = await this.git.raw([
        'config',
        '--file',
        '.gitmodules',
        `submodule.${path}.url`
      ])
      
      // 获取分支
      let branch: string | undefined
      try {
        branch = await this.git.raw([
          'config',
          '--file',
          '.gitmodules',
          `submodule.${path}.branch`
        ])
        branch = branch.trim()
      } catch {
        // 没有配置分支
      }
      
      return {
        name: path.split('/').pop() || path,
        path,
        url: url.trim(),
        branch,
        commit: status.commit,
        status: status.status,
        hasChanges: status.hasChanges,
        hasUnpushed: status.hasUnpushed,
        initialized: status.initialized,
        registered: status.registered
      }
    } catch (error) {
      throw new GitOperationError(
        `获取 submodule ${path} 信息失败`,
        'getInfo',
        error
      )
    }
  }

  /**
   * 获取 submodules 摘要
   */
  async getSummary(): Promise<SubmoduleSummary> {
    const submodules = await this.list()
    
    return {
      total: submodules.length,
      initialized: submodules.filter(sm => sm.initialized).length,
      uninitialized: submodules.filter(sm => !sm.initialized).length,
      modified: submodules.filter(sm => sm.hasChanges).length,
      outdated: submodules.filter(sm => sm.status === SubmoduleStatus.OUTDATED).length,
      clean: submodules.filter(sm => sm.status === SubmoduleStatus.CLEAN).length
    }
  }

  /**
   * 执行 foreach 命令
   */
  async foreach(command: string, recursive = false): Promise<string> {
    try {
      const args = ['submodule', 'foreach']
      if (recursive) args.push('--recursive')
      args.push(command)
      
      const output = await this.git.raw(args)
      return output
    } catch (error) {
      throw new GitOperationError('执行 foreach 命令失败', 'foreach', error)
    }
  }

  /**
   * 检查 submodule 是否存在
   */
  async exists(path: string): Promise<boolean> {
    try {
      await this.git.raw(['config', '--file', '.gitmodules', `submodule.${path}.url`])
      return true
    } catch {
      return false
    }
  }

  // ========== 私有辅助方法 ==========

  private parseGitmodulesConfig(output: string): Array<{ path: string }> {
    const submodules = new Map<string, { path: string }>()
    const lines = output.split('\n').filter(l => l.trim())
    
    for (const line of lines) {
      const match = line.match(/submodule\.(.+?)\.path=(.+)/)
      if (match) {
        const [, name, path] = match
        submodules.set(name, { path })
      }
    }
    
    return Array.from(submodules.values())
  }

  private parseSubmoduleStatus(output: string): {
    commit: string
    status: SubmoduleStatus
    hasChanges: boolean
    hasUnpushed: boolean
    initialized: boolean
    registered: boolean
  } {
    const line = output.trim()
    
    // 解析状态标识
    const firstChar = line[0]
    let status: SubmoduleStatus
    let initialized = true
    let hasChanges = false
    
    switch (firstChar) {
      case '-':
        status = SubmoduleStatus.UNINITIALIZED
        initialized = false
        break
      case '+':
        status = SubmoduleStatus.MODIFIED
        hasChanges = true
        break
      case 'U':
        status = SubmoduleStatus.CONFLICT
        break
      default:
        status = SubmoduleStatus.CLEAN
    }
    
    // 提取 commit hash
    const commitMatch = line.match(/[a-f0-9]{7,40}/)
    const commit = commitMatch ? commitMatch[0] : ''
    
    return {
      commit,
      status,
      hasChanges,
      hasUnpushed: false, // 需要额外检查
      initialized,
      registered: true
    }
  }
}
```

### 二、Web UI 架构设计

#### 2.1 后端 API 设计 (`packages/web-ui/server/src/routes/`)

**新增路由文件结构：**
```
server/src/
├── routes/
│   ├── index.ts           # 路由汇总
│   ├── git.ts             # Git 基础操作
│   ├── branches.ts        # 分支管理
│   ├── commits.ts         # 提交管理
│   ├── submodules.ts      # Submodule 管理 (新增)
│   ├── status.ts          # 状态查询
│   └── workflows.ts       # 工作流
├── services/
│   ├── GitService.ts      # Git 服务封装
│   └── SubmoduleService.ts # Submodule 服务 (新增)
└── websocket/
    ├── index.ts           # WebSocket 服务器
    └── handlers/
        ├── status.ts      # 状态实时更新
        └── submodule.ts   # Submodule 实时更新 (新增)
```

**Submodule API 端点设计：**

```typescript
// packages/web-ui/server/src/routes/submodules.ts
import express from 'express'
import { SubmoduleService } from '../services/SubmoduleService'

const router = express.Router()
const submoduleService = new SubmoduleService()

// GET /api/submodules - 列出所有 submodules
router.get('/', async (req, res) => {
  try {
    const submodules = await submoduleService.list()
    res.json({ success: true, data: submodules })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/submodules/summary - 获取摘要
router.get('/summary', async (req, res) => {
  try {
