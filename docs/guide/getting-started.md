# 快速开始

本指南将帮助你快速上手 @ldesign/git。

## 安装

### 使用 npm

```bash
npm install @ldesign/git
```

### 使用 pnpm

```bash
pnpm add @ldesign/git
```

### 使用 yarn

```bash
yarn add @ldesign/git
```

## 基本用法

### 初始化 Git 仓库

```typescript
import { GitManager } from '@ldesign/git'

const git = new GitManager('/path/to/repo')

// 初始化仓库
await git.init()

// 或者初始化裸仓库
await git.init({ bare: true })
```

### 提交更改

```typescript
// 添加文件到暂存区
await git.add('.')

// 提交更改
await git.commit('Initial commit')

// 带作者信息的提交
await git.commit('Fix bug', {
  author: 'John Doe <john@example.com>'
})

// 修改最后一次提交
await git.commit('Update message', { amend: true })
```

### 分支管理

```typescript
import { BranchManager } from '@ldesign/git'

const branches = new BranchManager('/path/to/repo')

// 创建新分支
await branches.create('feature/new-feature')

// 切换分支
await branches.checkout('feature/new-feature')

// 创建并切换分支
await branches.create('feature/another', { checkout: true })

// 列出所有分支
const allBranches = await branches.list()
console.log(allBranches)

// 删除分支
await branches.delete('feature/old-feature')

// 重命名分支
await branches.rename('old-name', 'new-name')
```

### 标签管理

```typescript
import { TagManager } from '@ldesign/git'

const tags = new TagManager('/path/to/repo')

// 创建轻量标签
await tags.create('v1.0.0')

// 创建附注标签
await tags.create('v1.0.0', {
  message: 'Release version 1.0.0',
  annotated: true
})

// 创建签名标签
await tags.create('v1.0.0', {
  message: 'Release version 1.0.0',
  annotated: true,
  sign: true
})

// 列出所有标签
const allTags = await tags.list()
console.log(allTags)

// 删除标签
await tags.delete('v0.9.0')

// 推送标签到远程
await tags.push('origin', 'v1.0.0')
```

### 远程仓库

```typescript
import { RemoteManager } from '@ldesign/git'

const remote = new RemoteManager('/path/to/repo')

// 添加远程仓库
await remote.add('origin', 'https://github.com/user/repo.git')

// 列出所有远程仓库
const remotes = await remote.list()
console.log(remotes)

// 获取远程仓库信息
const info = await remote.getUrl('origin')
console.log(info)

// 移除远程仓库
await remote.remove('origin')

// 推送到远程
await git.push('origin', 'main')

// 拉取远程更改
await git.pull('origin', 'main')

// 获取远程更改（不合并）
await git.fetch('origin')
```

### 查看状态和日志

```typescript
// 查看工作区状态
const status = await git.status()
console.log(status)

// 查看提交历史
const log = await git.log({ maxCount: 10 })
console.log(log)

// 查看特定分支的日志
const branchLog = await git.log({
  ref: 'feature/new-feature',
  maxCount: 20
})

// 查看文件修改
const diff = await git.diff()
console.log(diff)

// 查看两个提交之间的差异
const diffBetween = await git.diff('commit1', 'commit2')
```

### 存储更改

```typescript
import { StashManager } from '@ldesign/git'

const stash = new StashManager('/path/to/repo')

// 保存当前更改
await stash.save('Work in progress')

// 列出所有存储
const stashes = await stash.list()
console.log(stashes)

// 应用最近的存储
await stash.apply()

// 应用并删除存储
await stash.pop()

// 删除所有存储
await stash.clear()
```

## 高级用法

### 性能监控

```typescript
import { PerformanceMonitor } from '@ldesign/git'

const monitor = new PerformanceMonitor('/path/to/repo')

// 开始监控
await monitor.start()

// 执行 Git 操作
await git.commit('Update files')
await branches.create('feature/new')

// 停止监控并获取报告
await monitor.stop()
const report = await monitor.getReport()

console.log('Total operations:', report.totalOperations)
console.log('Average time:', report.averageTime)
console.log('Slowest operation:', report.slowestOperation)
```

