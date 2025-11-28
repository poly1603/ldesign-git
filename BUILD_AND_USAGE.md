# 构建和使用指南

## 📦 一键构建

现在您可以使用一个命令构建整个项目（包括核心库和 Web UI）：

```bash
npm run build
```

这个命令会：
1. 清理旧的构建产物
2. 构建核心 Git 库
3. 构建 Web UI 客户端
4. 构建 Web UI 服务器
5. 复制所有 Web 资源到 `dist` 目录

构建完成后，所有产物都在 `dist` 目录中。

## 📥 安装使用

### 方式 1：从 npm 安装（推荐）

```bash
npm install -g @ldesign/git
```

### 方式 2：本地安装

```bash
# 在项目目录
npm install
npm run build
npm link
```

## 🎯 使用方法

安装完成后，您将获得两个命令：

### 1. CLI 命令行工具

```bash
# 查看帮助
ldesign-git --help

# 查看状态
ldesign-git status

# 分支操作
ldesign-git branch list
ldesign-git branch create feature/new-feature
ldesign-git branch checkout feature/new-feature

# 更多命令...
```

### 2. Web UI 可视化界面

```bash
# 启动 Web UI（默认端口 3001）
ldesign-git-ui

# 指定端口
ldesign-git-ui --port 8080
ldesign-git-ui -p 8080

# 指定 Git 仓库路径
ldesign-git-ui --path /path/to/your/repo

# 组合使用
ldesign-git-ui --port 8080 --path /path/to/your/repo
```

启动后，在浏览器中访问：`http://localhost:3001`（或您指定的端口）

## 🌐 Web UI 功能

启动 Web UI 后，您可以：

- **📊 仪表盘** - 查看仓库概览、统计信息
- **🌿 分支管理** - 可视化管理所有分支
- **📝 提交历史** - 浏览完整的提交记录
- **📂 变更管理** - 暂存、提交、丢弃文件更改
- **🔄 同步操作** - Pull、Push、Fetch 远程仓库
- **⚡ 实时更新** - 自动同步仓库状态

## 🔧 配置选项

### 环境变量

您可以通过环境变量配置 Web UI：

```bash
# 设置端口
PORT=8080 ldesign-git-ui

# 设置仓库路径
GIT_REPO_PATH=/path/to/repo ldesign-git-ui

# 组合使用
PORT=8080 GIT_REPO_PATH=/path/to/repo ldesign-git-ui
```

### 配置文件

或者在仓库根目录创建 `.ldesign-git.json`：

```json
{
  "webui": {
    "port": 3001,
    "autoOpen": true
  }
}
```

## 📚 完整功能列表

### CLI 命令

- ✅ `ldesign-git status` - 查看状态
- ✅ `ldesign-git branch` - 分支管理
- ✅ `ldesign-git tag` - 标签管理
- ✅ `ldesign-git commit` - 提交管理
- ✅ `ldesign-git stash` - Stash 操作
- ✅ `ldesign-git remote` - 远程仓库管理
- ✅ `ldesign-git diff` - 差异比较
- ✅ `ldesign-git log` - 日志查看
- ✅ `ldesign-git config` - 配置管理
- ✅ `ldesign-git workflow` - 工作流管理
- ✅ `ldesign-git analyze` - 仓库分析
- ✅ `ldesign-git conflict` - 冲突解决
- ✅ `ldesign-git hooks` - Hooks 管理

### Web UI 功能

- ✅ 仪表盘概览
- ✅ 分支可视化管理
- ✅ 提交历史浏览
- ✅ 文件变更管理
- ✅ 远程同步操作
- ✅ 实时状态更新
- ✅ 冲突解决界面
- ✅ 响应式设计

## 🚀 开发模式

如果您想在开发模式下运行：

```bash
# 核心库开发
npm run dev

# Web UI 开发
cd web-ui

# 启动服务器
cd server && npm run dev

# 启动客户端（新终端）
cd client && npm run dev
```

## 📦 构建产物结构

```
dist/
├── index.js                 # 核心库入口
├── index.d.ts              # 类型定义
├── cli/                    # CLI 命令
├── core/                   # 核心模块
├── types/                  # 类型定义
├── utils/                  # 工具函数
└── web-ui/                 # Web UI
    ├── server/             # 服务器代码
    │   └── index.js
    └── client/             # 客户端静态文件
        ├── index.html
        ├── assets/
        └── ...
```

## 🔍 故障排除

### Web UI 无法启动

1. **检查构建**：确保运行了 `npm run build`
2. **检查端口**：确保端口未被占用
3. **检查路径**：确保指定的 Git 仓库路径有效

### CLI 命令找不到

1. **全局安装**：运行 `npm install -g @ldesign/git`
2. **或使用 link**：在项目目录运行 `npm link`

### 构建失败

1. **清理缓存**：运行 `npm run clean`
2. **重新安装**：删除 `node_modules` 并运行 `npm install`
3. **检查 Node 版本**：确保 >= 16.0.0

## 💡 使用技巧

### 快速启动 Web UI

添加到 shell 配置文件（如 `.bashrc` 或 `.zshrc`）：

```bash
alias gitui="ldesign-git-ui"
```

然后就可以使用：

```bash
gitui
```

### 项目内使用

在您的项目中安装：

```bash
npm install @ldesign/git --save-dev
```

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "git:ui": "ldesign-git-ui",
    "git:status": "ldesign-git status"
  }
}
```

## 📖 更多文档

- [README.md](README.md) - 项目主文档
- [web-ui/README.md](web-ui/README.md) - Web UI 详细文档
- [CHANGELOG.md](CHANGELOG.md) - 更新日志

## 🎉 开始使用

现在您已经了解了如何构建和使用 LDesign Git 工具！

```bash
# 1. 构建
npm run build

# 2. 安装
npm link

# 3. 使用 CLI
ldesign-git status

# 4. 启动 Web UI
ldesign-git-ui
```

享受可视化的 Git 管理体验！🚀