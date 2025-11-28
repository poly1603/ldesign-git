# @ldesign/git-core

LDesign Git 核心功能库 - 提供完整的 Git 操作 API

## 📦 安装

```bash
npm install @ldesign/git-core
# 或
pnpm add @ldesign/git-core
```

## 🚀 快速开始

```typescript
import { GitManager, BranchManager, TagManager } from '@ldesign/git-core'

// 初始化
const git = new GitManager({ baseDir: './my-project' })

// 基础操作
await git.init()
await git.add('.')
await git.commit('feat: initial commit')
await git.push('origin', 'main')

// 分支管理
const branchManager = new BranchManager({ baseDir: './my-project' })
await branchManager.createBranch('feature/new-feature')
await branchManager.checkoutBranch('feature/new-feature')
```

## ✨ 功能特性

### 核心功能
- 🚀 完善的 Git 基础操作（分支、标签、暂存、合并、变基）
- 🌿 强大的分支管理（创建、删除、重命名、比较、跟踪）
- 🏷️ 全面的标签管理（轻量级/注释标签、版本管理）
- 💾 灵活的暂存区管理（stash 操作）
- 🔀 智能的合并与变基（冲突检测、多种策略）

### 高级自动化
- 🤖 智能提交系统（自动分析变更，生成规范的提交信息）
- 🔄 工作流自动化（Git Flow、GitHub Flow、GitLab Flow）
- 📦 批量操作（批量分支、标签、合并）
- 👀 代码审查辅助（变更摘要、影响分析）

### Git Hooks
- 🪝 Hooks 管理器（安装、配置、管理 Git Hooks）
- 📝 提交信息验证
- 🧪 预提交检查

### 统计分析
- 📊 详细的提交分析（按作者、时间、类型统计）
- 📈 仓库分析（文件变更、代码趋势、分支生命周期）
- 📄 多格式报告生成（Markdown、JSON、CSV、HTML）

### 最新功能（v0.4.0）
- ⚡ 性能监控器 - 实时追踪Git操作性能
- 🔒 LFS 管理器 - 完整的Git LFS支持
- 📦 Monorepo 管理器 - 智能包检测、依赖分析
- 🕐 Reflog 管理器 - 完整的reflog操作

## 📚 API 文档

详细的 API 文档请查看 [主仓库文档](../../README.md)

## 📝 License

MIT