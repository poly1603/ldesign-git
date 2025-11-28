
# @ldesign/git Monorepo 重组方案

## 📋 项目现状分析

### 当前问题
1. **根目录混乱** - 15+ 个文档文件散落,包括多个 COMPLETE.md、SUMMARY.md
2. **架构不清晰** - 核心库、CLI、Web UI 混在一起
3. **构建配置分散** - tsconfig、tsup 配置在根目录
4. **Web UI 独立性差** - client/server 分离但缺乏统一管理
5. **文档系统重复** - docs/ 独立但与根目录文档重叠

### 目标架构
采用 **PNPM Workspace Monorepo** 架构,将项目拆分为:
- **packages/core** - Git 核心功能库
- **packages/cli** - 命令行工具
- **packages/web-ui** - Web 界面 (client + server)
- **docs/** - VitePress 文档站点 (保持独立)

## 🏗️ 新架构设计

### 目录结构

```
@ldesign/git/
├── packages/
│   ├── core/                    # Git 核心功能库
│   │   ├── src/
│   │   │   ├── core/           # 核心管理器
│   │   │   ├── advanced/       # 高级功能
│   │   │   ├── analytics/      # 统计分析
│   │   │   ├── automation/     # 自动化
│   │   │   ├── conflict/       # 冲突解决
│   │   │   ├── hooks/          # Hooks 管理
│   │   │   ├── submodule/      # 子模块
│   │   │   ├── types/          # 类型定义
│   │   │   ├── utils/          # 工具函数
│   │   │   ├── errors/         # 错误处理
│   │   │   ├── logger/         # 日志系统
│   │   │   ├── cache/          # 缓存系统
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── README.md
│   │
│   ├── cli/                     # CLI 工具
│   │   ├── src/
│   │   │   ├── commands/       # 命令实现
│   │   │   ├── utils/          # CLI 工具
│   │   │   └── index.ts
│   │   ├── bin/
│   │   │   └── cli.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── README.md
│   │
│   └── web-ui/                  # Web UI
│       ├── client/              # React 前端
│       │   ├── src/
│       │   ├── public/
│       │   ├── index.html
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   ├── vite.config.ts
│       │   └── tailwind.config.js
│       ├── server/              # Express 后端
│       │   ├── src/
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   └── tsup.config.ts
│       ├── bin/
│       │   └── web-ui.js
│       ├── package.json         # 统一的 web-ui package.json
│       └── README.md
│
├── docs/                        # VitePress 文档
│   ├── .vitepress/
│   ├── guide/
│   ├── api/
│   ├── examples/
│   ├── package.json
│   └── README.md
│
├── scripts/                     # 构建和工具脚本
│   ├── copy-web-assets.js
│   └── build-all.js
│
├── examples/                    # 使用示例 (保持)
│   └── *.ts
│
├── archive/                     # 归档的历史文档
│   ├── 100_PERCENT_COMPLETE.md
│   ├── FINAL_SUMMARY.md
│   ├── PROJECT_COMPLETE.md
│   ├── V04_COMPLETION_SUMMARY.md
│   ├── WEB_UI_IMPLEMENTATION_SUMMARY.md
│   ├── UNIFIED_BUILD_SUMMARY.md
│   └── roo_task_*.md
│
├── .github/                     # GitHub 配置
│   └── workflows/
│
├── pnpm-workspace.yaml          # PNPM Workspace 配置
├── package.json                 # Monorepo 根配置
├── tsconfig.base.json           # 共享 TS 配置
├── .gitignore
├── LICENSE
├── README.md                    # 主文档
├── CHANGELOG.md                 # 变更日志 (合并)
├── QUICK_START.md              # 快速开始
└── BUILD_AND_USAGE.md          # 构建和使用
```

### 架构图

```mermaid
graph TB
    subgraph Root[Monorepo 根目录]
        RootPkg[package.json<br/>workspace root]
        Workspace[pnpm-workspace.yaml]
        TSBase[tsconfig.base.json]
    end

    subgraph Packages[packages/]
        subgraph Core[core - 核心库]
            CorePkg[package.json<br/>@ldesign/git-core]
            CoreSrc[src/<br/>Git 核心功能]
        end
        
        subgraph CLI[cli - CLI 工具]
            CLIPkg[package.json<br/>@ldesign/git-cli]
            CLISrc[src/<br/>命令行实现]
            CLIBin[bin/cli.js]
        end
        
        subgraph WebUI[web-ui - Web 界面]
            WebPkg[package.json<br/>@ldesign/git-web-ui]
            Client[client/<br/>React 前端]
            Server[server/<br/>Express 后端]
            WebBin[bin/web-ui.js]
        end
    end

    subgraph Docs[docs/]
        DocsPkg[package.json<br/>VitePress]
        DocsContent[文档内容]
    end

    RootPkg --> Workspace
    Workspace --> Core
    Workspace --> CLI
    Workspace --> WebUI
    Workspace --> Docs

    CLI --> Core
    WebUI --> Core
    
    CorePkg -.发布到 npm.-> NPM[NPM Registry]
    CLIPkg -.发布到 npm.-> NPM
    WebPkg -.发布到 npm.-> NPM
```

### 依赖关系

```mermaid
graph LR
    Core[@ldesign/git-core<br/>核心功能]
    CLI[@ldesign/git-cli<br/>CLI 工具]
    WebUI[@ldesign/git-web-ui<br/>Web 界面]
    Docs[文档站点]

    CLI -->|workspace:*| Core
    WebUI -->|workspace:*| Core
    Docs -.引用.-> Core
    Docs -.引用.-> CLI
```

## 📦 包配置详情

### 1. packages/core/package.json

```json
{
  "name": "@ldesign/git-core",
  "version": "0.4.0",
  "description": "LDesign Git 核心功能库 - 提供完整的 Git 操作 API",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js",
      "require": "./dist/types/index.cjs"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.js",
      "require": "./dist/utils/index.cjs"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "simple-git": "^3.22.0",
    "chokidar": "^3.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.16",
    "typescript": "^5.7.3",
    "tsup": "^8.0.0",
    "vitest": "^1.6.1"
  }
}
```

### 2. packages/cli/package.json

```json
{
  "name": "@ldesign/git-cli",
  "version": "0.4.0",
  "description": "LDesign Git CLI 工具 - 功能强大的命令行界面",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "ldesign-git": "./bin/cli.js"
  },
  "files": ["dist", "bin", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@ldesign/git-core": "workspace:*",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "commander": "^12.0.0",
    "inquirer": "^9.2.0",
    "boxen": "^7.1.1",
    "cli-table3": "^0.6.3"
  },
  "devDependencies": {
    "@types/node": "^20.11.16",
    "@types/inquirer": "^9.0.7",
    "typescript": "^5.7.3",
    "tsup": "^8.0.0"
  }
}
```

### 3. packages/web-ui/package.json

```json
{
  "name": "@ldesign/git-web-ui",
  "version": "0.4.0",
  "description": "LDesign Git Web UI - 图形化界面",
  "type": "module",
  "private": false,
  "bin": {
    "ldesign-git-ui": "./bin/web-ui.js"
  },
  "files": ["dist", "bin", "README.md", "LICENSE"],
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && pnpm dev",
    "dev:server": "cd server && pnpm dev",
    "build": "pnpm build:client && pnpm build:server",
    "build:client": "cd client && pnpm build",
    "build:server": "cd server && pnpm build",
    "install:all": "pnpm install && cd client && pnpm install && cd ../server && pnpm install"
  },
  "dependencies": {
    "@ldesign/git-core": "workspace:*"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### 4. 根 package.json

```json
{
  "name": "@ldesign/git-monorepo",
  "version": "0.4.0",
  "private": true,
  "description": "LDesign Git Tools Monorepo",
  "type": "module",
  "scripts": {
    "build": "pnpm -r --filter \"./packages/**\" build",
    "build:core": "pnpm --filter @ldesign/git-core build",
    "build:cli": "pnpm --filter @ldesign/git-cli build",
    "build:web-ui": "pnpm --filter @ldesign/git-web-ui build",
    "build:docs": "pnpm --filter @ldesign/git-docs build",
    "dev": "pnpm -r --parallel dev",
    "test": "pnpm -r test",
    "clean": "pnpm -r exec rimraf dist",
    "type-check": "pnpm -r type-check",
    "lint": "eslint packages/*/src --ext .ts",
    "publish:all": "pnpm -r --filter \"./packages/**\" publish"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "rimraf": "^5.0.5",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.20.0",
    "@typescript-eslint/parser": "^6.20.0"
  }
}
```

### 5. pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'docs'
```

