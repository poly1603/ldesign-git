# 介绍

@ldesign/git 是一个功能强大且易用的 Git 操作工具库，旨在简化 Node.js 环境下的 Git 操作。

## 特性

### 核心功能

- **完整的 Git 操作**：涵盖初始化、提交、分支、标签、合并等所有常用操作
- **分支管理**：创建、删除、切换、合并分支，支持批量操作
- **标签管理**：创建轻量标签和附注标签，支持 GPG 签名
- **存储管理**：保存、恢复、删除暂存区更改
- **远程仓库**：管理远程仓库，同步本地和远程分支

### 高级功能

#### 性能监控 (v0.4.0+)
- 实时监控 Git 操作性能
- 自动检测性能瓶颈
- 生成详细的性能报告

#### Git LFS (v0.4.0+)
- 管理大文件存储
- 追踪和取消追踪文件
- 迁移现有大文件到 LFS

#### Monorepo 管理 (v0.4.0+)
- 检测变更的包
- 管理包依赖关系
- 自动化版本发布

#### Reflog 操作 (v0.4.0+)
- 查看引用日志
- 恢复误删的分支或提交
- 分析操作历史

#### Bisect 调试 (v0.4.0+)
- 二分查找引入 bug 的提交
- 自动化测试集成
- 可视化调试过程

#### Blame 分析 (v0.4.0+)
- 逐行追踪代码作者
- 分析代码所有权
- 生成贡献报告

#### GPG 签名 (v0.4.0+)
- 配置 GPG 密钥
- 签名提交和标签
- 验证签名有效性

#### Git Notes (v0.4.0+)
- 添加和管理提交注释
- 同步注释到远程
- 搜索和查询注释

### 自动化工具

- **智能提交**：自动检测更改类型，生成规范的提交信息
- **工作流自动化**：配置和执行自定义工作流
- **批量操作**：高效处理多个分支或标签
- **代码审查助手**：生成审查报告，检测潜在问题
- **变更日志生成**：自动生成版本变更日志

### 分析工具

- **仓库分析器**：统计代码行数、提交频率、贡献者等信息
- **报告生成器**：生成 HTML、Markdown、JSON 格式的报告
- **提交分析器**：分析提交模式和代码质量

### 基础设施

- **错误处理**：统一的错误处理机制
- **日志系统**：灵活的日志记录
- **缓存机制**：提升重复操作的性能
- **依赖注入**：模块化的上下文管理

## 设计理念

### 1. 简单易用

提供直观的 API 设计，让开发者能够快速上手：

```typescript
const git = new GitManager('/path/to/repo')
await git.commit('Fix bug')
```

### 2. 类型安全

完整的 TypeScript 类型定义，在编写代码时就能发现错误：

```typescript
interface CommitOptions {
  message: string
  author?: string
  date?: Date
  amend?: boolean
}
```

### 3. 模块化

按功能划分模块，可以按需引入：

```typescript
import { BranchManager } from '@ldesign/git'
import { TagManager } from '@ldesign/git'
```

### 4. 可扩展

支持插件机制和自定义配置：

```typescript
const git = new GitManager('/path/to/repo', {
  logger: customLogger,
  cache: customCache
})
```

### 5. 高性能

内置性能优化和监控：

```typescript
const monitor = new PerformanceMonitor('/path/to/repo')
await monitor.optimizeRepository()
```

## 适用场景

### CI/CD 流程

在持续集成和部署流程中自动化 Git 操作：

```typescript
// 自动发布新版本
const workflow = new WorkflowAutomation(repoPath)
await workflow.defineWorkflow('release', [
  { type: 'branch', action: 'create', name: 'release/v1.0.0' },
  { type: 'tag', action: 'create', name: 'v1.0.0' },
  { type: 'push', remote: 'origin', refs: ['release/v1.0.0', 'v1.0.0'] }
])
await workflow.executeWorkflow('release')
```

### Monorepo 管理

管理包含多个包的单一仓库：

```typescript
const monorepo = new MonorepoManager(repoPath)
const changed = await monorepo.detectChangedPackages('main')
await monorepo.publishPackages(changed)
```

### 代码审查

生成详细的审查报告：

```typescript
const reviewer = new ReviewHelper(repoPath)
const report = await reviewer.generateReviewReport('main', 'feature/new')
console.log(report)
```

### 问题排查

快速定位引入 bug 的提交：

```typescript
const bisect = new BisectManager(repoPath)
const result = await bisect.auto(async () => {
  return runTests()
})
```

### 代码分析

分析仓库状态和代码质量：

```typescript
const analyzer = new RepositoryAnalyzer(repoPath)
const stats = await analyzer.analyze()
const generator = new ReportGenerator(repoPath)
await generator.generateHTML(stats, 'report.html')
```

## 浏览器兼容性

@ldesign/git 是为 Node.js 环境设计的，不支持浏览器环境。如果需要在浏览器中使用 Git 功能，请考虑使用 [isomorphic-git](https://isomorphic-git.org/)。

## 系统要求

- Node.js >= 14.0.0
- Git >= 2.0.0（需要在系统中安装 Git）

## 下一步

- [快速开始](/guide/getting-started) - 学习如何安装和使用
- [API 文档](/api/) - 查看完整的 API 参考
- [示例代码](/examples/) - 浏览实际使用示例
