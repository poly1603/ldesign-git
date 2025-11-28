
# @ldesign/git 完善实施计划

## 📋 项目概览

本文档详细规划了 @ldesign/git 项目的完善方案，包括 CLI 命令补充和 Web UI 的完整实现。

## 🎯 实施目标

1. **CLI 完善**：补充所有常用 Git 操作的 CLI 命令
2. **Web UI 实现**：构建一个功能完整的本地 Git 管理界面
3. **集成优化**：确保 CLI 和 Web UI 无缝集成

---

## 📊 当前状态分析

### ✅ 已实现功能

**核心管理器（Core）：**
- GitManager - 基础 Git 操作
- BranchManager - 分支管理
- TagManager - 标签管理
- CommitAnalyzer - 提交分析
- MergeManager - 合并和变基
- StashManager - 暂存区管理
- RemoteManager - 远程仓库管理
- DiffManager - 差异比较
- ConfigManager - 配置管理
- WorktreeManager - 工作树管理
- LFSManager - LFS 支持
- MonorepoManager - Monorepo 支持
- PerformanceMonitor - 性能监控

**CLI 命令：**
- status - 状态查看
- init - 仓库初始化
- branch - 分支管理（list/create/delete/rename/compare/cleanup/checkout）
- tag - 标签管理（list/create/delete/push/info/latest）
- commit - 智能提交（smart/validate/analyze）
- workflow - 工作流管理（Git Flow）
- analyze - 提交和仓库分析
- conflict - 冲突解决
- hooks - Hooks 管理

### ❌ 需要补充的功能

**CLI 命令缺失：**
- remote 操作命令
- stash 操作命令
- diff 查看命令
- log 历史查看命令
- rebase 命令
- cherry-pick 命令
- worktree 命令
- lfs 命令
- monorepo 命令
- config 命令

**Web UI：**
- 完全未实现（仅有空目录结构）

---

## 🏗️ 系统架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                               │
├──────────────────────┬──────────────────────────────────────┤
│   CLI 命令行工具      │        Web UI 浏览器界面              │
│   - 交互式命令        │        - React + Ant Design          │
│   - 美化输出          │        - 现代化 UI/UX                │
└──────────────────────┴──────────────────────────────────────┘
           │                              │
           │                              │ HTTP/WebSocket
           │                              │
           ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API 服务层                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express Server (端口: 3000)                           │ │
