import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { ConflictInfo, GitOptions } from '../types'

/**
 * 冲突解析器 - 检测和解决 Git 冲突
 */
export class ConflictResolver {
  private git: SimpleGit
  private baseDir: string

  constructor(private options: GitOptions = {}) {
    this.baseDir = options.baseDir || process.cwd()
    this.git = simpleGit(this.baseDir)
  }

  /**
   * 检测冲突文件
   */
  async detectConflicts(): Promise<ConflictInfo[]> {
    const status = await this.git.status()
    const conflicts: ConflictInfo[] = []

    for (const file of status.conflicted) {
      const conflictInfo: ConflictInfo = {
        file,
        status: 'both-modified'
      }

      // 尝试获取冲突的不同版本
      try {
        // 获取我们的版本 (ours - HEAD)
        const oursContent = await this.git.show([`:2:${file}`])
        conflictInfo.ours = oursContent

        // 获取他们的版本 (theirs - MERGE_HEAD)
        const theirsContent = await this.git.show([`:3:${file}`])
        conflictInfo.theirs = theirsContent

        // 获取共同祖先版本 (base)
        try {
          const ancestorContent = await this.git.show([`:1:${file}`])
          conflictInfo.ancestor = ancestorContent
        } catch {
          // 共同祖先可能不存在（新文件冲突）
        }
      } catch (error) {
        // 某些版本可能不存在，继续处理
      }

      conflicts.push(conflictInfo)
    }

    return conflicts
  }

  /**
   * 检查是否存在冲突
   */
  async hasConflicts(): Promise<boolean> {
    const status = await this.git.status()
    return status.conflicted.length > 0
  }

  /**
   * 获取冲突文件列表
   */
  async getConflictedFiles(): Promise<string[]> {
    const status = await this.git.status()
    return status.conflicted
  }

  /**
   * 解析冲突标记
   * @param filePath 文件路径
   */
  async parseConflictMarkers(filePath: string): Promise<{
    conflicts: Array<{
      ours: string
      theirs: string
      base?: string
      startLine: number
      endLine: number
    }>
    hasConflicts: boolean
  }> {
    const fullPath = path.join(this.baseDir, filePath)
    const content = await fs.readFile(fullPath, 'utf-8')
    const lines = content.split('\n')

    const conflicts: any[] = []
    let inConflict = false
    let currentConflict: any = null
    let lineNumber = 0

    for (const line of lines) {
      lineNumber++

      if (line.startsWith('<<<<<<<')) {
        // 冲突开始
        inConflict = true
        currentConflict = {
          ours: '',
          theirs: '',
          startLine: lineNumber,
          endLine: 0
        }
      } else if (line.startsWith('=======') && inConflict) {
        // 分隔符，切换到 theirs
        currentConflict.oursEnd = lineNumber
      } else if (line.startsWith('>>>>>>>') && inConflict) {
        // 冲突结束
        inConflict = false
        currentConflict.endLine = lineNumber
        conflicts.push(currentConflict)
        currentConflict = null
      } else if (inConflict && currentConflict) {
        if (currentConflict.oursEnd === undefined) {
          // 收集 ours 部分
          currentConflict.ours += line + '\n'
        } else {
          // 收集 theirs 部分
          currentConflict.theirs += line + '\n'
        }
      }
    }

    return {
      conflicts,
      hasConflicts: conflicts.length > 0
    }
  }

  /**
   * 使用我们的版本解决冲突
   * @param filePath 文件路径
   */
  async resolveWithOurs(filePath: string): Promise<void> {
    await this.git.raw(['checkout', '--ours', filePath])
    await this.git.add(filePath)
  }

  /**
   * 使用他们的版本解决冲突
   * @param filePath 文件路径
   */
  async resolveWithTheirs(filePath: string): Promise<void> {
    await this.git.raw(['checkout', '--theirs', filePath])
    await this.git.add(filePath)
  }

