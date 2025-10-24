import type {
  BatchOperationResult,
  BatchOperationSummary,
  GitOptions
} from '../types'
import { BranchManager } from '../core/branch-manager'
import { TagManager } from '../core/tag-manager'
import { MergeManager } from '../core/merge-manager'

/**
 * 批量操作 - 批量处理分支、标签等操作
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
   * @param branchNames 分支名数组
   * @param startPoint 起始点（可选）
   */
  async createBranches(
    branchNames: string[],
    startPoint?: string
  ): Promise<BatchOperationSummary> {
    const results: BatchOperationResult[] = []

    for (const branchName of branchNames) {
      try {
        await this.branchManager.createBranch(branchName, startPoint)
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
   * @param remote 远程名称
   */
  async cleanupStaleBranches(remote = 'origin'): Promise<void> {
    await this.branchManager.pruneRemoteBranches(remote)
  }
}


