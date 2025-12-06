import simpleGit, { SimpleGit } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 补丁信息
 */
export interface PatchInfo {
  filename: string
  path: string
  subject: string
  author: string
  date: string
  stats: {
    files: number
    additions: number
    deletions: number
  }
}

/**
 * 应用补丁结果
 */
export interface ApplyResult {
  success: boolean
  applied: string[]
  failed: string[]
  conflicts?: string[]
}

/**
 * Git Patch 管理器
 * 
 * 创建和应用 Git 补丁
 * 
 * @example
 * ```ts
 * const patch = new PatchManager()
 * await patch.create('HEAD~3..HEAD')
 * await patch.apply('0001-fix-bug.patch')
 * ```
 */
export class PatchManager {
  private git: SimpleGit
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 创建补丁文件
   */
  async create(range: string, options?: {
    output?: string
    numbered?: boolean
    stdout?: boolean
  }): Promise<PatchInfo[]> {
    const args = ['format-patch']
    
    if (options?.numbered !== false) {
      args.push('-n')
    }
    
    if (options?.output) {
      args.push('-o', options.output)
    }
    
    if (options?.stdout) {
      args.push('--stdout')
    }

    args.push(range)

    const result = await this.git.raw(args)
    
    if (options?.stdout) {
      // 返回原始补丁内容
      return [{
        filename: 'stdout.patch',
        path: '',
        subject: range,
        author: '',
        date: '',
        stats: { files: 0, additions: 0, deletions: 0 }
      }]
    }

    // 解析生成的补丁文件
    const files = result.split('\n').filter(f => f.trim())
    const patches: PatchInfo[] = []

    for (const file of files) {
      const fullPath = path.isAbsolute(file) ? file : path.join(this.baseDir, file)
      const info = await this.getPatchInfo(fullPath)
      patches.push(info)
    }

    return patches
  }

  /**
   * 从单个提交创建补丁
   */
  async createFromCommit(commit: string, options?: {
    output?: string
  }): Promise<PatchInfo> {
    const patches = await this.create(`${commit}~1..${commit}`, options)
    return patches[0]
  }

  /**
   * 创建工作区更改的补丁
   */
  async createFromWorking(options?: {
    staged?: boolean
    output?: string
  }): Promise<string> {
    const args = ['diff']
    
    if (options?.staged) {
      args.push('--cached')
    }

    const diff = await this.git.raw(args)
    
    if (options?.output) {
      const outputPath = path.isAbsolute(options.output) 
        ? options.output 
        : path.join(this.baseDir, options.output)
      fs.writeFileSync(outputPath, diff)
      return outputPath
    }

    return diff
  }

  /**
   * 应用补丁
   */
  async apply(patchFile: string, options?: {
    check?: boolean
    threeWay?: boolean
    reverse?: boolean
    directory?: string
  }): Promise<ApplyResult> {
    const args = ['apply']
    
    if (options?.check) {
      args.push('--check')
    }
    if (options?.threeWay) {
      args.push('-3')
    }
    if (options?.reverse) {
      args.push('-R')
    }
    if (options?.directory) {
      args.push('--directory', options.directory)
    }

    const fullPath = path.isAbsolute(patchFile) 
      ? patchFile 
      : path.join(this.baseDir, patchFile)
    args.push(fullPath)

    try {
      await this.git.raw(args)
      return {
        success: true,
        applied: [patchFile],
        failed: []
      }
    } catch (error: any) {
      return {
        success: false,
        applied: [],
        failed: [patchFile],
        conflicts: this.parseConflicts(error.message)
      }
    }
  }

  /**
   * 使用 git am 应用补丁（作为提交）
   */
  async am(patchFile: string, options?: {
    threeWay?: boolean
    signoff?: boolean
    keepNonPatch?: boolean
  }): Promise<ApplyResult> {
    const args = ['am']
    
    if (options?.threeWay) {
      args.push('-3')
    }
    if (options?.signoff) {
      args.push('-s')
    }
    if (options?.keepNonPatch) {
      args.push('-k')
    }

    const fullPath = path.isAbsolute(patchFile) 
      ? patchFile 
      : path.join(this.baseDir, patchFile)
    args.push(fullPath)

    try {
      await this.git.raw(args)
      return {
        success: true,
        applied: [patchFile],
        failed: []
      }
    } catch (error: any) {
      return {
        success: false,
        applied: [],
        failed: [patchFile],
        conflicts: this.parseConflicts(error.message)
      }
    }
  }

