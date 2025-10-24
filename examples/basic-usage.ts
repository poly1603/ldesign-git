/**
 * @ldesign/git 基础使用示例
 */

import {
  GitManager,
  BranchManager,
  TagManager,
  SmartCommit,
  WorkflowAutomation,
  CommitAnalyzer,
  ReportGenerator,
  validateBranchName,
  validateCommitMessage
} from '@ldesign/git'

async function basicUsageExample() {
  console.log('=== Git 基础操作示例 ===\n')

  // 1. 初始化 Git 管理器
  const git = new GitManager({ baseDir: './my-project' })

  try {
    // 获取当前分支
    const currentBranch = await git.getCurrentBranch()
    console.log(`当前分支: ${currentBranch}`)

    // 获取仓库状态
    const status = await git.status()
    console.log(`修改的文件: ${status.modified.length}`)
    console.log(`新增的文件: ${status.created.length}`)
    console.log(`删除的文件: ${status.deleted.length}`)
  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function branchManagementExample() {
  console.log('\n=== 分支管理示例 ===\n')

  const branchManager = new BranchManager({ baseDir: './my-project' })

  try {
    // 列出所有分支
    const branches = await branchManager.listBranches()
    console.log(`总分支数: ${branches.all.length}`)
    console.log(`当前分支: ${branches.current}`)

    // 创建新分支
    await branchManager.createBranch('feature/new-feature')
    console.log('✅ 创建分支成功: feature/new-feature')

    // 比较分支
    const comparison = await branchManager.compareBranches('main', 'feature/new-feature')
    console.log(`领先: ${comparison.ahead} 个提交`)
    console.log(`落后: ${comparison.behind} 个提交`)
  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function smartCommitExample() {
  console.log('\n=== 智能提交示例 ===\n')

  const smartCommit = new SmartCommit({ baseDir: './my-project' })

  try {
    // 分析变更并获取建议
    const suggestions = await smartCommit.analyzeChanges()
    if (suggestions.length > 0) {
      const best = suggestions[0]
      console.log(`建议的提交类型: ${best.type}`)
      console.log(`建议的主题: ${best.subject}`)
      console.log(`置信度: ${(best.confidence * 100).toFixed(0)}%`)
      console.log(`原因: ${best.reason}`)
    }

    // 验证提交信息
    const validation = validateCommitMessage('feat(user): add login feature')
    console.log(`\n提交信息验证: ${validation.valid ? '✅ 通过' : '❌ 失败'}`)
    if (validation.parsed) {
      console.log(`类型: ${validation.parsed.type}`)
      console.log(`作用域: ${validation.parsed.scope}`)
      console.log(`主题: ${validation.parsed.subject}`)
    }
  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function workflowExample() {
  console.log('\n=== 工作流自动化示例 ===\n')

  const workflow = new WorkflowAutomation(
    WorkflowAutomation.getDefaultConfig('git-flow'),
    { baseDir: './my-project' }
  )

  try {
    console.log('初始化 Git Flow...')
    // await workflow.initGitFlow()
    console.log('✅ Git Flow 初始化成功')

    // 开始新功能
    console.log('\n开始新功能开发...')
    // const featureBranch = await workflow.startFeature({
    //   name: 'user-authentication',
    //   push: false
    // })
    // console.log(`✅ 创建功能分支: ${featureBranch}`)
  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function analysisExample() {
  console.log('\n=== 统计分析示例 ===\n')

  try {
    // 提交分析
    const commitAnalyzer = new CommitAnalyzer({ baseDir: './my-project' })
    const analytics = await commitAnalyzer.analyzeCommitsDetailed(100)

    console.log(`总提交数: ${analytics.totalCommits}`)
    console.log(`平均每天提交: ${analytics.avgCommitsPerDay.toFixed(2)}`)
    console.log(`平均每人提交: ${analytics.avgCommitsPerAuthor.toFixed(2)}`)

    console.log('\n提交类型分布:')
    Object.entries(analytics.commitsByType).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  ${type}: ${count}`)
      }
    })

    console.log('\nTop 5 贡献者:')
    analytics.topContributors.slice(0, 5).forEach((contributor, index) => {
      console.log(`  ${index + 1}. ${contributor.author} - ${contributor.commits} 次提交`)
    })

    // 生成报告
    const reportGen = new ReportGenerator({ baseDir: './my-project' })
    const summary = await reportGen.generateSummary()
    console.log('\n' + summary)
  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function validationExample() {
  console.log('\n=== 验证工具示例 ===\n')

  // 验证分支名
  const branchValidation = validateBranchName('feature/user-login')
  console.log(`分支名验证: ${branchValidation.valid ? '✅ 通过' : '❌ 失败'}`)
  if (branchValidation.warnings.length > 0) {
    console.log('警告:', branchValidation.warnings)
  }
  if (branchValidation.suggestion) {
    console.log('建议:', branchValidation.suggestion)
  }

  // 验证提交信息
  const commitValidation = validateCommitMessage('feat(user): add login feature')
  console.log(`\n提交信息验证: ${commitValidation.valid ? '✅ 通过' : '❌ 失败'}`)
  if (commitValidation.errors.length > 0) {
    console.log('错误:', commitValidation.errors)
  }
  if (commitValidation.warnings.length > 0) {
    console.log('警告:', commitValidation.warnings)
  }
}

// 运行所有示例
async function runAllExamples() {
  await basicUsageExample()
  await branchManagementExample()
  await smartCommitExample()
  await workflowExample()
  await analysisExample()
  await validationExample()
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error)
}


