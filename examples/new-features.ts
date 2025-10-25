/**
 * @ldesign/git v0.3.0 新功能示例
 * 
 * 本文件展示 v0.3.0 版本新增的所有功能
 */

import {
  // 新增管理器
  StashManager,
  RemoteManager,
  DiffManager,
  GitConfigManager,
  WorktreeManager,
  ChangelogGenerator,

  // 错误处理
  GitError,
  GitBranchError,
  GitConflictError,
  isGitBranchError,
  isGitConflictError,

  // 日志系统
  GitLogger,
  LogLevel,

  // 缓存系统
  LRUCache,
  createLRUCache,

  // 上下文
  GitContext,

  // 工具函数
  parseSemver,
  compareSemver,
  incrementSemver,
  formatRelativeTime,
  detectCommitType
} from '@ldesign/git'

// ==================== 1. Stash 管理器 ====================

async function stashExample() {
  console.log('\n=== Stash 管理器示例 ===\n')

  const stashManager = new StashManager({ baseDir: './my-project' })

  try {
    // 保存当前更改
    await stashManager.save({
      message: 'WIP: 临时保存开发中的功能',
      includeUntracked: true
    })
    console.log('✅ Stash 保存成功')

    // 列出所有 stash
    const stashes = await stashManager.list()
    console.log(`📦 当前有 ${stashes.length} 个 stash`)

    stashes.forEach(stash => {
      console.log(`  ${stash.index}: ${stash.message} (${stash.date})`)
    })

    // 应用最新的 stash
    // await stashManager.apply()
    console.log('✅ 应用 stash（仅演示）')

    // 从 stash 创建分支
    // await stashManager.branch('feature/from-stash', 0)
    console.log('✅ 从 stash 创建分支（仅演示）')
  } catch (error) {
    console.error('❌ Stash 操作失败:', error)
  }
}

// ==================== 2. Remote 管理器 ====================

async function remoteExample() {
  console.log('\n=== Remote 管理器示例 ===\n')

  const remoteManager = new RemoteManager({ baseDir: './my-project' })

  try {
    // 列出所有远程仓库
    const remotes = await remoteManager.list()
    console.log(`🌐 远程仓库数: ${remotes.length}`)

    remotes.forEach(remote => {
      console.log(`  ${remote.name} (${remote.type}): ${remote.url}`)
    })

    // 获取默认远程
    const defaultRemote = await remoteManager.getDefault()
    console.log(`\n📍 默认远程: ${defaultRemote}`)

    // 检查远程是否存在
    const hasOrigin = await remoteManager.exists('origin')
    console.log(`🔍 Origin 存在: ${hasOrigin}`)

    // Fetch 远程仓库
    // await remoteManager.fetch('origin', { prune: true })
    console.log('✅ Fetch 操作（仅演示）')
  } catch (error) {
    console.error('❌ Remote 操作失败:', error)
  }
}

// ==================== 3. Diff 管理器 ====================

async function diffExample() {
  console.log('\n=== Diff 管理器示例 ===\n')

  const diffManager = new DiffManager({ baseDir: './my-project' })

  try {
    // 比较两个提交
    const commitDiff = await diffManager.diffCommits('HEAD~5', 'HEAD')
    console.log(`📊 提交对比 HEAD~5..HEAD:`)
    console.log(`  变更文件: ${commitDiff.files.length}`)
    console.log(`  新增行数: ${commitDiff.totalInsertions}`)
    console.log(`  删除行数: ${commitDiff.totalDeletions}`)

    // 获取工作区变更
    const workingDiff = await diffManager.diffWorkingDirectory()
    console.log(`\n📝 工作区变更: ${workingDiff.length} 个文件`)

    // 获取暂存区变更
    const stagedDiff = await diffManager.diffStaged()
    console.log(`📦 暂存区变更: ${stagedDiff.length} 个文件`)

    // 获取文件历史
    // const history = await diffManager.getFileHistory('src/index.ts', 5)
    // console.log(`\n📜 文件历史（最近5次）:`)
    // history.forEach(commit => {
    //   console.log(`  ${commit.hash.substring(0, 7)}: ${commit.message}`)
    // })
  } catch (error) {
    console.error('❌ Diff 操作失败:', error)
  }
}

