---
layout: home

hero:
  name: "@ldesign/git"
  text: 功能强大的 Git 操作工具库
  tagline: 简化 Git 操作，提升开发效率
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/
    - theme: alt
      text: GitHub
      link: https://github.com/your-org/ldesign-git

features:
  - icon: 🚀
    title: 高性能
    details: 内置性能监控，支持操作缓存和批量处理，提供卓越的执行效率
  
  - icon: 📦
    title: 功能全面
    details: 涵盖分支、标签、提交、合并等所有常用 Git 操作，以及 LFS、Monorepo 等高级功能
  
  - icon: 🤖
    title: 智能自动化
    details: 提供智能提交、工作流自动化、批量操作等工具，减少重复劳动
  
  - icon: 🔍
    title: 深度分析
    details: 支持 Blame 分析、Bisect 调试、Reflog 追踪，快速定位问题
  
  - icon: 🛡️
    title: 安全可靠
    details: 完善的错误处理机制，支持 GPG 签名验证，保障代码安全
  
  - icon: 📊
    title: 数据可视化
    details: 内置分析工具和报告生成器，直观展示仓库状态和代码质量
---

## 快速开始

```bash
# 安装
npm install @ldesign/git

# 或使用 pnpm
pnpm add @ldesign/git
```

## 简单示例

```typescript
import { GitManager } from '@ldesign/git'

// 创建 Git 管理器实例
const git = new GitManager('/path/to/repo')

// 初始化仓库
await git.init()

// 提交更改
await git.add('.')
await git.commit('Initial commit')

// 推送到远程
await git.push('origin', 'main')
```

## 高级功能

### 性能监控

```typescript
import { PerformanceMonitor } from '@ldesign/git'

const monitor = new PerformanceMonitor('/path/to/repo')
await monitor.start()

// 执行 Git 操作
await git.commit('Update files')

const report = await monitor.getReport()
console.log(report)
```

### Monorepo 管理

```typescript
import { MonorepoManager } from '@ldesign/git'

const monorepo = new MonorepoManager('/path/to/monorepo')

// 检测变更的包
const changed = await monorepo.detectChangedPackages('main')

// 发布变更的包
await monorepo.publishPackages(changed, { registry: 'npm' })
```

### 问题定位 (Bisect)

```typescript
import { BisectManager } from '@ldesign/git'

const bisect = new BisectManager('/path/to/repo')

// 开始二分查找
await bisect.start('bad-commit', 'good-commit')

// 自动化查找引入 bug 的提交
const result = await bisect.auto(async () => {
  // 运行测试
  return runTests()
})

console.log('Bug 引入于:', result.firstBadCommit)
```

## 为什么选择 @ldesign/git？

- ✅ **TypeScript 原生支持**：完整的类型定义，提供优秀的开发体验
- ✅ **模块化设计**：按需引入，减小打包体积
- ✅ **企业级可靠**：经过大量生产环境验证
- ✅ **活跃维护**：持续更新，快速响应问题
- ✅ **完善文档**：详细的 API 文档和丰富的使用示例

## 许可证

[MIT License](https://opensource.org/licenses/MIT)
