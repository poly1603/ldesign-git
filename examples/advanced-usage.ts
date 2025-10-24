/**
 * @ldesign/git 高级用法示例
 */

import {
  GitManager,
  BranchManager,
  TagManager,
  StashManager,
  MergeManager,
  SubmoduleManager,
  ConflictResolver,
  HookManager,
  ReviewHelper,
  ConfigManager
} from '@ldesign/git'

async function stashOperationsExample() {
  console.log('=== Stash 操作示例 ===\n')

  const stashManager = new StashManager()

  try {
    // 1. 保存工作区
    console.log('1. 保存当前工作到 stash...')
    await stashManager.stash({ message: 'WIP: 临时保存工作进度' })
    console.log('✅ 工作区已保存\n')

    // 2. 列出所有 stash
    console.log('2. 查看 stash 列表...')
    const stashes = await stashManager.list()
    console.log(`当前有 ${stashes.length} 个 stash:`)
    stashes.forEach(stash => {
      console.log(`   ${stash.name}: ${stash.message}`)
    })
    console.log()

    // 3. 应用最新的 stash
    console.log('3. 应用最新的 stash...')
    await stashManager.apply(0)
    console.log('✅ Stash 已应用\n')

    // 4. 从 stash 创建分支
    console.log('4. 从 stash 创建分支...')
    await stashManager.branch('feature/from-stash', 0)
    console.log('✅ 已从 stash 创建分支 feature/from-stash\n')

    // 5. 清理 stash
    console.log('5. 清理特定 stash...')
    await stashManager.drop(0)
    console.log('✅ Stash 已删除\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function mergeOperationsExample() {
  console.log('=== 合并操作示例 ===\n')

  const mergeManager = new MergeManager()

  try {
    // 1. 合并分支
    console.log('1. 合并分支...')
    const mergeResult = await mergeManager.merge('feature/new-feature', {
      noFastForward: true,
      message: 'Merge feature/new-feature'
    })

    if (mergeResult.success) {
      console.log('✅ 合并成功\n')
    } else {
      console.log('⚠️  合并产生冲突')
      console.log(`冲突文件数: ${mergeResult.conflicts.length}`)
      mergeResult.conflicts.forEach(c => {
        console.log(`   - ${c.file} (${c.status})`)
      })
      console.log()
    }

    // 2. Cherry-pick 提交
    console.log('2. Cherry-pick 提交...')
    await mergeManager.cherryPick('abc1234', { noCommit: false })
    console.log('✅ Cherry-pick 成功\n')

    // 3. 变基操作
    console.log('3. 变基到主分支...')
    await mergeManager.rebase('main', { interactive: false })
    console.log('✅ 变基成功\n')

  } catch (error: any) {
    console.error('错误:', error.message)

    // 如果失败，可能需要中止
    console.log('提示: 如果操作失败，可以使用 abortMerge() 或 abortRebase() 中止')
  }
}

async function submoduleManagementExample() {
  console.log('=== 子模块管理示例 ===\n')

  const submodule = new SubmoduleManager()

  try {
    // 1. 添加子模块
    console.log('1. 添加子模块...')
    await submodule.addSubmodule(
      'https://github.com/user/library.git',
      'libs/external-lib',
      { branch: 'main' }
    )
    console.log('✅ 子模块已添加\n')

    // 2. 初始化子模块
    console.log('2. 初始化所有子模块...')
    await submodule.initSubmodules(true)
    console.log('✅ 子模块已初始化\n')

    // 3. 更新子模块
    console.log('3. 更新子模块到最新...')
    await submodule.updateSubmodulesToLatest()
    console.log('✅ 子模块已更新\n')

    // 4. 列出所有子模块
    console.log('4. 查看子模块列表...')
    const submodules = await submodule.listSubmodules()
    console.log(`子模块数量: ${submodules.length}`)
    submodules.forEach(sub => {
      console.log(`   - ${sub.name}: ${sub.url} (${sub.status})`)
    })
    console.log()

    // 5. 遍历子模块执行命令
    console.log('5. 遍历子模块执行 git status...')
    const output = await submodule.foreachSubmodule('git status --short')
    console.log(output)
    console.log()

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function conflictResolutionExample() {
  console.log('=== 冲突解决示例 ===\n')

  const resolver = new ConflictResolver()

  try {
    // 1. 检测冲突
    console.log('1. 检测冲突...')
    const conflicts = await resolver.detectConflicts()

    if (conflicts.length === 0) {
      console.log('✅ 没有冲突\n')
      return
    }

    console.log(`⚠️  发现 ${conflicts.length} 个冲突文件:`)
    conflicts.forEach(c => {
      console.log(`   - ${c.file} (${c.status})`)
    })
    console.log()

    // 2. 解析冲突标记
    console.log('2. 解析冲突标记...')
    const firstConflict = conflicts[0]
    const parsed = await resolver.parseConflictMarkers(firstConflict.file)

    if (parsed.hasConflicts) {
      console.log(`   ${firstConflict.file} 包含 ${parsed.conflicts.length} 个冲突区域`)
      parsed.conflicts.forEach((c, i) => {
        console.log(`   冲突 ${i + 1}: 行 ${c.startLine} - ${c.endLine}`)
      })
    }
    console.log()

    // 3. 解决策略示例
    console.log('3. 冲突解决策略:')
    console.log('   a) 使用我们的版本:')
    console.log('      await resolver.resolveWithOurs("path/to/file")')
    console.log('   b) 使用他们的版本:')
    console.log('      await resolver.resolveWithTheirs("path/to/file")')
    console.log('   c) 手动解决后标记:')
    console.log('      await resolver.markAsResolved("path/to/file")')
    console.log()

    // 4. 批量解决
    console.log('4. 批量解决冲突...')
    console.log('   await resolver.batchResolveWithOurs(conflictedFiles)')
    console.log()

    // 5. 生成冲突报告
    console.log('5. 生成冲突报告...')
    const report = await resolver.generateConflictReport()
    console.log(report)
    console.log()

    // 6. 检查当前操作
    const operation = await resolver.getCurrentOperation()
    if (operation) {
      console.log(`当前正在进行: ${operation}`)
      console.log('可以使用 continueCurrentOperation() 继续')
      console.log('或使用 abortCurrentOperation() 中止')
    }
    console.log()

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function hooksManagementExample() {
  console.log('=== Hooks 管理示例 ===\n')

  const hookManager = new HookManager()

  try {
    // 1. 列出可用模板
    console.log('1. 可用的 Hook 模板:')
    const templates = HookManager.listTemplates()
    templates.forEach(t => {
      console.log(`   - ${t.name}: ${t.description}`)
    })
    console.log()

    // 2. 安装模板
    console.log('2. 安装提交信息验证模板...')
    const template = HookManager.getTemplate('commit-msg-validation')
    if (template) {
      await hookManager.installFromTemplate(template)
      console.log('✅ 模板已安装\n')
    }

    // 3. 列出已安装的 hooks
    console.log('3. 已安装的 hooks:')
    const installed = await hookManager.listInstalledHooks()
    installed.forEach(hook => {
      console.log(`   - ${hook}`)
    })
    console.log()

    // 4. 自定义 hook
    console.log('4. 安装自定义 hook...')
    await hookManager.installHook({
      type: 'pre-commit',
      enabled: true,
      script: `#!/bin/sh
echo "运行代码检查..."
npm run lint || exit 1
echo "✅ 代码检查通过"
exit 0`
    })
    console.log('✅ 自定义 hook 已安装\n')

    // 5. 禁用/启用 hook
    console.log('5. 管理 hook 状态...')
    await hookManager.disableHook('pre-push')
    console.log('✅ pre-push hook 已禁用')

    await hookManager.enableHook('pre-push')
    console.log('✅ pre-push hook 已启用\n')

    // 6. 备份 hooks
    console.log('6. 备份现有 hooks...')
    await hookManager.backupHooks()
    console.log('✅ Hooks 已备份\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function reviewProcessExample() {
  console.log('=== 代码审查流程示例 ===\n')

  const reviewer = new ReviewHelper()

  try {
    // 1. 生成审查数据
    console.log('1. 生成代码审查数据...')
    const reviewData = await reviewer.generateReviewData('main', 'feature/new-feature')

    console.log(`审查标题: ${reviewData.title}`)
    console.log(`变更文件数: ${reviewData.changes.files}`)
    console.log(`新增行数: +${reviewData.changes.insertions}`)
    console.log(`删除行数: -${reviewData.changes.deletions}`)
    console.log(`影响级别: ${reviewData.impact.level}`)
    console.log(`影响原因: ${reviewData.impact.reason}`)
    console.log()

    // 2. 审查建议
    if (reviewData.suggestions.length > 0) {
      console.log('2. 审查建议:')
      reviewData.suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion}`)
      })
      console.log()
    }

    // 3. 文件变更详情
    console.log('3. 文件变更详情 (Top 5):')
    reviewData.fileChanges.slice(0, 5).forEach(file => {
      console.log(`   ${file.type.padEnd(10)} ${file.path} (+${file.insertions}/-${file.deletions})`)
    })
    console.log()

    // 4. 生成 Markdown 报告
    console.log('4. 生成审查报告...')
    const report = await reviewer.generateMarkdownReport('main', 'feature/new-feature')
    await fs.writeFile('review-report.md', report, 'utf-8')
    console.log('✅ 审查报告已保存到: review-report.md\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function configManagementExample() {
  console.log('=== 配置管理示例 ===\n')

  const config = new ConfigManager()

  try {
    // 1. 加载配置
    console.log('1. 加载配置...')
    const userConfig = await config.loadConfig()
    console.log('当前配置:')
    console.log(JSON.stringify(userConfig, null, 2))
    console.log()

    // 2. 更新配置
    console.log('2. 更新配置...')
    await config.updateConfig({
      preferences: {
        autoStash: true,
        autoFetch: true,
        defaultBranch: 'main',
        pullRebase: true
      }
    })
    console.log('✅ 配置已更新\n')

    // 3. 添加自定义作用域
    console.log('3. 添加自定义作用域...')
    await config.addScope('user')
    await config.addScope('auth')
    await config.addScope('payment')
    console.log('✅ 作用域已添加\n')

    // 4. 添加别名
    console.log('4. 添加 Git 别名...')
    await config.addAlias('st', 'status')
    await config.addAlias('co', 'checkout')
    await config.addAlias('br', 'branch')
    await config.addAlias('ci', 'commit')
    console.log('✅ 别名已添加\n')

    // 5. 设置工作流
    console.log('5. 设置工作流配置...')
    await config.setWorkflowConfig({
      type: 'git-flow',
      branches: {
        main: 'main',
        develop: 'develop'
      },
      prefixes: {
        feature: 'feature/',
        release: 'release/',
        hotfix: 'hotfix/'
      },
      versionTag: {
        prefix: 'v',
        enabled: true
      }
    })
    console.log('✅ 工作流配置已设置\n')

    // 6. 导出配置
    console.log('6. 导出配置...')
    await config.exportConfig('git-config-backup.json')
    console.log('✅ 配置已导出到: git-config-backup.json\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function complexWorkflowExample() {
  console.log('=== 复杂工作流示例 ===\n')

  const git = new GitManager()
  const branchManager = new BranchManager()
  const tagManager = new TagManager()
  const stashManager = new StashManager()

  try {
    console.log('场景: 紧急修复正在开发的功能\n')

    // 1. 当前正在开发功能
    console.log('1. 正在 feature/new-feature 分支开发...')
    await branchManager.checkoutBranch('feature/new-feature')

    // 2. 突然需要修复紧急 bug
    console.log('2. 接到紧急 bug 修复任务...')

    // 3. 保存当前工作
    console.log('3. 保存当前未完成的工作...')
    await stashManager.stash({ message: 'WIP: 新功能开发中' })
    console.log('✅ 工作已暂存\n')

    // 4. 切换到主分支
    console.log('4. 切换到 main 分支...')
    await branchManager.checkoutBranch('main')

    // 5. 创建热修复分支
    console.log('5. 创建热修复分支...')
    await branchManager.createBranch('hotfix/critical-bug', 'main')
    await branchManager.checkoutBranch('hotfix/critical-bug')
    console.log('✅ 热修复分支已创建\n')

    // 6. 修复 bug 并提交
    console.log('6. 修复 bug 并提交...')
    await git.add('.')
    await git.commit('fix: 修复关键 bug')
    console.log('✅ Bug 已修复并提交\n')

    // 7. 合并到 main 并打标签
    console.log('7. 合并到 main 并发布...')
    await branchManager.checkoutBranch('main')
    const mergeManager = new MergeManager()
    await mergeManager.merge('hotfix/critical-bug')
    await tagManager.createAnnotatedTag('v1.0.1', 'Hotfix release 1.0.1')
    console.log('✅ 热修复已发布\n')

    // 8. 返回继续开发
    console.log('8. 返回继续新功能开发...')
    await branchManager.checkoutBranch('feature/new-feature')
    await stashManager.pop(0)
    console.log('✅ 已恢复之前的工作，继续开发\n')

    console.log('🎉 完整的紧急修复流程完成！\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function cicdIntegrationExample() {
  console.log('=== CI/CD 集成示例 ===\n')

  console.log('GitHub Actions 工作流示例:\n')

  console.log('```yaml')
  console.log('name: Git Analysis')
  console.log('')
  console.log('on:')
  console.log('  push:')
  console.log('    branches: [main, develop]')
  console.log('  pull_request:')
  console.log('')
  console.log('jobs:')
  console.log('  analyze:')
  console.log('    runs-on: ubuntu-latest')
  console.log('    steps:')
  console.log('      - uses: actions/checkout@v3')
  console.log('        with:')
  console.log('          fetch-depth: 0  # 获取完整历史')
  console.log('')
  console.log('      - name: Setup Node.js')
  console.log('        uses: actions/setup-node@v3')
  console.log('        with:')
  console.log('          node-version: 18')
  console.log('')
  console.log('      - name: Install dependencies')
  console.log('        run: npm install -g @ldesign/git')
  console.log('')
  console.log('      - name: Analyze commits')
  console.log('        run: ldesign-git analyze commits')
  console.log('')
  console.log('      - name: Generate report')
  console.log('        run: ldesign-git report -f markdown -o report.md')
  console.log('')
  console.log('      - name: Upload report')
  console.log('        uses: actions/upload-artifact@v3')
  console.log('        with:')
  console.log('          name: git-analysis-report')
  console.log('          path: report.md')
  console.log('```\n')
}

async function performanceTipsExample() {
  console.log('=== 性能优化技巧 ===\n')

  console.log('1. 限制分析的提交数量:')
  console.log('   const analyzer = new CommitAnalyzer()')
  console.log('   await analyzer.analyzeCommits(100)  // 只分析最近 100 次提交\n')

  console.log('2. 使用缓存（未来功能）:')
  console.log('   const analyzer = new CommitAnalyzer({ cache: true })\n')

  console.log('3. 批量操作时分批处理:')
  console.log('   const branches = [...allBranches]')
  console.log('   const batchSize = 10')
  console.log('   for (let i = 0; i < branches.length; i += batchSize) {')
  console.log('     const batch = branches.slice(i, i + batchSize)')
  console.log('     await batchOperations.deleteBranches(batch)')
  console.log('   }\n')

  console.log('4. 并发执行独立任务:')
  console.log('   const [commits, branches, tags] = await Promise.all([')
  console.log('     analyzer.analyzeCommits(),')
  console.log('     branchManager.listBranches(),')
  console.log('     tagManager.listTags()')
  console.log('   ])\n')
}

// 运行所有示例
async function runAllExamples() {
  await stashOperationsExample()
  await mergeOperationsExample()
  await submoduleManagementExample()
  await conflictResolutionExample()
  await hooksManagementExample()
  await reviewProcessExample()
  await configManagementExample()
  await complexWorkflowExample()
  await cicdIntegrationExample()
  await performanceTipsExample()
}

if (require.main === module) {
  runAllExamples().catch(console.error)
}


