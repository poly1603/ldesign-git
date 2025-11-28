# NPM 发布指南

## 发布前准备

### 1. 确保所有测试通过
```bash
pnpm test
pnpm type-check
pnpm lint
```

### 2. 构建所有包
```bash
pnpm build
```

### 3. 更新版本号
```bash
# 在各个包的 package.json 中更新版本号
# 或使用 pnpm 的版本管理
pnpm -r exec npm version patch  # 或 minor/major
```

## 发布到 NPM

### 方式一：发布所有包
```bash
pnpm publish:all
```

### 方式二：单独发布每个包

#### 1. 发布 core 包
```bash
cd packages/core
npm publish --access public
```

#### 2. 发布 cli 包
```bash
cd packages/cli
npm publish --access public
```

#### 3. 发布 web-ui 包
```bash
cd packages/web-ui
npm publish --access public
```

## 发布后用户使用方式

### Core 库
```bash
# 安装
npm install @ldesign/git-core

# 使用
import { GitManager } from '@ldesign/git-core'
```

### CLI 工具
```bash
# 全局安装
npm install -g @ldesign/git-cli

# 使用
ldesign-git status
ldesign-git commit -m "message"
```

### Web UI
```bash
# 全局安装
npm install -g @ldesign/git-web-ui

# 使用
ldesign-git-ui

# 或使用 npx
npx @ldesign/git-web-ui

# 自定义选项
npx @ldesign/git-web-ui --port 8080 --path /path/to/repo
```

## 重要说明

### 包依赖关系

发布顺序必须是：
1. **先发布 @ldesign/git-core**
2. 再发布 @ldesign/git-cli
3. 最后发布 @ldesign/git-web-ui

因为 cli 和 web-ui 都依赖 core。

### Web UI 包的特殊配置

`packages/web-ui/package.json` 已配置：

1. **files 字段**：包含构建后的文件
   ```json
   "files": [
     "bin",
     "client/dist",
     "server/dist",
     "README.md",
     "LICENSE"
   ]
   ```

2. **dependencies**：包含所有运行时依赖
   ```json
   "dependencies": {
     "@ldesign/git-core": "^0.4.0",
     "express": "^4.18.2",
     "cors": "^2.8.5",
     "ws": "^8.16.0",
     "chokidar": "^3.6.0"
   }
   ```

3. **prepublishOnly**：发布前自动构建
   ```json
   "prepublishOnly": "npm run build"
   ```

### 验证发布

发布后验证：

```bash
# 在新目录测试
mkdir test-install
cd test-install

# 测试 core
npm install @ldesign/git-core
node -e "const { GitManager } = require('@ldesign/git-core'); console.log('Core OK')"

# 测试 cli
npm install -g @ldesign/git-cli
ldesign-git --version

# 测试 web-ui
npm install -g @ldesign/git-web-ui
ldesign-git-ui --help

# 或使用 npx
npx @ldesign/git-web-ui
```

## 常见问题

### Q: 发布时提示 "workspace:*" 错误
A: 这是正常的。pnpm 会在发布时自动将 `workspace:*` 转换为实际的版本号。

### Q: Web UI 发布后用户安装失败
A: 确保：
1. ✅ 已先发布 @ldesign/git-core
2. ✅ package.json 中 dependencies 使用了具体版本号（不是 workspace:*）
3. ✅ files 字段包含了 client/dist 和 server/dist

### Q: 用户使用 npx 时找不到模块
A: 检查：
1. ✅ bin/web-ui.js 的 shebang 正确：`#!/usr/bin/env node`
2. ✅ bin/web-ui.js 有执行权限
3. ✅ package.json 的 bin 字段正确配置

### Q: 如何回退发布
```bash
# 废弃某个版本（不推荐删除）
npm deprecate @ldesign/git-web-ui@0.4.0 "Use version 0.4.1 instead"

# 发布修复版本
npm version patch
npm publish
```

## 发布检查清单

- [ ] 所有测试通过
- [ ] 代码已构建
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] README 已更新
- [ ] 已登录 npm (`npm login`)
- [ ] 按顺序发布（core → cli → web-ui）
- [ ] 发布后验证功能

## NPM 组织设置

如果使用 npm 组织（@ldesign），需要：

1. 创建组织：https://www.npmjs.com/org/create
2. 添加成员
3. 设置组织为 public（免费）或 private（付费）
4. 首次发布使用 `--access public`

## 示例发布流程

```bash
# 1. 确保在主分支且代码已提交
git checkout main
git pull

# 2. 运行测试和构建
pnpm test
pnpm build

# 3. 更新版本（可选）
# 手动编辑 package.json 或使用命令

# 4. 登录 npm
npm login

# 5. 发布 core（最先）
cd packages/core
npm publish --access public
cd ../..

# 6. 发布 cli
cd packages/cli
npm publish --access public
cd ../..

# 7. 发布 web-ui（最后）
cd packages/web-ui
npm publish --access public
cd ../..

# 8. 打标签
git tag v0.4.0
git push origin v0.4.0

# 9. 验证
npx @ldesign/git-web-ui --help
```

## 自动化发布（可选）

可以使用 GitHub Actions 自动发布：

```yaml
# .github/workflows/publish.yml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      
      - run: cd packages/core && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
      
      - run: cd packages/cli && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
      
      - run: cd packages/web-ui && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}