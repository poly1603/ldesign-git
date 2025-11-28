import simpleGit, { SimpleGit } from 'simple-git'
import type { TagInfo, CreateTagOptions, GitOptions } from '../types'

/**
 * 标签管理器 - 管理 Git 标签
 */
export class TagManager {
  private git: SimpleGit

  constructor(private options: GitOptions = {}) {
    this.git = simpleGit(options.baseDir || process.cwd())
  }

  /**
   * 创建轻量级标签
   * @param tagName 标签名
   * @param ref 引用（可选，默认为 HEAD）
   */
  async createLightweightTag(tagName: string, ref?: string): Promise<void> {
    const args = [tagName]
    if (ref) {
      args.push(ref)
    }
    await this.git.tag(args)
  }

  /**
   * 创建注释标签
   * @param tagName 标签名
   * @param message 标签消息
   * @param ref 引用（可选，默认为 HEAD）
   */
  async createAnnotatedTag(tagName: string, message: string, ref?: string): Promise<void> {
    const args = ['-a', tagName, '-m', message]
    if (ref) {
      args.push(ref)
    }
    await this.git.tag(args)
  }

  /**
   * 创建标签（通用方法）
   * @param tagName 标签名
   * @param options 创建选项
   */
  async createTag(tagName: string, options: CreateTagOptions = {}): Promise<void> {
    const args: string[] = []

    if (options.annotated && options.message) {
      args.push('-a', tagName, '-m', options.message)
    } else {
      args.push(tagName)
    }

    if (options.force) {
      args.unshift('-f')
    }

    await this.git.tag(args)
  }

  /**
   * 删除本地标签
   * @param tagName 标签名
   */
  async deleteTag(tagName: string): Promise<void> {
    await this.git.tag(['-d', tagName])
  }

  /**
   * 删除多个本地标签
   * @param tagNames 标签名数组
   */
  async deleteTags(tagNames: string[]): Promise<void> {
    await this.git.tag(['-d', ...tagNames])
  }

  /**
   * 删除远程标签
   * @param tagName 标签名
   * @param remote 远程名称（默认为 origin）
   */
  async deleteRemoteTag(tagName: string, remote = 'origin'): Promise<void> {
    await this.git.push(remote, `:refs/tags/${tagName}`)
  }

  /**
   * 列出所有标签
   */
  async listTags(): Promise<string[]> {
    const tags = await this.git.tags()
    return tags.all
  }

  /**
   * 列出匹配模式的标签
   * @param pattern 匹配模式（支持通配符）
   */
  async listTagsWithPattern(pattern: string): Promise<string[]> {
    const tags = await this.git.tags(['-l', pattern])
    return tags.all
  }

  /**
   * 获取标签详细信息
   * @param tagName 标签名
   */
  async getTagInfo(tagName: string): Promise<TagInfo | null> {
    try {
      // 尝试获取注释标签信息
      const showResult = await this.git.show([tagName, '--format=%H%n%ci%n%s%n%b', '--no-patch'])
      const lines = showResult.split('\n')

      if (lines.length >= 3) {
        return {
          name: tagName,
          commit: lines[0],
          date: lines[1],
          message: lines.slice(2).join('\n').trim(),
          type: 'annotated'
        }
      }

      // 轻量级标签
      const commit = await this.git.revparse([tagName])
      return {
        name: tagName,
        commit: commit.trim(),
        type: 'lightweight'
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 获取所有标签的详细信息
   * 
   * @returns 标签信息数组
   * 
   * @example
   * ```ts
   * const allTags = await tagManager.getAllTagsInfo()
   * ```
   */
  async getAllTagsInfo(): Promise<TagInfo[]> {
    const tagNames = await this.listTags()

    // 并发获取所有标签信息（性能优化）
    const tagsInfoPromises = tagNames.map(tagName => this.getTagInfo(tagName))
    const tagsInfo = await Promise.all(tagsInfoPromises)

    // 过滤掉 null 值
    return tagsInfo.filter((info): info is TagInfo => info !== null)
  }

  /**
   * 推送标签到远程
   * @param tagName 标签名
   * @param remote 远程名称（默认为 origin）
   */
  async pushTag(tagName: string, remote = 'origin'): Promise<void> {
    await this.git.push(remote, tagName)
  }

  /**
   * 推送所有标签到远程
   * @param remote 远程名称（默认为 origin）
   */
  async pushAllTags(remote = 'origin'): Promise<void> {
    await this.git.push(remote, '--tags')
  }

  /**
   * 检查标签是否存在
   * @param tagName 标签名
   */
  async tagExists(tagName: string): Promise<boolean> {
    const tags = await this.listTags()
    return tags.includes(tagName)
  }

  /**
   * 获取指向特定提交的标签
   * @param commitHash 提交哈希
   */
  async getTagsForCommit(commitHash: string): Promise<string[]> {
    try {
      const result = await this.git.tag(['--points-at', commitHash])
      return result.split('\n').filter(tag => tag.trim() !== '')
    } catch (error) {
      return []
    }
  }

  /**
   * 获取最新的标签
   */
  async getLatestTag(): Promise<string | null> {
    try {
      const result = await this.git.raw(['describe', '--tags', '--abbrev=0'])
      return result.trim() || null
    } catch (error) {
      return null
    }
  }

  /**
   * 按版本号排序标签
   */
  async listTagsSorted(): Promise<string[]> {
    const tags = await this.git.tags(['--sort=-version:refname'])
    return tags.all
  }

  /**
   * 检出标签
   * @param tagName 标签名
   */
  async checkoutTag(tagName: string): Promise<void> {
    await this.git.checkout(tagName)
  }
}


