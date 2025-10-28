# API 参考

@ldesign/git 提供了丰富的 API 来管理 Git 仓库。所有的管理器和工具都可以从主包中导入。

## 核心管理器

### GitManager

主要的 Git 操作管理器，提供基本的 Git 命令封装。

```typescript
import { GitManager } from '@ldesign/git'

const git = new GitManager('/path/to/repo')
```

**主要方法：**
- `init(options?)` - 初始化仓库
- `clone(url, options?)` - 克隆仓库
- `add(files)` - 添加文件到暂存区
- `commit(message, options?)` - 提交更改
- `push(remote, branch, options?)` - 推送到远程
- `pull(remote, branch, options?)` - 拉取远程更改
- `fetch(remote, options?)` - 获取远程更改
- `status()` - 查看工作区状态
- `log(options?)` - 查看提交历史
- `diff(ref1?, ref2?)` - 查看差异

[查看完整文档 →](/api/git-manager)

### BranchManager

分支管理器，处理所有与分支相关的操作。

```typescript
import { BranchManager } from '@ldesign/git'

const branches = new BranchManager('/path/to/repo')
```

**主要方法：**
- `create(name, options?)` - 创建分支
- `delete(name, options?)` - 删除分支
- `checkout(name)` - 切换分支
- `list(options?)` - 列出分支
- `rename(oldName, newName)` - 重命名分支
- `merge(branch, options?)` - 合并分支
- `getCurrent()` - 获取当前分支

[查看完整文档 →](/api/branch-manager)

### TagManager

标签管理器，管理 Git 标签。

```typescript
import { TagManager } from '@ldesign/git'

const tags = new TagManager('/path/to/repo')
```

**主要方法：**
- `create(name, options?)` - 创建标签
- `delete(name)` - 删除标签
- `list(options?)` - 列出标签
- `push(remote, tag)` - 推送标签
- `verify(name)` - 验证签名标签

[查看完整文档 →](/api/tag-manager)

### StashManager

存储管理器，管理工作区的临时存储。

```typescript
import { StashManager } from '@ldesign/git'

const stash = new StashManager('/path/to/repo')
```

**主要方法：**
- `save(message?)` - 保存更改
- `list()` - 列出所有存储
- `apply(index?)` - 应用存储
- `pop(index?)` - 应用并删除存储
- `drop(index?)` - 删除存储
- `clear()` - 清除所有存储

[查看完整文档 →](/api/stash-manager)

### MergeManager

合并管理器，处理分支合并和冲突解决。

```typescript
import { MergeManager } from '@ldesign/git'

const merge = new MergeManager('/path/to/repo')
```

**主要方法：**
- `merge(branch, options?)` - 合并分支
- `abort()` - 中止合并
- `getConflicts()` - 获取冲突文件
- `resolveConflict(file, resolution)` - 解决冲突
- `continue()` - 继续合并

[查看完整文档 →](/api/merge-manager)

## 高级功能

### PerformanceMonitor

性能监控工具，监控和优化 Git 操作性能。

```typescript
import { PerformanceMonitor } from '@ldesign/git'

const monitor = new PerformanceMonitor('/path/to/repo')
```

**主要方法：**
- `start()` - 开始监控
- `stop()` - 停止监控
- `getReport()` - 获取性能报告
- `optimizeRepository()` - 优化仓库
- `analyzeBottlenecks()` - 分析性能瓶颈

[查看完整文档 →](/api/performance-monitor)

### LFSManager

Git LFS 管理器，管理大文件存储。

```typescript
import { LFSManager } from '@ldesign/git'

const lfs = new LFSManager('/path/to/repo')
```

**主要方法：**
- `install()` - 安装 LFS
- `track(pattern)` - 追踪文件模式
- `untrack(pattern)` - 取消追踪
- `listTracked()` - 列出追踪的文件
- `migrate(files, options)` - 迁移文件到 LFS
- `pull()` - 拉取 LFS 文件

[查看完整文档 →](/api/lfs-manager)

### MonorepoManager

Monorepo 管理器，管理包含多个包的仓库。

```typescript
import { MonorepoManager } from '@ldesign/git'

const monorepo = new MonorepoManager('/path/to/repo')
```

**主要方法：**
- `detectChangedPackages(base)` - 检测变更的包
- `getDependencyGraph()` - 获取依赖图
- `getTopologicalOrder()` - 获取拓扑排序
- `publishPackages(packages, options)` - 发布包
- `runScriptInPackages(script, packages)` - 在包中运行脚本

[查看完整文档 →](/api/monorepo-manager)

### ReflogManager

