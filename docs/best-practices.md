# Git 最佳实践

使用 @ldesign/git 的最佳实践和推荐方法。

## 📋 目录

- [提交管理](#提交管理)
- [分支管理](#分支管理)
- [代码审查](#代码审查)
- [版本管理](#版本管理)
- [团队协作](#团队协作)
- [安全性](#安全性)
- [性能优化](#性能优化)

## 提交管理

### 1. 使用规范的提交信息

✅ **推荐做法**:

```bash
# 使用智能提交
ldesign-git commit smart

# 或手动遵循 Conventional Commits
git commit -m "feat(user): add login feature"
git commit -m "fix(payment): fix calculation error"
git commit -m "docs: update README"
```

❌ **避免做法**:

```bash
git commit -m "update"
git commit -m "fix"
git commit -m "..."
```

### 2. 提交粒度

✅ **推荐做法**:
- 一次提交完成一个逻辑单元
- 相关的改动放在同一个提交
- 提交应该是可工作的

```bash
# 好的提交
git add src/user/login.ts src/user/auth.ts
ldesign-git commit smart  # "feat(user): add login functionality"

git add tests/user/login.test.ts
ldesign-git commit smart  # "test(user): add login tests"
```

❌ **避免做法**:
- 多个不相关的改动放在一起
- 提交导致代码无法运行

### 3. 提交前验证

```bash
# 使用验证工具
ldesign-git commit validate "feat(user): add login"

# 分析变更
ldesign-git commit analyze

# 安装提交信息验证 hook
ldesign-git hooks install commit-msg-validation
```

## 分支管理

### 1. 分支命名

✅ **推荐做法**:

```bash
# 使用有意义的前缀
feature/user-authentication
bugfix/fix-login-error
hotfix/critical-security-patch
release/1.0.0

# 包含 issue 编号
feature/ISSUE-123-user-profile
bugfix/ISSUE-456-payment-error
```

❌ **避免做法**:

```bash
# 无意义的名称
test
my-branch
new-feature
```

### 2. 分支生命周期

```bash
# 1. 创建分支
ldesign-git branch create feature/new-feature -c

# 2. 开发过程中频繁提交
git add .
ldesign-git commit smart

# 3. 定期与主分支同步
git fetch origin
git rebase origin/develop

# 4. 功能完成后及时合并
ldesign-git workflow feature finish new-feature

# 5. 定期清理已合并的分支
ldesign-git branch cleanup
```

### 3. 保护重要分支

```bash
# 安装分支保护 hook
ldesign-git hooks install pre-push-test

# 自定义保护规则
# 阻止直接推送到 main/master
```

### 4. 分支对比

在合并前先比较：

```bash
ldesign-git branch compare main feature/new-feature
```

## 代码审查

### 1. 使用审查助手

```typescript
import { ReviewHelper } from '@ldesign/git'

const reviewer = new ReviewHelper()
const review = await reviewer.generateReviewData('main', 'feature/new-feature')

// 检查影响级别
if (review.impact.level === 'critical') {
  console.log('⚠️  重大变更，需要深度审查')
}

// 查看建议
review.suggestions.forEach(s => console.log(s))

// 生成审查报告
const report = await reviewer.generateMarkdownReport('main', 'feature/new-feature')
```

### 2. 审查清单

在审查代码时检查：

- ✅ 提交信息是否规范
- ✅ 代码是否通过测试
- ✅ 是否有充分的注释
- ✅ 是否更新了文档
- ✅ 是否有 Breaking Changes
- ✅ 性能是否受影响

### 3. 自动化审查

```bash
# 生成审查报告
ldesign-git report -f markdown -o review.md

# 在 CI 中集成
# GitHub Actions, GitLab CI 等
```

## 版本管理

### 1. 语义化版本

遵循 [Semantic Versioning](https://semver.org/)：

- **MAJOR** (1.0.0) - 不兼容的 API 变更
- **MINOR** (0.1.0) - 向后兼容的功能新增
- **PATCH** (0.0.1) - 向后兼容的 bug 修复

```bash
# 创建版本标签
ldesign-git tag create v1.0.0 -a -m "Release 1.0.0"

# 推送标签
ldesign-git tag push v1.0.0
```

### 2. 版本发布流程

```bash
# 使用工作流自动化
ldesign-git workflow release start 1.0.0

# 更新版本相关文件
# - package.json
# - CHANGELOG.md
# - README.md

# 完成发布
ldesign-git workflow release finish 1.0.0
```

### 3. CHANGELOG 管理

保持 CHANGELOG 更新：

```markdown
## [1.0.0] - 2025-10-23

### Added
- 新功能 A
- 新功能 B

### Changed
- 改进 X
- 优化 Y

### Fixed
- 修复 bug 1
- 修复 bug 2
```

## 团队协作

### 1. 统一的 Hooks 配置

创建 `scripts/install-hooks.js`：

```javascript
const { HookManager } = require('@ldesign/git')

async function installHooks() {
  const manager = new HookManager()
  const template = HookManager.getTemplate('full-workflow')
  await manager.installFromTemplate(template)
  console.log('✅ 团队 hooks 已安装')
}

installHooks().catch(console.error)
```

在 `package.json` 中：

```json
{
  "scripts": {
    "prepare": "node scripts/install-hooks.js"
  }
}
```

### 2. 共享配置

创建 `.git-config.json`：

```json
{
  "workflow": {
    "type": "git-flow",
    "branches": {
      "main": "main",
      "develop": "develop"
    },
    "prefixes": {
      "feature": "feature/",
      "release": "release/",
      "hotfix": "hotfix/"
    }
  },
  "commitTemplate": {
    "scopes": ["user", "payment", "auth", "ui"],
    "maxSubjectLength": 72
  }
}
```

### 3. 代码审查流程

```bash
# 1. 创建功能分支并开发
ldesign-git branch create feature/new-feature -c

# 2. 开发完成后，生成审查报告
ldesign-git report -f markdown -o feature-review.md

# 3. 提交 Pull Request，附带审查报告

# 4. 审查通过后合并
ldesign-git workflow feature finish new-feature
```

## 安全性

### 1. 敏感信息检查

安装 pre-commit hook 检查敏感信息：

```bash
# 自定义 hook 检查密钥、密码等
ldesign-git hooks install pre-commit-security
```

### 2. 分支保护

```bash
# 安装分支保护 hook
ldesign-git hooks install pre-push-protection

# 防止直接推送到 main/master
```

### 3. 提交签名

使用 GPG 签名提交（Git 原生功能）：

```bash
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_KEY_ID
```

## 性能优化

### 1. 限制分析范围

```bash
# 只分析最近 100 次提交
ldesign-git analyze commits -n 100

# 只分析特定作者
ldesign-git analyze commits --author "John Doe"
```

### 2. 使用 dry-run

```bash
# 预览操作结果，避免错误
ldesign-git branch cleanup --dry-run
```

### 3. 批量操作优化

```typescript
import { BatchOperations } from '@ldesign/git'

const batch = new BatchOperations()

// 分批处理大量分支
const allBranches = [...] // 100+ 分支
const batchSize = 10

for (let i = 0; i < allBranches.length; i += batchSize) {
  const batch = allBranches.slice(i, i + batchSize)
  await batchOps.deleteBranches(batch)
}
```

### 4. 并发执行

```typescript
// 并行执行独立任务
const [commits, branches, tags] = await Promise.all([
  analyzer.analyzeCommits(),
  branchManager.listBranches(),
  tagManager.listTags()
])
```

## 🚫 常见错误避免

### 1. 不要在主分支直接开发

❌ 错误做法:
```bash
git checkout main
# 直接在 main 上修改代码
git commit -m "update"
```

✅ 正确做法:
```bash
ldesign-git branch create feature/new-feature -c
# 在功能分支上开发
ldesign-git commit smart
```

### 2. 不要提交大文件

❌ 避免:
```bash
git add large-file.zip
git add node_modules/
```

✅ 正确做法:
- 使用 `.gitignore`
- 使用 Git LFS 管理大文件

### 3. 不要频繁 rebase 公共分支

❌ 避免:
```bash
# 已经推送到远程的分支不要 rebase
git rebase -i HEAD~10
git push -f  # 危险！
```

✅ 正确做法:
- 只 rebase 本地分支
- 使用 merge 而不是 rebase 公共分支

### 4. 不要忽略冲突

❌ 错误做法:
```bash
# 随便解决冲突就提交
git add .
git commit -m "merge"
```

✅ 正确做法:
```bash
# 仔细检查冲突
ldesign-git conflict list

# 交互式解决
ldesign-git conflict resolve

# 或生成报告仔细审查
ldesign-git conflict report -o conflicts.md
```

## 📈 监控仓库健康度

### 定期检查

每周执行：

```bash
# 1. 检查陈旧分支
ldesign-git branch list

# 2. 清理已合并分支
ldesign-git branch cleanup

# 3. 分析提交质量
ldesign-git analyze commits

# 4. 生成健康报告
ldesign-git report -o weekly-health.md
```

### 关键指标

监控以下指标：

- ✅ 陈旧分支数量（应 < 10%）
- ✅ 规范提交占比（应 > 80%）
- ✅ 活跃贡献者数量
- ✅ 平均提交频率
- ✅ 代码审查覆盖率

## 🎓 学习资源

### 官方文档

- [Git 官方文档](https://git-scm.com/doc)
- [Pro Git 书籍](https://git-scm.com/book/zh/v2)

### 教程

- [Git 基础教程](https://www.runoob.com/git/git-tutorial.html)
- [交互式 Git 学习](https://learngitbranching.js.org/)

### 工具文档

- [简单Git](https://github.com/steveukx/git-js)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 💬 社区

- GitHub Discussions
- Stack Overflow
- 开发者论坛

---

返回 [快速开始](./getting-started.md) | 查看 [工作流指南](./workflows-guide.md)