// ==================== 4. Git Config 管理器 ====================

async function gitConfigExample() {
  console.log('\n=== Git Config 管理器示例 ===\n')

  const configManager = new GitConfigManager({ baseDir: './my-project' })

  try {
    // 获取用户信息
    const userInfo = await configManager.getUserInfo()
    console.log(`👤 用户信息:`)
    console.log(`  姓名: ${userInfo.name}`)
    console.log(`  邮箱: ${userInfo.email}`)

    // 获取特定配置
    const editor = await configManager.get('core.editor')
    if (editor) {
      console.log(`\n📝 编辑器: ${editor}`)
    }

    // 列出所有配置（仅显示前5个）
    const configs = await configManager.list()
    const configKeys = Object.keys(configs).slice(0, 5)
    console.log(`\n⚙️ 配置项（前5个）:`)
    configKeys.forEach(key => {
      console.log(`  ${key}: ${configs[key]}`)
    })
  } catch (error) {
    console.error('❌ Config 操作失败:', error)
  }
}

// ==================== 5. Worktree 管理器 ====================

async function worktreeExample() {
  console.log('\n=== Worktree 管理器示例 ===\n')

  const worktreeManager = new WorktreeManager({ baseDir: './my-project' })

  try {
    // 列出所有工作树
    const worktrees = await worktreeManager.list()
    console.log(`🌳 工作树数量: ${worktrees.length}`)

    worktrees.forEach(wt => {
      console.log(`  ${wt.path}`)
      console.log(`    分支: ${wt.branch}`)
      console.log(`    提交: ${wt.commit.substring(0, 7)}`)
      console.log(`    主工作树: ${wt.isPrimary}`)
    })

    // 添加新工作树（仅演示）
    // await worktreeManager.add('../my-project-feature', 'feature/new')
    console.log('\n✅ 添加工作树（仅演示）')
  } catch (error) {
    console.error('❌ Worktree 操作失败:', error)
  }
}

// ==================== 6. Changelog 生成器 ====================

async function changelogExample() {
  console.log('\n=== Changelog 生成器示例 ===\n')

  const changelogGen = new ChangelogGenerator({ baseDir: './my-project' })

  try {
    // 生成 changelog
    const changelog = await changelogGen.generate({
      from: 'HEAD~10',
      to: 'HEAD',
      grouped: true
    })

    console.log('📝 生成的 Changelog:')
    console.log(changelog)

    // 更新 CHANGELOG.md（仅演示）
    // await changelogGen.update('1.1.0')
    console.log('\n✅ 更新 CHANGELOG.md（仅演示）')
  } catch (error) {
    console.error('❌ Changelog 生成失败:', error)
  }
}

// ==================== 7. 错误处理系统 ====================

async function errorHandlingExample() {
  console.log('\n=== 错误处理系统示例 ===\n')

  const { BranchManager } = await import('@ldesign/git')
  const branchManager = new BranchManager({ baseDir: './my-project' })

  try {
    // 尝试删除不存在的分支
    await branchManager.deleteBranch('non-existent-branch')
  } catch (error) {
    // 使用类型守卫检查错误类型
    if (isGitBranchError(error)) {
      console.log('🚨 分支错误:')
      console.log(`  分支: ${error.branch}`)
      console.log(`  操作: ${error.operation}`)
      console.log(`  错误码: ${error.code}`)
      console.log(`  消息: ${error.message}`)
    } else if (error instanceof GitError) {
      console.log('🚨 Git 错误:')
      console.log(`  错误码: ${error.code}`)
      console.log(`  消息: ${error.message}`)
    } else {
      console.error('❌ 未知错误:', error)
    }
  }
}

// ==================== 8. 日志系统 ====================

