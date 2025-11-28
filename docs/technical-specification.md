
# @ldesign/git 技术规格说明

## 📋 文档说明

本文档详细说明了 @ldesign/git 项目完善的技术实现细节，包括 CLI 命令和 Web UI 的具体实现规格。

---

## 1️⃣ CLI 命令实现规格

### 1.1 Remote 命令 (`src/cli/commands/remote.ts`)

#### 命令结构
```typescript
ldesign-git remote <subcommand> [options]
```

#### 子命令列表

**1. list / ls - 列出所有远程仓库**
```bash
ldesign-git remote list
ldesign-git remote list -v  # 显示详细信息（URL）
```
实现：
- 调用 `RemoteManager.list()`
- 以表格形式展示远程名称和 URL
- 显示 fetch 和 push URL

**2. add - 添加远程仓库**
```bash
ldesign-git remote add <name> <url>
```
实现：
- 验证远程名称和 URL 格式
- 调用 `RemoteManager.add(name, url)`
- 成功后显示确认信息

**3. remove / rm - 删除远程仓库**
```bash
ldesign-git remote remove <name>
```
实现：
- 确认删除操作（交互式提示）
- 调用 `RemoteManager.remove(name)`
- 显示操作结果

**4. rename - 重命名远程仓库**
```bash
ldesign-git remote rename <oldName> <newName>
```
实现：
- 调用 `RemoteManager.rename(oldName, newName)`
- 显示操作结果

**5. show - 显示远程仓库详情**
```bash
ldesign-git remote show <name>
```
实现：
- 调用 `RemoteManager.show(name)`
- 格式化显示远程信息

**6. set-url - 设置远程 URL**
```bash
ldesign-git remote set-url <name> <url>
ldesign-git remote set-url <name> <url> --push  # 仅设置 push URL
```
实现：
- 调用 `RemoteManager.setUrl(name, url, type)`
- 显示更新结果

**7. fetch - 拉取远程更新**
```bash
ldesign-git remote fetch <name>
ldesign-git remote fetch <name> --prune  # 清理远程分支
ldesign-git remote fetch <name> --tags   # 拉取标签
```
实现：
- 显示进度指示器
- 调用 `RemoteManager.fetch(name, options)`
- 显示拉取的更新信息

**8. prune - 清理远程分支**
```bash
ldesign-git remote prune <name>
```
实现：
- 调用 `RemoteManager.prune(name)`
- 显示删除的分支列表

---

### 1.2 Stash 命令 (`src/cli/commands/stash.ts`)

#### 命令结构
```typescript
ldesign-git stash <subcommand> [options]
```

#### 子命令列表

**1. save / push - 保存到 stash**
```bash
ldesign-git stash save [message]
ldesign-git stash save -u  # 包含未跟踪文件
ldesign-git stash save -a  # 包含所有文件（含ignored）
```
实现：
- 调用 `StashManager.save({ message, includeUntracked, includeAll })`
- 显示保存的 stash 信息

**2. list / ls - 列出所有 stash**
```bash
ldesign-git stash list
```
实现：
- 调用 `StashManager.list()`
- 以表格形式展示：索引、消息、日期

**3. show - 显示 stash 详情**
```bash
ldesign-git stash show [index]
```
实现：
- 调用 `StashManager.show(index)`
- 显示变更文件列表和统计

**4. apply - 应用 stash**
```bash
ldesign-git stash apply [index]
ldesign-git stash apply --index  # 保持暂存区状态
```
实现：
- 调用 `StashManager.apply(index)`
- 显示应用结果

**5. pop - 应用并删除 stash**
```bash
ldesign-git stash pop [index]
```
实现：
- 调用 `StashManager.pop(index)`
- 显示操作结果

**6. drop - 删除指定 stash**
```bash
ldesign-git stash drop <index>
```
实现：
- 确认删除操作
- 调用 `StashManager.drop(index)`

**7. clear - 清空所有 stash**
```bash
ldesign-git stash clear
```
实现：
- 确认清空操作
- 调用 `StashManager.clear()`

**8. branch - 从 stash 创建分支**
```bash
ldesign-git stash branch <name> [index]
```
实现：
- 调用 `StashManager.branch(name, index)`
- 显示创建的分支信息

---

### 1.3 Diff 命令 (`src/cli/commands/diff.ts`)

#### 命令结构
```typescript
ldesign-git diff [options] [paths...]
```

#### 命令选项

**1. 工作区差异**
```bash
ldesign-git diff                    # 工作区 vs 暂存区
ldesign-git diff <file>             # 指定文件差异
```