│  │  - RESTful API 路由                                    │ │
│  │  - WebSocket 实时通信                                  │ │
│  │  - 静态文件服务                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           │
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                     核心业务层                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Git 操作管理器（已实现）                               │ │
│  │  - BranchManager  - TagManager    - CommitAnalyzer    │ │
│  │  - MergeManager   - StashManager  - RemoteManager     │ │
│  │  - DiffManager    - ConfigManager - WorktreeManager   │ │
│  │  - LFSManager     - MonorepoManager                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           │
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Git 底层操作                               │
│                  simple-git 库                               │
└─────────────────────────────────────────────────────────────┘
```

### Web UI 技术栈

**前端框架：**
- React 18+
- TypeScript
- Ant Design 5.x（UI 组件库）
- Vite（构建工具）

**状态管理：**
- Zustand（轻量级状态管理）

**网络请求：**
- Axios（HTTP 客户端）
- Socket.io-client（WebSocket）

**其他工具：**
- React Router（路由）
- React Query（数据缓存）
- Day.js（时间处理）
- Prism.js（代码高亮）

**后端框架：**
- Express.js
- Socket.io（WebSocket）
- CORS（跨域支持）

---

## 📝 详细实施方案

### 阶段一：CLI 命令补充（优先级：高）

#### 1. Remote 操作命令

**文件：** `src/cli/commands/remote.ts`

**命令列表：**
```bash
ldesign-git remote list              # 列出所有远程仓库
ldesign-git remote add <name> <url>  # 添加远程仓库
ldesign-git remote remove <name>     # 删除远程仓库
ldesign-git remote rename <old> <new># 重命名远程仓库
ldesign-git remote show <name>       # 显示远程仓库详情
ldesign-git remote set-url <name> <url> # 设置远程 URL
ldesign-git remote fetch <name>      # 拉取远程更新
ldesign-git remote prune <name>      # 清理远程分支
```

#### 2. Stash 操作命令

**文件：** `src/cli/commands/stash.ts`

**命令列表：**
```bash
ldesign-git stash save [message]     # 保存到 stash
ldesign-git stash list               # 列出所有 stash
ldesign-git stash show [index]       # 显示 stash 详情
ldesign-git stash apply [index]      # 应用 stash
ldesign-git stash pop [index]        # 应用并删除 stash
ldesign-git stash drop <index>       # 删除指定 stash
ldesign-git stash clear              # 清空所有 stash
ldesign-git stash branch <name> [index] # 从 stash 创建分支
```

#### 3. Diff 和 Log 命令

**文件：** `src/cli/commands/diff.ts` 和 `src/cli/commands/log.ts`

**Diff 命令：**
```bash
ldesign-git diff                     # 查看工作区变更
ldesign-git diff --staged            # 查看暂存区变更
ldesign-git diff <commit1> <commit2> # 比较两个提交
ldesign-git diff <branch1> <branch2> # 比较两个分支
ldesign-git diff <file>              # 查看文件差异
```

**Log 命令：**
```bash
ldesign-git log                      # 查看提交历史
ldesign-git log -n <count>           # 限制显示数量
ldesign-git log --author <name>      # 按作者过滤
ldesign-git log --since <date>       # 按日期过滤
ldesign-git log --graph              # 图形化显示
ldesign-git log <file>               # 查看文件历史
```

#### 4. Rebase 和 Cherry-pick 命令

**文件：** `src/cli/commands/rebase.ts`

**命令列表：**
```bash
ldesign-git rebase <branch>          # 变基到指定分支
ldesign-git rebase --interactive     # 交互式变基
ldesign-git rebase --continue        # 继续变基
ldesign-git rebase --abort           # 中止变基
ldesign-git cherry-pick <commit>     # Cherry-pick 提交
```

#### 5. Worktree 命令

**文件：** `src/cli/commands/worktree.ts`

**命令列表：**
```bash
ldesign-git worktree list            # 列出所有工作树
ldesign-git worktree add <path> [branch] # 添加工作树
ldesign-git worktree remove <path>   # 移除工作树
ldesign-git worktree move <old> <new># 移动工作树
ldesign-git worktree lock <path>     # 锁定工作树
ldesign-git worktree unlock <path>   # 解锁工作树
```

#### 6. LFS 命令

**文件：** `src/cli/commands/lfs.ts`

**命令列表：**
```bash
ldesign-git lfs install              # 安装 LFS
ldesign-git lfs track <pattern>      # 跟踪文件类型
ldesign-git lfs untrack <pattern>    # 取消跟踪
ldesign-git lfs list                 # 列出 LFS 文件
ldesign-git lfs pull                 # 拉取 LFS 文件
ldesign-git lfs push                 # 推送 LFS 文件
ldesign-git lfs prune                # 清理 LFS 文件
```

#### 7. Monorepo 命令

**文件：** `src/cli/commands/monorepo.ts`

**命令列表：**
```bash
ldesign-git monorepo discover        # 发现包
ldesign-git monorepo changed         # 查看变更的包
ldesign-git monorepo affected <pkg>  # 查看受影响的包
ldesign-git monorepo bump <pkg> <type> # 版本升级
ldesign-git monorepo graph           # 显示依赖图
```

#### 8. Config 命令

**文件：** `src/cli/commands/config.ts`

**命令列表：**
```bash
ldesign-git config list              # 列出所有配置
ldesign-git config get <key>         # 获取配置值
ldesign-git config set <key> <value> # 设置配置
ldesign-git config unset <key>       # 删除配置
ldesign-git config user              # 配置用户信息
```

---

### 阶段二：Web Server 实现（优先级：高）

#### 目录结构

```
web-ui/
├── server/
│   ├── src/
│   │   ├── index.ts              # 服务器入口
│   │   ├── app.ts                # Express 应用配置
│   │   ├── config.ts             # 服务器配置
│   │   ├── api/                  # API 路由
│   │   │   ├── index.ts          # 路由聚合
│   │   │   ├── status.ts         # 状态 API
│   │   │   ├── branch.ts         # 分支 API
│   │   │   ├── commit.ts         # 提交 API
│   │   │   ├── tag.ts            # 标签 API
│   │   │   ├── remote.ts         # 远程 API
│   │   │   ├── stash.ts          # Stash API
│   │   │   ├── diff.ts           # Diff API
│   │   │   ├── merge.ts          # 合并 API
│   │   │   ├── conflict.ts       # 冲突 API
│   │   │   └── files.ts          # 文件操作 API
│   │   ├── services/             # 业务逻辑层
│   │   │   ├── git-service.ts    # Git 操作服务
│   │   │   └── file-service.ts   # 文件服务
│   │   ├── websocket/            # WebSocket 处理
│   │   │   ├── index.ts          # WebSocket 服务器
│   │   │   └── handlers.ts       # 事件处理器
│   │   ├── middleware/           # 中间件
│   │   │   ├── error-handler.ts  # 错误处理
│   │   │   └── logger.ts         # 日志中间件
│   │   └── types/                # TypeScript 类型
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
```

#### API 端点设计

**状态相关：**
- `GET /api/status` - 获取仓库状态
- `GET /api/repository` - 获取仓库信息

**分支相关：**
- `GET /api/branches` - 获取分支列表
- `POST /api/branches` - 创建分支
- `DELETE /api/branches/:name` - 删除分支
- `PUT /api/branches/:name` - 重命名分支
- `POST /api/branches/:name/checkout` - 切换分支
- `GET /api/branches/compare` - 比较分支

**提交相关：**
- `GET /api/commits` - 获取提交历史
- `POST /api/commits` - 创建提交
- `GET /api/commits/:hash` - 获取提交详情
- `POST /api/commits/:hash/cherry-pick` - Cherry-pick

**文件相关：**
- `GET /api/files/changes` - 获取文件变更
- `POST /api/files/stage` - 暂存文件
- `POST /api/files/unstage` - 取消暂存
- `GET /api/files/content` - 获取文件内容
- `GET /api/files/diff` - 获取文件差异

**标签相关：**
- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建标签
- `DELETE /api/tags/:name` - 删除标签
- `POST /api/tags/:name/push` - 推送标签

**远程相关：**
- `GET /api/remotes` - 获取远程列表
- `POST /api/remotes` - 添加远程
- `DELETE /api/remotes/:name` - 删除远程
- `POST /api/remotes/:name/fetch` - 拉取更新
- `POST /api/sync/push` - 推送
- `POST /api/sync/pull` - 拉取

**Stash 相关：**
- `GET /api/stash` - 获取 stash 列表
- `POST /api/stash` - 保存 stash
- `POST /api/stash/:index/apply` - 应用 stash
- `POST /api/stash/:index/pop` - 弹出 stash
- `DELETE /api/stash/:index` - 删除 stash

**合并相关：**
- `POST /api/merge` - 合并分支
- `POST /api/rebase` - 变基
- `GET /api/conflicts` - 获取冲突列表
- `POST /api/conflicts/resolve` - 解决冲突

**WebSocket 事件：**
- `status:change` - 状态变更
- `operation:progress` - 操作进度
- `operation:complete` - 操作完成
- `operation:error` - 操作错误

---

### 阶段三：Web UI 实现（优先级：高）

#### 目录结构

```
web-ui/
├── client/
│   ├── src/
│   │   ├── main.tsx              # 应用入口
│   │   ├── App.tsx               # 根组件
│   │   ├── components/           # UI 组件
│   │   │   ├── layout/           # 布局组件
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   ├── status/           # 状态组件
│   │   │   │   ├── StatusOverview.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   ├── branch/           # 分支组件
│   │   │   │   ├── BranchList.tsx
│   │   │   │   ├── BranchCard.tsx
