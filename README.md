# @ldesign/git

LDesign Git 工具集 - 功能强大的 Git 操作工具集合

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org)
[![PNPM](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg)](https://pnpm.io)

</div>

## 📦 Monorepo 结构

本项目采用 Monorepo 架构,包含以下包:

```
packages/
├── core/          @ldesign/git-core      - Git 核心功能库
├── cli/           @ldesign/git-cli       - 命令行工具
└── web-ui/        @ldesign/git-web-ui    - Web 图形界面
```

### 📚 包说明

#### [@ldesign/git-core](./packages/core)
Git 核心功能库,提供完整的 Git 操作 API

- ✅ 完善的 Git 基础操作
- ✅ 高级自动化功能
- ✅ 统计分析和报告
- ✅ Hooks 管理
- ✅ 性能监控

```bash
npm install @ldesign/git-core
```

#### [@ldesign/git-cli](./packages/cli)
功能强大的命令行工具

- ✅ 美化的终端输出
- ✅ 交互式操作
- ✅ 智能提交系统
- ✅ 工作流自动化

```bash
npm install -g @ldesign/git-cli
ldesign-git --help
```

#### [@ldesign/git-web-ui](./packages/web-ui)
现代化的 Web 图形界面

- ✅ 直观的仪表板
- ✅ 实时更新
- ✅ 可视化操作
- ✅ WebSocket 支持

```bash
npm install -g @ldesign/git-web-ui
ldesign-git-ui
```

## 🚀 快速开始

### 安装依赖

```bash
# 使用 PNPM (推荐)
pnpm install

# 或使用 NPM
npm install
```

### 开发

```bash
# 启动所有包的开发模式
pnpm dev

# 单独启动某个包
pnpm dev:core      # 核心库
pnpm dev:cli       # CLI 工具
pnpm dev:web-ui    # Web UI
pnpm dev:docs      # 文档站点
```

### 构建

```bash
# 构建所有包
pnpm build

# 单独构建某个包
pnpm build:core
pnpm build:cli
pnpm build:web-ui
```

### 测试

```bash
# 运行所有测试
pnpm test

# 单独测试核心库
pnpm test:core
```

## ✨ 主要特性

### 核心功能
- 🚀 完善的 Git 基础操作（分支、标签、暂存、合并、变基）
- 🌿 强大的分支管理
- 🏷️ 全面的标签管理
- 💾 灵活的暂存区管理
- 🔀 智能的合并与变基

### 高级自动化
- 🤖 智能提交系统
- 🔄 工作流自动化（Git Flow、GitHub Flow、GitLab Flow）
- 📦 批量操作
- 👀 代码审查辅助

### Git Hooks
- 🪝 Hooks 管理器
- 📝 提交信息验证
- 🧪 预提交检查

### 统计分析
- 📊 详细的提交分析
- 📈 仓库分析
- 📄 多格式报告生成

### 最新功能（v0.5.0）

#### 🆕 新增功能
- ⚡ **操作队列** - 支持并发控制、优先级排序、自动重试
- 💾 **持久化缓存** - 基于文件系统的缓存持久化
- 🛡️ **错误码枚举** - 统一的错误码和错误消息
- 📝 **类型工具** - DeepPartial、DeepReadonly 等完整类型工具
- ✅ **统一验证器** - GitValidator 支持批量验证
- 🔒 **增强错误处理** - 错误链、重试配置、丰富的错误类型

#### 🛠️ 现有功能
- ⚡ 性能监控器
- 🔒 LFS 管理器
- 📦 Monorepo 管理器
- 🕐 Reflog 管理器
- 🩺 Git 健康检查
- ↩️ 智能撤销向导
- 🏷️ 别名管理器
- 🍒 Cherry-pick 管理
- 📦 归档管理器
- 🩹 补丁管理器
- 💾 备份管理器
- 🔍 安全扫描器
- 🔐 凭证管理器
- 🧹 清理工具
- 📊 增强统计
- 🐚 Shell 补全

## 📝 使用示例

### 基础 Git 操作

```ts
import { GitManager } from '@ldesign/git-core'

const git = new GitManager({ baseDir: './my-project' })

// 获取状态
const status = await git.status()
console.log(`当前分支: ${status.current}`)
console.log(`修改的文件: ${status.modified.length}`)

// 提交更改
await git.add('.')
await git.commit('feat: add new feature')
await git.push()
```

### 操作队列

```ts
import { OperationQueue, OperationPriority } from '@ldesign/git-core'

const queue = new OperationQueue({ concurrency: 3 })

// 添加操作
const result = await queue.add(
  () => git.push(),
  { name: 'push', priority: OperationPriority.HIGH }
)

// 批量添加
const results = await queue.addBatch([
  { execute: () => git.fetch('origin'), name: 'fetch' },
  { execute: () => git.pull(), name: 'pull' }
])
```

### 持久化缓存

```ts
import { PersistentCache } from '@ldesign/git-core'

const cache = new PersistentCache<string, object>({
  cacheName: 'git-cache',
  defaultTTL: 1000 * 60 * 60, // 1 小时
  autoSave: true
})

cache.set('key', { data: 'value' })
const value = cache.get('key')
```

### 统一验证

```ts
import { GitValidator } from '@ldesign/git-core'

const validator = new GitValidator({ strict: true })

// 验证分支名
const branchResult = validator.validateBranchName('feature/login')
console.log(branchResult.valid) // true

// 验证提交信息
const commitResult = validator.validateCommitMessage('feat(user): add login')
console.log(commitResult.parsed?.type) // 'feat'
```

### 错误处理

```ts
import { GitError, GitErrorCode, isGitError } from '@ldesign/git-core'

try {
  await git.push()
} catch (error) {
  if (isGitError(error)) {
    console.log('错误码:', error.code)
    console.log('可重试:', error.isRetryable)
    console.log('错误链:', error.getErrorChain())
  }
}
```

## 📖 文档

- [快速开始](./QUICK_START.md)
- [构建和使用](./BUILD_AND_USAGE.md)
- [API 文档](./API.md)
- [完整文档](./docs)

## 🛠️ 技术栈

- **语言**: TypeScript
- **包管理**: PNPM Workspaces
- **构建工具**: tsup
- **测试框架**: Vitest
- **文档**: VitePress
- **Git 库**: simple-git

## 🏗️ 项目结构

```
@ldesign/git/
├── packages/
│   ├── core/              # 核心功能库
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── cli/               # CLI 工具
│   │   ├── src/
│   │   ├── bin/
│   │   ├── package.json
│   │   └── README.md
│   └── web-ui/            # Web UI
│       ├── client/        # React 前端
│       ├── server/        # Express 后端
│       ├── package.json
│       └── README.md
├── docs/                  # VitePress 文档
├── examples/              # 使用示例
├── scripts/               # 构建脚本
├── archive/               # 归档文档
├── pnpm-workspace.yaml    # PNPM 工作区配置
├── tsconfig.base.json     # 共享 TS 配置
└── package.json           # Monorepo 根配置
```

## 🤝 贡献

欢迎贡献!请查看各个包的 README 了解更多信息。

## 📝 变更日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本历史。

## 📄 License

MIT © LDesign Team

## 🔗 相关链接

- [GitHub](https://github.com/ldesign/git)
- [NPM - @ldesign/git-core](https://www.npmjs.com/package/@ldesign/git-core)
- [NPM - @ldesign/git-cli](https://www.npmjs.com/package/@ldesign/git-cli)
- [NPM - @ldesign/git-web-ui](https://www.npmjs.com/package/@ldesign/git-web-ui)
