# @ldesign/git

LDesign Git 工具 - 功能强大的 Git 操作插件，提供完整的 Git 操作、高级自动化、工作流集成和丰富的统计分析功能。

## ✨ 特性

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
- 📋 丰富的 Hook 模板库

### 子模块与冲突
- 📁 子模块管理（添加、更新、删除、同步）
- ⚔️ 冲突解析器（检测冲突、智能解决、操作向导）

### 统计分析
- 📊 详细的提交分析（按作者、时间、类型统计）
- 📈 仓库分析（文件变更、代码趋势、分支生命周期）
- 📄 多格式报告生成（Markdown、JSON、CSV、HTML）

### CLI 工具
- 💻 丰富的命令行工具
- 🎨 美化的输出（颜色、表格、进度条）
- 🤝 交互式操作

### 🆕 新增功能（v0.3.0）
- 🔧 **配置管理器** - 完整的 Git 配置操作（local/global/system）
- 📦 **Stash 管理器** - 强大的暂存区管理（save/pop/apply/list）
- 🌐 **Remote 管理器** - 远程仓库完整操作（add/remove/fetch/prune）
- 📊 **Diff 管理器** - 全面的差异比较（commits/branches/files）
- 🌳 **Worktree 管理器** - 多工作树支持（add/remove/move/lock）
- 📝 **Changelog 生成器** - 基于 Conventional Commits 的变更日志
- 🚨 **统一错误处理** - 完整的错误类型系统和类型守卫
- 📋 **日志系统** - 多级别日志支持和自定义输出
- ⚡ **LRU 缓存** - 智能缓存机制，显著提升性能
- 🔗 **依赖注入** - GitContext 统一管理共享资源

## 📦 安装

```bash
pnpm add @ldesign/git
```

## 🚀 快速开始

### 基础操作

```typescript
import { GitManager, BranchManager, TagManager } from '@ldesign/git'

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
const branches = await branchManager.listBranches()

// 标签管理
const tagManager = new TagManager({ baseDir: './my-project' })
await tagManager.createAnnotatedTag('v1.0.0', 'Release version 1.0.0')
await tagManager.pushTag('v1.0.0')
```

### 智能提交

```typescript
import { SmartCommit } from '@ldesign/git'

const smartCommit = new SmartCommit({ baseDir: './my-project' })

// 自动分析变更并生成提交信息
const suggestions = await smartCommit.analyzeChanges()
console.log('建议的提交类型:', suggestions[0].type)

// 智能提交
await smartCommit.smartCommit({
  autoDetect: true, // 自动检测提交类型
  scope: 'user',
  breaking: false
})

// 验证提交信息
const validation = smartCommit.validateCommitMessage('feat(user): add login')
console.log('验证结果:', validation.valid)
```

### 工作流自动化

```typescript
import { WorkflowAutomation } from '@ldesign/git'

// Git Flow
const workflow = new WorkflowAutomation(
  WorkflowAutomation.getDefaultConfig('git-flow'),
  { baseDir: './my-project' }
)

// 初始化 Git Flow
await workflow.initGitFlow()

// 开始新功能
const featureBranch = await workflow.startFeature({
  name: 'user-authentication',
  push: true
})

// 完成功能
await workflow.finishFeature('user-authentication')

// 开始发布
await workflow.startRelease({ version: '1.0.0' })
await workflow.finishRelease('1.0.0')
```

### 批量操作

```typescript
import { BatchOperations } from '@ldesign/git'

const batch = new BatchOperations({ baseDir: './my-project' })

// 批量创建分支
const result = await batch.createBranches([
  'feature/feature-1',
  'feature/feature-2',
  'feature/feature-3'
])
console.log(`成功: ${result.succeeded}, 失败: ${result.failed}`)

// 批量删除已合并的分支
await batch.cleanupMergedBranches('main', ['main', 'develop'])

// 批量推送标签
await batch.pushTags(['v1.0.0', 'v1.0.1', 'v1.0.2'])
```

### 代码审查

