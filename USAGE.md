# LDesign Git Tools 使用指南

## 🚀 快速开始（重要！）

### 第一次使用必须先构建

```bash
# 1. 安装依赖（如果还没安装）
pnpm install

# 2. 构建项目（必须！）
pnpm build
```

构建完成后，会在根目录生成 `dist/` 文件夹，包含所有打包好的文件。

### 启动 Web UI

构建完成后，有两种方式启动：

```bash
# 方式 1：使用 npm 脚本（推荐）
pnpm start:ui

# 方式 2：直接运行
node bin/ldesign-git-ui.js
```

Web UI 将在 http://localhost:3001 启动

### ⚠️ 常见错误

**错误：找不到 dist/web-ui-server.cjs**
```
❌ Web UI 构建产物不存在！
请先运行: pnpm build
```

**解决方案**：先运行 `pnpm build`

## 完整工作流程

```bash
# 1. 克隆项目
git clone <your-repo>
cd <your-repo>

# 2. 安装依赖
pnpm install

# 3. 构建所有包（必须！）
pnpm build

# 4. 启动 Web UI
pnpm start:ui

# 5. 打开浏览器访问
# http://localhost:3001
```

## 开发模式

如果你要开发和修改代码：

```bash
# 启动开发服务器（支持热重载）
pnpm dev:web-ui
```

开发模式下，前端和后端都会自动重新加载。

## 自定义选项

### 更改端口

```bash
node bin/ldesign-git-ui.js --port 8080
```

### 指定 Git 仓库路径

```bash
node bin/ldesign-git-ui.js --path /path/to/your/git/repo
```

### 同时指定多个选项

```bash
node bin/ldesign-git-ui.js --port 8080 --path /path/to/repo
```

## 发布到 NPM 后的使用

当您将包发布到 npm 后，用户可以：

```bash
# 全局安装
npm install -g @ldesign/git-tools

# 直接运行
ldesign-git-ui

# 或使用 npx（无需安装）
npx @ldesign/git-tools
```

## 项目结构

构建后的目录结构：

```
.
├── bin/
│   └── ldesign-git-ui.js     # 启动脚本
├── dist/                      # 构建产物（运行 pnpm build 后生成）
│   ├── web-ui-client/        # 前端静态文件
│   └── web-ui-server.cjs     # 后端服务器（已打包所有依赖）
├── packages/                  # 源代码
│   ├── core/                 # Git 核心库
│   ├── cli/                  # 命令行工具
│   └── web-ui/               # Web UI
└── scripts/
    └── build-all.js          # 统一构建脚本
```

## 开发命令

```bash
# 构建（生成 dist/）
pnpm build

# 构建单个包（开发用）
pnpm build:packages

# 开发模式
pnpm dev:web-ui

# 启动 UI（生产模式）
pnpm start:ui

# 清理构建产物
pnpm clean

# 运行测试
pnpm test

# 类型检查
pnpm type-check

# 代码检查
pnpm lint
pnpm lint:fix
```

## 常见问题

### Q: 为什么 `pnpm start:ui` 报错找不到文件？
**A:** 必须先运行 `pnpm build` 生成构建产物。

### Q: 如何重新构建？
**A:** 
```bash
# 清理旧的构建
pnpm clean

# 重新构建
pnpm build
```

### Q: 开发时每次都要重新构建吗？
**A:** 不需要！开发时使用 `pnpm dev:web-ui`，支持热重载。

### Q: 构建失败怎么办？
**A:**
```bash
# 1. 清理
pnpm clean
rm -rf node_modules
rm -rf packages/*/node_modules

# 2. 重新安装
pnpm install

# 3. 重新构建
pnpm build
```

### Q: 如何更改监听的端口？
**A:** 
```bash
node bin/ldesign-git-ui.js --port 8080
```

### Q: 如何在不同的仓库中使用？
**A:** 
```bash
node bin/ldesign-git-ui.js --path /path/to/another/repo
```

### Q: dist 目录可以删除吗？
**A:** 可以，运行 `pnpm clean` 会删除。但再次启动前需要重新构建。

### Q: 如何验证构建是否成功？
**A:**
```bash
# 检查 dist 目录
ls -la dist/

# 应该看到：
# dist/web-ui-client/  （前端文件）
# dist/web-ui-server.cjs（后端文件）
```

## 技术栈

- **Core**: TypeScript, simple-git
- **CLI**: TypeScript, Commander.js  
- **Web UI Client**: React, TypeScript, Vite, TailwindCSS, Zustand
- **Web UI Server**: Express, WebSocket, TypeScript
- **Build Tool**: esbuild（统一打包）

## 优势

✅ **单一包发布** - 只需发布根目录，无需分别发布子包
✅ **开箱即用** - 构建后直接运行，无需额外配置
✅ **完整打包** - 所有依赖都打包在一起，无模块依赖问题
✅ **本地测试方便** - 构建后立即可以测试
✅ **用户使用简单** - 安装后直接 `npx @ldesign/git-tools` 即可

## License

MIT