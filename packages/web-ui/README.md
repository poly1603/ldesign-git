# @ldesign/git-web-ui

LDesign Git Web UI - 图形化界面

## 📦 安装

```bash
npm install -g @ldesign/git-web-ui
# 或
pnpm add -g @ldesign/git-web-ui
```

## 🚀 快速开始

```bash
# 启动 Web UI
ldesign-git-ui

# 默认访问地址
# http://localhost:3000
```

## ✨ 功能特性

### 仪表板
- 📊 仓库状态概览
- 📈 提交统计图表
- 🔔 实时更新通知
- ⚡ 快捷操作面板

### 分支管理
- 🌿 可视化分支列表
- ➕ 创建/删除分支
- 🔄 切换分支
- 🔀 合并操作
- 📊 分支比较
- 🌳 分支图可视化

### 提交历史
- 📜 提交时间线
- 🔍 搜索和过滤
- 📝 提交详情查看
- 👤 作者信息展示

### 变更管理
- 📂 文件变更列表
- ➕ 暂存/取消暂存
- 💬 提交变更
- 🔄 差异对比

### 同步操作
- ⬆️ Push 推送
- ⬇️ Pull 拉取
- 🔄 Fetch 获取
- 🌐 远程仓库管理

### 高级功能
- 📁 文件浏览器 - 浏览仓库文件
- 🔍 代码搜索 - 全文搜索代码
- 📊 统计分析 - 贡献者、活动统计
- 🪝 Hooks 管理 - 配置 Git Hooks
- 📦 子模块管理 - 管理子模块
- 💾 贮藏管理 - Stash 操作

### 用户体验
- ⌨️ **键盘快捷键** - 全面的快捷键支持
- 🎯 **命令面板** - Ctrl+K 快速执行命令
- 🌗 **主题切换** - 支持深色/浅色主题
- 🔔 **Toast 通知** - 操作反馈通知
- 📱 **响应式设计** - 自适应布局

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 打开命令面板 |
| `Ctrl+R` | 刷新状态 |
| `Ctrl+Shift+P` | 拉取 (Pull) |
| `Ctrl+Shift+U` | 推送 (Push) |
| `Ctrl+Shift+F` | 获取 (Fetch) |
| `G D` | 跳转到概览 |
| `G C` | 跳转到变更 |
| `G B` | 跳转到分支 |
| `G H` | 跳转到提交历史 |
| `?` | 显示快捷键帮助 |

## 🏗️ 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **TailwindCSS** - 样式框架
- **Zustand** - 状态管理
- **React Router** - 路由管理
- **Axios** - HTTP 客户端

### 后端
- **Express** - Web 服务器
- **WebSocket (ws)** - 实时通信
- **Chokidar** - 文件监听
- **@ldesign/git-core** - Git 核心功能

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 开发模式（前端 + 后端）
pnpm dev

# 单独启动前端
pnpm dev:client

# 单独启动后端
pnpm dev:server

# 构建
pnpm build
```

## 📝 配置

Web UI 默认配置:
- 服务器端口: `3000`
- WebSocket 端口: `3001`
- 自动检测当前目录的 Git 仓库

## 📝 License

MIT