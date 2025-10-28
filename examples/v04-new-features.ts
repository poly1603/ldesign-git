/**
 * @ldesign/git v0.4.0 新功能示例
 * 
 * 展示 PerformanceMonitor、LFSManager、MonorepoManager 和 ReflogManager 的使用
 */

import {
  PerformanceMonitor,
  LFSManager,
  MonorepoManager,
  ReflogManager,
  GitManager,
} from '@ldesign/git'

// ==================== 1. PerformanceMonitor 示例 ====================

async function performanceMonitorExample() {
  console.log('\n=== Performance Monitor 示例 ===\n')
  
  const monitor = new PerformanceMonitor({
    slowThreshold: 1000, // 1秒
    autoLog: true,
    maxOperations: 100,
  })
  
  const git = new GitManager()
  
  // 方式1: 使用 track 方法
  await monitor.track('fetch', async () => {
    await git.fetch()
  })
  
  // 方式2: 手动追踪
  const tracker = monitor.startTracking('push', { remote: 'origin' })
  await git.push()
  tracker.end(true)
  
  // 获取性能报告
  const report = monitor.getPerformanceReport()
  console.log('总操作数:', report.totalOperations)
  console.log('平均耗时:', report.averageDuration.toFixed(2), 'ms')
  console.log('成功率:', ((report.successfulOperations / report.totalOperations) * 100).toFixed(2), '%')
  
  // 查看慢操作
  const slowOps = monitor.getSlowOperations(500)
  if (slowOps.length > 0) {
    console.log('\n慢操作 (>500ms):')
    slowOps.forEach(op => {
      console.log(`  - ${op.name}: ${op.duration}ms`)
    })
  }
  
  // 导出数据
  const metricsData = monitor.exportMetrics()
  console.log('\n性能数据已导出，包含', metricsData.operations.length, '条记录')
}

// ==================== 2. LFSManager 示例 ====================

async function lfsManagerExample() {
  console.log('\n=== LFS Manager 示例 ===\n')
  
  const lfs = new LFSManager({ baseDir: './my-project' })
  
  // 检查 LFS 是否已安装
  const installed = await lfs.isInstalled()
  console.log('LFS 已安装:', installed)
  
  if (!installed) {
    console.log('请先安装 Git LFS: https://git-lfs.github.com/')
    return
  }
  
  // 安装 LFS hooks
  await lfs.install()
  console.log('LFS hooks 已安装')
  
  // 跟踪大文件
  await lfs.track('*.psd')
  await lfs.track('*.zip')
  await lfs.track('videos/*.mp4')
  console.log('已配置 LFS 跟踪')
  
  // 查看跟踪的文件类型
  const tracked = await lfs.listTracked()
  console.log('跟踪的文件模式:', tracked)
  
  // 拉取 LFS 对象
  await lfs.pull()
  console.log('LFS 对象已拉取')
  
  // 列出 LFS 文件
  const files = await lfs.listFiles()
  console.log(`仓库中有 ${files.length} 个 LFS 文件`)
  if (files.length > 0) {
    console.log('示例:')
    files.slice(0, 3).forEach(file => {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2)
      console.log(`  - ${file.path} (${sizeMB} MB)`)
    })
  }
  
  // 清理旧对象
  await lfs.prune({ olderThan: '7d', dryRun: true })
  console.log('预览清理结果（dry-run 模式）')
  
  // 获取状态
  const status = await lfs.getStatus()
  console.log('\nLFS 状态:')
  console.log('  版本:', status.version)
  console.log('  已启用:', status.enabled)
  console.log('  跟踪的模式:', status.trackedPatterns)
}

// ==================== 3. MonorepoManager 示例 ====================

async function monorepoManagerExample() {
  console.log('\n=== Monorepo Manager 示例 ===\n')
  
  const monorepo = new MonorepoManager({
    baseDir: './my-monorepo',
    packages: ['packages/*', 'apps/*'],
  })
  
  // 1. 发现所有包
  const packages = await monorepo.discoverPackages()
  console.log(`发现 ${packages.length} 个包:`)
  packages.forEach(pkg => {
    console.log(`  - ${pkg.name} (v${pkg.version})`)
  })
  
  // 2. 检测变更的包
  const changed = await monorepo.detectChangedPackages('main')
  console.log(`\n相对于 main 分支，有 ${changed.length} 个包发生了变更:`)
  changed.forEach(pkg => {
    console.log(`  - ${pkg.name}`)
    console.log(`    变更文件: ${pkg.changedFiles.length} 个`)
    console.log(`    变更类型: ${pkg.changeTypes.join(', ')}`)
  })
  
  // 3. 分析影响
  const changedNames = changed.map(p => p.name)
  if (changedNames.length > 0) {
    const impact = await monorepo.getAffectedPackages(changedNames)
    console.log('\n影响分析:')
    console.log('  直接影响:', impact.directlyAffected.length, '个包')
    console.log('  间接影响:', impact.indirectlyAffected.length, '个包')
    console.log('  总计:', impact.allAffected.length, '个包')
    
    if (impact.allAffected.length > 0) {
      console.log('\n受影响的包:')
      impact.allAffected.forEach(name => {
        console.log(`    - ${name}`)
      })
    }
  }
  
  // 4. 获取依赖图
  const graph = await monorepo.getDependencyGraph()
  console.log('\n依赖关系:')
  Object.entries(graph).slice(0, 3).forEach(([pkg, deps]) => {
    console.log(`  ${pkg} -> [${deps.join(', ')}]`)
  })
  
  // 5. 获取发布顺序
  const publishOrder = await monorepo.getPublishOrder()
  console.log('\n推荐的发布顺序:')
  publishOrder.forEach((pkg, index) => {
    console.log(`  ${index + 1}. ${pkg}`)
  })
  
  // 6. 更新版本
  if (changedNames.length > 0) {
    const results = await monorepo.bumpVersion(changedNames, 'patch')
    console.log('\n版本更新:')
    results.forEach(result => {
      console.log(`  ${result.package}: ${result.oldVersion} -> ${result.newVersion}`)
    })
  }
}