async function loggingExample() {
  console.log('\n=== 日志系统示例 ===\n')

  // 创建日志器
  const logger = new GitLogger({
    level: LogLevel.DEBUG,
    includeTimestamp: true
  })

  // 记录不同级别的日志
  logger.debug('调试信息', { context: 'development' })
  logger.info('开始执行操作')
  logger.warn('发现潜在问题', { issue: 'performance' })
  logger.error('操作失败', new Error('示例错误'))

  // 获取日志统计
  const logs = logger.getLogs()
  console.log(`\n📊 日志统计:`)
  console.log(`  总日志数: ${logs.length}`)

  const errorLogs = logger.getLogsByLevel(LogLevel.ERROR)
  console.log(`  错误日志: ${errorLogs.length}`)

  // 创建子日志器
  const childLogger = logger.createChild('SubModule')
  childLogger.info('这是来自子模块的日志')
}

// ==================== 9. 缓存系统 ====================

async function cacheExample() {
  console.log('\n=== 缓存系统示例 ===\n')

  // 创建 LRU 缓存
  const cache = createLRUCache<string, any>({
    maxSize: 100,
    defaultTTL: 60000 // 1分钟
  })

  // 使用 getOrSet 模式
  const getData = async (key: string) => {
    return cache.getOrSet(key, async () => {
      console.log(`  🔄 缓存未命中，从源获取数据: ${key}`)
      // 模拟耗时操作
      return { data: `数据-${key}`, timestamp: Date.now() }
    })
  }

  // 第一次调用（缓存未命中）
  await getData('key1')

  // 第二次调用（缓存命中）
  await getData('key1')

  // 获取缓存统计
  const stats = cache.getStats()
  console.log(`\n📊 缓存统计:`)
  console.log(`  大小: ${stats.size}/${stats.maxSize}`)
  console.log(`  命中: ${stats.hits}`)
  console.log(`  未命中: ${stats.misses}`)
  console.log(`  命中率: ${(stats.hitRate * 100).toFixed(2)}%`)
}

// ==================== 10. GitContext（依赖注入）====================

async function contextExample() {
  console.log('\n=== GitContext 示例 ===\n')

  // 创建统一的上下文
  const context = new GitContext({
    baseDir: './my-project',
    logLevel: LogLevel.INFO,
    enableCache: true,
    cacheMaxSize: 200
  })

  // 获取共享资源
  const git = context.getGit()
  const logger = context.getLogger()
  const cache = context.getCache()

  console.log('✅ 上下文创建成功')

  logger.info('使用上下文中的日志器')

  // 使用缓存
  await cache.getOrSet('example', async () => {
    return { data: 'example' }
  })

  // 获取统计信息
  const cacheStats = context.getCacheStats()
  if (cacheStats) {
    console.log(`\n📊 上下文缓存统计:`)
    console.log(`  命中率: ${(cacheStats.hitRate * 100).toFixed(2)}%`)
  }

  // 创建子上下文
  const childContext = context.createChild({
    logLevel: LogLevel.DEBUG
  })
  console.log('✅ 创建子上下文成功')
}

// ==================== 11. 实用工具函数 ====================

async function utilsExample() {
  console.log('\n=== 实用工具函数示例 ===\n')

  // 语义化版本解析
  const version = parseSemver('v1.2.3-beta.1+build.123')
  console.log('🔢 版本解析:')
  console.log(`  主版本: ${version?.major}`)
  console.log(`  次版本: ${version?.minor}`)
  console.log(`  补丁: ${version?.patch}`)
  console.log(`  预发布: ${version?.prerelease}`)
  console.log(`  构建: ${version?.build}`)

  // 版本比较
  const comparison = compareSemver('1.2.3', '1.2.2')
  console.log(`\n📊 版本比较 (1.2.3 vs 1.2.2): ${comparison > 0 ? '更新' : '更旧'}`)

  // 版本递增
  const newPatch = incrementSemver('v1.2.3', 'patch')
  const newMinor = incrementSemver('v1.2.3', 'minor')
  const newMajor = incrementSemver('v1.2.3', 'major')
  console.log(`\n⬆️ 版本递增:`)
  console.log(`  Patch: ${newPatch}`)
  console.log(`  Minor: ${newMinor}`)
  console.log(`  Major: ${newMajor}`)

  // 相对时间格式化
  const oneHourAgo = new Date(Date.now() - 3600000)
  const oneDayAgo = new Date(Date.now() - 86400000)
  console.log(`\n⏰ 相对时间:`)
  console.log(`  1小时前: ${formatRelativeTime(oneHourAgo)}`)
  console.log(`  1天前: ${formatRelativeTime(oneDayAgo)}`)

  // 检测提交类型
  const docFiles = ['README.md', 'docs/guide.md']
  const testFiles = ['src/index.test.ts', 'src/utils.spec.ts']
  console.log(`\n🔍 提交类型检测:`)
  console.log(`  文档文件 → ${detectCommitType(docFiles)}`)
  console.log(`  测试文件 → ${detectCommitType(testFiles)}`)
}

