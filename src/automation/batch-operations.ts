import type {
  BatchOperationResult,
  BatchOperationSummary,
  BatchOperationConfig,
  GitOptions
} from '../types'
import { BranchManager } from '../core/branch-manager'
import { TagManager } from '../core/tag-manager'
import { MergeManager } from '../core/merge-manager'

/**
 * 批量操作 - 批量处理分支、标签等操作
 * 
 * 提供批量执行 Git 操作的功能，支持并发执行和进度回调
 * 
 * @example
 * ```ts
 * const batch = new BatchOperations({ baseDir: './my-project' })
 * 
 * // 批量创建分支
 * const result = await batch.createBranches([
 *   'feature/feature-1',
 *   'feature/feature-2'
 * ])
 * 
 * console.log(`成功: ${result.succeeded}, 失败: ${result.failed}`)
 * ```
 */
export class BatchOperations {
  private branchManager: BranchManager
  private tagManager: TagManager
  private mergeManager: MergeManager

  constructor(private options: GitOptions = {}) {
    this.branchManager = new BranchManager(options)
    this.tagManager = new TagManager(options)
    this.mergeManager = new MergeManager(options)
  }

  /**
   * 批量创建分支
   * 
   * @param branchNames - 分支名数组
   * @param startPoint - 起始点（可选）
   * @param config - 批量操作配置
   * @returns 批量操作摘要
   * 
   * @example
   * ```ts
   * const result = await batch.createBranches([
   *   'feature/feature-1',
   *   'feature/feature-2',
   *   'feature/feature-3'
   * ])
   * ```
   */
  async createBranches(
    branchNames: string[],
    startPoint?: string,
    config: BatchOperationConfig = {}
  ): Promise<BatchOperationSummary> {
    return this.executeBatch(
      branchNames,
      async (branchName) => {
        await this.branchManager.createBranch(branchName, startPoint)
      },
      config
    )
  }

  /**
   * 批量删除分支
   * @param branchNames 分支名数组
   * @param force 是否强制删除
   */
  async deleteBranches(
    branchNames: string[],
    force = false
  ): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    for (const branchName of branchNames) {
      try {
        await this.branchManager.deleteBranch(branchName, force)
        results.push({
          success: true,
          item: branchName
        })
      } catch (error: any) {
        results.push({
          success: false,
          item: branchName,
          error: error.message
        })
      }
    }