### 6. tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

## 🔄 迁移步骤详解

### 阶段 1: 创建基础架构 (30分钟)

1. **创建 Monorepo 配置**
   - 创建 `pnpm-workspace.yaml`
   - 创建 `tsconfig.base.json`
   - 更新根 `package.json` 为 workspace root

2. **创建 packages 目录结构**
   ```bash
   mkdir -p packages/{core,cli,web-ui}
   ```

### 阶段 2: 迁移核心代码 (1小时)

3. **迁移 packages/core**
   - 移动 `src/` 下所有核心代码到 `packages/core/src/`
   - 创建 `packages/core/package.json`
   - 创建 `packages/core/tsconfig.json` (继承 base)
   - 复制 `tsup.config.ts` 到 `packages/core/`
   - 保留测试文件在对应位置

4. **迁移 packages/cli**
   - 移动 `src/cli/` 到 `packages/cli/src/`
   - 移动 `bin/cli.js` 到 `packages/cli/bin/`
   - 创建 `packages/cli/package.json`
   - 创建 `packages/cli/tsconfig.json`
   - 更新 CLI 依赖为 `@ldesign/git-core: workspace:*`

5. **重组 packages/web-ui**
   - 移动 `web-ui/client/` 到 `packages/web-ui/client/`
   - 移动 `web-ui/server/` 到 `packages/web-ui/server/`
   - 移动 `bin/web-ui.js` 到 `packages/web-ui/bin/`
   - 创建统一的 `packages/web-ui/package.json`
   - 更新依赖关系

### 阶段 3: 整理文档 (30分钟)

6. **归档历史文档**
   - 创建 `archive/` 目录
   - 移动以下文件到 archive/:
     - `100_PERCENT_COMPLETE.md`
     - `FINAL_SUMMARY.md`
     - `PROJECT_COMPLETE.md`
     - `V04_COMPLETION_SUMMARY.md`
     - `WEB_UI_IMPLEMENTATION_SUMMARY.md`
     - `UNIFIED_BUILD_SUMMARY.md`
     - `roo_task_*.md`
   
7. **保留的根目录文档**
   - `README.md` (更新为 Monorepo 说明)
   - `CHANGELOG.md` (合并所有变更日志)