// ==================== 12. 综合示例 ====================

async function comprehensiveExample() {
  console.log('\n=== 综合示例 ===\n')

  // 1. 创建上下文
  const context = new GitContext({
    baseDir: './my-project',
    logLevel: LogLevel.INFO,
    enableCache: true
  })

  const logger = context.getLogger()

  try {
    // 2. 使用多个管理器
    logger.info('开始 Git 操作流程')

    const stashManager = new StashManager(context.getConfig())
    const remoteManager = new RemoteManager(context.getConfig())
    const diffManager = new DiffManager(context.getConfig())

    // 3. 检查工作区状态
    const workingDiff = await diffManager.diffWorkingDirectory()

    if (workingDiff.length > 0) {
      logger.warn(`检测到 ${workingDiff.length} 个未提交的更改`)

      // 保存到 stash
      await stashManager.save({
        message: 'Auto-stash before operation'
      })
      logger.info('已保存到 stash')
    }

    // 4. 执行其他操作
    logger.info('执行主要操作...')

    // 5. 恢复工作区
    const hasStashes = await stashManager.hasStashes()
    if (hasStashes) {
      const latest = await stashManager.getLatest()
      if (latest?.message.includes('Auto-stash')) {
        // await stashManager.pop()
        logger.info('已恢复工作区（仅演示）')
      }
    }

    logger.info('✅ 操作流程完成')

    // 6. 获取统计信息
    const cacheStats = context.getCacheStats()
    if (cacheStats) {
      console.log(`\n📊 缓存性能:`)
      console.log(`  命中率: ${(cacheStats.hitRate * 100).toFixed(2)}%`)
      console.log(`  命中次数: ${cacheStats.hits}`)
      console.log(`  未命中次数: ${cacheStats.misses}`)
    }
  } catch (error) {
    if (isGitBranchError(error)) {
      logger.error(`分支操作失败: ${error.branch}`, error)
    } else if (error instanceof GitError) {
      logger.error(`Git 错误 [${error.code}]: ${error.message}`, error)
    } else {
      logger.error('未知错误', error as Error)
    }
  } finally {
    // 清理资源
    context.cleanup()
    logger.info('资源已清理')
  }
}

// ==================== 运行所有示例 ====================

async function runAllExamples() {
  console.log('='.repeat(60))
  console.log('🚀 @ldesign/git v0.3.0 新功能演示')
  console.log('='.repeat(60))

  await stashExample()
  await remoteExample()
  await diffExample()
  await gitConfigExample()
  await worktreeExample()
  await changelogExample()
  await errorHandlingExample()
  await loggingExample()
  await cacheExample()
  await contextExample()
  await utilsExample()
  await comprehensiveExample()

  console.log('\n' + '='.repeat(60))
  console.log('✨ 所有示例运行完成')
  console.log('='.repeat(60) + '\n')
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error)
}

export {
  stashExample,
  remoteExample,
  diffExample,
  gitConfigExample,
  worktreeExample,
  changelogExample,
  errorHandlingExample,
  loggingExample,
  cacheExample,
  contextExample,
  utilsExample,
  comprehensiveExample
}

