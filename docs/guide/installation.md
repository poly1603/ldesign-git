# 安装

本指南将帮助你在项目中安装和配置 @ldesign/git。

## 系统要求

在安装之前，请确保你的系统满足以下要求：

- **Node.js** >= 14.0.0
- **Git** >= 2.0.0（需要在系统中安装 Git 命令行工具）

### 检查系统环境

```bash
# 检查 Node.js 版本
node --version

# 检查 Git 版本
git --version
```

如果没有安装 Git，请访问 [Git 官网](https://git-scm.com/) 下载安装。

## 包管理器安装

### npm

```bash
npm install @ldesign/git
```

### pnpm

```bash
pnpm add @ldesign/git
```

### yarn

```bash
yarn add @ldesign/git
```

### bun

```bash
bun add @ldesign/git
```

## 开发依赖安装

如果你只在开发环境中使用，可以作为开发依赖安装：

```bash
npm install --save-dev @ldesign/git
# 或
pnpm add -D @ldesign/git
```

## 验证安装

安装完成后，可以通过以下方式验证：

```typescript
import { GitManager } from '@ldesign/git'

const git = new GitManager(process.cwd())
console.log('@ldesign/git installed successfully!')
```

或创建一个简单的测试脚本：

```typescript path=null start=null
// test-install.js
import { GitManager } from '@ldesign/git'

async function test() {
  try {
    const git = new GitManager(process.cwd())
    const status = await git.status()
    console.log('✅ @ldesign/git is working correctly!')
    console.log('Repository status:', status)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

test()
```

运行测试：

```bash
node test-install.js
```

## TypeScript 配置

如果你使用 TypeScript，@ldesign/git 已经包含了完整的类型定义，无需额外安装 @types 包。

确保你的 `tsconfig.json` 配置正确：

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  }
}
```

## Git LFS 安装（可选）

如果需要使用 `LFSManager` 功能，需要额外安装 Git LFS：

### macOS

```bash
brew install git-lfs
git lfs install
```

### Ubuntu/Debian

```bash
sudo apt-get install git-lfs
git lfs install
```

### Windows

下载并安装 [Git LFS for Windows](https://git-lfs.github.com/)，或使用 Chocolatey：

```powershell
choco install git-lfs
git lfs install
```

### 验证 Git LFS

```bash
git lfs version
```

## 故障排除

### 找不到 Git 命令

如果遇到 "git command not found" 错误：

1. 确保已安装 Git
2. 确保 Git 在系统 PATH 中
3. 重启终端或 IDE

### 权限错误

如果遇到权限相关错误：

```bash
# macOS/Linux
sudo chown -R $(whoami) /path/to/repo

# 或使用 sudo 运行
sudo npm install @ldesign/git
```

### 网络问题

如果遇到网络问题，可以尝试使用镜像源：

```bash
# 使用淘宝镜像
npm install @ldesign/git --registry=https://registry.npmmirror.com

# 或配置永久镜像
npm config set registry https://registry.npmmirror.com
```

### 版本冲突

如果遇到版本冲突，可以：

1. 清除缓存：
```bash
npm cache clean --force
# 或
pnpm store prune
```

2. 删除 node_modules 重新安装：
```bash
rm -rf node_modules package-lock.json
npm install
```

## 升级

### 升级到最新版本

```bash
npm update @ldesign/git
# 或
pnpm update @ldesign/git
```

### 升级到特定版本

```bash
npm install @ldesign/git@0.4.0
# 或
pnpm add @ldesign/git@0.4.0
```

### 查看当前版本

```bash
npm list @ldesign/git
# 或
pnpm list @ldesign/git
```

## 卸载

如果需要卸载：

```bash
npm uninstall @ldesign/git
# 或
pnpm remove @ldesign/git
```

## 下一步

- [快速开始](/guide/getting-started) - 学习基本用法
- [API 文档](/api/) - 查看完整 API
- [示例代码](/examples/) - 浏览实际示例
