# Git 工作流指南

深入了解如何使用 @ldesign/git 实现各种 Git 工作流。

## 📋 目录

- [什么是 Git 工作流](#什么是-git-工作流)
- [Git Flow](#git-flow)
- [GitHub Flow](#github-flow)
- [GitLab Flow](#gitlab-flow)
- [选择合适的工作流](#选择合适的工作流)
- [最佳实践](#最佳实践)

## 什么是 Git 工作流

Git 工作流是一套关于如何使用 Git 完成工作的规则和约定。它定义了：

- 分支的命名和用途
- 何时创建和合并分支
- 如何进行代码审查
- 如何发布新版本

## Git Flow

Git Flow 是一个完整的分支管理模型，适合有明确发布周期的项目。

### 分支结构

- **main/master** - 生产环境分支，永远保持稳定
- **develop** - 开发分支，集成所有功能
- **feature/** - 功能分支，开发新功能
- **release/** - 发布分支，准备新版本发布
- **hotfix/** - 热修复分支，修复生产环境的紧急问题

### 使用 CLI

#### 1. 初始化

```bash
ldesign-git workflow init git-flow
```

这将创建 `main` 和 `develop` 分支。

#### 2. 开发新功能

```bash
# 开始功能
ldesign-git workflow feature start user-login

# 在功能分支上开发...
git add .
ldesign-git commit smart

# 完成功能
ldesign-git workflow feature finish user-login
```

**流程说明**:
1. 从 `develop` 创建 `feature/user-login`
2. 在功能分支上开发和提交
3. 合并回 `develop`
4. 删除功能分支

#### 3. 准备发布

```bash
# 开始发布
ldesign-git workflow release start 1.0.0

# 在发布分支上更新版本号、CHANGELOG...
# 进行最后的测试和 bug 修复

# 完成发布
ldesign-git workflow release finish 1.0.0
```

**流程说明**:
1. 从 `develop` 创建 `release/1.0.0`
2. 更新版本相关文件
3. 合并到 `main`
4. 创建标签 `v1.0.0`
5. 合并回 `develop`
6. 删除发布分支

#### 4. 紧急修复

```bash
# 开始热修复
ldesign-git workflow hotfix start critical-bug

# 修复 bug...
git add .
git commit -m "fix: critical bug"

# 完成热修复
ldesign-git workflow hotfix finish critical-bug -v 1.0.1
```

**流程说明**:
1. 从 `main` 创建 `hotfix/critical-bug`
2. 修复 bug 并提交
3. 合并到 `main`
4. 创建标签 `v1.0.1`
5. 合并回 `develop`
6. 删除热修复分支

### 使用 API

```typescript
import { WorkflowAutomation } from '@ldesign/git'

const workflow = new WorkflowAutomation(
  WorkflowAutomation.getDefaultConfig('git-flow')
)

// 初始化
await workflow.initGitFlow()

// 功能开发
const featureBranch = await workflow.startFeature({
  name: 'user-authentication',
  push: true
})

// 开发完成后
await workflow.finishFeature('user-authentication')

// 发布
await workflow.startRelease({ version: '1.0.0' })
await workflow.finishRelease('1.0.0')

// 热修复
await workflow.startHotfix({ name: 'critical-bug' })
await workflow.finishHotfix('critical-bug', '1.0.1')
```

### 优点

✅ 清晰的分支职责  
✅ 支持并行开发  
✅ 适合版本管理  
✅ 稳定的发布流程

### 缺点

❌ 分支较多，相对复杂  
❌ 不适合持续部署  
❌ 学习曲线较陡

### 适用场景

- 有明确的发布周期（如每月一版）
- 需要同时维护多个版本
- 团队规模较大
- 企业级项目

## GitHub Flow

GitHub Flow 是一个简化的工作流，适合持续部署的项目。

### 分支结构

- **main** - 主分支，永远可部署
- **feature/** - 功能分支，所有开发都在功能分支进行

### 使用 CLI

```bash
# 初始化
ldesign-git workflow init github-flow

# 创建功能分支
ldesign-git branch create feature/new-feature -c

# 开发和提交
git add .
ldesign-git commit smart

# 推送并创建 Pull Request
git push -u origin feature/new-feature

# 审查通过后，合并到 main
# (通常通过 GitHub PR 界面合并)
```

### 使用 API

```typescript
import { WorkflowAutomation } from '@ldesign/git'

const workflow = new WorkflowAutomation(
  WorkflowAutomation.getDefaultConfig('github-flow')
)

// 创建功能分支
const branch = await workflow.createFeatureBranch('add-feature', true)

// 开发完成后，合并到 main
await workflow.mergeToMain(branch, true)
```

### 工作流程

1. 从 `main` 创建功能分支
2. 开发并频繁提交
3. 推送到远程并创建 PR
4. 代码审查
5. 合并到 `main`
6. 自动部署

### 优点

✅ 简单易懂  
✅ 适合持续部署  
✅ 快速迭代  
✅ 分支少，易管理

### 缺点

❌ 不适合多版本维护  
❌ 需要完善的 CI/CD  
❌ 需要频繁测试

### 适用场景

- SaaS 产品
- Web 应用
- 持续部署环境
- 快速迭代的项目

## GitLab Flow

GitLab Flow 结合了 Git Flow 和 GitHub Flow 的优点。

### 分支结构

- **main** - 主开发分支
- **production** - 生产环境分支
- **staging** - 预发布环境分支
- **feature/** - 功能分支

### 特点

- 环境分支（production、staging、pre-production）
- 上游优先（upstream first）
- 功能分支直接合并到 main

### 适用场景

- 需要多个部署环境
- 需要灵活的发布策略
- 结合了开发效率和版本控制

## 选择合适的工作流

### 决策树

```
你的项目有明确的发布周期吗？
├─ 是 → 需要维护多个版本吗？
│  ├─ 是 → Git Flow ✓
│  └─ 否 → GitLab Flow
└─ 否 → 持续部署吗？
   ├─ 是 → GitHub Flow ✓
   └─ 否 → GitLab Flow
```

### 对比表

| 特性 | Git Flow | GitHub Flow | GitLab Flow |
|------|----------|-------------|-------------|
| 复杂度 | 高 | 低 | 中 |
| 分支数量 | 多 | 少 | 中 |
| 学习曲线 | 陡 | 平缓 | 适中 |
| 版本管理 | 优秀 | 一般 | 良好 |
| 持续部署 | 不适合 | 优秀 | 良好 |
| 热修复 | 完善 | 简单 | 良好 |
| 适合规模 | 大型 | 中小型 | 中大型 |

## 最佳实践

### 1. 分支命名规范

```bash
# 功能分支
feature/user-authentication
feature/payment-integration

# Bug 修复
bugfix/fix-login-error
bugfix/fix-typo

# 热修复
hotfix/critical-security-fix
hotfix/urgent-bug

# 发布分支
release/1.0.0
release/2.0.0-beta
```

### 2. 提交信息规范

使用智能提交功能确保规范：

```bash
ldesign-git commit smart
```

或手动遵循 Conventional Commits：

```
feat(scope): 添加新功能
fix(scope): 修复 bug
docs(scope): 更新文档
```

### 3. 定期清理

保持仓库整洁：

```bash
# 每周清理一次已合并的分支
ldesign-git branch cleanup

# 清理远程分支引用
git fetch --prune
```

### 4. 代码审查

在合并前进行审查：

```typescript
import { ReviewHelper } from '@ldesign/git'

const reviewer = new ReviewHelper()
const review = await reviewer.generateReviewData('main', 'feature/new-feature')

// 查看影响级别
console.log('影响级别:', review.impact.level)

// 查看建议
console.log('审查建议:', review.suggestions)
```

### 5. 自动化检查

安装 hooks 进行自动检查：

```bash
# 提交信息验证
ldesign-git hooks install commit-msg-validation

# 代码检查
ldesign-git hooks install pre-commit-lint

# 测试运行
ldesign-git hooks install pre-push-test
```

## 🎯 实战示例

### 完整的功能开发流程

```bash
# 1. 初始化工作流
ldesign-git workflow init git-flow

# 2. 开始新功能
ldesign-git workflow feature start user-profile

# 3. 开发过程中多次提交
git add src/profile/
ldesign-git commit smart

git add tests/
ldesign-git commit smart

# 4. 功能完成，合并到 develop
ldesign-git workflow feature finish user-profile

# 5. 准备发布
ldesign-git workflow release start 1.1.0

# 6. 更新版本和文档
vim package.json
vim CHANGELOG.md
git add .
git commit -m "chore: bump version to 1.1.0"

# 7. 完成发布
ldesign-git workflow release finish 1.1.0

# 8. 检查结果
ldesign-git tag list
ldesign-git branch list
```

### 紧急修复流程

```bash
# 1. 发现生产环境 bug
ldesign-git workflow hotfix start payment-error

# 2. 快速修复
git add .
git commit -m "fix: 修复支付错误"

# 3. 测试验证
npm test

# 4. 完成热修复并发布
ldesign-git workflow hotfix finish payment-error -v 1.0.1

# 5. 验证
ldesign-git tag latest  # 应该显示 v1.0.1
```

## 📊 工作流分析

使用分析功能监控工作流健康度：

```bash
# 查看提交类型分布
ldesign-git analyze commits

# 查看分支健康度
ldesign-git analyze repository

# 生成月度报告
ldesign-git report -o monthly-report.md
```

## 🔗 参考资源

- [Git Flow 原文](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow 指南](https://guides.github.com/introduction/flow/)
- [GitLab Flow 文档](https://docs.gitlab.com/ee/topics/gitlab_flow.html)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 💡 小贴士

1. **选择并坚持一种工作流** - 不要在项目中途更换
2. **团队共识** - 确保所有成员理解并遵守工作流
3. **自动化** - 使用 CLI 工具和 hooks 自动化流程
4. **定期审查** - 检查是否有偏离工作流的情况
5. **灵活调整** - 根据团队实际情况调整规则

---

返回 [快速开始](./getting-started.md) | 查看 [CLI 使用](./cli-usage.md)

