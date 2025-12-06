import simpleGit, { SimpleGit } from 'simple-git'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 凭证信息
 */
export interface CredentialInfo {
  protocol: string
  host: string
  username?: string
  path?: string
}

/**
 * 凭证助手类型
 */
export type CredentialHelper = 'cache' | 'store' | 'manager' | 'osxkeychain' | 'wincred' | 'manager-core' | string

/**
 * Git 凭证管理器
 * 
 * 管理 Git 凭证和凭证助手
 * 
 * @example
 * ```ts
 * const cred = new CredentialManager()
 * await cred.setHelper('store')
 * await cred.store({ host: 'github.com', username: 'user', password: 'token' })
 * ```
 */
export class CredentialManager {
  private git: SimpleGit
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 获取当前凭证助手
   */
  async getHelper(): Promise<string | null> {
    try {
      const result = await this.git.getConfig('credential.helper')
      return result.value || null
    } catch {
      return null
    }
  }

  /**
   * 设置凭证助手
   */
  async setHelper(helper: CredentialHelper, options?: { 
    global?: boolean
    timeout?: number // 仅用于 cache
  }): Promise<void> {
    const scope = options?.global ? '--global' : '--local'
    
    let helperValue = helper
    if (helper === 'cache' && options?.timeout) {
      helperValue = `cache --timeout=${options.timeout}`
    }

    await this.git.raw(['config', scope, 'credential.helper', helperValue])
  }

  /**
   * 清除凭证助手设置
   */
  async clearHelper(options?: { global?: boolean }): Promise<void> {
    const scope = options?.global ? '--global' : '--local'
    try {
      await this.git.raw(['config', scope, '--unset', 'credential.helper'])
    } catch {
      // 可能不存在，忽略错误
    }
  }

  /**
   * 获取推荐的凭证助手
   */
  getRecommendedHelper(): CredentialHelper {
    const platform = os.platform()
    
    switch (platform) {
      case 'darwin':
        return 'osxkeychain'
      case 'win32':
        return 'manager-core'
      default:
        return 'store'
    }
  }