  /**
   * 批量应用补丁
   */
  async applyMultiple(patchFiles: string[], options?: {
    threeWay?: boolean
  }): Promise<ApplyResult> {
    const applied: string[] = []
    const failed: string[] = []
    const conflicts: string[] = []

    for (const file of patchFiles) {
      const result = await this.apply(file, options)
      
      if (result.success) {
        applied.push(file)
      } else {
        failed.push(file)
        if (result.conflicts) {
          conflicts.push(...result.conflicts)
        }
        break // 遇到失败停止
      }
    }

    return {
      success: failed.length === 0,
      applied,
      failed,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    }
  }

  /**
   * 检查补丁是否可以应用
   */
  async check(patchFile: string): Promise<{ canApply: boolean; issues?: string[] }> {
    const result = await this.apply(patchFile, { check: true })
    
    if (result.success) {
      return { canApply: true }
    }
    
    return {
      canApply: false,
      issues: result.conflicts
    }
  }

  /**
   * 获取补丁信息
   */
  async getPatchInfo(patchFile: string): Promise<PatchInfo> {
    const fullPath = path.isAbsolute(patchFile) 
      ? patchFile 
      : path.join(this.baseDir, patchFile)
    
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    // 解析补丁头
    const subjectMatch = content.match(/^Subject: (.+)$/m)
    const fromMatch = content.match(/^From: (.+)$/m)
    const dateMatch = content.match(/^Date: (.+)$/m)
    
    // 统计变更
    const additions = (content.match(/^\+[^+]/gm) || []).length
    const deletions = (content.match(/^-[^-]/gm) || []).length
    const files = new Set((content.match(/^diff --git a\/(.+) b\//gm) || []).map(m => 
      m.replace('diff --git a/', '').replace(/ b\/.*/, '')
    ))

    return {
      filename: path.basename(patchFile),
      path: fullPath,
      subject: subjectMatch?.[1]?.replace(/^\[PATCH[^\]]*\]\s*/, '') || '',
      author: fromMatch?.[1] || '',
      date: dateMatch?.[1] || '',
      stats: {
        files: files.size,
        additions,
        deletions
      }
    }
  }

  /**
   * 列出目录中的补丁文件
   */
  async listPatches(directory?: string): Promise<PatchInfo[]> {
    const dir = directory || this.baseDir
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.patch'))
    const patches: PatchInfo[] = []

    for (const file of files) {
      const info = await this.getPatchInfo(path.join(dir, file))
      patches.push(info)
    }

    // 按文件名排序
    patches.sort((a, b) => a.filename.localeCompare(b.filename))
    
    return patches
  }

  /**
   * 继续 git am
   */
  async amContinue(): Promise<ApplyResult> {
    try {
      await this.git.raw(['am', '--continue'])
      return { success: true, applied: [], failed: [] }
    } catch (error: any) {
      return {
        success: false,
        applied: [],
        failed: [],
        conflicts: this.parseConflicts(error.message)
      }
    }
  }

  /**
   * 跳过当前补丁
   */
  async amSkip(): Promise<void> {
    await this.git.raw(['am', '--skip'])
  }

  /**
   * 中止 git am
   */
  async amAbort(): Promise<void> {
    await this.git.raw(['am', '--abort'])
  }

  /**
   * 检查是否在 am 过程中
   */
  async isAmInProgress(): Promise<boolean> {
    const gitDir = await this.git.revparse(['--git-dir'])
    const amDir = path.join(this.baseDir, gitDir.trim(), 'rebase-apply')
    return fs.existsSync(amDir)
  }

  /**
   * 反向应用补丁
   */
  async reverse(patchFile: string): Promise<ApplyResult> {
    return this.apply(patchFile, { reverse: true })
  }

  /**
   * 合并多个补丁为一个
   */
  async combine(patchFiles: string[], output: string): Promise<string> {
    let combined = ''
    
    for (const file of patchFiles) {
      const fullPath = path.isAbsolute(file) ? file : path.join(this.baseDir, file)
      const content = fs.readFileSync(fullPath, 'utf-8')
      combined += content + '\n'
    }

    const outputPath = path.isAbsolute(output) ? output : path.join(this.baseDir, output)
    fs.writeFileSync(outputPath, combined)
    
    return outputPath
  }

  /**
   * 解析冲突信息
   */
  private parseConflicts(message: string): string[] {
    const conflicts: string[] = []
    const lines = message.split('\n')
    
    for (const line of lines) {
      if (line.includes('CONFLICT') || line.includes('conflict')) {
        conflicts.push(line.trim())
      }
      const fileMatch = line.match(/error: patch failed: (.+):/)
      if (fileMatch) {
        conflicts.push(fileMatch[1])
      }
    }
    
    return conflicts
  }

  /**
   * 显示补丁统计
   */
  async stat(patchFile: string): Promise<string> {
    const fullPath = path.isAbsolute(patchFile) 
      ? patchFile 
      : path.join(this.baseDir, patchFile)
    
    const result = await this.git.raw(['apply', '--stat', fullPath])
    return result
  }
}