  /**
   * 批量使用我们的版本解决冲突
   * @param filePaths 文件路径数组
   */
  async batchResolveWithOurs(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      await this.resolveWithOurs(filePath)
    }
  }

  /**
   * 批量使用他们的版本解决冲突
   * @param filePaths 文件路径数组
   */
  async batchResolveWithTheirs(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      await this.resolveWithTheirs(filePath)
    }
  }

  /**
   * 手动解决冲突（移除冲突标记后调用）
   * @param filePath 文件路径
   */
  async markAsResolved(filePath: string): Promise<void> {
    await this.git.add(filePath)
  }

  /**
   * 批量标记为已解决
   * @param filePaths 文件路径数组
   */
  async batchMarkAsResolved(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      await this.markAsResolved(filePath)
    }
  }

  /**
   * 自动解决简单冲突（移除冲突标记，保留双方代码）
   * @param filePath 文件路径
   */
  async autoResolveSimpleConflict(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, filePath)
    const content = await fs.readFile(fullPath, 'utf-8')

    // 移除冲突标记，保留所有内容
    const resolved = content
      .replace(/^<<<<<<< .*$/gm, '')
      .replace(/^=======$/gm, '')
      .replace(/^>>>>>>> .*$/gm, '')
      .replace(/\n\n\n+/g, '\n\n') // 清理多余的空行

    if (resolved !== content) {
      await fs.writeFile(fullPath, resolved, 'utf-8')
      await this.markAsResolved(filePath)
      return true
    }

    return false
  }

  /**
   * 获取冲突的统计信息
   */
  async getConflictStatistics(): Promise<{
    total: number
    byType: Record<string, number>
    files: string[]
  }> {
    const conflicts = await this.detectConflicts()

    const byType: Record<string, number> = {}
    conflicts.forEach(conflict => {
      byType[conflict.status] = (byType[conflict.status] || 0) + 1
    })

    return {
      total: conflicts.length,
      byType,
      files: conflicts.map(c => c.file)
    }
  }

  /**
   * 生成冲突报告
   */
  async generateConflictReport(): Promise<string> {
    const conflicts = await this.detectConflicts()
    const stats = await this.getConflictStatistics()

    const lines: string[] = []

    lines.push('# 冲突报告')
    lines.push('')
    lines.push(`**总冲突数**: ${stats.total}`)
    lines.push('')

    if (stats.total > 0) {
      lines.push('## 冲突文件列表')
      lines.push('')

      for (const conflict of conflicts) {
        lines.push(`### ${conflict.file}`)
        lines.push('')
        lines.push(`- **状态**: ${conflict.status}`)

        // 尝试解析冲突标记
        try {
          const parsed = await this.parseConflictMarkers(conflict.file)
          if (parsed.hasConflicts) {
            lines.push(`- **冲突区域数**: ${parsed.conflicts.length}`)

            parsed.conflicts.forEach((c, index) => {
              lines.push(`  - 冲突 ${index + 1}: 行 ${c.startLine} - ${c.endLine}`)
            })
          }
        } catch (error) {
          // 解析失败，跳过
        }

        lines.push('')
      }

      lines.push('## 解决建议')
      lines.push('')
      lines.push('1. 使用 `resolveWithOurs()` 保留我们的版本')
      lines.push('2. 使用 `resolveWithTheirs()` 保留他们的版本')
      lines.push('3. 手动编辑文件解决冲突，然后调用 `markAsResolved()`')
      lines.push('')
    } else {
      lines.push('**没有检测到冲突**')
    }

    return lines.join('\n')
  }

  /**
   * 检查合并是否正在进行
   */
  async isMerging(): Promise<boolean> {
    try {
      const result = await this.git.raw(['rev-parse', '-q', '--verify', 'MERGE_HEAD'])
      return result.trim() !== ''
    } catch {
      return false
    }
  }

  /**
   * 检查变基是否正在进行
   */
  async isRebasing(): Promise<boolean> {
    try {
      const result = await this.git.raw(['rev-parse', '-q', '--verify', 'REBASE_HEAD'])
      return result.trim() !== ''
    } catch {
      return false
    }
  }

  /**
   * 获取当前操作类型
   */
  async getCurrentOperation(): Promise<'merge' | 'rebase' | 'cherry-pick' | null> {
    if (await this.isMerging()) {
      return 'merge'
    }
    if (await this.isRebasing()) {
      return 'rebase'
    }

    try {
      const result = await this.git.raw(['rev-parse', '-q', '--verify', 'CHERRY_PICK_HEAD'])
      if (result.trim() !== '') {
        return 'cherry-pick'
      }
    } catch {
      // 不是 cherry-pick
    }

    return null
  }

  /**
   * 中止当前操作
   */
  async abortCurrentOperation(): Promise<void> {
    const operation = await this.getCurrentOperation()

    if (operation === 'merge') {
      await this.git.merge(['--abort'])
    } else if (operation === 'rebase') {
      await this.git.rebase(['--abort'])
    } else if (operation === 'cherry-pick') {
      await this.git.raw(['cherry-pick', '--abort'])
    }
  }

  /**
   * 继续当前操作（在解决冲突后）
   */
  async continueCurrentOperation(): Promise<void> {
    const operation = await this.getCurrentOperation()

    if (operation === 'merge') {
      await this.git.merge(['--continue'])
    } else if (operation === 'rebase') {
      await this.git.rebase(['--continue'])
    } else if (operation === 'cherry-pick') {
      await this.git.raw(['cherry-pick', '--continue'])
    }
  }
}


