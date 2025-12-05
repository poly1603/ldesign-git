#!/usr/bin/env node

/**
 * LDesign Git Tools - 统一命令行入口
 * 
 * 用法:
 *   lgit [command] [options]
 * 
 * 命令:
 *   lgit status          查看 Git 状态
 *   lgit branch          分支管理
 *   lgit commit          提交管理
 *   lgit submodule       子模块管理
 *   lgit ui              启动可视化界面
 *   lgit --help          查看帮助
 */

import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 查找 CLI 入口
const possiblePaths = [
  // 生产环境（打包后）
  join(__dirname, '../dist/cli.cjs'),
  // 开发环境
  join(__dirname, '../packages/cli/dist/index.js'),
  join(__dirname, '../packages/cli/dist/index.cjs'),
]

let cliPath = null
for (const p of possiblePaths) {
  if (existsSync(p)) {
    cliPath = p
    break
  }
}

if (!cliPath) {
  console.error('❌ 找不到 CLI 入口文件，请先运行 pnpm build')
  process.exit(1)
}

// 转换为 file:// URL 并动态导入
const cliUrl = pathToFileURL(cliPath).href
import(cliUrl).catch(err => {
  console.error('❌ 加载 CLI 失败:', err.message)
  process.exit(1)
})
