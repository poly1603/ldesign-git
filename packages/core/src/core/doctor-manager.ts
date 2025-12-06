import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  name: string
  status: 'pass' | 'warning' | 'error'
  message: string
  suggestion?: string
}

/**
 * 完整诊断报告
 */
export interface DiagnosticReport {
  timestamp: Date
  gitVersion: string
  checks: HealthCheckResult[]
  summary: {
    passed: number
    warnings: number
    errors: number
  }
}

/**
 * Git 健康检查管理器
 * 
 * 检查 Git 配置和仓库健康状态
 * 
 * @example
 * ```ts
 * const doctor = new DoctorManager()
 * const report = await doctor.runFullDiagnosis()
 * console.log(report.summary)
 * ```
 */
export class DoctorManager {
  private git: SimpleGit
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 运行完整诊断
   */
  async runFullDiagnosis(): Promise<DiagnosticReport> {
    const checks: HealthCheckResult[] = []

    // Git 版本检查
    checks.push(await this.checkGitVersion())
    
    // 用户配置检查
    checks.push(await this.checkUserConfig())
    
    // SSH 密钥检查
    checks.push(await this.checkSSHKey())
    
    // 仓库状态检查
    checks.push(await this.checkRepositoryStatus())
    
    // .gitignore 检查
    checks.push(await this.checkGitignore())
    
    // 大文件检查
    checks.push(await this.checkLargeFiles())
    
    // 敏感信息检查
    checks.push(await this.checkSensitiveInfo())
    
    // 远程配置检查
    checks.push(await this.checkRemoteConfig())
    
    // Hooks 检查
    checks.push(await this.checkHooks())
    
    // LFS 检查
    checks.push(await this.checkLFS())

    const gitVersion = await this.getGitVersion()

    return {
      timestamp: new Date(),
      gitVersion,
      checks,
      summary: {
        passed: checks.filter(c => c.status === 'pass').length,
        warnings: checks.filter(c => c.status === 'warning').length,
        errors: checks.filter(c => c.status === 'error').length
      }
    }
  }

  /**
   * 获取 Git 版本
   */
  async getGitVersion(): Promise<string> {
    try {
      const result = await this.git.version()
      return `${result.major}.${result.minor}.${result.patch}`
    } catch {
      return 'unknown'
    }
  }

  /**
   * 检查 Git 版本
   */
  async checkGitVersion(): Promise<HealthCheckResult> {
    try {
      const version = await this.git.version()
      const patchNum = typeof version.patch === 'number' ? version.patch : 0
      const versionNum = version.major * 100 + version.minor * 10 + patchNum
      
      if (versionNum >= 230) {
        return {
          name: 'Git 版本',
          status: 'pass',
          message: `Git ${version.major}.${version.minor}.${version.patch} 已安装`
        }
      } else if (versionNum >= 220) {
        return {
          name: 'Git 版本',
          status: 'warning',
          message: `Git ${version.major}.${version.minor}.${version.patch} 版本较旧`,
          suggestion: '建议升级到 Git 2.30+ 以获得更好的性能和安全性'
        }
      } else {
        return {
          name: 'Git 版本',
          status: 'error',
          message: `Git ${version.major}.${version.minor}.${version.patch} 版本过低`,
          suggestion: '请升级到 Git 2.20+ 以确保兼容性'
        }
      }
    } catch {
      return {
        name: 'Git 版本',
        status: 'error',
        message: 'Git 未安装或不在 PATH 中',
        suggestion: '请安装 Git: https://git-scm.com/downloads'
      }
    }
  }