```typescript
import { ReviewHelper } from '@ldesign/git'

const reviewer = new ReviewHelper({ baseDir: './my-project' })

// 生成审查数据
const reviewData = await reviewer.generateReviewData('main', 'feature/new-feature')

console.log('变更文件数:', reviewData.changes.files)
console.log('影响级别:', reviewData.impact.level)
console.log('审查建议:', reviewData.suggestions)

// 生成 Markdown 报告
const report = await reviewer.generateMarkdownReport('main', 'feature/new-feature')
console.log(report)
```

### Hooks 管理

```typescript
import { HookManager } from '@ldesign/git'

const hookManager = new HookManager({ baseDir: './my-project' })

// 从模板安装 hooks
const template = HookManager.getTemplate('commit-msg-validation')
if (template) {
  await hookManager.installFromTemplate(template)
}

// 列出已安装的 hooks
const installed = await hookManager.listInstalledHooks()
console.log('已安装的 Hooks:', installed)

// 禁用/启用 hook
await hookManager.disableHook('pre-commit')
await hookManager.enableHook('pre-commit')
```

### 子模块管理

```typescript
import { SubmoduleManager } from '@ldesign/git'

const submodule = new SubmoduleManager({ baseDir: './my-project' })

// 添加子模块
await submodule.addSubmodule(
  'https://github.com/user/repo.git',
  'libs/external',
  { branch: 'main' }
)

// 初始化并更新所有子模块
await submodule.initSubmodules(true)
await submodule.updateSubmodules({ recursive: true })

// 列出所有子模块
const submodules = await submodule.listSubmodules()
console.log('子模块:', submodules)
```

### 冲突解决

```typescript
import { ConflictResolver } from '@ldesign/git'

const resolver = new ConflictResolver({ baseDir: './my-project' })

// 检测冲突
const conflicts = await resolver.detectConflicts()
console.log('冲突文件数:', conflicts.length)

// 解决冲突 - 使用我们的版本
await resolver.resolveWithOurs('src/app.ts')

// 解决冲突 - 使用他们的版本
await resolver.resolveWithTheirs('src/utils.ts')

// 生成冲突报告
const report = await resolver.generateConflictReport()
console.log(report)

// 继续当前操作
await resolver.continueCurrentOperation()
```

### 🆕 新增管理器（v0.3.0）

#### Stash 管理器

```typescript
import { StashManager } from '@ldesign/git'

const stashManager = new StashManager({ baseDir: './my-project' })

// 保存当前更改
await stashManager.save({ message: 'WIP: 临时保存', includeUntracked: true })

// 列出所有 stash
const stashes = await stashManager.list()

// 应用最新的 stash
await stashManager.apply()

// 弹出并删除 stash
await stashManager.pop()

// 从 stash 创建分支
await stashManager.branch('feature/from-stash', 0)
```

#### Remote 管理器

```typescript
import { RemoteManager } from '@ldesign/git'

const remoteManager = new RemoteManager({ baseDir: './my-project' })

// 添加远程仓库
await remoteManager.add('origin', 'https://github.com/user/repo.git')

// 列出所有远程
const remotes = await remoteManager.list()

// 设置 URL
await remoteManager.setUrl('origin', 'https://github.com/user/new-repo.git')

// Fetch 并清理
await remoteManager.fetch('origin', { prune: true })
await remoteManager.prune('origin')
```

#### Diff 管理器

```typescript
import { DiffManager } from '@ldesign/git'

const diffManager = new DiffManager({ baseDir: './my-project' })

// 比较两个提交
const diff = await diffManager.diffCommits('HEAD~5', 'HEAD')
console.log(`变更了 ${diff.files.length} 个文件`)

// 比较分支
const branchDiff = await diffManager.diffBranches('main', 'develop')
console.log(`${branchDiff.commits.length} 个提交`)

// 获取工作区变更
const workingDiff = await diffManager.diffWorkingDirectory()

// 查看文件 diff
const fileDiff = await diffManager.showFileDiff('src/index.ts')
```

#### Git Config 管理器

```typescript
import { GitConfigManager } from '@ldesign/git'

const configManager = new GitConfigManager({ baseDir: './my-project' })

// 设置用户信息
await configManager.setUserInfo('John Doe', 'john@example.com', 'global')

// 获取配置
const email = await configManager.get('user.email')

// 列出所有配置
const configs = await configManager.list('global')

// 设置自定义配置
await configManager.set('core.editor', 'code --wait', 'global')
```