Reflog 管理器，管理引用日志。

```typescript
import { ReflogManager } from '@ldesign/git'

const reflog = new ReflogManager('/path/to/repo')
```

**主要方法：**
- `show(ref?, options?)` - 显示 reflog
- `expire(options?)` - 清理过期条目
- `delete(ref)` - 删除 reflog
- `exists(ref)` - 检查是否存在
- `recover(ref, index)` - 恢复引用

[查看完整文档 →](/api/reflog-manager)

### BisectManager

Bisect 管理器，二分查找引入 bug 的提交。

```typescript
import { BisectManager } from '@ldesign/git'

const bisect = new BisectManager('/path/to/repo')
```

**主要方法：**
- `start(bad, good?)` - 开始二分查找
- `good(commit?)` - 标记为好的提交
- `bad(commit?)` - 标记为坏的提交
- `skip(commit?)` - 跳过提交
- `reset()` - 重置
- `auto(testFn)` - 自动化查找

[查看完整文档 →](/api/bisect-manager)

### BlameAnalyzer

Blame 分析器，分析代码作者和历史。

```typescript
import { BlameAnalyzer } from '@ldesign/git'

const blame = new BlameAnalyzer('/path/to/repo')
```

**主要方法：**
- `analyze(file, options?)` - 分析文件
- `getLineAuthor(file, line)` - 获取行作者
- `getFileOwnership(file)` - 获取文件所有权
- `generateReport(files)` - 生成报告

[查看完整文档 →](/api/blame-analyzer)

### SignManager

GPG 签名管理器，管理提交和标签的签名。

```typescript
import { SignManager } from '@ldesign/git'

const sign = new SignManager('/path/to/repo')
```

**主要方法：**
- `configureKey(keyId)` - 配置 GPG 密钥
- `signCommit(message, options?)` - 签名提交
- `signTag(name, options?)` - 签名标签
- `verifyCommit(commit)` - 验证提交签名
- `verifyTag(tag)` - 验证标签签名

[查看完整文档 →](/api/sign-manager)

### NotesManager

Git Notes 管理器，管理提交注释。

```typescript
import { NotesManager } from '@ldesign/git'

const notes = new NotesManager('/path/to/repo')
```

**主要方法：**
- `add(commit, note, options?)` - 添加注释
- `show(commit, options?)` - 显示注释
- `remove(commit, options?)` - 删除注释
- `list(options?)` - 列出所有注释
- `merge(ref, options?)` - 合并注释

[查看完整文档 →](/api/notes-manager)

## 自动化工具

### SmartCommit

智能提交工具，自动生成规范的提交信息。

```typescript
import { SmartCommit } from '@ldesign/git'

const smartCommit = new SmartCommit('/path/to/repo')
```

**主要方法：**
- `analyze()` - 分析更改
- `commit(options)` - 提交更改
- `configure(rules)` - 配置规则

[查看完整文档 →](/api/smart-commit)

### WorkflowAutomation

工作流自动化工具，定义和执行自定义工作流。

```typescript
import { WorkflowAutomation } from '@ldesign/git'

const workflow = new WorkflowAutomation('/path/to/repo')
```

**主要方法：**
- `defineWorkflow(name, steps)` - 定义工作流
- `executeWorkflow(name, variables?)` - 执行工作流
- `listWorkflows()` - 列出工作流
- `deleteWorkflow(name)` - 删除工作流

[查看完整文档 →](/api/workflow-automation)

### BatchOperations

批量操作工具，高效处理多个对象。

```typescript
import { BatchOperations } from '@ldesign/git'

const batch = new BatchOperations('/path/to/repo')
```

**主要方法：**
- `deleteBranches(branches)` - 批量删除分支
- `mergeBranches(branches, target)` - 批量合并分支
- `createTags(tags)` - 批量创建标签
- `deleteTags(tags)` - 批量删除标签

[查看完整文档 →](/api/batch-operations)

## 类型定义

所有的类型定义都可以从主包中导入：

```typescript
import type {
  GitOptions,
  CommitOptions,
  BranchOptions,
  TagOptions,
  MergeOptions,
  // ... 更多类型
} from '@ldesign/git'
```

## 错误处理

所有操作都可能抛出 `GitError`：

```typescript
import { GitError } from '@ldesign/git'

try {
  await git.commit('Update files')
} catch (error) {
  if (error instanceof GitError) {
    // 处理 Git 错误
  }
}
```

## 下一步

- 浏览各个管理器的详细文档
- 查看[示例代码](/examples/)了解实际用法
- 阅读[指南](/guide/)深入了解各个功能