### LFS 管理

```typescript
import { LFSManager } from '@ldesign/git'

const lfs = new LFSManager('/path/to/repo')

// 安装 Git LFS
await lfs.install()

// 追踪大文件
await lfs.track('*.psd')
await lfs.track('*.zip')

// 列出追踪的文件
const tracked = await lfs.listTracked()
console.log(tracked)

// 迁移现有文件到 LFS
await lfs.migrate(['*.mp4'], { include: true })

// 拉取 LFS 文件
await lfs.pull()
```

### Monorepo 管理

```typescript
import { MonorepoManager } from '@ldesign/git'

const monorepo = new MonorepoManager('/path/to/monorepo', {
  packagesPath: 'packages',
  workspaces: ['packages/*']
})

// 检测变更的包
const changed = await monorepo.detectChangedPackages('main')
console.log('Changed packages:', changed)

// 获取包依赖图
const graph = await monorepo.getDependencyGraph()
console.log(graph)

// 按依赖顺序排序包
const sorted = await monorepo.getTopologicalOrder()
console.log('Build order:', sorted)

// 发布变更的包
await monorepo.publishPackages(changed, {
  registry: 'https://registry.npmjs.org',
  access: 'public'
})
```

### 智能提交

```typescript
import { SmartCommit } from '@ldesign/git'

const smartCommit = new SmartCommit('/path/to/repo')

// 分析更改并生成提交信息
const suggestion = await smartCommit.analyze()
console.log('Suggested message:', suggestion.message)
console.log('Detected type:', suggestion.type)

// 使用建议的信息提交
await smartCommit.commit(suggestion)

// 或使用自定义规则
await smartCommit.commit({
  message: 'feat: Add new feature',
  type: 'feat',
  scope: 'api',
  breaking: false
})
```

### 工作流自动化

```typescript
import { WorkflowAutomation } from '@ldesign/git'

const workflow = new WorkflowAutomation('/path/to/repo')

// 定义发布工作流
await workflow.defineWorkflow('release', [
  {
    type: 'branch',
    action: 'create',
    name: 'release/{{version}}'
  },
  {
    type: 'tag',
    action: 'create',
    name: '{{version}}',
    message: 'Release {{version}}'
  },
  {
    type: 'push',
    remote: 'origin',
    refs: ['release/{{version}}', '{{version}}']
  }
])

// 执行工作流
await workflow.executeWorkflow('release', {
  version: 'v1.2.0'
})

// 列出所有工作流
const workflows = await workflow.listWorkflows()
console.log(workflows)
```

## 错误处理

所有的操作都可能抛出错误，建议使用 try-catch 进行错误处理：

```typescript
import { GitError } from '@ldesign/git'

try {
  await git.commit('Update files')
} catch (error) {
  if (error instanceof GitError) {
    console.error('Git operation failed:', error.message)
    console.error('Command:', error.command)
    console.error('Exit code:', error.exitCode)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

## 配置选项

大多数管理器都支持配置选项：

```typescript
import { GitManager } from '@ldesign/git'
import { Logger } from '@ldesign/git/logger'
import { Cache } from '@ldesign/git/cache'

const git = new GitManager('/path/to/repo', {
  // 自定义日志器
  logger: new Logger({
    level: 'debug',
    output: 'file',
    path: '/var/log/git.log'
  }),
  
  // 自定义缓存
  cache: new Cache({
    ttl: 3600,
    maxSize: 1000
  }),
  
  // Git 执行选项
  gitOptions: {
    maxBuffer: 10 * 1024 * 1024 // 10MB
  }
})
```

## 下一步

- [分支管理](/guide/branch-management) - 深入了解分支操作
- [性能监控](/guide/performance-monitor) - 优化 Git 操作性能
- [Monorepo](/guide/monorepo) - 管理 Monorepo 项目
- [API 文档](/api/) - 查看完整的 API 参考
- [示例代码](/examples/) - 浏览更多实际示例
