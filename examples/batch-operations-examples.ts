/**
 * @ldesign/git 批量操作示例
 */

import { BatchOperations } from '@ldesign/git'

async function batchBranchesExample() {
  console.log('=== 批量分支操作示例 ===\n')

  const batch = new BatchOperations()

  try {
    // 1. 批量创建分支
    console.log('1. 批量创建分支...')
    const createResult = await batch.createBranches([
      'feature/feature-1',
      'feature/feature-2',
      'feature/feature-3',
      'bugfix/bug-fix-1'
    ])

    console.log(`✅ 成功: ${createResult.succeeded}`)
    console.log(`❌ 失败: ${createResult.failed}`)

    if (createResult.failed > 0) {
      console.log('\n失败的分支:')
      createResult.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.item}: ${r.error}`)
        })
    }

    console.log()

    // 2. 批量推送分支
    console.log('2. 批量推送分支...')
    const pushResult = await batch.pushBranches([
      'feature/feature-1',
      'feature/feature-2'
    ], 'origin', true)

    console.log(`✅ 推送成功: ${pushResult.succeeded}`)
    console.log(`❌ 推送失败: ${pushResult.failed}\n`)

    // 3. 清理已合并的分支
    console.log('3. 清理已合并的分支...')
    const cleanupResult = await batch.cleanupMergedBranches(
      'main',
      ['main', 'master', 'develop']
    )

    console.log(`✅ 已删除 ${cleanupResult.succeeded} 个已合并的分支`)

    if (cleanupResult.results.length > 0) {
      console.log('\n已删除的分支:')
      cleanupResult.results
        .filter(r => r.success)
        .forEach(r => {
          console.log(`  ✓ ${r.item}`)
        })
    }

    console.log()

    // 4. 清理陈旧的远程分支引用
    console.log('4. 清理陈旧的远程分支引用...')
    await batch.cleanupStaleBranches('origin')
    console.log('✅ 远程分支引用已清理\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function batchTagsExample() {
  console.log('=== 批量标签操作示例 ===\n')

  const batch = new BatchOperations()

  try {
    // 1. 批量创建标签
    console.log('1. 批量创建标签...')
    const createResult = await batch.createTags([
      { name: 'v1.0.0', annotated: true, message: 'Release 1.0.0' },
      { name: 'v1.0.1', annotated: true, message: 'Release 1.0.1' },
      { name: 'latest', annotated: false }
    ])

    console.log(`✅ 成功创建: ${createResult.succeeded}`)
    console.log(`❌ 创建失败: ${createResult.failed}\n`)

    // 2. 批量推送标签
    console.log('2. 批量推送标签到远程...')
    const pushResult = await batch.pushTags([
      'v1.0.0',
      'v1.0.1'
    ], 'origin')

    console.log(`✅ 推送成功: ${pushResult.succeeded}`)
    console.log(`❌ 推送失败: ${pushResult.failed}\n`)

    // 3. 批量删除旧标签
    console.log('3. 批量删除旧标签...')
    const deleteResult = await batch.deleteTags([
      'old-tag-1',
      'old-tag-2'
    ])

    console.log(`✅ 删除成功: ${deleteResult.succeeded}`)
    console.log(`❌ 删除失败: ${deleteResult.failed}\n`)

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function batchMergeExample() {
  console.log('=== 批量合并示例 ===\n')

  const batch = new BatchOperations()

  try {
    // 批量合并多个功能分支到 develop
    console.log('批量合并功能分支到 develop...')
    const mergeResult = await batch.mergeBranches([
      'feature/feature-1',
      'feature/feature-2',
      'feature/feature-3'
    ], 'develop')

    console.log(`✅ 合并成功: ${mergeResult.succeeded}`)
    console.log(`❌ 合并失败: ${mergeResult.failed}`)

    // 显示合并结果详情
    if (mergeResult.failed > 0) {
      console.log('\n失败的合并:')
      mergeResult.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.item}: ${r.error}`)
        })
    }

    console.log()

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function batchOperationsBestPractices() {
  console.log('=== 批量操作最佳实践 ===\n')

  console.log('1. 批量操作前的准备:')
  console.log('   ✓ 确保工作区干净')
  console.log('   ✓ 备份重要数据')
  console.log('   ✓ 先在测试环境验证\n')

  console.log('2. 批量删除分支前:')
  console.log('   ✓ 使用 --dry-run 预览')
  console.log('   ✓ 确认分支已合并')
  console.log('   ✓ 备份重要的未合并分支\n')

  console.log('3. 批量合并注意事项:')
  console.log('   ✓ 先解决可能的冲突')
  console.log('   ✓ 逐个检查合并结果')
  console.log('   ✓ 合并后运行测试\n')

  console.log('4. 性能优化建议:')
  console.log('   ✓ 合理控制批量操作数量')
  console.log('   ✓ 对大量操作分批执行')
  console.log('   ✓ 使用进度回调监控进度\n')
}

// 运行所有示例
async function runAllExamples() {
  await batchBranchesExample()
  await batchTagsExample()
  await batchMergeExample()
  await batchOperationsBestPractices()
}

if (require.main === module) {
  runAllExamples().catch(console.error)
}


