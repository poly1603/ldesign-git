# 快速开始

欢迎使用 @ldesign/git！这是一个功能强大的 Git 操作插件。

## 📦 安装

### 作为项目依赖

```bash
# 使用 pnpm
pnpm add @ldesign/git

# 使用 npm
npm install @ldesign/git

# 使用 yarn
yarn add @ldesign/git
```

### 全局安装 CLI 工具

```bash
# 使用 pnpm
pnpm add -g @ldesign/git

# 使用 npm
npm install -g @ldesign/git
```

## 🚀 快速上手

### 使用 API

```typescript
import { GitManager, BranchManager } from '@ldesign/git'

// 创建 Git 管理器
const git = new GitManager({ baseDir: './my-project' })

// 获取仓库状态
const status = await git.status()
console.log('当前分支:', status.current)
console.log('修改的文件:', status.modified)

// 分支管理
const branchManager = new BranchManager({ baseDir: './my-project' })
const branches = await branchManager.listBranches()
console.log('所有分支:', branches.all)
```

### 使用 CLI

```bash
# 查看仓库状态
ldesign-git status

# 列出所有分支
ldesign-git branch list

# 创建新分支
ldesign-git branch create feature/new-feature

# 智能提交
ldesign-git commit smart

# 查看帮助
ldesign-git --help
```

## 💡 核心概念

### 1. 管理器模式

@ldesign/git 使用管理器模式来组织功能：

- **GitManager** - 基础 Git 操作
- **BranchManager** - 分支管理
- **TagManager** - 标签管理
- **StashManager** - 暂存区管理
- **MergeManager** - 合并和变基

每个管理器都是独立的，可以单独使用。

### 2. 智能提交

智能提交系统可以自动分析你的文件变更，并建议合适的提交类型：

```typescript
import { SmartCommit } from '@ldesign/git'

const smartCommit = new SmartCommit()

// 分析变更
const suggestions = await smartCommit.analyzeChanges()
console.log('建议:', suggestions[0].type) // 例如: 'feat'

// 智能提交
await smartCommit.smartCommit({
  autoDetect: true
})
```

### 3. 工作流自动化

支持常见的 Git 工作流：

```typescript
import { WorkflowAutomation } from '@ldesign/git'

// Git Flow
const workflow = new WorkflowAutomation(
  WorkflowAutomation.getDefaultConfig('git-flow')
)

await workflow.initGitFlow()
await workflow.startFeature({ name: 'user-login' })
```

### 4. 批量操作

高效处理大量分支或标签：

```typescript
import { BatchOperations } from '@ldesign/git'

const batch = new BatchOperations()

// 批量删除已合并的分支
const result = await batch.cleanupMergedBranches('main')
console.log(`已删除 ${result.succeeded} 个分支`)
```

## 📚 常见场景

### 场景 1: 日常开发

```bash
# 1. 查看状态
ldesign-git status

# 2. 创建功能分支
ldesign-git branch create feature/new-feature -c

# 3. 开发完成后，智能提交
ldesign-git commit smart

# 4. 推送到远程
git push -u origin feature/new-feature
```

### 场景 2: 代码审查

```typescript
import { ReviewHelper } from '@ldesign/git'

const reviewer = new ReviewHelper()

// 生成审查数据
const review = await reviewer.generateReviewData('main', 'feature/new-feature')

console.log('影响级别:', review.impact.level)
console.log('变更文件数:', review.changes.files)
console.log('审查建议:', review.suggestions)

// 生成 Markdown 报告
const report = await reviewer.generateMarkdownReport('main', 'feature/new-feature')
```

### 场景 3: 版本发布

```bash
# 1. 开始发布
ldesign-git workflow release start 1.0.0

# 2. 更新版本号和 CHANGELOG
# ... 手动编辑文件 ...

# 3. 完成发布
ldesign-git workflow release finish 1.0.0

# 这将自动：
# - 合并到 main 分支
# - 创建标签 v1.0.0
# - 合并回 develop 分支
# - 删除发布分支
```

### 场景 4: 冲突解决

```bash
# 1. 检测冲突
ldesign-git conflict list

# 2. 交互式解决
ldesign-git conflict resolve

# 3. 或批量解决
ldesign-git conflict resolve-all --ours
```

### 场景 5: 仓库分析

```bash
# 1. 分析提交历史
ldesign-git analyze commits

# 2. 分析贡献者
ldesign-git analyze contributors

# 3. 生成完整报告
ldesign-git report -f markdown -o report.md
```

## 🎯 最佳实践

### 1. 使用智能提交

始终使用智能提交功能，确保提交信息符合规范：

```bash
ldesign-git commit smart
```

### 2. 定期清理分支

保持仓库整洁，定期清理已合并的分支：

```bash
ldesign-git branch cleanup --dry-run  # 先预览
ldesign-git branch cleanup            # 确认后执行
```

### 3. 配置 Git Hooks

安装提交信息验证和代码检查 hooks：

```bash
ldesign-git hooks install commit-msg-validation
ldesign-git hooks install pre-commit-lint
```

### 4. 使用工作流

选择适合团队的工作流并严格遵守：

```bash
# 初始化 Git Flow
ldesign-git workflow init git-flow

# 开始新功能
ldesign-git workflow feature start user-authentication
```

### 5. 定期生成报告

了解仓库健康状况：

```bash
ldesign-git analyze repository
ldesign-git report -o monthly-report.md
```

## 🔗 下一步

- 📖 阅读 [CLI 使用指南](./cli-usage.md)
- 📖 阅读 [工作流指南](./workflows-guide.md)
- 📖 查看 [API 参考](./api-reference.md)
- 📖 了解 [最佳实践](./best-practices.md)
- 💡 查看 [示例代码](../examples/)

## ❓ 获取帮助

- 查看命令帮助: `ldesign-git <command> --help`
- 查看所有命令: `ldesign-git --help`
- 报告问题: [GitHub Issues](https://github.com/ldesign/git/issues)

## 📝 许可证

MIT