  /**
   * 存储凭证
   */
  async store(credential: {
    protocol?: string
    host: string
    username: string
    password: string
    path?: string
  }): Promise<void> {
    const input = [
      `protocol=${credential.protocol || 'https'}`,
      `host=${credential.host}`,
      `username=${credential.username}`,
      `password=${credential.password}`,
    ]
    
    if (credential.path) {
      input.push(`path=${credential.path}`)
    }

    const { spawn } = await import('child_process')
    
    return new Promise((resolve, reject) => {
      const proc = spawn('git', ['credential', 'store'], {
        cwd: this.baseDir
      })

      proc.stdin.write(input.join('\n') + '\n\n')
      proc.stdin.end()

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`凭证存储失败，退出码: ${code}`))
        }
      })

      proc.on('error', reject)
    })
  }

  /**
   * 获取凭证
   */
  async get(credential: CredentialInfo): Promise<{ username: string; password: string } | null> {
    const input = [
      `protocol=${credential.protocol || 'https'}`,
      `host=${credential.host}`,
    ]
    
    if (credential.username) {
      input.push(`username=${credential.username}`)
    }
    if (credential.path) {
      input.push(`path=${credential.path}`)
    }

    const { spawn } = await import('child_process')
    
    return new Promise((resolve, reject) => {
      const proc = spawn('git', ['credential', 'fill'], {
        cwd: this.baseDir
      })

      let output = ''
      proc.stdout.on('data', (data) => {
        output += data.toString()
      })

      proc.stdin.write(input.join('\n') + '\n\n')
      proc.stdin.end()

      proc.on('close', (code) => {
        if (code === 0 && output) {
          const lines = output.split('\n')
          const result: any = {}
          
          for (const line of lines) {
            const [key, value] = line.split('=')
            if (key && value) {
              result[key] = value
            }
          }
          
          if (result.username && result.password) {
            resolve({ username: result.username, password: result.password })
          } else {
            resolve(null)
          }
        } else {
          resolve(null)
        }
      })

      proc.on('error', () => resolve(null))
    })
  }

  /**
   * 删除凭证
   */
  async erase(credential: CredentialInfo): Promise<void> {
    const input = [
      `protocol=${credential.protocol || 'https'}`,
      `host=${credential.host}`,
    ]
    
    if (credential.username) {
      input.push(`username=${credential.username}`)
    }
    if (credential.path) {
      input.push(`path=${credential.path}`)
    }

    const { spawn } = await import('child_process')
    
    return new Promise((resolve, reject) => {
      const proc = spawn('git', ['credential', 'reject'], {
        cwd: this.baseDir
      })

      proc.stdin.write(input.join('\n') + '\n\n')
      proc.stdin.end()

      proc.on('close', () => resolve())
      proc.on('error', reject)
    })
  }

  /**
   * 列出可用的凭证助手
   */
  async listAvailableHelpers(): Promise<Array<{
    name: CredentialHelper
    available: boolean
    description: string
  }>> {
    const helpers: Array<{
      name: CredentialHelper
      available: boolean
      description: string
    }> = []

    const platform = os.platform()

    // 通用助手
    helpers.push({
      name: 'cache',
      available: true,
      description: '在内存中缓存凭证（默认15分钟）'
    })

    helpers.push({
      name: 'store',
      available: true,
      description: '以明文存储在磁盘上'
    })

    // 平台特定助手
    if (platform === 'darwin') {
      helpers.push({
        name: 'osxkeychain',
        available: await this.checkHelperAvailable('osxkeychain'),
        description: 'macOS 钥匙串'
      })
    }

    if (platform === 'win32') {
      helpers.push({
        name: 'wincred',
        available: await this.checkHelperAvailable('wincred'),
        description: 'Windows 凭据管理器（旧版）'
      })

      helpers.push({
        name: 'manager-core',
        available: await this.checkHelperAvailable('manager-core'),
        description: 'Git Credential Manager（推荐）'
      })

      helpers.push({
        name: 'manager',
        available: await this.checkHelperAvailable('manager'),
        description: 'Git Credential Manager for Windows'
      })
    }

    if (platform === 'linux') {
      helpers.push({
        name: 'libsecret',
        available: await this.checkHelperAvailable('libsecret'),
        description: 'GNOME Keyring / KDE Wallet'
      })
    }

    return helpers
  }

  /**
   * 检查凭证助手是否可用
   */
  private async checkHelperAvailable(helper: string): Promise<boolean> {
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      await execAsync(`git credential-${helper} version`)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取 .git-credentials 文件路径
   */
  getStoreFilePath(): string {
    return path.join(os.homedir(), '.git-credentials')
  }

  /**
   * 列出存储的凭证（仅限 store 助手）
   */
  async listStoredCredentials(): Promise<Array<{
    protocol: string
    host: string
    username: string
  }>> {
    const credentials: Array<{
      protocol: string
      host: string
      username: string
    }> = []

    const credFile = this.getStoreFilePath()
    
    if (!fs.existsSync(credFile)) {
      return credentials
    }

    try {
      const content = fs.readFileSync(credFile, 'utf-8')
      const lines = content.split('\n').filter(l => l.trim())

      for (const line of lines) {
        const match = line.match(/^(https?):\/\/([^:]+):([^@]+)@(.+)$/)
        if (match) {
          credentials.push({
            protocol: match[1],
            username: decodeURIComponent(match[2]),
            host: match[4]
          })
        }
      }
    } catch {}

    return credentials
  }

  /**
   * 清除所有存储的凭证（仅限 store 助手）
   */
  async clearAllStoredCredentials(): Promise<void> {
    const credFile = this.getStoreFilePath()
    
    if (fs.existsSync(credFile)) {
      fs.unlinkSync(credFile)
    }
  }

  /**
   * 测试凭证
   */
  async testCredential(url: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.git.raw(['ls-remote', '--exit-code', url])
      return { valid: true }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }

  /**
   * 配置 URL 特定的凭证
   */
  async setUrlCredential(url: string, username: string, options?: { global?: boolean }): Promise<void> {
    const scope = options?.global ? '--global' : '--local'
    await this.git.raw(['config', scope, `credential.${url}.username`, username])
  }

  /**
   * 获取 URL 特定的凭证用户名
   */
  async getUrlUsername(url: string): Promise<string | null> {
    try {
      const result = await this.git.getConfig(`credential.${url}.username`)
      return result.value || null
    } catch {
      return null
    }
  }

  /**
   * 安全地显示凭证信息（遮蔽密码）
   */
  maskCredential(credential: { password?: string; [key: string]: any }): any {
    const masked = { ...credential }
    if (masked.password) {
      masked.password = '********'
    }
    return masked
  }

  /**
   * 获取远程仓库的认证方式
   */
  async getRemoteAuthType(remote = 'origin'): Promise<'ssh' | 'https' | 'unknown'> {
    try {
      const remotes = await this.git.getRemotes(true)
      const remoteInfo = remotes.find(r => r.name === remote)
      
      if (!remoteInfo) {
        return 'unknown'
      }

      const url = remoteInfo.refs.fetch || remoteInfo.refs.push || ''
      
      if (url.startsWith('git@') || url.startsWith('ssh://')) {
        return 'ssh'
      }
      if (url.startsWith('https://') || url.startsWith('http://')) {
        return 'https'
      }
      
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 生成 SSH 密钥
   */
  async generateSSHKey(options: {
    email: string
    type?: 'ed25519' | 'rsa'
    filename?: string
    passphrase?: string
  }): Promise<{ publicKey: string; privateKey: string; path: string }> {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    const keyType = options.type || 'ed25519'
    const sshDir = path.join(os.homedir(), '.ssh')
    const filename = options.filename || `id_${keyType}`
    const keyPath = path.join(sshDir, filename)

    // 确保 .ssh 目录存在
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { mode: 0o700 })
    }

    // 生成密钥
    const passphrase = options.passphrase || ''
    await execAsync(
      `ssh-keygen -t ${keyType} -C "${options.email}" -f "${keyPath}" -N "${passphrase}"`
    )

    const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf-8')
    const privateKey = fs.readFileSync(keyPath, 'utf-8')

    return {
      publicKey,
      privateKey,
      path: keyPath
    }
  }
}