    return {
      total: branchNames.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * 批量删除远程分支
   * @param branchNames 分支名数组
   * @param remote 远程名称
   */
  async deleteRemoteBranches(
    branchNames: string[],
    remote = 'origin'
  ): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    for (const branchName of branchNames) {
      try {
        await this.branchManager.deleteRemoteBranch(remote, branchName)
        results.push({
          success: true,
          item: branchName
        })
      } catch (error: any) {
        results.push({
          success: false,
          item: branchName,
          error: error.message
        })
      }
    }

    return {
      total: branchNames.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * 批量推送分支
   * @param branchNames 分支名数组
   * @param remote 远程名称
   * @param setUpstream 是否设置上游跟踪
   */
  async pushBranches(
    branchNames: string[],
    remote = 'origin',
    setUpstream = false
  ): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    for (const branchName of branchNames) {
      try {
        await this.branchManager.pushBranch(branchName, remote, setUpstream)
        results.push({
          success: true,
          item: branchName
        })
      } catch (error: any) {
        results.push({
          success: false,
          item: branchName,
          error: error.message
        })
      }
    }

    return {
      total: branchNames.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * 批量合并分支
   * @param branchNames 要合并的分支名数组
   * @param targetBranch 目标分支（当前分支）
   */
  async mergeBranches(
    branchNames: string[],
    targetBranch?: string
  ): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    // 如果指定了目标分支，先切换过去
    if (targetBranch) {
      await this.branchManager.checkoutBranch(targetBranch)
    }

    for (const branchName of branchNames) {
      try {
        const result = await this.mergeManager.merge(branchName)
        results.push({
          success: result.success,
          item: branchName,
          result,
          error: result.success ? undefined : result.message
        })
      } catch (error: any) {
        results.push({
          success: false,
          item: branchName,
          error: error.message
        })
      }
    }

    return {
      total: branchNames.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * 批量创建标签
   * @param tags 标签配置数组 { name: string, message?: string, annotated?: boolean }
   */
  async createTags(
    tags: Array<{ name: string; message?: string; annotated?: boolean }>
  ): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    for (const tag of tags) {
      try {
        if (tag.annotated && tag.message) {
          await this.tagManager.createAnnotatedTag(tag.name, tag.message)
        } else {
          await this.tagManager.createLightweightTag(tag.name)
        }
        results.push({
          success: true,
          item: tag.name
        })
      } catch (error: any) {
        results.push({
          success: false,
          item: tag.name,
          error: error.message
        })
      }
    }

    return {
      total: tags.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * 批量删除标签
   * @param tagNames 标签名数组
   */
  async deleteTags(tagNames: string[]): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    for (const tagName of tagNames) {
      try {
        await this.tagManager.deleteTag(tagName)
        results.push({
          success: true,
          item: tagName
        })
      } catch (error: any) {
        results.push({
          success: false,
          item: tagName,
          error: error.message
        })
      }
    }

    return {
      total: tagNames.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * 批量推送标签
   * @param tagNames 标签名数组
   * @param remote 远程名称
   */
  async pushTags(
    tagNames: string[],
    remote = 'origin'
  ): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    for (const tagName of tagNames) {
      try {
        await this.tagManager.pushTag(tagName, remote)
        results.push({
          success: true,
          item: tagName
        })
      } catch (error: any) {
        results.push({
          success: false,
          item: tagName,
          error: error.message
        })
      }
    }

    return {
      total: tagNames.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * 批量删除远程标签
   * @param tagNames 标签名数组
   * @param remote 远程名称
   */
  async deleteRemoteTags(
    tagNames: string[],
    remote = 'origin'
  ): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    for (const tagName of tagNames) {
      try {
        await this.tagManager.deleteRemoteTag(tagName, remote)
        results.push({
          success: true,
          item: tagName
        })
      } catch (error: any) {
        results.push({
          success: false,
          item: tagName,
          error: error.message
        })
      }
    }

    return {
      total: tagNames.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * 清理已合并的分支
   * @param targetBranch 目标分支（默认为当前分支）
   * @param excludeBranches 排除的分支
   */
  async cleanupMergedBranches(
    targetBranch?: string,
    excludeBranches: string[] = ['main', 'master', 'develop']
  ): Promise<BatchOperationSummary> {
    const mergedBranches = await this.branchManager.getMergedBranches(targetBranch)

    // 过滤掉排除的分支
    const branchesToDelete = mergedBranches.filter(
      branch => !excludeBranches.includes(branch.trim())
    )

    return await this.deleteBranches(branchesToDelete)
  }

  /**
   * 清理陈旧的远程分支
   * 
   * @param remote - 远程名称（默认为 'origin'）
   * 
   * @example
   * ```ts
   * await batch.cleanupStaleBranches('origin')
   * ```
   */
  async cleanupStaleBranches(remote = 'origin'): Promise<void> {
    await this.branchManager.pruneRemoteBranches(remote)
  }

  /**
   * 通用批量执行方法
   * 
   * @param items - 要处理的项数组
   * @param operation - 对每个项执行的操作
   * @param config - 批量操作配置
   * @returns 批量操作摘要
   * 
   * @private
   */
  private async executeBatch<T>(
    items: T[],
    operation: (item: T) => Promise<void>,
    config: BatchOperationConfig = {}
  ): Promise<BatchOperationSummary> {
    const {
      concurrent = false,
      concurrency = 5,
      onProgress,
      continueOnError = true
    } = config

    const results: BatchOperationResult[] = []
    let completed = 0
    let succeeded = 0
    let failed = 0

    if (concurrent) {
      // 并发执行（使用并发限制）
      const chunks = this.chunkArray(items, concurrency)

      for (const chunk of chunks) {
        const promises = chunk.map(async (item) => {
          const itemStr = String(item)
          try {
            await operation(item)
            completed++
            succeeded++

            if (onProgress) {
              onProgress({
                total: items.length,
                completed,
                succeeded,
                failed,
                current: itemStr
              })
            }

            return {
              success: true,
              item: itemStr
            }
          } catch (error: any) {
            completed++
            failed++

            if (onProgress) {
              onProgress({
                total: items.length,
                completed,
                succeeded,
                failed,
                current: itemStr
              })
            }

            if (!continueOnError) {
              throw error
            }

            return {
              success: false,
              item: itemStr,
              error: error.message
            }
          }
        })

        const chunkResults = await Promise.all(promises)
        results.push(...chunkResults)
      }
    } else {
      // 串行执行
      for (const item of items) {
        const itemStr = String(item)
        try {
          await operation(item)
          completed++
          succeeded++

          results.push({
            success: true,
            item: itemStr
          })
        } catch (error: any) {
          completed++
          failed++

          results.push({
            success: false,
            item: itemStr,
            error: error.message
          })

          if (!continueOnError) {
            break
          }
        }

        if (onProgress) {
          onProgress({
            total: items.length,
            completed,
            succeeded,
            failed,
            current: itemStr
          })
        }
      }
    }

    return {
      total: items.length,
      succeeded,
      failed,
      results
    }
  }

  /**
   * 将数组分块
   * 
   * @param array - 要分块的数组
   * @param chunkSize - 每块的大小
   * @returns 分块后的数组
   * 
   * @private
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}