#### Worktree 管理器

```typescript
import { WorktreeManager } from '@ldesign/git'

const worktreeManager = new WorktreeManager({ baseDir: './my-project' })

// 添加新工作树
await worktreeManager.add('../my-project-feature', 'feature/new-feature')

// 列出所有工作树
const worktrees = await worktreeManager.list()

// 锁定工作树
await worktreeManager.lock('../my-project-feature', '正在进行重要工作')

// 移除工作树
await worktreeManager.remove('../my-project-feature')
```

#### Changelog 生成器

```typescript
import { ChangelogGenerator } from '@ldesign/git'

const changelogGen = new ChangelogGenerator({ baseDir: './my-project' })

// 生成特定版本的 changelog
const changelog = await changelogGen.generateForVersion('1.1.0')
console.log(changelog)

// 更新 CHANGELOG.md
await changelogGen.update('1.1.0')

// 生成自定义范围的 changelog
const customChangelog = await changelogGen.generate({
  from: 'v1.0.0',
  to: 'v1.1.0',
  grouped: true,
  outputFile: 'CHANGELOG.md'
})
```

#### 错误处理和日志

```typescript
import { 
  GitLogger, 
  LogLevel,
  GitBranchError,
  isGitBranchError 
} from '@ldesign/git'

// 使用日志系统
const logger = new GitLogger({ level: LogLevel.DEBUG })
logger.info('操作开始')
logger.error('操作失败', error)

// 错误处理
try {
  await branchManager.deleteBranch('feature/test')
} catch (error) {
  if (isGitBranchError(error)) {
    console.error(`分支操作失败: ${error.branch}`)
    console.error(`错误代码: ${error.code}`)
  }
}
```

#### GitContext（依赖注入）

```typescript
import { GitContext, LogLevel } from '@ldesign/git'

// 创建统一的上下文
const context = new GitContext({
  baseDir: './my-project',
  logLevel: LogLevel.INFO,
  enableCache: true,
  cacheMaxSize: 200
})

// 获取共享资源
const git = context.getGit()
const logger = context.getLogger()
const cache = context.getCache()

// 查看统计信息
const cacheStats = context.getCacheStats()
console.log(`缓存命中率: ${(cacheStats.hitRate * 100).toFixed(2)}%`)
```

### 统计分析

```typescript
import { CommitAnalyzer, RepositoryAnalyzer, ReportGenerator } from '@ldesign/git'

// 提交分析
const commitAnalyzer = new CommitAnalyzer({ baseDir: './my-project' })
const analytics = await commitAnalyzer.analyzeCommitsDetailed()

console.log('总提交数:', analytics.totalCommits)
console.log('提交类型分布:', analytics.commitsByType)
console.log('Top 贡献者:', analytics.topContributors)

// 仓库分析
const repoAnalyzer = new RepositoryAnalyzer({ baseDir: './my-project' })
const metrics = await repoAnalyzer.analyzeRepository()

console.log('语言分布:', metrics.languageDistribution)
console.log('最常变更的文件:', metrics.mostChangedFiles)
console.log('分支统计:', metrics.branchMetrics)

// 生成报告
const reportGen = new ReportGenerator({ baseDir: './my-project' })

// Markdown 报告
const mdReport = await reportGen.generateMarkdownReport()
console.log(mdReport)

// JSON 报告
const jsonReport = await reportGen.generateJsonReport()

// HTML 报告
const htmlReport = await reportGen.generateHtmlReport()
```

### 配置管理

```typescript
import { ConfigManager } from '@ldesign/git'

const config = new ConfigManager({ baseDir: './my-project' })

// 加载配置
const userConfig = await config.loadConfig()

// 更新配置
await config.updateConfig({
  preferences: {
    autoStash: true,
    autoFetch: true,
    defaultBranch: 'main'
  }
})

// 添加自定义作用域
await config.addScope('user')
await config.addScope('auth')

// 添加别名
await config.addAlias('st', 'status')
await config.addAlias('co', 'checkout')
```

### 验证工具

