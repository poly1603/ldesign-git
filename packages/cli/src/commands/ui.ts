import { Command } from 'commander'
import { spawn, fork } from 'child_process'
import path from 'path'
import { existsSync } from 'fs'
import * as display from '../utils/display'

// 获取当前脚本目录（兼容 CJS 和 ESM）
function getCurrentDir(): string {
  // 尝试使用 __dirname (CJS)
  if (typeof __dirname !== 'undefined') {
    return __dirname
  }
  // 尝试使用 import.meta.url (ESM)
  try {
    const { fileURLToPath } = require('url')
    return path.dirname(fileURLToPath(import.meta.url))
  } catch {
    return process.cwd()
  }
}

export function createUICommand(): Command {
  const ui = new Command('ui')
    .description('启动 Git 可视化界面')
    .option('-p, --port <port>', '指定端口号', '19899')
    .option('--no-open', '不自动打开浏览器')
    .action(async (options) => {
      const port = options.port || '19899'
      const cwd = process.cwd()

      display.box(`正在启动 LDesign Git Web UI...\n\n仓库路径: ${cwd}\n端口: ${port}`, {
        title: 'Git Web UI',
        type: 'info'
      })

      try {
        const currentDir = getCurrentDir()
        
        // 查找服务器入口文件
        const possiblePaths = [
          // 生产环境（npm 安装后，从 dist/cli.cjs 运行）
          path.resolve(currentDir, '../web-ui-server.cjs'),
          path.resolve(currentDir, './web-ui-server.cjs'),
          path.resolve(currentDir, '../../dist/web-ui-server.cjs'),
          path.resolve(currentDir, '../../../dist/web-ui-server.cjs'),
          // 开发环境（从 packages/cli/dist 运行）
          path.resolve(currentDir, '../../web-ui/server/dist/index.js'),
          path.resolve(currentDir, '../../../web-ui/server/dist/index.js'),
          path.resolve(currentDir, '../../../../packages/web-ui/server/dist/index.js'),
        ]

        let serverPath: string | null = null
        for (const p of possiblePaths) {
          if (existsSync(p)) {
            serverPath = p
            break
          }
        }

        if (!serverPath) {
          display.error('找不到 Web UI 服务器文件')
          display.info('尝试的路径:')
          possiblePaths.forEach(p => display.info(`  - ${p}`))
          display.info('请先运行: pnpm build')
          process.exit(1)
        }

        const env = {
          ...process.env,
          PORT: port,
          GIT_REPO_PATH: cwd
        }

        display.info(`仓库路径: ${cwd}`)
        display.info(`端口: ${port}`)
        display.newLine()

        // 启动服务器
        const serverProcess = fork(serverPath, [], {
          cwd,
          env,
          stdio: 'inherit'
        })

        serverProcess.on('error', (error) => {
          display.error(`启动失败: ${error.message}`)
          process.exit(1)
        })

        // 自动打开浏览器
        if (options.open !== false) {
          setTimeout(() => {
            const url = `http://localhost:${port}`
            const openCommand = process.platform === 'win32' ? 'start' :
                               process.platform === 'darwin' ? 'open' : 'xdg-open'
            
            spawn(openCommand, [url], { shell: true, stdio: 'ignore' })
          }, 2000)
        }

        // 处理退出信号
        process.on('SIGINT', () => {
          serverProcess.kill()
          process.exit(0)
        })

      } catch (error: any) {
        display.error(`启动 UI 失败: ${error.message}`)
        process.exit(1)
      }
    })

  return ui
}
