# 快速开始指南

## 🚀 安装和使用

### 方式 1：直接使用（推荐新用户）

```bash
# 1. 安装包
npm install -g @ldesign/git

# 2. 使用 CLI 命令
ldesign-git status
ldesign-git branch list

# 3. 启动 Web UI（如果已构建）
ldesign-git-ui
```

### 方式 2：从源码构建（推荐开发者）

```bash
# 1. 克隆项目
git clone <repo-url>
cd ldesign-git

# 2. 安装依赖
pnpm install

# 3. 构建核心库
pnpm run build

# 4. （可选）构建 Web UI
pnpm run build:web

# 5. 本地链接
pnpm link --global

# 6. 使用
ldesign-git status
ldesign-git-ui
```

## 📦 构建说明

### 只构建核心库

```bash
pnpm run build:core
```

这会构建所有 CLI 命令和核心 Git 功能。

### 构建 Web UI

如果您想使用 Web UI，需要单独构建：

```bash
# 构建 Web UI 服务器
cd web-ui/server
pnpm install
pnpm run build
cd ../..

# 构建 Web UI 客户端
cd web-ui/client
pnpm install
pnpm run build
cd ../..

# 复制资源到 dist
pnpm run copy:web-assets
```

或者使用快捷命令：

```bash
pnpm run build:web
```

### 完整构建

```bash
# 构建所有内容（核心 + Web UI）
pnpm run build:core
pnpm run build:web
pnpm run copy:web-assets
```

## 🎯 使用 CLI 命令

```bash
# 查看帮助
ldesign-git --help

# 状态查看
ldesign-git status

# 分支管理
ldesign-git branch list
ldesign-git branch create feature/new
ldesign-git branch checkout feature/new

# 智能提交
ldesign-git commit smart

# 更多命令...
```

## 🌐 使用 Web UI

```bash
# 启动 Web UI（默认端口 3001）
ldesign-git-ui

# 自定义端口
ldesign-git-ui --port 8080

# 指定仓库路径
ldesign-git-ui --path /path/to/repo
```

然后在浏览器中访问 `http://localhost:3001`

## ⚠️ 注意事项

1. **Web UI 是可选的**：如果您只需要 CLI 功能，不需要构建 Web UI
2. **依赖安装**：Web UI 需要额外的 npm 包，第一次构建会自动安装
3. **Node 版本**：确保 Node.js >= 16.0.0

## 🔧 故障排除

### 构建失败

```bash
# 清理并重试
pnpm run clean
pnpm install
pnpm run build
```

### CLI 命令找不到

```bash
# 确保已全局安装或链接
pnpm link --global

# 或者本地使用
npx ldesign-git status
```

### Web UI 无法启动

```bash
# 确保已构建 Web UI
pnpm run build:web

# 检查构建产物
ls dist/web-ui/server
ls dist/web-ui/client
```

## 📚 更多文档

- [BUILD_AND_USAGE.md](BUILD_AND_USAGE.md) - 详细构建说明
- [README.md](README.md) - 完整功能文档
- [web-ui/README.md](web-ui/README.md) - Web UI 详细文档

开始享受强大的 Git 管理工具吧！🎉