# 示例

本章节提供了 @ldesign/git 的实际使用示例，涵盖常见的使用场景。

## 基础示例

### 简单的提交流程

```typescript path=null start=null
import { GitManager } from '@ldesign/git'

async function simpleCommit() {
  const git = new GitManager('/path/to/repo')
  
  // 添加所有更改
  await git.add('.')
  
  // 提交
  await git.commit('feat: Add new feature')
  
  // 推送到远程
  await git.push('origin', 'main')
}
```

### 创建特性分支

```typescript path=null start=null
import { BranchManager } from '@ldesign/git'

async function createFeatureBranch() {
  const branches = new BranchManager('/path/to/repo')
  
  // 创建并切换到新分支
  await branches.create('feature/user-auth', { checkout: true })
  
  // 做一些修改...
  
  // 切换回主分支
  await branches.checkout('main')
  
  // 合并特性分支
  await branches.merge('feature/user-auth')
  
  // 删除特性分支
  await branches.delete('feature/user-auth')
}
```

### 发布新版本

```typescript path=null start=null
import { GitManager, TagManager } from '@ldesign/git'

async function releaseVersion(version: string) {
  const git = new GitManager('/path/to/repo')
  const tags = new TagManager('/path/to/repo')
  
  // 更新版本文件
  // updateVersion(version)
  
  // 提交版本更改
  await git.add('package.json')
  await git.commit(`chore: Bump version to ${version}`)
  
  // 创建带注释的标签
  await tags.create(version, {
    message: `Release ${version}`,
    annotated: true,
    sign: true
  })
  
  // 推送提交和标签
  await git.push('origin', 'main')
  await tags.push('origin', version)
}
```

## 性能优化

### 监控和优化仓库性能

```typescript path=null start=null
import { PerformanceMonitor } from '@ldesign/git'

async function optimizeRepository() {
  const monitor = new PerformanceMonitor('/path/to/repo')
  
  // 开始监控
  await monitor.start()
  
  // 执行一系列 Git 操作
  // ...
  
  // 停止监控
  await monitor.stop()
  
  // 获取性能报告
  const report = await monitor.getReport()
  console.log('Performance Report:')
  console.log(`Total Operations: ${report.totalOperations}`)
  console.log(`Average Time: ${report.averageTime}ms`)
  console.log(`Slowest Operation: ${report.slowestOperation.name} (${report.slowestOperation.duration}ms)`)
  
  // 分析瓶颈
  const bottlenecks = await monitor.analyzeBottlenecks()
  if (bottlenecks.length > 0) {
    console.log('\\nPerformance Bottlenecks:')
    bottlenecks.forEach(b => {
      console.log(`- ${b.operation}: ${b.reason}`)
    })
  }
  
  // 优化仓库
  console.log('\\nOptimizing repository...')
  await monitor.optimizeRepository()
  console.log('Optimization complete!')
}
```

[查看完整示例 →](/examples/performance)

## Monorepo 管理

### 自动发布变更的包

```typescript path=null start=null
import { MonorepoManager } from '@ldesign/git'

async function publishChangedPackages() {
  const monorepo = new MonorepoManager('/path/to/monorepo', {
    packagesPath: 'packages',
    workspaces: ['packages/*']
  })
  
  // 检测自上次发布以来变更的包
  const changedPackages = await monorepo.detectChangedPackages('main')
  
  if (changedPackages.length === 0) {
    console.log('No packages changed')
    return
  }
  
  console.log('Changed packages:', changedPackages.join(', '))
  
  // 获取依赖关系
  const graph = await monorepo.getDependencyGraph()
  
  // 按依赖顺序获取发布顺序
  const publishOrder = await monorepo.getTopologicalOrder()
  console.log('Publish order:', publishOrder.join(' → '))
  
  // 发布包
  await monorepo.publishPackages(changedPackages, {
    registry: 'https://registry.npmjs.org',
    access: 'public',
    tag: 'latest'
  })
  
  console.log('All packages published successfully!')
}
```

[查看完整示例 →](/examples/monorepo)

## 问题定位

### 使用 Bisect 查找引入 Bug 的提交

```typescript path=null start=null
import { BisectManager } from '@ldesign/git'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function findBuggyCommit() {
  const bisect = new BisectManager('/path/to/repo')
  
  // 定义测试函数
  async function runTests(): Promise<boolean> {
    try {
      await execAsync('npm test')
      return true // 测试通过
    } catch {
      return false // 测试失败
    }
  }
  
  // 自动化二分查找
  console.log('Starting bisect...')
  const result = await bisect.auto(runTests)
  
  if (result.found) {
    console.log(`Bug introduced in commit: ${result.firstBadCommit}`)
    console.log(`Author: ${result.author}`)
    console.log(`Date: ${result.date}`)
    console.log(`Message: ${result.message}`)
  } else {
    console.log('Could not determine the buggy commit')
  }
}
```

### 使用 Blame 分析代码所有权

```typescript path=null start=null
import { BlameAnalyzer } from '@ldesign/git'

async function analyzeCodeOwnership() {
  const blame = new BlameAnalyzer('/path/to/repo')
  
  const files = [
    'src/core/api.ts',
    'src/core/auth.ts',
    'src/utils/helpers.ts'
  ]
  
  for (const file of files) {
    console.log(`\\nAnalyzing ${file}...`)
    
    // 获取文件所有权
    const ownership = await blame.getFileOwnership(file)
    
    console.log('Code ownership:')
    ownership.forEach(owner => {
      const percentage = ((owner.lines / ownership.reduce((sum, o) => sum + o.lines, 0)) * 100).toFixed(1)
      console.log(`  ${owner.author}: ${owner.lines} lines (${percentage}%)`)
    })
  }
  
  // 生成报告
  const report = await blame.generateReport(files)
  console.log('\\nSummary:')
  console.log(`Total lines analyzed: ${report.totalLines}`)
  console.log(`Contributors: ${report.contributors}`)
}
```

