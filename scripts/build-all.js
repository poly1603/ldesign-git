#!/usr/bin/env node

import { execSync } from 'child_process'
import { cpSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { build } from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🔨 开始构建 @ldesign/git-tools...\n')

// 1. 清理根目录 dist
const distDir = join(rootDir, 'dist')
if (existsSync(distDir)) {
  console.log('🧹 清理旧的构建产物...')
  rmSync(distDir, { recursive: true, force: true })
}
mkdirSync(distDir, { recursive: true })
mkdirSync(join(distDir, 'bin'), { recursive: true })

// 2. 构建所有 packages
console.log('📦 构建 packages...\n')
try {
  execSync('pnpm -r --filter "./packages/**" build', {
    stdio: 'inherit',
    cwd: rootDir
  })
} catch (error) {
  console.error('❌ 构建失败')
  process.exit(1)
}

console.log('\n📋 打包所有产物到 dist/...\n')

// 3. 打包 CLI（包含所有依赖）
console.log('  📦 打包 CLI...')
try {
  await build({
    entryPoints: [join(rootDir, 'packages/cli/src/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: join(distDir, 'cli.cjs'),
    external: ['fsevents'],
    sourcemap: false,
    minify: true,
  })
  console.log('    ✓ CLI 打包完成')
} catch (error) {
  console.error('❌ 打包 CLI 失败:', error)
  process.exit(1)
}

// 4. 复制 web-ui client 的构建产物
console.log('  📦 复制 Web UI Client...')
const webClientDistDir = join(distDir, 'web-ui-client')
mkdirSync(webClientDistDir, { recursive: true })
cpSync(
  join(rootDir, 'packages/web-ui/client/dist'),
  webClientDistDir,
  { recursive: true }
)
console.log('    ✓ Web UI Client 复制完成')

// 5. 打包 web-ui server（包含所有依赖）
console.log('  📦 打包 Web UI Server...')
try {
  await build({
    entryPoints: [join(rootDir, 'packages/web-ui/server/src/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: join(distDir, 'web-ui-server.cjs'),
    external: ['fsevents'],
    sourcemap: false,
    minify: true,
  })
  console.log('    ✓ Web UI Server 打包完成')
} catch (error) {
  console.error('❌ 打包 Web UI Server 失败:', error)
  process.exit(1)
}

console.log('\n✅ 构建完成！\n')
console.log('📂 产物目录结构:')
console.log('  dist/')
console.log('    ├── cli.js            # CLI 命令行工具')
console.log('    ├── web-ui-server.js  # Web UI 服务器')
console.log('    └── web-ui-client/    # Web UI 前端资源')
console.log('')
console.log('🚀 安装后可用命令:')
console.log('  lgit              # Git 命令行工具')
console.log('  lgit ui           # 启动可视化界面')
console.log('  lgit submodule    # 子模块管理')
console.log('  lgit --help       # 查看所有命令')
console.log('')