**2. 暂存区差异**
```bash
ldesign-git diff --staged           # 暂存区 vs HEAD
ldesign-git diff --cached           # 同上（别名）
```

**3. 提交比较**
```bash
ldesign-git diff <commit1> <commit2>
ldesign-git diff HEAD~5 HEAD
```

**4. 分支比较**
```bash
ldesign-git diff <branch1> <branch2>
ldesign-git diff main..develop
```

**5. 统计信息**
```bash
ldesign-git diff --stat             # 显示统计信息
ldesign-git diff --name-only        # 仅显示文件名
ldesign-git diff --name-status      # 显示文件名和状态
```

实现：
- 根据参数调用对应的 `DiffManager` 方法
- 使用 `chalk` 进行颜色高亮（添加/删除/修改）
- 支持分页显示（长输出）

---

### 1.4 Log 命令 (`src/cli/commands/log.ts`)

#### 命令结构
```typescript
ldesign-git log [options] [paths...]
```

#### 命令选项

**1. 基础日志**
```bash
ldesign-git log                     # 显示提交历史
ldesign-git log -n 20               # 限制数量
ldesign-git log --oneline           # 单行显示
```

**2. 过滤选项**
```bash
ldesign-git log --author <name>     # 按作者过滤
ldesign-git log --since <date>      # 按日期过滤
ldesign-git log --until <date>
ldesign-git log --grep <pattern>    # 按消息过滤
```

**3. 格式化选项**
```bash
ldesign-git log --graph             # 图形化显示
ldesign-git log --pretty            # 美化显示
ldesign-git log --stat              # 显示统计
```

**4. 文件历史**
```bash
ldesign-git log <file>              # 文件提交历史
ldesign-git log -p <file>           # 显示差异
```

实现：
- 调用 `GitManager` 的 log 方法
- 使用表格或列表格式化输出
- 支持颜色高亮和图标
- 实现分页（长列表）

---

### 1.5 Rebase 命令 (`src/cli/commands/rebase.ts`)

#### 命令结构
```typescript
ldesign-git rebase <subcommand> [options]
```

#### 子命令列表

**1. 基础变基**
```bash
ldesign-git rebase <branch>
ldesign-git rebase <upstream> <branch>
```

**2. 交互式变基**
```bash
ldesign-git rebase -i <commit>
ldesign-git rebase --interactive HEAD~5
```

**3. 继续/中止**
```bash
ldesign-git rebase --continue      # 继续变基
ldesign-git rebase --abort         # 中止变基
ldesign-git rebase --skip          # 跳过当前提交
```

**4. Cherry-pick**
```bash
ldesign-git cherry-pick <commit>
ldesign-git cherry-pick <commit1> <commit2>
ldesign-git cherry-pick --continue
ldesign-git cherry-pick --abort
```

实现：
- 调用 `MergeManager.rebase()` 和 `cherryPick()`
- 检测冲突并提供解决选项
- 显示操作进度
- 交互式模式使用 inquirer

---

### 1.6 Worktree 命令 (`src/cli/commands/worktree.ts`)

#### 子命令列表

**1. list - 列出工作树**
```bash
ldesign-git worktree list
```

**2. add - 添加工作树**
```bash
ldesign-git worktree add <path> [branch]
ldesign-git worktree add <path> -b <new-branch>
```

**3. remove - 移除工作树**
```bash
ldesign-git worktree remove <path>
ldesign-git worktree remove <path> --force
```

**4. move - 移动工作树**
```bash
ldesign-git worktree move <old-path> <new-path>
```

**5. lock/unlock - 锁定/解锁**
```bash
ldesign-git worktree lock <path> [reason]
ldesign-git worktree unlock <path>
```

**6. prune - 清理工作树**
```bash
ldesign-git worktree prune
```

实现：
- 调用 `WorktreeManager` 对应方法
- 验证路径合法性
- 显示工作树状态

---

### 1.7 LFS 命令 (`src/cli/commands/lfs.ts`)

#### 子命令列表

**1. install - 安装 LFS**
```bash
ldesign-git lfs install
ldesign-git lfs install --global
```

**2. track - 跟踪文件类型**
```bash
ldesign-git lfs track "*.psd"
ldesign-git lfs track "*.zip"
```

**3. untrack - 取消跟踪**
```bash
ldesign-git lfs untrack "*.psd"
```

**4. list - 列出 LFS 文件**
```bash
ldesign-git lfs list
ldesign-git lfs ls-files
```