[查看完整示例 →](/examples/debugging)

## 代码审查

### 生成变更审查报告

```typescript path=null start=null
import { ReviewHelper, DiffManager } from '@ldesign/git'

async function generateReviewReport() {
  const reviewer = new ReviewHelper('/path/to/repo')
  const diff = new DiffManager('/path/to/repo')
  
  // 生成审查报告
  const report = await reviewer.generateReviewReport('main', 'feature/new')
  
  console.log('Review Report')
  console.log('=============')
  console.log(`Files changed: ${report.filesChanged}`)
  console.log(`Lines added: ${report.linesAdded}`)
  console.log(`Lines deleted: ${report.linesDeleted}`)
  console.log(`\\nCommits: ${report.commits.length}`)
  
  // 检查潜在问题
  const issues = await reviewer.detectIssues('feature/new')
  
  if (issues.length > 0) {
    console.log('\\nPotential Issues:')
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.type}: ${issue.message}`)
      console.log(`   File: ${issue.file}:${issue.line}`)
    })
  }
  
  // 获取详细的文件差异
  const fileDiff = await diff.getFileDiff('main', 'feature/new', 'src/api.ts')
  console.log('\\nChanges in src/api.ts:')
  console.log(fileDiff)
}
```

[查看完整示例 →](/examples/code-review)

## 工作流自动化

### CI/CD 集成

```typescript path=null start=null
import { WorkflowAutomation, GitManager } from '@ldesign/git'

async function cicdWorkflow() {
  const workflow = new WorkflowAutomation('/path/to/repo')
  const git = new GitManager('/path/to/repo')
  
  // 定义 CI 工作流
  await workflow.defineWorkflow('ci', [
    {
      type: 'fetch',
      remote: 'origin'
    },
    {
      type: 'checkout',
      branch: 'main'
    },
    {
      type: 'pull',
      remote: 'origin',
      branch: 'main'
    }
  ])
  
  // 定义发布工作流
  await workflow.defineWorkflow('release', [
    {
      type: 'branch',
      action: 'create',
      name: 'release/{{version}}',
      from: 'main'
    },
    {
      type: 'tag',
      action: 'create',
      name: '{{version}}',
      message: 'Release {{version}}',
      annotated: true
    },
    {
      type: 'push',
      remote: 'origin',
      refs: ['release/{{version}}', '{{version}}']
    }
  ])
  
  // 执行 CI 工作流
  await workflow.executeWorkflow('ci')
  
  // 运行测试
  // await runTests()
  
  // 如果测试通过，执行发布工作流
  await workflow.executeWorkflow('release', {
    version: 'v1.2.0'
  })
}
```

### 批量操作

```typescript path=null start=null
import { BatchOperations, BranchManager } from '@ldesign/git'

async function cleanupBranches() {
  const batch = new BatchOperations('/path/to/repo')
  const branches = new BranchManager('/path/to/repo')
  
  // 获取所有分支
  const allBranches = await branches.list()
  
  // 过滤出已合并的特性分支
  const mergedFeatures = allBranches.filter(branch => 
    branch.startsWith('feature/') && branch.merged
  )
  
  if (mergedFeatures.length === 0) {
    console.log('No merged feature branches to delete')
    return
  }
  
  console.log(`Found ${mergedFeatures.length} merged feature branches`)
  console.log(mergedFeatures.join('\\n'))
  
  // 批量删除
  await batch.deleteBranches(mergedFeatures)
  
  console.log('All merged feature branches deleted!')
}
```

## LFS 管理

### 迁移大文件到 LFS

```typescript path=null start=null
import { LFSManager, GitManager } from '@ldesign/git'

async function migrateLargeFiles() {
  const lfs = new LFSManager('/path/to/repo')
  const git = new GitManager('/path/to/repo')
  
  // 安装 LFS
  await lfs.install()
  
  // 追踪大文件类型
  const patterns = ['*.psd', '*.mp4', '*.zip', '*.pdf']
  for (const pattern of patterns) {
    await lfs.track(pattern)
  }
  
  // 提交 .gitattributes
  await git.add('.gitattributes')
  await git.commit('chore: Configure Git LFS')
  
  // 迁移历史中的大文件
  console.log('Migrating existing large files...')
  await lfs.migrate(patterns, {
    include: true,
    everything: true
  })
  
  // 获取 LFS 状态
  const tracked = await lfs.listTracked()
  console.log('\\nTracked patterns:')
  tracked.forEach(t => console.log(`  ${t}`))
  
  // 推送更改
  await git.push('origin', 'main')
  console.log('\\nMigration complete!')
}
```

## 更多示例

- [基础操作](/examples/basic) - 常用的 Git 操作
- [性能优化](/examples/performance) - 监控和优化性能
- [Monorepo 发布](/examples/monorepo) - 管理和发布 Monorepo
- [问题定位](/examples/debugging) - 使用 Bisect 和 Blame
- [代码审查](/examples/code-review) - 生成审查报告

## 贡献示例

如果你有好的使用示例，欢迎贡献！请查看[贡献指南](https://github.com/your-org/ldesign-git/blob/main/CONTRIBUTING.md)。
