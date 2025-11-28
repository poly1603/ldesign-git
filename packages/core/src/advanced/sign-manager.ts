import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * 签名配置
 */
export interface SignConfig {
  /** GPG密钥ID */
  keyId?: string
  /** 是否使用GPG */
  useGpg?: boolean
  /** GPG程序路径 */
  gpgProgram?: string
}

/**
 * 签名验证结果
 */
export interface SignatureVerification {
  /** 是否有效 */
  valid: boolean
  /** 签名者 */
  signer?: string
  /** 签名者邮箱 */
  signerEmail?: string
  /** 密钥ID */
  keyId?: string
  /** 信任级别 */
  trustLevel?: 'ultimate' | 'full' | 'marginal' | 'never' | 'unknown'
  /** 错误信息 */
  error?: string
}

/**
 * 签名管理器
 * 
 * 用于管理Git提交和标签的GPG签名
 * 
 * @example
 * ```typescript
 * const signManager = new SignManager()
 * 
 * // 配置GPG
 * await signManager.configureGPG('YOUR_KEY_ID')
 * 
 * // 签名提交
 * await signManager.signCommit('feat: new feature')
 * 
 * // 验证提交
 * const verification = await signManager.verifyCommit('HEAD')
 * console.log('签名有效:', verification.valid)
 * ```
 */
export class SignManager {
  private git: SimpleGit
  private baseDir: string

  constructor(options: GitOptions = {}) {
    this.baseDir = options.baseDir || process.cwd()
    this.git = simpleGit({
      baseDir: this.baseDir,
      binary: 'git',
      maxConcurrentProcesses: 6,
    })
  }

  /**
   * 配置GPG签名
   * 
   * @param keyId - GPG密钥ID
   * @param scope - 配置范围
   * 
   * @example
   * ```typescript
   * await signManager.configureGPG('YOUR_KEY_ID', 'global')
   * ```
   */
  async configureGPG(
    keyId: string,
    scope: 'local' | 'global' = 'local'
  ): Promise<void> {
    try {
      const scopeFlag = scope === 'global' ? '--global' : '--local'
      await this.git.raw(['config', scopeFlag, 'user.signingkey', keyId])
      await this.git.raw(['config', scopeFlag, 'commit.gpgsign', 'true'])
    } catch (error) {
      throw new GitOperationError(
        'configureGPG',
        `配置GPG失败: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * 启用/禁用自动签名
   * 
   * @param enable - 是否启用
   * @param scope - 配置范围
   * 
   * @example
   * ```typescript
   * await signManager.setAutoSign(true, 'global')
   * ```
   */
  async setAutoSign(
    enable: boolean,
    scope: 'local' | 'global' = 'local'
  ): Promise<void> {
    try {
      const scopeFlag = scope === 'global' ? '--global' : '--local'
      await this.git.raw([
        'config',
        scopeFlag,
        'commit.gpgsign',
        String(enable),
      ])
    } catch (error) {
      throw new GitOperationError(
        'setAutoSign',
        `设置自动签名失败: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * 创建签名提交
   * 
   * @param message - 提交信息
   * 
   * @example
   * ```typescript
   * await signManager.signCommit('feat: add new feature')
   * ```
   */
  async signCommit(message: string): Promise<void> {
    try {
      await this.git.raw(['commit', '-S', '-m', message])
    } catch (error) {
      throw new GitOperationError(
        'signCommit',
        `签名提交失败: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * 创建签名标签
   * 
   * @param tagName - 标签名称
   * @param message - 标签信息
   * 
   * @example
   * ```typescript
   * await signManager.signTag('v1.0.0', 'Release 1.0.0')
   * ```
   */
  async signTag(tagName: string, message: string): Promise<void> {
    try {
      await this.git.raw(['tag', '-s', tagName, '-m', message])
    } catch (error) {
      throw new GitOperationError(
        'signTag',
        `签名标签失败: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * 验证提交签名
   * 
   * @param commit - 提交哈希
   * @returns 验证结果
   * 
   * @example
   * ```typescript
   * const result = await signManager.verifyCommit('HEAD')
   * if (result.valid) {
   *   console.log('签名者:', result.signer)
   * }
   * ```
   */
  async verifyCommit(commit: string = 'HEAD'): Promise<SignatureVerification> {
    try {
      const output = await this.git.raw(['verify-commit', commit])
      return this.parseVerificationOutput(output)
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 验证标签签名
   * 
   * @param tagName - 标签名称
   * @returns 验证结果
   * 
   * @example
   * ```typescript
   * const result = await signManager.verifyTag('v1.0.0')
   * console.log('签名有效:', result.valid)
   * ```
   */
  async verifyTag(tagName: string): Promise<SignatureVerification> {
    try {
      const output = await this.git.raw(['verify-tag', tagName])
      return this.parseVerificationOutput(output)
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 列出GPG密钥
   * 
   * @returns 密钥列表
   * 
   * @example
   * ```typescript
   * const keys = await signManager.listKeys()
   * keys.forEach(key => console.log(key))
   * ```
   */
  async listKeys(): Promise<string[]> {
    try {
      const output = await this.git.raw(['config', '--list'])
      const lines = output.split('\n')
      const keys: string[] = []

      for (const line of lines) {
        if (line.startsWith('user.signingkey=')) {
          keys.push(line.split('=')[1])
        }
      }

      return keys
    } catch (error) {
      throw new GitOperationError(
        'listKeys',
        `列出密钥失败: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * 获取当前签名配置
   * 
   * @returns 签名配置
   * 
   * @example
   * ```typescript
   * const config = await signManager.getConfig()
   * console.log('密钥ID:', config.keyId)
   * console.log('启用GPG:', config.useGpg)
   * ```
   */
  async getConfig(): Promise<SignConfig> {
    try {
      const output = await this.git.raw(['config', '--list'])
      const lines = output.split('\n')

      let keyId: string | undefined
      let useGpg = false
      let gpgProgram: string | undefined

      for (const line of lines) {
        if (line.startsWith('user.signingkey=')) {
          keyId = line.split('=')[1]
        } else if (line.startsWith('commit.gpgsign=')) {
          useGpg = line.split('=')[1] === 'true'
        } else if (line.startsWith('gpg.program=')) {
          gpgProgram = line.split('=')[1]
        }
      }

      return { keyId, useGpg, gpgProgram }
    } catch (error) {
      throw new GitOperationError(
        'getConfig',
        `获取配置失败: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * 解析验证输出
   */
  private parseVerificationOutput(output: string): SignatureVerification {
    // 简化的解析逻辑
    const lines = output.split('\n')
    
    for (const line of lines) {
      if (line.includes('Good signature')) {
        const match = line.match(/from "(.+?)\s*<(.+?)>"/)
        return {
          valid: true,
          signer: match ? match[1] : undefined,
          signerEmail: match ? match[2] : undefined,
        }
      }
    }

    return { valid: false }
  }
}