// ==================== 4. ReflogManager 示例 ====================

async function reflogManagerExample() {
  console.log('\n=== Reflog Manager 示例 ===\n')
  
  const reflog = new ReflogManager({ baseDir: './my-project' })
  
  // 列出最近的 reflog 条目
  const entries = await reflog.list('HEAD', 20)
  console.log(`最近 ${entries.length} 次操作:\n`)
  
  entries.slice(0, 10).forEach((entry, index) => {
    const hash = entry.hash.substring(0, 7)
    const date = entry.timestamp.toLocaleDateString()
    console.log(`${index + 1}. ${hash} - ${entry.message} (${date})`)
  })
  
  // 检查特定引用是否存在
  const exists = await reflog.exists('HEAD@{5}')
  console.log(`\nHEAD@{5} 存在:`, exists)
  
  // 显示特定引用的详情
  if (exists) {
    const details = await reflog.show('HEAD@{5}')
    console.log('\nHEAD@{5} 详情:')
    console.log(details.split('\n').slice(0, 5).join('\n'))
  }
  
  // 过期旧条目（模拟）
  console.log('\n清理 reflog（预览）:')
  console.log('  - 将删除 30 天前的条目')
  console.log('  - 将删除不可达的条目')
  // await reflog.expire({ expireTime: '30.days.ago', expireUnreachable: 'now' })
}

// ==================== 5. 组合使用示例 ====================

async function combinedExample() {
  console.log('\n=== 组合使用示例 ===\n')
  
  const monitor = new PerformanceMonitor({ autoLog: true })
  const monorepo = new MonorepoManager({ packages: ['packages/*'] })
  
  // 监控 monorepo 操作性能
  const changed = await monitor.track('detectChanges', async () => {
    return await monorepo.detectChangedPackages('main')
  })
  
  const impact = await monitor.track('analyzeImpact', async () => {
    return await monorepo.getAffectedPackages(changed.map(p => p.name))
  })
  
  console.log('检测到', changed.length, '个变更的包')
  console.log('影响', impact.allAffected.length, '个包')
  
  // 查看性能
  const stats = monitor.getOperationStats()
  console.log('\n性能统计:')
  stats.forEach(stat => {
    console.log(`  ${stat.name}: ${stat.averageDuration.toFixed(2)}ms`)
  })
}

// ==================== 6. LFS + 性能监控示例 ====================

async function lfsWithPerformanceExample() {
  console.log('\n=== LFS + 性能监控示例 ===\n')
  
  const monitor = new PerformanceMonitor({ slowThreshold: 2000 })
  const lfs = new LFSManager()
  
  // 监控 LFS 操作
  await monitor.track('lfs-pull', async () => {
    await lfs.pull()
  })
  
  await monitor.track('lfs-prune', async () => {
    await lfs.prune({ olderThan: '7d' })
  })
  
  await monitor.track('lfs-listFiles', async () => {
    return await lfs.listFiles()
  })
  
  // 分析 LFS 操作性能
  const report = monitor.getPerformanceReport()
  console.log('LFS 操作性能:')
  Object.entries(report.operationStats).forEach(([name, stat]) => {
    console.log(`  ${name}:`)
    console.log(`    平均: ${stat.averageDuration.toFixed(2)}ms`)
    console.log(`    最小: ${stat.minDuration}ms`)
    console.log(`    最大: ${stat.maxDuration}ms`)
  })
  
  const slowOps = monitor.getSlowOperations()
  if (slowOps.length > 0) {
    console.log('\n慢操作警告:')
    slowOps.forEach(op => {
      console.log(`  ${op.name} 耗时 ${op.duration}ms`)
    })
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('╔═══════════════════════════════════════════════╗')
  console.log('║   @ldesign/git v0.4.0 新功能示例             ║')
  console.log('╚═══════════════════════════════════════════════╝')
  
  try {
    // 运行所有示例
    await performanceMonitorExample()
    await lfsManagerExample()
    await monorepoManagerExample()
    await reflogManagerExample()
    await combinedExample()
    await lfsWithPerformanceExample()
    
    console.log('\n✅ 所有示例运行完成！')
  } catch (error) {
    console.error('\n❌ 错误:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error)
}

export {
  performanceMonitorExample,
  lfsManagerExample,
  monorepoManagerExample,
  reflogManagerExample,
  combinedExample,
  lfsWithPerformanceExample,
}
