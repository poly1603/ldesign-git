import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { GitService } from './services/git-service.js'
import { WebSocketManager } from './websocket/ws-manager.js'
import { createApiRoutes } from './api/routes.js'

// 兼容 CommonJS 和 ESM
let __dirname: string = ''
try {
  // ESM 环境
  const __filename = fileURLToPath(import.meta.url)
  __dirname = path.dirname(__filename)
} catch {
  // CommonJS 环境 (esbuild 打包后) - __dirname 会在运行时由 Node.js 提供
  // 这里不做任何事，保持空字符串，后面用 process.cwd() 替代
}

const PORT = process.env.PORT || 3001
const GIT_REPO_PATH = process.env.GIT_REPO_PATH || process.cwd()

async function startServer() {
  const app = express()
  const server = createServer(app)

  // 中间件
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // 静态文件服务（用于前端）
  // 在打包后，client 文件在 dist/web-ui-client
  const clientPath = __dirname
    ? path.join(__dirname, '../../client/dist')  // packages 开发环境
    : path.join(process.cwd(), 'dist/web-ui-client')  // 打包后的生产环境
  
  app.use(express.static(clientPath))

  // 初始化Git服务
  const gitService = new GitService(GIT_REPO_PATH)

  // API路由
  app.use('/api', createApiRoutes(gitService))

  // WebSocket服务
  const wss = new WebSocketServer({ server, path: '/ws' })
  const wsManager = new WebSocketManager(wss, gitService, GIT_REPO_PATH)

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() })
  })

  // 对于所有其他路由，返回前端应用
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'))
  })

  // 启动服务器
  server.listen(PORT, () => {
    console.log('='.repeat(50))
    console.log('🚀 LDesign Git Web UI Server 已启动')
    console.log('='.repeat(50))
    console.log(`📡 HTTP服务: http://localhost:${PORT}`)
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`)
    console.log(`📂 Git仓库路径: ${GIT_REPO_PATH}`)
    console.log('='.repeat(50))
  })

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...')
    wsManager.close()
    server.close(() => {
      console.log('服务器已关闭')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('\n收到SIGINT信号，正在关闭服务器...')
    wsManager.close()
    server.close(() => {
      console.log('服务器已关闭')
      process.exit(0)
    })
  })
}

// 启动应用
startServer().catch(error => {
  console.error('启动服务器失败:', error)
  process.exit(1)
})