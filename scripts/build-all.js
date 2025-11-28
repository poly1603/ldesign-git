#!/usr/bin/env node

import { execSync } from 'child_process'
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { build } from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🔨 开始构建所有包...\n')

// 1. 清理根目录 dist
const distDir = join(rootDir, 'dist')
if (existsSync(distDir)) {
  console.log('🧹 清理旧的构建产物...')
  rmSync(distDir, { recursive: true, force: true })
}
mkdirSync(distDir, { recursive: true })

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

console.log('\n📋 打包和复制构建产物...\n')

// 3. 复制 web-ui client 的构建产物
console.log('  ✓ 复制 web-ui client')
const webClientDistDir = join(distDir, 'web-ui-client')
mkdirSync(webClientDistDir, { recursive: true })
cpSync(
  join(rootDir, 'packages/web-ui/client/dist'),
  webClientDistDir,
  { recursive: true }
)

// 4. 使用 esbuild 打包 web-ui server（包含所有依赖）
console.log('  ✓ 打包 web-ui server (包含所有依赖)...')
try {
  await build({
    entryPoints: [join(rootDir, 'packages/web-ui/server/src/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',  // 使用 CommonJS 格式
    outfile: join(distDir, 'web-ui-server.cjs'),  // 使用 .cjs 扩展名
    external: ['fsevents'],  // 排除原生依赖
    sourcemap: true,
    minify: false,
  })
  console.log('    ✓ 打包完成')
} catch (error) {
  console.error('❌ 打包 web-ui server 失败:', error)
  process.exit(1)
}

console.log('\n✅ 构建完成！所有产物已复制到 dist/ 目录\n')
console.log('📂 目录结构:')
console.log('  dist/')
console.log('    ├── web-ui-client/   # Web UI 前端构建产物')
console.log('    └── web-ui-server.cjs # Web UI 后端（已打包所有依赖）')
console.log('')
console.log('🚀 现在可以运行:')
console.log('  node bin/ldesign-git-ui.js')
console.log('  或')
console.log('  pnpm start:ui')
console.log('')
console.log('💡 现在可以直接发布根目录，无需单独发布子包！')