```typescript
import { validateBranchName, validateCommitMessage, validateTagName } from '@ldesign/git'

// 验证分支名
const branchValidation = validateBranchName('feature/user-login')
if (!branchValidation.valid) {
  console.error('分支名错误:', branchValidation.errors)
}
if (branchValidation.suggestion) {
  console.log('建议:', branchValidation.suggestion)
}

// 验证提交信息
const commitValidation = validateCommitMessage('feat(user): add login feature')
if (commitValidation.valid) {
  console.log('解析结果:', commitValidation.parsed)
}

// 验证标签名
const tagValidation = validateTagName('v1.0.0')
console.log('标签验证:', tagValidation.valid)
```

## 📚 API 文档

### 核心模块

#### GitManager
基础 Git 操作管理器

- `init()` - 初始化仓库
- `add(files)` - 添加文件到暂存区
- `commit(message)` - 提交更改
- `push(remote, branch)` - 推送到远程
- `pull(remote, branch)` - 从远程拉取
- `status()` - 获取仓库状态
- `log(options)` - 获取提交历史
- `clone(url, path)` - 克隆仓库
- `getCurrentBranch()` - 获取当前分支
- `addRemote(name, url)` - 添加远程仓库

#### BranchManager
分支管理器

- `listBranches()` - 列出所有分支
- `createBranch(name, startPoint?)` - 创建分支
- `deleteBranch(name, force?)` - 删除分支
- `checkoutBranch(name, options?)` - 切换分支
- `renameBranch(oldName, newName)` - 重命名分支
- `compareBranches(branch1, branch2)` - 比较分支
- `isMerged(branch, target?)` - 检查是否已合并
- `pushBranch(name, remote, setUpstream?)` - 推送分支
- `getMergedBranches(target?)` - 获取已合并分支
- `getUnmergedBranches(target?)` - 获取未合并分支

#### TagManager
标签管理器

- `createLightweightTag(name, ref?)` - 创建轻量级标签
- `createAnnotatedTag(name, message, ref?)` - 创建注释标签
- `deleteTag(name)` - 删除本地标签
- `deleteRemoteTag(name, remote?)` - 删除远程标签
- `listTags()` - 列出所有标签
- `getTagInfo(name)` - 获取标签信息
- `pushTag(name, remote?)` - 推送标签
- `pushAllTags(remote?)` - 推送所有标签
- `getLatestTag()` - 获取最新标签

#### StashManager
暂存区管理器

- `stash(options?)` - 保存到 stash
- `apply(index?)` - 应用 stash
- `pop(index?)` - 应用并删除 stash
- `list()` - 列出所有 stash
- `drop(index)` - 删除 stash
- `clear()` - 清空所有 stash
- `branch(branchName, index)` - 从 stash 创建分支

#### MergeManager
合并管理器

- `merge(branch, options?)` - 合并分支
- `rebase(branch, options?)` - 变基
- `cherryPick(commit, options?)` - Cherry-pick
- `getConflicts()` - 获取冲突列表
- `resolveWithOurs(file)` - 使用我们的版本
- `resolveWithTheirs(file)` - 使用他们的版本
- `abortMerge()` - 中止合并
- `continueMerge()` - 继续合并

详细文档请查看各模块的 TypeScript 类型定义和源代码注释。

## 🛠️ CLI 工具

### 基础命令

```bash
# 查看帮助
ldesign-git --help

# 查看版本
ldesign-git --version

# 查看状态（美化输出）
ldesign-git status
ldesign-git st  # 别名

# 初始化仓库
ldesign-git init
```

### 分支管理

```bash
# 列出所有分支
ldesign-git branch list
ldesign-git branch ls      # 别名
ldesign-git branch list -r # 只显示远程分支
ldesign-git branch list -a # 显示所有分支

# 创建分支
ldesign-git branch create feature/new-feature
ldesign-git branch create feature/new-feature -c  # 创建并切换
ldesign-git branch create hotfix/bug -s main     # 从 main 创建

# 删除分支
ldesign-git branch delete feature/old-feature
ldesign-git branch del feature/old-feature -f    # 强制删除
ldesign-git branch delete feature/old -r         # 删除远程分支

# 重命名分支
ldesign-git branch rename old-name new-name
ldesign-git branch rename old-name new-name -f   # 强制重命名

# 比较分支
ldesign-git branch compare main feature/new-feature

# 清理已合并分支
ldesign-git branch cleanup
ldesign-git branch cleanup --dry-run             # 预览模式
ldesign-git branch cleanup -t develop            # 指定目标分支

# 切换分支
ldesign-git branch checkout feature/new-feature
ldesign-git branch co feature/new-feature        # 别名
ldesign-git branch co new-branch -b              # 创建并切换
```