**5. pull/push - 同步 LFS 文件**
```bash
ldesign-git lfs pull
ldesign-git lfs push origin main
```

**6. prune - 清理 LFS 文件**
```bash
ldesign-git lfs prune
ldesign-git lfs prune --dry-run
```

**7. status - LFS 状态**
```bash
ldesign-git lfs status
```

实现：
- 调用 `LFSManager` 对应方法
- 检查 LFS 是否安装
- 显示文件大小和统计

---

### 1.8 Monorepo 命令 (`src/cli/commands/monorepo.ts`)

#### 子命令列表

**1. discover - 发现包**
```bash
ldesign-git monorepo discover
```

**2. changed - 查看变更的包**
```bash
ldesign-git monorepo changed
ldesign-git monorepo changed --since HEAD~5
```

**3. affected - 查看受影响的包**
```bash
ldesign-git monorepo affected <package>
```

**4. bump - 版本升级**
```bash
ldesign-git monorepo bump <package> <type>
# type: major | minor | patch
```

**5. graph - 依赖图**
```bash
ldesign-git monorepo graph
ldesign-git monorepo graph --json
```

**6. publish-order - 发布顺序**
```bash
ldesign-git monorepo publish-order
```

实现：
- 调用 `MonorepoManager` 对应方法
- 可视化显示依赖关系
- 支持多种输出格式

---

### 1.9 Config 命令 (`src/cli/commands/config.ts`)

#### 子命令列表

**1. list - 列出配置**
```bash
ldesign-git config list
ldesign-git config list --local
ldesign-git config list --global
ldesign-git config list --system
```

**2. get - 获取配置**
```bash
ldesign-git config get <key>
ldesign-git config get user.name
```

**3. set - 设置配置**
```bash
ldesign-git config set <key> <value>
ldesign-git config set user.name "John Doe"
ldesign-git config set user.email "john@example.com" --global
```

**4. unset - 删除配置**
```bash
ldesign-git config unset <key>
```

**5. user - 配置用户信息**
```bash
ldesign-git config user
# 交互式设置 name 和 email
```

实现：
- 调用 `ConfigManager` 对应方法
- 支持三种作用域：local/global/system
- 交互式配置用户信息

---

## 2️⃣ Web Server 实现规格

### 2.1 技术栈

**核心框架：**
- Express.js 4.x
- Socket.io 4.x
- TypeScript 5.x

**依赖包：**
```json
{
  "express": "^4.18.0",
  "socket.io": "^4.6.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "compression": "^1.7.4",
  "morgan": "^1.10.0"
}
```

### 2.2 项目结构

```
web-ui/server/
├── src/
│   ├── index.ts              # 入口文件
│   ├── app.ts                # Express 应用
│   ├── config.ts             # 配置
│   ├── api/                  # API 路由
│   │   ├── index.ts
│   │   ├── status.ts
│   │   ├── branch.ts
│   │   ├── commit.ts
│   │   ├── tag.ts
│   │   ├── remote.ts
│   │   ├── stash.ts
│   │   ├── diff.ts
│   │   ├── merge.ts
│   │   ├── conflict.ts
│   │   └── files.ts
│   ├── services/             # 服务层
│   │   ├── git-service.ts
│   │   └── file-service.ts
│   ├── websocket/            # WebSocket
│   │   ├── index.ts
│   │   └── handlers.ts
│   ├── middleware/           # 中间件
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   └── validator.ts
│   └── types/                # 类型定义
│       └── index.ts
├── package.json
└── tsconfig.json
```

### 2.3 API 端点详细设计

#### 状态 API (`api/status.ts`)

```typescript
// GET /api/status - 获取仓库状态
Response: {
  current: string
  ahead: number
  behind: number
  modified: string[]
  created: string[]
  deleted: string[]
  conflicted: string[]
  staged: string[]
}

// GET /api/repository - 获取仓库信息
Response: {
  path: string
  name: string
  branch: string
  remotes: Remote[]
  lastCommit: Commit
}
```

#### 分支 API (`api/branch.ts`)

```typescript
// GET /api/branches - 获取分支列表
Query: { type?: 'all' | 'local' | 'remote' }
Response: {
  branches: Branch[]
  current: string
}

// POST /api/branches - 创建分支
Body: {
  name: string
  startPoint?: string
  checkout?: boolean
}

// DELETE /api/branches/:name - 删除分支
Params: { name: string }
Query: { force?: boolean, remote?: boolean }

// PUT /api/branches/:name - 重命名分支
Body: { newName: string, force?: boolean }