  /**
   * 检查用户配置
   */
  async checkUserConfig(): Promise<HealthCheckResult> {
    try {
      const userName = await this.git.getConfig('user.name')
      const userEmail = await this.git.getConfig('user.email')

      if (!userName.value || !userEmail.value) {
        return {
          name: '用户配置',
          status: 'error',
          message: '用户名或邮箱未配置',
          suggestion: '运行: git config --global user.name "Your Name" && git config --global user.email "your@email.com"'
        }
      }

      // 检查邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userEmail.value)) {
        return {
          name: '用户配置',
          status: 'warning',
          message: '邮箱格式可能不正确',
          suggestion: '请检查邮箱配置是否正确'
        }
      }

      return {
        name: '用户配置',
        status: 'pass',
        message: `用户: ${userName.value} <${userEmail.value}>`
      }
    } catch {
      return {
        name: '用户配置',
        status: 'warning',
        message: '无法读取用户配置',
        suggestion: '请确保 Git 已正确初始化'
      }
    }
  }

  /**
   * 检查 SSH 密钥
   */
  async checkSSHKey(): Promise<HealthCheckResult> {
    const sshDir = path.join(os.homedir(), '.ssh')
    const keyFiles = ['id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa']
    
    try {
      if (!fs.existsSync(sshDir)) {
        return {
          name: 'SSH 密钥',
          status: 'warning',
          message: 'SSH 目录不存在',
          suggestion: '如果需要使用 SSH 连接，请运行: ssh-keygen -t ed25519'
        }
      }

      const foundKeys = keyFiles.filter(key => 
        fs.existsSync(path.join(sshDir, key)) || 
        fs.existsSync(path.join(sshDir, `${key}.pub`))
      )

      if (foundKeys.length === 0) {
        return {
          name: 'SSH 密钥',
          status: 'warning',
          message: '未找到 SSH 密钥',
          suggestion: '如果需要使用 SSH 连接，请运行: ssh-keygen -t ed25519 -C "your@email.com"'
        }
      }

      // 检查是否使用了推荐的 ed25519
      if (foundKeys.includes('id_ed25519')) {
        return {
          name: 'SSH 密钥',
          status: 'pass',
          message: `找到 SSH 密钥: ${foundKeys.join(', ')}`
        }
      }

      return {
        name: 'SSH 密钥',
        status: 'pass',
        message: `找到 SSH 密钥: ${foundKeys.join(', ')}`,
        suggestion: '考虑使用更安全的 ed25519 密钥'
      }
    } catch {
      return {
        name: 'SSH 密钥',
        status: 'warning',
        message: '无法检查 SSH 密钥'
      }
    }
  }

  /**
   * 检查仓库状态
   */
  async checkRepositoryStatus(): Promise<HealthCheckResult> {
    try {
      const isRepo = await this.git.checkIsRepo()
      
      if (!isRepo) {
        return {
          name: '仓库状态',
          status: 'warning',
          message: '当前目录不是 Git 仓库',
          suggestion: '运行 git init 初始化仓库'
        }
      }

      const status = await this.git.status()
      
      if (status.isClean()) {
        return {
          name: '仓库状态',
          status: 'pass',
          message: '工作区干净'
        }
      }

      const changes = status.modified.length + status.created.length + status.deleted.length
      return {
        name: '仓库状态',
        status: 'warning',
        message: `有 ${changes} 个未提交的更改`,
        suggestion: '考虑提交或暂存这些更改'
      }
    } catch {
      return {
        name: '仓库状态',
        status: 'warning',
        message: '无法检查仓库状态'
      }
    }
  }

  /**
   * 检查 .gitignore
   */
  async checkGitignore(): Promise<HealthCheckResult> {
    const gitignorePath = path.join(this.baseDir, '.gitignore')
    
    try {
      if (!fs.existsSync(gitignorePath)) {
        return {
          name: '.gitignore',
          status: 'warning',
          message: '未找到 .gitignore 文件',
          suggestion: '建议添加 .gitignore 来忽略不需要版本控制的文件'
        }
      }

      const content = fs.readFileSync(gitignorePath, 'utf-8')
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))

      if (lines.length < 3) {
        return {
          name: '.gitignore',
          status: 'warning',
          message: '.gitignore 内容较少',
          suggestion: '建议添加 node_modules/, .env, dist/ 等常见忽略项'
        }
      }

      // 检查常见的应该忽略的文件
      const recommendedIgnores = ['node_modules', '.env', '.DS_Store', '*.log']
      const missing = recommendedIgnores.filter(item => 
        !lines.some(line => line.includes(item))
      )

      if (missing.length > 0) {
        return {
          name: '.gitignore',
          status: 'pass',
          message: `.gitignore 已配置 (${lines.length} 条规则)`,
          suggestion: `考虑添加: ${missing.join(', ')}`
        }
      }

      return {
        name: '.gitignore',
        status: 'pass',
        message: `.gitignore 已配置 (${lines.length} 条规则)`
      }
    } catch {
      return {
        name: '.gitignore',
        status: 'warning',
        message: '无法读取 .gitignore'
      }
    }
  }

  /**
   * 检查大文件
   */
  async checkLargeFiles(): Promise<HealthCheckResult> {
    try {
      const isRepo = await this.git.checkIsRepo()
      if (!isRepo) {
        return {
          name: '大文件检查',
          status: 'pass',
          message: '非 Git 仓库，跳过检查'
        }
      }

      // 检查暂存区中的大文件
      const result = await this.git.raw(['diff', '--cached', '--stat'])
      
      // 简单检查：查找工作目录中的大文件
      const largeFiles: string[] = []
      const maxSize = 10 * 1024 * 1024 // 10MB

      const checkDir = (dir: string, depth = 0) => {
        if (depth > 3) return // 限制深度
        try {
          const files = fs.readdirSync(dir)
          for (const file of files) {
            const filePath = path.join(dir, file)
            try {
              const stat = fs.statSync(filePath)
              if (stat.isFile() && stat.size > maxSize) {
                const relativePath = path.relative(this.baseDir, filePath)
                if (!relativePath.startsWith('node_modules') && !relativePath.startsWith('.git')) {
                  largeFiles.push(`${relativePath} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`)
                }
              } else if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                checkDir(filePath, depth + 1)
              }
            } catch {}
          }
        } catch {}
      }

      checkDir(this.baseDir)

      if (largeFiles.length > 0) {
        return {
          name: '大文件检查',
          status: 'warning',
          message: `发现 ${largeFiles.length} 个大文件 (>10MB)`,
          suggestion: `考虑使用 Git LFS: ${largeFiles.slice(0, 3).join(', ')}${largeFiles.length > 3 ? '...' : ''}`
        }
      }

      return {
        name: '大文件检查',
        status: 'pass',
        message: '未发现大文件'
      }
    } catch {
      return {
        name: '大文件检查',
        status: 'pass',
        message: '检查完成'
      }
    }
  }

  /**
   * 检查敏感信息
   */
  async checkSensitiveInfo(): Promise<HealthCheckResult> {
    const sensitivePatterns = [
      { pattern: /password\s*[=:]\s*['""][^'""]+['""]/, name: 'password' },
      { pattern: /api[_-]?key\s*[=:]\s*['""][^'""]+['""]/, name: 'API key' },
      { pattern: /secret\s*[=:]\s*['""][^'""]+['""]/, name: 'secret' },
      { pattern: /token\s*[=:]\s*['""][^'""]+['""]/, name: 'token' },
      { pattern: /private[_-]?key/, name: 'private key' }
    ]

    const sensitiveFiles = ['.env', '.env.local', '.env.production', 'config.json', 'secrets.json']
    
    try {
      const issues: string[] = []

      // 检查是否有敏感文件被跟踪
      const trackedFiles = await this.git.raw(['ls-files'])
      const tracked = trackedFiles.split('\n').filter(f => f.trim())

      for (const sensitiveFile of sensitiveFiles) {
        if (tracked.some(f => f.endsWith(sensitiveFile))) {
          issues.push(`${sensitiveFile} 被 Git 跟踪`)
        }
      }

      if (issues.length > 0) {
        return {
          name: '敏感信息',
          status: 'warning',
          message: `发现潜在敏感文件: ${issues.join(', ')}`,
          suggestion: '将敏感文件添加到 .gitignore 并从历史中移除'
        }
      }

      return {
        name: '敏感信息',
        status: 'pass',
        message: '未发现明显的敏感文件'
      }
    } catch {
      return {
        name: '敏感信息',
        status: 'pass',
        message: '检查完成'
      }
    }
  }

  /**
   * 检查远程配置
   */
  async checkRemoteConfig(): Promise<HealthCheckResult> {
    try {
      const remotes = await this.git.getRemotes(true)

      if (remotes.length === 0) {
        return {
          name: '远程仓库',
          status: 'warning',
          message: '未配置远程仓库',
          suggestion: '运行: git remote add origin <url>'
        }
      }

      const origin = remotes.find(r => r.name === 'origin')
      if (origin) {
        const url = origin.refs.fetch || origin.refs.push || ''
        const isSSH = url.startsWith('git@')
        return {
          name: '远程仓库',
          status: 'pass',
          message: `已配置 ${remotes.length} 个远程仓库 (${isSSH ? 'SSH' : 'HTTPS'})`
        }
      }

      return {
        name: '远程仓库',
        status: 'pass',
        message: `已配置 ${remotes.length} 个远程仓库`
      }
    } catch {
      return {
        name: '远程仓库',
        status: 'warning',
        message: '无法检查远程配置'
      }
    }
  }

  /**
   * 检查 Git Hooks
   */
  async checkHooks(): Promise<HealthCheckResult> {
    const hooksDir = path.join(this.baseDir, '.git', 'hooks')
    const commonHooks = ['pre-commit', 'commit-msg', 'pre-push']
    
    try {
      if (!fs.existsSync(hooksDir)) {
        return {
          name: 'Git Hooks',
          status: 'pass',
          message: '未配置 Git Hooks'
        }
      }

      const files = fs.readdirSync(hooksDir)
      const activeHooks = files.filter(f => 
        commonHooks.includes(f) && !f.endsWith('.sample')
      )

      if (activeHooks.length > 0) {
        return {
          name: 'Git Hooks',
          status: 'pass',
          message: `已配置 Hooks: ${activeHooks.join(', ')}`
        }
      }

      return {
        name: 'Git Hooks',
        status: 'pass',
        message: '未配置自定义 Hooks',
        suggestion: '考虑使用 husky 来管理 Git Hooks'
      }
    } catch {
      return {
        name: 'Git Hooks',
        status: 'pass',
        message: '检查完成'
      }
    }
  }

  /**
   * 检查 Git LFS
   */
  async checkLFS(): Promise<HealthCheckResult> {
    try {
      await this.git.raw(['lfs', 'version'])
      
      // 检查是否有 .gitattributes 配置 LFS
      const gitattributesPath = path.join(this.baseDir, '.gitattributes')
      if (fs.existsSync(gitattributesPath)) {
        const content = fs.readFileSync(gitattributesPath, 'utf-8')
        if (content.includes('filter=lfs')) {
          return {
            name: 'Git LFS',
            status: 'pass',
            message: 'Git LFS 已安装并配置'
          }
        }
      }

      return {
        name: 'Git LFS',
        status: 'pass',
        message: 'Git LFS 已安装',
        suggestion: '如有大文件需要管理，可以使用 git lfs track'
      }
    } catch {
      return {
        name: 'Git LFS',
        status: 'pass',
        message: 'Git LFS 未安装',
        suggestion: '如需管理大文件，请安装 Git LFS: https://git-lfs.github.com'
      }
    }
  }

  /**
   * 快速检查（仅检查关键项）
   */
  async quickCheck(): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = []
    
    checks.push(await this.checkGitVersion())
    checks.push(await this.checkUserConfig())
    checks.push(await this.checkRepositoryStatus())
    
    return checks
  }

  /**
   * 修复常见问题
   */
  async autoFix(issues: string[]): Promise<{ fixed: string[]; failed: string[] }> {
    const fixed: string[] = []
    const failed: string[] = []

    for (const issue of issues) {
      try {
        if (issue === 'user_config') {
          // 无法自动修复，需要用户输入
          failed.push('用户配置需要手动设置')
        }
        // 可以添加更多自动修复逻辑
      } catch {
        failed.push(issue)
      }
    }

    return { fixed, failed }
  }
}