### 标签管理

```bash
# 列出所有标签
ldesign-git tag list
ldesign-git tag ls         # 别名
ldesign-git tag list -s    # 按版本号排序
ldesign-git tag list -p "v1.*"  # 模式匹配

# 创建标签
ldesign-git tag create v1.0.0
ldesign-git tag create v1.0.0 -a -m "Release 1.0"  # 注释标签
ldesign-git tag create v1.0.1 -r abc123            # 指定提交

# 删除标签
ldesign-git tag delete v0.9.0
ldesign-git tag del v0.9.0 -r     # 删除远程标签

# 推送标签
ldesign-git tag push v1.0.0
ldesign-git tag push --all        # 推送所有标签

# 查看标签信息
ldesign-git tag info v1.0.0

# 查看最新标签
ldesign-git tag latest
```

### 智能提交

```bash
# 智能提交（交互式）
ldesign-git commit smart

# 非交互模式（自动使用建议）
ldesign-git commit smart --no-interactive

# 验证提交信息
ldesign-git commit validate "feat(user): add login feature"

# 分析当前变更
ldesign-git commit analyze
```

### CLI 特性

**美化输出**
- 🎨 彩色显示（成功/错误/警告/信息）
- 📊 表格格式化
- ⏳ 进度指示器
- 📦 美化的消息框
- ✨ 统一的图标系统

**交互式操作**
- ✅ 确认提示（删除操作）
- 📝 智能输入表单
- 🎯 自动默认值
- ✔️ 输入验证

**用户体验**
- 详细的操作反馈
- 友好的错误提示
- 批量操作支持
- Dry-run 预览模式

### 工作流管理

```bash
# 初始化工作流
ldesign-git workflow init
ldesign-git workflow init git-flow    # 直接指定类型

# 功能分支管理（Git Flow）
ldesign-git workflow feature start <name>
ldesign-git workflow feature finish <name>

# 发布管理
ldesign-git workflow release start <version>
ldesign-git workflow release finish <version>

# 热修复管理
ldesign-git workflow hotfix start <name>
ldesign-git workflow hotfix finish <name> -v <version>
```

### 仓库分析

```bash
# 提交分析
ldesign-git analyze commits
ldesign-git analyze commits -n 500           # 指定数量
ldesign-git analyze commits --author "John"  # 特定作者

# 贡献者分析
ldesign-git analyze contributors
ldesign-git analyze contributors -l 20       # Top 20

# 仓库分析
ldesign-git analyze repository

# 生成报告
ldesign-git report
ldesign-git report -f markdown -o report.md  # Markdown 格式
ldesign-git report -f json -o data.json      # JSON 格式
ldesign-git report -f html -o report.html    # HTML 格式
```

### 冲突解决

```bash
# 列出冲突
ldesign-git conflict list

# 交互式解决
ldesign-git conflict resolve

# 批量解决
ldesign-git conflict resolve-all --ours      # 使用我们的版本
ldesign-git conflict resolve-all --theirs    # 使用他们的版本

# 中止操作
ldesign-git conflict abort

# 生成冲突报告
ldesign-git conflict report -o conflicts.md
```

### Hooks 管理

```bash
# 列出已安装的 hooks
ldesign-git hooks list

# 查看可用模板
ldesign-git hooks templates

# 安装模板
ldesign-git hooks install commit-msg-validation
ldesign-git hooks install pre-commit-lint
ldesign-git hooks install full-workflow

# 启用/禁用 hook
ldesign-git hooks enable pre-commit
ldesign-git hooks disable pre-push

# 查看 hook 内容
ldesign-git hooks show commit-msg

# 备份 hooks
ldesign-git hooks backup

# 卸载
ldesign-git hooks uninstall pre-commit
ldesign-git hooks uninstall-all
```

## 📝 License

MIT


