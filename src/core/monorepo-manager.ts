import simpleGit, { SimpleGit } from 'simple-git'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import type { GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * 包信息
 */
export interface PackageInfo {
  /** 包名 */
  name: string
  /** 包路径 */
  path: string
  /** 包版本 */
  version: string
  /** 是否私有 */
  private?: boolean
  /** 依赖关系 */
  dependencies?: Record<string, string>
  /** 开发依赖 */
  devDependencies?: Record<string, string>
}

/**
 * 变更的包信息
 */
export interface ChangedPackageInfo extends PackageInfo {
  /** 变更的文件 */
  changedFiles: string[]
  /** 变更类型 */
  changeTypes: ('added' | 'modified' | 'deleted')[]
}

/**
 * 影响分析结果
 */
export interface ImpactAnalysis {
  /** 直接影响的包 */
  directlyAffected: string[]
  /** 间接影响的包（依赖链） */
  indirectlyAffected: string[]
  /** 所有受影响的包 */
  allAffected: string[]
  /** 依赖图 */
  dependencyGraph: Record<string, string[]>
}

/**
 * 版本变更类型
 */
export type VersionBumpType = 'major' | 'minor' | 'patch'

/**
 * 版本变更结果
 */
export interface VersionBumpResult {
  /** 包名 */
  package: string
  /** 旧版本 */
  oldVersion: string
  /** 新版本 */
  newVersion: string
  /** 变更类型 */
  bumpType: VersionBumpType
}

/**
 * Monorepo 配置
 */
export interface MonorepoConfig {
  /** 包路径模式 */
  packages?: string[]
  /** 工作空间根目录 */
  workspaceRoot?: string
}

/**
 * Monorepo 管理器
 * 
 * 用于管理 Monorepo 项目
 * 
 * @example
 * ```typescript
 * const monorepo = new MonorepoManager({
 *   baseDir: './my-monorepo',
 *   packages: ['packages/*', 'apps/*']
 * })
 * 
 * // 检测变更的包
 * const changed = await monorepo.detectChangedPackages('main')
 * console.log('变更的包:', changed.map(p => p.name))
 * 
 * // 分析影响
 * const impact = await monorepo.getAffectedPackages(['@myorg/core'])
 * console.log('受影响的包:', impact.allAffected)
 * ```
 */
export class MonorepoManager {
  private git: SimpleGit
  private baseDir: string
  private packages: string[]
  private workspaceRoot: string

  constructor(options: GitOptions & MonorepoConfig = {}) {
    this.baseDir = options.baseDir || process.cwd()
    this.workspaceRoot = options.workspaceRoot || this.baseDir
    this.packages = options.packages || ['packages/*']
    
    this.git = simpleGit({
      baseDir: this.baseDir,
      binary: 'git',
      maxConcurrentProcesses: 6,
    })
  }

  /**
   * 发现所有包
   * 
   * @returns 包信息列表
   * 
   * @example
   * ```typescript
   * const packages = await monorepo.discoverPackages()
   * console.log(`发现 ${packages.length} 个包`)
   * ```
   */
  async discoverPackages(): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = []

    for (const pattern of this.packages) {
      const dirs = await this.expandGlob(pattern)
      
      for (const dir of dirs) {
        const packageJsonPath = path.join(dir, 'package.json')
        
        try {
          const content = await fs.readFile(packageJsonPath, 'utf-8')
          const packageJson = JSON.parse(content)
          
          packages.push({
            name: packageJson.name,
            path: path.relative(this.workspaceRoot, dir),
            version: packageJson.version,
            private: packageJson.private,
            dependencies: packageJson.dependencies,
            devDependencies: packageJson.devDependencies,
          })
        } catch {
          // 跳过没有 package.json 的目录
        }
      }
    }

    return packages
  }

  /**
   * 检测变更的包
   * 
   * @param since - 起始引用（分支、标签、提交）
   * @param until - 结束引用，默认为 HEAD
   * @returns 变更的包列表
   * 
   * @example
   * ```typescript
   * // 检测相对于 main 分支的变更
   * const changed = await monorepo.detectChangedPackages('main')
   * 
   * // 检测特定提交范围
   * const changed = await monorepo.detectChangedPackages('abc123', 'def456')
   * ```
   */
  async detectChangedPackages(
    since: string,
    until: string = 'HEAD'
  ): Promise<ChangedPackageInfo[]> {
    try {
      // 获取变更的文件
      const diffResult = await this.git.diff([
        '--name-status',
        `${since}...${until}`,
      ])
      
      const changedFiles = new Map<string, {
        files: string[]
        types: Set<'added' | 'modified' | 'deleted'>
      }>()
      
      // 解析 diff 输出
      const lines = diffResult.split('\n').filter((line) => line.trim())
      for (const line of lines) {
        const [status, filePath] = line.split('\t')
        if (!filePath) continue
        
        const changeType = this.parseChangeType(status)
        
        // 找到文件所属的包
        const packages = await this.discoverPackages()
        for (const pkg of packages) {
          const pkgPath = path.join(this.workspaceRoot, pkg.path)
          const absoluteFilePath = path.join(this.workspaceRoot, filePath)
          
          if (absoluteFilePath.startsWith(pkgPath)) {
            if (!changedFiles.has(pkg.name)) {
              changedFiles.set(pkg.name, {
                files: [],
                types: new Set(),
              })
            }
            
            const entry = changedFiles.get(pkg.name)!
            entry.files.push(filePath)
            entry.types.add(changeType)
          }
        }
      }
      
      // 构建结果
      const packages = await this.discoverPackages()
      const result: ChangedPackageInfo[] = []
      
      for (const pkg of packages) {
        const changes = changedFiles.get(pkg.name)
        if (changes) {
          result.push({
            ...pkg,
            changedFiles: changes.files,
            changeTypes: Array.from(changes.types),
          })
        }
      }
      
      return result
    } catch (error) {
      throw new GitOperationError(
        `检测变更包失败: ${error instanceof Error ? error.message : String(error)}`,
        'MONOREPO_DETECT_FAILED',
        'detectChangedPackages',
        error as Error
      )
    }
  }

  /**
   * 获取受影响的包
   * 
   * 分析包的依赖关系,找出所有受影响的包
   * 
   * @param changedPackages - 变更的包名列表
   * @returns 影响分析结果
   * 
   * @example
   * ```typescript
   * const impact = await monorepo.getAffectedPackages(['@myorg/utils'])
   * console.log('直接影响:', impact.directlyAffected)
   * console.log('间接影响:', impact.indirectlyAffected)
   * ```
   */
  async getAffectedPackages(
    changedPackages: string[]
  ): Promise<ImpactAnalysis> {
    const packages = await this.discoverPackages()
    
    // 构建依赖图（反向）
    const dependencyGraph = new Map<string, Set<string>>()
    
    for (const pkg of packages) {
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      }
      
      for (const depName of Object.keys(allDeps)) {
        if (!dependencyGraph.has(depName)) {
          dependencyGraph.set(depName, new Set())
        }
        dependencyGraph.get(depName)!.add(pkg.name)
      }
    }
    
    // 查找受影响的包
    const directlyAffected = new Set<string>()
    const visited = new Set<string>()
    const queue: string[] = [...changedPackages]
    
    // BFS 遍历依赖图
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      
      const dependents = dependencyGraph.get(current)
      if (dependents) {
        for (const dependent of dependents) {
          directlyAffected.add(dependent)
          queue.push(dependent)
        }
      }
    }
    
    // 分离直接和间接影响
    const indirectlyAffected = new Set<string>()
    for (const pkg of directlyAffected) {
      let isDirect = false
      for (const changed of changedPackages) {
        const deps = dependencyGraph.get(changed)
        if (deps?.has(pkg)) {
          isDirect = true
          break
        }
      }
      if (!isDirect) {
        indirectlyAffected.add(pkg)
      }
    }
    
    // 移除间接影响中已在直接影响中的包
    for (const pkg of indirectlyAffected) {
      directlyAffected.delete(pkg)
    }
    
    // 转换为普通对象
    const graphObj: Record<string, string[]> = {}
    for (const [key, value] of dependencyGraph) {
      graphObj[key] = Array.from(value)
    }
    
    return {
      directlyAffected: Array.from(directlyAffected),
      indirectlyAffected: Array.from(indirectlyAffected),
      allAffected: [
        ...Array.from(directlyAffected),
        ...Array.from(indirectlyAffected),
      ],
      dependencyGraph: graphObj,
    }
  }

  /**
   * 更新包版本
   * 
   * @param packageNames - 包名列表
   * @param bumpType - 版本变更类型
   * @returns 版本变更结果列表
   * 
   * @example
   * ```typescript
   * // 升级 patch 版本
   * const results = await monorepo.bumpVersion(['@myorg/core'], 'patch')
   * 
   * // 升级 minor 版本
   * const results = await monorepo.bumpVersion(['@myorg/ui'], 'minor')
   * ```
   */
  async bumpVersion(
    packageNames: string[],
    bumpType: VersionBumpType
  ): Promise<VersionBumpResult[]> {
    const packages = await this.discoverPackages()
    const results: VersionBumpResult[] = []
    
    for (const pkgName of packageNames) {
      const pkg = packages.find((p) => p.name === pkgName)
      if (!pkg) {
        throw new GitOperationError(
          `包 "${pkgName}" 不存在`,
          'PACKAGE_NOT_FOUND',
          'bumpVersion'
        )
      }
      
      const oldVersion = pkg.version
      const newVersion = this.incrementVersion(oldVersion, bumpType)
      
      // 更新 package.json
      const packageJsonPath = path.join(
        this.workspaceRoot,
        pkg.path,
        'package.json'
      )
      
      try {
        const content = await fs.readFile(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(content)
        packageJson.version = newVersion
        
        await fs.writeFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + '\n',
          'utf-8'
        )
        
        results.push({
          package: pkgName,
          oldVersion,
          newVersion,
          bumpType,
        })
      } catch (error) {
        throw new GitOperationError(
          `更新包版本失败: ${error instanceof Error ? error.message : String(error)}`,
          'VERSION_BUMP_FAILED',
          'bumpVersion',
          error as Error
        )
      }
    }
    
    return results
  }

  /**
   * 获取包之间的依赖关系
   * 
   * @returns 依赖图
   * 
   * @example
   * ```typescript
   * const graph = await monorepo.getDependencyGraph()
   * console.log('依赖关系:', graph)
   * ```
   */
  async getDependencyGraph(): Promise<Record<string, string[]>> {
    const packages = await this.discoverPackages()
    const graph: Record<string, string[]> = {}
    
    const packageNames = new Set(packages.map((p) => p.name))
    
    for (const pkg of packages) {
      const deps = new Set<string>()
      
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      }
      
      for (const depName of Object.keys(allDeps)) {
        // 只包含 monorepo 内部的依赖
        if (packageNames.has(depName)) {
          deps.add(depName)
        }
      }
      
      graph[pkg.name] = Array.from(deps)
    }
    
    return graph
  }

  /**
   * 获取包的发布顺序
   * 
   * 基于依赖关系计算正确的发布顺序
   * 
   * @param packageNames - 要发布的包（可选，默认所有包）
   * @returns 按发布顺序排列的包名列表
   * 
   * @example
   * ```typescript
   * const order = await monorepo.getPublishOrder()
   * console.log('发布顺序:', order)
   * ```
   */
  async getPublishOrder(packageNames?: string[]): Promise<string[]> {
    const graph = await this.getDependencyGraph()
    const packages = packageNames || Object.keys(graph)
    
    // 拓扑排序
    const inDegree = new Map<string, number>()
    const adjList = new Map<string, string[]>()
    
    // 初始化
    for (const pkg of packages) {
      inDegree.set(pkg, 0)
      adjList.set(pkg, [])
    }
    
    // 构建图
    for (const pkg of packages) {
      const deps = graph[pkg] || []
      for (const dep of deps) {
        if (packages.includes(dep)) {
          adjList.get(dep)!.push(pkg)
          inDegree.set(pkg, (inDegree.get(pkg) || 0) + 1)
        }
      }
    }
    
    // BFS
    const queue: string[] = []
    for (const [pkg, degree] of inDegree) {
      if (degree === 0) {
        queue.push(pkg)
      }
    }
    
    const result: string[] = []
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)
      
      const neighbors = adjList.get(current) || []
      for (const neighbor of neighbors) {
        const degree = inDegree.get(neighbor)!
        inDegree.set(neighbor, degree - 1)
        if (degree - 1 === 0) {
          queue.push(neighbor)
        }
      }
    }
    
    if (result.length !== packages.length) {
      throw new GitOperationError(
        '检测到循环依赖',
        'CIRCULAR_DEPENDENCY',
        'getPublishOrder'
      )
    }
    
    return result
  }

  /**
   * 展开 glob 模式
   */
  private async expandGlob(pattern: string): Promise<string[]> {
    const basePath = path.join(this.workspaceRoot, pattern.replace('/*', ''))
    
    try {
      const entries = await fs.readdir(basePath, { withFileTypes: true })
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(basePath, entry.name))
    } catch {
      return []
    }
  }

  /**
   * 解析变更类型
   */
  private parseChangeType(
    status: string
  ): 'added' | 'modified' | 'deleted' {
    if (status.startsWith('A')) return 'added'
    if (status.startsWith('D')) return 'deleted'
    return 'modified'
  }

  /**
   * 增加版本号
   */
  private incrementVersion(
    version: string,
    bumpType: VersionBumpType
  ): string {
    const parts = version.split('.').map(Number)
    if (parts.length !== 3) {
      throw new GitOperationError(
        `无效的版本号格式: ${version}`,
        'INVALID_VERSION',
        'incrementVersion'
      )
    }
    
    let [major, minor, patch] = parts
    
    switch (bumpType) {
      case 'major':
        major++
        minor = 0
        patch = 0
        break
      case 'minor':
        minor++
        patch = 0
        break
      case 'patch':
        patch++
        break
    }
    
    return `${major}.${minor}.${patch}`
  }
}
