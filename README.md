# @ldesign/git

LDesign Git 工具 - 提供强大的 Git 操作、仓库管理和提交分析功能。

## 特性

- 🚀 简单易用的 Git 操作 API
- 📊 提交历史分析
- 🔍 仓库状态管理
- 🌿 分支管理
- 🛠️ CLI 工具支持

## 安装

```bash
pnpm add @ldesign/git
```

## 使用

### API 方式

```typescript
import { GitManager, CommitAnalyzer } from '@ldesign/git'

// 创建 Git 管理器
const git = new GitManager({ baseDir: './my-project' })

// 初始化仓库
await git.init()

// 添加文件
await git.add('.')

// 提交
await git.commit('feat: initial commit')

// 推送
await git.push('origin', 'main')

// 分析提交历史
const analyzer = new CommitAnalyzer(git)
const stats = await analyzer.analyzeCommits()
console.log(`总提交数: ${stats.total}`)
console.log(`贡献者数: ${stats.authors}`)
```

### CLI 方式

```bash
# 查看状态
ldesign-git status

# 初始化仓库
ldesign-git init
```

## API 文档

### GitManager

Git 基础操作管理器。

#### 方法

- `init()` - 初始化 Git 仓库
- `add(files)` - 添加文件到暂存区
- `commit(message)` - 提交更改
- `push(remote, branch)` - 推送到远程
- `pull(remote, branch)` - 从远程拉取
- `status()` - 获取仓库状态
- `log(options)` - 获取提交历史

### CommitAnalyzer

提交历史分析工具。

#### 方法

- `analyzeCommits(maxCount)` - 分析提交历史，返回统计信息

### RepositoryManager

仓库信息管理器。

#### 方法

- `getRepositoryInfo()` - 获取仓库详细信息
- `hasUncommittedChanges()` - 检查是否有未提交的更改

## License

MIT


