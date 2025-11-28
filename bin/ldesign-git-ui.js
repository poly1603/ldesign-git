#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { spawn } from 'child_process'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Web UI 服务器入口文件路径（从根目录的 dist）
const serverPath = join(__dirname, '../dist/web-ui-server.cjs')

// 检查构建产物是否存在
if (!existsSync(serverPath)) {
  console.error('❌ Web UI 构建产物不存在！')
  console.error('请先运行: pnpm build')
  process.exit(1)
}

// 解析命令行参数
const args = process.argv.slice(2)
const portIndex = args.indexOf('--port') || args.indexOf('-p')
const pathIndex = args.indexOf('--path')

// 设置环境变量
const env = { ...process.env }

if (portIndex !== -1 && args[portIndex + 1]) {
  env.PORT = args[portIndex + 1]
}

if (pathIndex !== -1 && args[pathIndex + 1]) {
  env.GIT_REPO_PATH = args[pathIndex + 1]
}

// 显示启动信息
console.log('🚀 启动 LDesign Git Web UI...')
console.log('')

// 启动服务器
const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  env
})

child.on('error', (error) => {
  console.error('❌ 启动失败:', error.message)
  process.exit(1)
})

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ 服务器异常退出，退出码: ${code}`)
    process.exit(code)
  }
})

// 处理进程退出
process.on('SIGINT', () => {
  child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  child.kill('SIGTERM')
})