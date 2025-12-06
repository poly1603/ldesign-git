import simpleGit, { SimpleGit } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 敏感信息类型
 */
export interface SecretFinding {
  type: string
  file: string
  line: number
  match: string
  commit?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * 大文件信息
 */
export interface LargeFileInfo {
  path: string
  size: number
  sizeFormatted: string
  commit?: string
  inHistory: boolean
}

/**
 * 扫描结果
 */
export interface ScanResult {
  secrets: SecretFinding[]
  largeFiles: LargeFileInfo[]
  duplicates: Array<{ files: string[]; size: number }>
  issues: string[]
  summary: {
    secretsFound: number
    largeFilesFound: number
    duplicatesFound: number
    totalIssues: number
  }
}

/**
 * Git 扫描管理器
 * 
 * 扫描仓库中的安全问题和优化建议
 * 
 * @example
 * ```ts
 * const scan = new ScanManager()
 * const result = await scan.fullScan()
 * console.log(result.secrets)
 * ```
 */
export class ScanManager {
  private git: SimpleGit
  private baseDir: string

  // 敏感信息模式
  private secretPatterns = [
    { type: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' as const },
    { type: 'AWS Secret Key', pattern: /[A-Za-z0-9/+=]{40}/g, severity: 'critical' as const },
    { type: 'GitHub Token', pattern: /ghp_[A-Za-z0-9]{36}/g, severity: 'critical' as const },
    { type: 'GitHub Token (old)', pattern: /[a-f0-9]{40}/g, severity: 'medium' as const },
    { type: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, severity: 'critical' as const },
    { type: 'Password in URL', pattern: /[a-zA-Z]+:\/\/[^:]+:[^@]+@/g, severity: 'high' as const },
    { type: 'Generic API Key', pattern: /api[_-]?key\s*[=:]\s*['"][A-Za-z0-9-_]{20,}['"]/gi, severity: 'high' as const },
    { type: 'Generic Secret', pattern: /secret\s*[=:]\s*['"][A-Za-z0-9-_]{10,}['"]/gi, severity: 'high' as const },
    { type: 'Generic Password', pattern: /password\s*[=:]\s*['"][^'"]{6,}['"]/gi, severity: 'high' as const },
    { type: 'Generic Token', pattern: /token\s*[=:]\s*['"][A-Za-z0-9-_]{20,}['"]/gi, severity: 'high' as const },
    { type: 'Slack Token', pattern: /xox[baprs]-[0-9A-Za-z-]{10,}/g, severity: 'high' as const },
    { type: 'Google API Key', pattern: /AIza[0-9A-Za-z-_]{35}/g, severity: 'high' as const },
    { type: 'Stripe Key', pattern: /sk_live_[0-9a-zA-Z]{24}/g, severity: 'critical' as const },
    { type: 'NPM Token', pattern: /npm_[A-Za-z0-9]{36}/g, severity: 'high' as const },
    { type: 'Database URL', pattern: /(mysql|postgres|mongodb):\/\/[^:\s]+:[^@\s]+@[^\s]+/gi, severity: 'critical' as const },
  ]

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 完整扫描
   */
  async fullScan(options?: {
    scanHistory?: boolean
    maxDepth?: number
  }): Promise<ScanResult> {
    const secrets = await this.scanSecrets(options?.scanHistory)
    const largeFiles = await this.scanLargeFiles(options?.maxDepth)
    const duplicates = await this.scanDuplicates()
    const issues = this.collectIssues(secrets, largeFiles)

    return {
      secrets,
      largeFiles,
      duplicates,
      issues,
      summary: {
        secretsFound: secrets.length,
        largeFilesFound: largeFiles.length,
        duplicatesFound: duplicates.length,
        totalIssues: secrets.length + largeFiles.length + duplicates.length
      }
    }
  }

  /**
   * 扫描敏感信息
   */
  async scanSecrets(includeHistory = false): Promise<SecretFinding[]> {
    const findings: SecretFinding[] = []

    // 扫描当前工作区
    await this.scanDirectory(this.baseDir, findings)

    // 扫描 Git 历史
    if (includeHistory) {
      await this.scanHistory(findings)
    }

    // 去重
    return this.deduplicateFindings(findings)
  }

  /**
   * 扫描目录中的敏感信息
   */
  private async scanDirectory(dir: string, findings: SecretFinding[], depth = 0): Promise<void> {
    if (depth > 10) return // 限制深度

    const ignoreList = ['node_modules', '.git', 'dist', 'build', 'coverage', 'vendor', '.next']
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        if (ignoreList.includes(entry.name)) continue
        
        const fullPath = path.join(dir, entry.name)
        const relativePath = path.relative(this.baseDir, fullPath)

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, findings, depth + 1)
        } else if (entry.isFile()) {
          // 跳过二进制文件和大文件
          const ext = path.extname(entry.name).toLowerCase()
          const binaryExts = ['.exe', '.dll', '.so', '.dylib', '.png', '.jpg', '.gif', '.zip', '.tar', '.gz']
          
          if (binaryExts.includes(ext)) continue

          try {
            const stat = fs.statSync(fullPath)
            if (stat.size > 1024 * 1024) continue // 跳过大于 1MB 的文件

            const content = fs.readFileSync(fullPath, 'utf-8')
            this.scanContent(content, relativePath, findings)
          } catch {}
        }
      }
    } catch {}
  }

  /**
   * 扫描内容中的敏感信息
   */
  private scanContent(content: string, file: string, findings: SecretFinding[]): void {
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      for (const { type, pattern, severity } of this.secretPatterns) {
        // 重置正则表达式
        pattern.lastIndex = 0
        let match

        while ((match = pattern.exec(line)) !== null) {
          // 过滤误报
          if (this.isFalsePositive(match[0], type)) continue

          findings.push({
            type,
            file,
            line: i + 1,
            match: this.maskSecret(match[0]),
            severity
          })
        }
      }
    }
  }

  /**
   * 扫描 Git 历史中的敏感信息
   */
  private async scanHistory(findings: SecretFinding[]): Promise<void> {
    try {
      // 获取所有提交的差异
      const log = await this.git.log({ maxCount: 100 })

      for (const commit of log.all.slice(0, 20)) { // 只检查最近 20 个提交
        try {
          const diff = await this.git.diff([`${commit.hash}^`, commit.hash])
          const addedLines = diff.split('\n')
            .filter(l => l.startsWith('+') && !l.startsWith('+++'))
            .map(l => l.substring(1))

          for (const line of addedLines) {
            for (const { type, pattern, severity } of this.secretPatterns) {
              pattern.lastIndex = 0
              let match

              while ((match = pattern.exec(line)) !== null) {
                if (this.isFalsePositive(match[0], type)) continue

                findings.push({
                  type,
                  file: 'history',
                  line: 0,
                  match: this.maskSecret(match[0]),
                  commit: commit.hash.substring(0, 7),
                  severity
                })
              }
            }
          }
        } catch {}
      }
    } catch {}
  }

  /**
   * 检查是否为误报
   */
  private isFalsePositive(match: string, type: string): boolean {
    // 常见的误报模式
    const falsePositives = [
      /^0+$/,
      /^x+$/i,
      /^test/i,
      /^example/i,
      /^placeholder/i,
      /^your[_-]?/i,
      /^\$\{/,
      /^<[^>]+>$/,
      /^\{\{/,
    ]

    return falsePositives.some(fp => fp.test(match))
  }

  /**
   * 遮蔽敏感信息
   */
  private maskSecret(secret: string): string {
    if (secret.length <= 8) {
      return '*'.repeat(secret.length)
    }
    return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4)
  }

  /**
   * 去重
   */
  private deduplicateFindings(findings: SecretFinding[]): SecretFinding[] {
    const seen = new Set<string>()
    return findings.filter(f => {
      const key = `${f.type}:${f.file}:${f.match}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * 扫描大文件
   */
  async scanLargeFiles(maxDepth = 5): Promise<LargeFileInfo[]> {
    const largeFiles: LargeFileInfo[] = []
    const threshold = 5 * 1024 * 1024 // 5MB

    // 扫描当前工作区
    this.findLargeFiles(this.baseDir, largeFiles, threshold, 0, maxDepth)

    // 扫描 Git 历史中的大文件
    await this.findLargeFilesInHistory(largeFiles, threshold)

    // 排序
    largeFiles.sort((a, b) => b.size - a.size)

    return largeFiles
  }

  /**
   * 在目录中查找大文件
   */
  private findLargeFiles(
    dir: string, 
    results: LargeFileInfo[], 
    threshold: number,
    depth: number,
    maxDepth: number
  ): void {
    if (depth > maxDepth) return

    const ignoreList = ['node_modules', '.git']
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        if (ignoreList.includes(entry.name)) continue
        
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          this.findLargeFiles(fullPath, results, threshold, depth + 1, maxDepth)
        } else if (entry.isFile()) {
          try {
            const stat = fs.statSync(fullPath)
            if (stat.size >= threshold) {
              results.push({
                path: path.relative(this.baseDir, fullPath),
                size: stat.size,
                sizeFormatted: this.formatSize(stat.size),
                inHistory: false
              })
            }
          } catch {}
        }
      }
    } catch {}
  }

  /**
   * 在 Git 历史中查找大文件
   */
  private async findLargeFilesInHistory(results: LargeFileInfo[], threshold: number): Promise<void> {
    try {
      // 使用 git rev-list 查找大对象
      const result = await this.git.raw([
        'rev-list', '--objects', '--all'
      ])

      const objects = result.split('\n')
        .filter(l => l.trim())
        .map(l => {
          const parts = l.split(' ')
          return { hash: parts[0], path: parts.slice(1).join(' ') }
        })

      for (const obj of objects.slice(0, 1000)) { // 限制检查数量
        if (!obj.path) continue

        try {
          const sizeResult = await this.git.raw(['cat-file', '-s', obj.hash])
          const size = parseInt(sizeResult.trim())

          if (size >= threshold) {
            // 检查是否已经在结果中
            if (!results.some(r => r.path === obj.path)) {
              results.push({
                path: obj.path,
                size,
                sizeFormatted: this.formatSize(size),
                inHistory: true,
                commit: obj.hash.substring(0, 7)
              })
            }
          }
        } catch {}
      }
    } catch {}
  }

  /**
   * 扫描重复文件
   */
  async scanDuplicates(): Promise<Array<{ files: string[]; size: number }>> {
    const fileHashes = new Map<string, { files: string[]; size: number }>()
    
    const scanDir = async (dir: string, depth = 0) => {
      if (depth > 5) return

      const ignoreList = ['node_modules', '.git', 'dist', 'build']
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })

        for (const entry of entries) {
          if (ignoreList.includes(entry.name)) continue
          
          const fullPath = path.join(dir, entry.name)

          if (entry.isDirectory()) {
            await scanDir(fullPath, depth + 1)
          } else if (entry.isFile()) {
            try {
              const stat = fs.statSync(fullPath)
              if (stat.size < 1024 || stat.size > 10 * 1024 * 1024) continue // 1KB - 10MB

              const content = fs.readFileSync(fullPath)
              const crypto = await import('crypto')
              const hash = crypto.createHash('md5').update(content).digest('hex')
              
              const relativePath = path.relative(this.baseDir, fullPath)
              
              if (fileHashes.has(hash)) {
                fileHashes.get(hash)!.files.push(relativePath)
              } else {
                fileHashes.set(hash, { files: [relativePath], size: stat.size })
              }
            } catch {}
          }
        }
      } catch {}
    }

    await scanDir(this.baseDir)

    // 返回有重复的文件
    return Array.from(fileHashes.values())
      .filter(v => v.files.length > 1)
      .sort((a, b) => b.size * b.files.length - a.size * a.files.length)
  }

  /**
   * 收集问题
   */
  private collectIssues(secrets: SecretFinding[], largeFiles: LargeFileInfo[]): string[] {
    const issues: string[] = []

    const criticalSecrets = secrets.filter(s => s.severity === 'critical')
    if (criticalSecrets.length > 0) {
      issues.push(`发现 ${criticalSecrets.length} 个严重的敏感信息泄露`)
    }

    const highSecrets = secrets.filter(s => s.severity === 'high')
    if (highSecrets.length > 0) {
      issues.push(`发现 ${highSecrets.length} 个高风险的敏感信息`)
    }

    const veryLargeFiles = largeFiles.filter(f => f.size > 50 * 1024 * 1024)
    if (veryLargeFiles.length > 0) {
      issues.push(`发现 ${veryLargeFiles.length} 个超大文件 (>50MB)，建议使用 Git LFS`)
    }

    const historyLargeFiles = largeFiles.filter(f => f.inHistory)
    if (historyLargeFiles.length > 0) {
      issues.push(`Git 历史中存在 ${historyLargeFiles.length} 个大文件，可能需要清理历史`)
    }

    return issues
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * 快速扫描（只扫描当前工作区）
   */
  async quickScan(): Promise<ScanResult> {
    return this.fullScan({ scanHistory: false, maxDepth: 3 })
  }

  /**
   * 仅扫描暂存区
   */
  async scanStaged(): Promise<SecretFinding[]> {
    const findings: SecretFinding[] = []
    
    try {
      const diff = await this.git.diff(['--cached'])
      const addedLines = diff.split('\n')
        .filter(l => l.startsWith('+') && !l.startsWith('+++'))

      let currentFile = ''
      let lineNum = 0

      for (const line of diff.split('\n')) {
        if (line.startsWith('+++ b/')) {
          currentFile = line.substring(6)
          lineNum = 0
        } else if (line.startsWith('@@')) {
          const match = line.match(/@@ -\d+,?\d* \+(\d+)/)
          if (match) {
            lineNum = parseInt(match[1]) - 1
          }
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
          lineNum++
          this.scanContent(line.substring(1), currentFile, findings)
        } else if (!line.startsWith('-')) {
          lineNum++
        }
      }
    } catch {}

    return findings
  }

  /**
   * 生成扫描报告
   */
  generateReport(result: ScanResult): string {
    let report = '# Git 仓库安全扫描报告\n\n'
    report += `扫描时间: ${new Date().toISOString()}\n\n`

    report += '## 摘要\n\n'
    report += `- 敏感信息: ${result.summary.secretsFound}\n`
    report += `- 大文件: ${result.summary.largeFilesFound}\n`
    report += `- 重复文件: ${result.summary.duplicatesFound}\n\n`

    if (result.secrets.length > 0) {
      report += '## 敏感信息\n\n'
      report += '| 类型 | 文件 | 行号 | 严重程度 |\n'
      report += '|------|------|------|----------|\n'
      for (const s of result.secrets) {
        report += `| ${s.type} | ${s.file} | ${s.line} | ${s.severity} |\n`
      }
      report += '\n'
    }

    if (result.largeFiles.length > 0) {
      report += '## 大文件\n\n'
      report += '| 文件 | 大小 | 在历史中 |\n'
      report += '|------|------|----------|\n'
      for (const f of result.largeFiles) {
        report += `| ${f.path} | ${f.sizeFormatted} | ${f.inHistory ? '是' : '否'} |\n`
      }
      report += '\n'
    }

    if (result.issues.length > 0) {
      report += '## 问题和建议\n\n'
      for (const issue of result.issues) {
        report += `- ${issue}\n`
      }
    }

    return report
  }
}
