import { WebSocket, WebSocketServer } from 'ws'
import { watch } from 'chokidar'
import type { WebSocketMessage } from '../types/index.js'
import type { GitService } from '../services/git-service.js'

export class WebSocketManager {
  private wss: WebSocketServer
  private clients: Set<WebSocket> = new Set()
  private gitService: GitService
  private watcher: any

  constructor(wss: WebSocketServer, gitService: GitService, watchPath: string) {
    this.wss = wss
    this.gitService = gitService
    this.setupWebSocket()
    this.setupFileWatcher(watchPath)
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket客户端已连接')
      this.clients.add(ws)

      // 立即发送当前状态
      this.sendStatusUpdate(ws)

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString())
          await this.handleClientMessage(ws, data)
        } catch (error) {
          console.error('处理WebSocket消息错误:', error)
          this.sendError(ws, '消息处理失败')
        }
      })

      ws.on('close', () => {
        console.log('WebSocket客户端已断开')
        this.clients.delete(ws)
      })

      ws.on('error', (error) => {
        console.error('WebSocket错误:', error)
        this.clients.delete(ws)
      })
    })
  }

  private setupFileWatcher(watchPath: string) {
    // 监听 .git 目录的变化
    this.watcher = watch([`${watchPath}/.git/refs`, `${watchPath}/.git/HEAD`, `${watchPath}/.git/index`], {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    })

    this.watcher
      .on('change', () => this.broadcastUpdate())
      .on('add', () => this.broadcastUpdate())
      .on('unlink', () => this.broadcastUpdate())
  }

  private async handleClientMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'ping':
        this.send(ws, { type: 'pong', timestamp: Date.now() })
        break
      case 'getStatus':
        await this.sendStatusUpdate(ws)
        break
      case 'getBranches':
        await this.sendBranchesUpdate(ws)
        break
      case 'getCommits':
        await this.sendCommitsUpdate(ws, data.limit)
        break
      default:
        this.sendError(ws, '未知的消息类型')
    }
  }

  private async sendStatusUpdate(ws: WebSocket) {
    try {
      const status = await this.gitService.getStatus()
      this.send(ws, {
        type: 'status',
        data: status,
        timestamp: Date.now()
      })
    } catch (error: any) {
      this.sendError(ws, `获取状态失败: ${error.message}`)
    }
  }

  private async sendBranchesUpdate(ws: WebSocket) {
    try {
      const branches = await this.gitService.getBranches()
      this.send(ws, {
        type: 'branches',
        data: branches,
        timestamp: Date.now()
      })
    } catch (error: any) {
      this.sendError(ws, `获取分支失败: ${error.message}`)
    }
  }

  private async sendCommitsUpdate(ws: WebSocket, limit = 50) {
    try {
      const commits = await this.gitService.getCommits(limit)
      this.send(ws, {
        type: 'commits',
        data: commits,
        timestamp: Date.now()
      })
    } catch (error: any) {
      this.sendError(ws, `获取提交历史失败: ${error.message}`)
    }
  }

  private send(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      error,
      timestamp: Date.now()
    })
  }

  private broadcast(message: WebSocketMessage) {
    const data = JSON.stringify(message)
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }

  private async broadcastUpdate() {
    try {
      const status = await this.gitService.getStatus()
      const branches = await this.gitService.getBranches()
      
      this.broadcast({
        type: 'notification',
        data: { status, branches },
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('广播更新失败:', error)
    }
  }

  public async notifyClients(type: string, data: any) {
    this.broadcast({
      type: type as any,
      data,
      timestamp: Date.now()
    })
  }

  public close() {
    if (this.watcher) {
      this.watcher.close()
    }
    this.clients.forEach(client => client.close())
    this.clients.clear()
  }
}