/**
 * @ldesign/git 工作流使用示例
 */

import { WorkflowAutomation } from '@ldesign/git'

// ==================== Git Flow 示例 ====================

async function gitFlowExample() {
  console.log('=== Git Flow 工作流示例 ===\n')

  const workflow = new WorkflowAutomation(
    WorkflowAutomation.getDefaultConfig('git-flow')
  )

  try {
    // 1. 初始化 Git Flow
    console.log('1. 初始化 Git Flow...')
    await workflow.initGitFlow()
    console.log('✅ Git Flow 初始化完成\n')

    // 2. 开始新功能
    console.log('2. 开始新功能开发...')
    const featureBranch = await workflow.startFeature({
      name: 'user-authentication',
      push: false
    })
    console.log(`✅ 创建功能分支: ${featureBranch}\n`)

    // ... 在功能分支上进行开发和提交 ...
    console.log('   在功能分支上进行开发...\n')

    // 3. 完成功能
    console.log('3. 完成功能开发...')
    await workflow.finishFeature('user-authentication', true)
    console.log('✅ 功能已合并到 develop 分支\n')

    // 4. 开始发布
    console.log('4. 开始版本发布...')
    const releaseBranch = await workflow.startRelease({
      version: '1.0.0',
      push: false
    })
    console.log(`✅ 创建发布分支: ${releaseBranch}\n`)

    // ... 在发布分支上进行版本号更新、bug 修复等 ...
    console.log('   更新版本号和 CHANGELOG...\n')

    // 5. 完成发布
    console.log('5. 完成版本发布...')
    await workflow.finishRelease('1.0.0', true)
    console.log('✅ 版本 1.0.0 已发布\n')
    console.log('   - 已合并到 main 分支')
    console.log('   - 已合并到 develop 分支')
    console.log('   - 已创建标签 v1.0.0\n')

    // 6. 紧急热修复
    console.log('6. 紧急热修复...')
    const hotfixBranch = await workflow.startHotfix({
      name: 'critical-bug',
      push: false
    })
    console.log(`✅ 创建热修复分支: ${hotfixBranch}\n`)

    // ... 修复 bug ...
    console.log('   修复紧急 bug...\n')

    // 7. 完成热修复
    console.log('7. 完成热修复...')
    await workflow.finishHotfix('critical-bug', '1.0.1', true)
    console.log('✅ 热修复已完成\n')
    console.log('   - 已合并到 main 分支')
    console.log('   - 已合并到 develop 分支')
    console.log('   - 已创建标签 v1.0.1\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

// ==================== GitHub Flow 示例 ====================

async function githubFlowExample() {
  console.log('=== GitHub Flow 工作流示例 ===\n')

  const workflow = new WorkflowAutomation(
    WorkflowAutomation.getDefaultConfig('github-flow')
  )

  try {
    // 1. 创建功能分支
    console.log('1. 从 main 创建功能分支...')
    const featureBranch = await workflow.createFeatureBranch('add-new-feature', false)
    console.log(`✅ 创建功能分支: ${featureBranch}\n`)

    // 2. 在功能分支上开发
    console.log('2. 在功能分支上进行开发和提交...\n')

    // 3. 推送到远程并创建 Pull Request
    console.log('3. 推送到远程并创建 PR...')
    console.log('   (在实际使用中会推送到 GitHub)\n')

    // 4. 代码审查通过后，合并到 main
    console.log('4. 合并到 main 分支...')
    await workflow.mergeToMain(featureBranch, true)
    console.log('✅ 功能已合并到 main 分支\n')
    console.log('   - 自动部署到生产环境\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

// ==================== 自定义工作流配置 ====================

async function customWorkflowExample() {
  console.log('=== 自定义工作流配置示例 ===\n')

  const customConfig = {
    type: 'custom' as const,
    branches: {
      main: 'master',
      develop: 'dev',
      feature: 'features/',
      release: 'releases/',
      hotfix: 'hotfixes/'
    },
    prefixes: {
      feature: 'features/',
      release: 'releases/',
      hotfix: 'hotfixes/',
      bugfix: 'bugfixes/'
    },
    versionTag: {
      prefix: 'release-',
      enabled: true
    }
  }

  const workflow = new WorkflowAutomation(customConfig)

  console.log('自定义工作流配置:')
  console.log(JSON.stringify(customConfig, null, 2))
  console.log('\n✅ 可以使用自定义的分支命名和流程\n')
}

// ==================== 工作流最佳实践 ====================

async function bestPracticesExample() {
  console.log('=== 工作流最佳实践 ===\n')

  console.log('1. Git Flow 适用场景:')
  console.log('   - 有明确的发布周期')
  console.log('   - 需要同时维护多个版本')
  console.log('   - 团队规模较大\n')

  console.log('2. GitHub Flow 适用场景:')
  console.log('   - 持续部署')
  console.log('   - 快速迭代')
  console.log('   - 团队规模中小\n')

  console.log('3. 工作流选择建议:')
  console.log('   - 小型项目/快速迭代: GitHub Flow')
  console.log('   - 大型项目/版本管理: Git Flow')
  console.log('   - 中型项目/灵活部署: GitLab Flow\n')

  console.log('4. 常见错误避免:')
  console.log('   ✗ 不要在 main/master 分支直接提交')
  console.log('   ✗ 不要跳过代码审查')
  console.log('   ✗ 不要忘记更新 CHANGELOG')
  console.log('   ✓ 使用规范的分支命名')
  console.log('   ✓ 保持提交信息清晰')
  console.log('   ✓ 及时清理已合并的分支\n')
}

// 运行所有示例
async function runAllExamples() {
  await gitFlowExample()
  await githubFlowExample()
  await customWorkflowExample()
  await bestPracticesExample()
}

if (require.main === module) {
  runAllExamples().catch(console.error)
}


