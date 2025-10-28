import simpleGit, { SimpleGit } from 'simple-git'
import type { GitOptions } from '../types'
import { GitOperationError } from '../errors'

/**
 * Note 信息
 */
export interface NoteInfo {
  /** 引用对象（提交哈希） */
  ref: string
  /** Note 内容 */
  content: string
  /** Note 命名空间 */
  namespace?: string
}

/**
 * Git Notes 管理器
 * 
 * 用于管理 Git Notes（为提交添加注释）
 * 
 * @example
 * ```typescript
 * const notes = new NotesManager()
 * 
 * // 添加 note
 * await notes.add('HEAD', 'This is a note')
 * 
 * // 查看 note
 * const note = await notes.show('HEAD')
 * console.log(note)
 * 
 * // 列出所有 notes
 * const allNotes = await notes.list()
 * ```
 */
export class NotesManager {
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
   * 添加 note
   * 
   * @param ref - 引用（提交哈希）
   * @param message - Note 内容
   * @param options - 选项
   * 
   * @example
   * ```typescript
   * await notes.add('HEAD', 'Review completed')
   * await notes.add('abc123', 'Bug fixed here')
   * ```
   */
  async add(
    ref: string,
    message: string,
    options: { force?: boolean; namespace?: string } = {}
  ): Promise<void> {
    try {
      const args = ['notes', 'add']
      
      if (options.force) {
        args.push('--force')
      }
      if (options.namespace) {
        args.push('--ref', options.namespace)
      }
      
      args.push('-m', message, ref)
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `添加 note 失败: ${error instanceof Error ? error.message : String(error)}`,
        'NOTES_ADD_FAILED',
        'add',
        error as Error
      )
    }
  }

  /**
   * 显示 note
   * 
   * @param ref - 引用（提交哈希）
   * @param namespace - 命名空间
   * @returns Note 内容
   * 
   * @example
   * ```typescript
   * const note = await notes.show('HEAD')
   * console.log(note)
   * ```
   */
  async show(ref: string = 'HEAD', namespace?: string): Promise<string> {
    try {
      const args = ['notes', 'show']
      
      if (namespace) {
        args.push('--ref', namespace)
      }
      
      args.push(ref)
      return await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `显示 note 失败: ${error instanceof Error ? error.message : String(error)}`,
        'NOTES_SHOW_FAILED',
        'show',
        error as Error
      )
    }
  }

  /**
   * 列出所有 notes
   * 
   * @param namespace - 命名空间
   * @returns Notes 列表
   * 
   * @example
   * ```typescript
   * const notes = await notesManager.list()
   * notes.forEach(note => {
   *   console.log(`${note.ref}: ${note.content}`)
   * })
   * ```
   */
  async list(namespace?: string): Promise<NoteInfo[]> {
    try {
      const args = ['notes', 'list']
      
      if (namespace) {
        args.push('--ref', namespace)
      }
      
      const output = await this.git.raw(args)
      const lines = output.split('\n').filter(line => line.trim())
      
      const notes: NoteInfo[] = []
      for (const line of lines) {
        const [noteHash, ref] = line.split(/\s+/)
        if (noteHash && ref) {
          try {
            const content = await this.show(ref, namespace)
            notes.push({ ref, content, namespace })
          } catch {
            // Note 可能已被删除
          }
        }
      }
      
      return notes
    } catch (error) {
      throw new GitOperationError(
        `列出 notes 失败: ${error instanceof Error ? error.message : String(error)}`,
        'NOTES_LIST_FAILED',
        'list',
        error as Error
      )
    }
  }

  /**
   * 删除 note
   * 
   * @param ref - 引用（提交哈希）
   * @param namespace - 命名空间
   * 
   * @example
   * ```typescript
   * await notes.remove('HEAD')
   * ```
   */
  async remove(ref: string, namespace?: string): Promise<void> {
    try {
      const args = ['notes', 'remove']
      
      if (namespace) {
        args.push('--ref', namespace)
      }
      
      args.push(ref)
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `删除 note 失败: ${error instanceof Error ? error.message : String(error)}`,
        'NOTES_REMOVE_FAILED',
        'remove',
        error as Error
      )
    }
  }

  /**
   * 追加到 note
   * 
   * @param ref - 引用（提交哈希）
   * @param message - 要追加的内容
   * @param namespace - 命名空间
   * 
   * @example
   * ```typescript
   * await notes.append('HEAD', 'Additional info')
   * ```
   */
  async append(ref: string, message: string, namespace?: string): Promise<void> {
    try {
      const args = ['notes', 'append']
      
      if (namespace) {
        args.push('--ref', namespace)
      }
      
      args.push('-m', message, ref)
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `追加 note 失败: ${error instanceof Error ? error.message : String(error)}`,
        'NOTES_APPEND_FAILED',
        'append',
        error as Error
      )
    }
  }

  /**
   * 复制 note
   * 
   * @param fromRef - 源引用
   * @param toRef - 目标引用
   * @param options - 选项
   * 
   * @example
   * ```typescript
   * await notes.copy('abc123', 'def456')
   * ```
   */
  async copy(
    fromRef: string,
    toRef: string,
    options: { force?: boolean; namespace?: string } = {}
  ): Promise<void> {
    try {
      const args = ['notes', 'copy']
      
      if (options.force) {
        args.push('--force')
      }
      if (options.namespace) {
        args.push('--ref', options.namespace)
      }
      
      args.push(fromRef, toRef)
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `复制 note 失败: ${error instanceof Error ? error.message : String(error)}`,
        'NOTES_COPY_FAILED',
        'copy',
        error as Error
      )
    }
  }

  /**
   * 合并 notes
   * 
   * @param ref - 要合并的引用
   * @param namespace - 命名空间
   * 
   * @example
   * ```typescript
   * await notes.merge('origin/main')
   * ```
   */
  async merge(ref: string, namespace?: string): Promise<void> {
    try {
      const args = ['notes', 'merge']
      
      if (namespace) {
        args.push('--ref', namespace)
      }
      
      args.push(ref)
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `合并 notes 失败: ${error instanceof Error ? error.message : String(error)}`,
        'NOTES_MERGE_FAILED',
        'merge',
        error as Error
      )
    }
  }

  /**
   * 清理无效的 notes
   * 
   * @param namespace - 命名空间
   * 
   * @example
   * ```typescript
   * await notes.prune()
   * ```
   */
  async prune(namespace?: string): Promise<void> {
    try {
      const args = ['notes', 'prune']
      
      if (namespace) {
        args.push('--ref', namespace)
      }
      
      await this.git.raw(args)
    } catch (error) {
      throw new GitOperationError(
        `清理 notes 失败: ${error instanceof Error ? error.message : String(error)}`,
        'NOTES_PRUNE_FAILED',
        'prune',
        error as Error
      )
    }
  }
}
