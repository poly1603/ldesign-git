/**
 * @ldesign/git Hooks 管理示例
 */

import { HookManager } from '@ldesign/git'
import type { HookConfig } from '@ldesign/git'

async function basicHooksExample() {
  console.log('=== 基础 Hooks 使用示例 ===\n')

  const hookManager = new HookManager()

  try {
    // 1. 安装提交信息验证 hook
    console.log('1. 安装提交信息验证 hook...')
    const template = HookManager.getTemplate('commit-msg-validation')
    if (template) {
      await hookManager.installFromTemplate(template)
      console.log('✅ 提交信息验证 hook 已安装\n')
    }

    // 2. 安装代码检查 hook
    console.log('2. 安装预提交代码检查 hook...')
    const lintTemplate = HookManager.getTemplate('pre-commit-lint')
    if (lintTemplate) {
      await hookManager.installFromTemplate(lintTemplate)
      console.log('✅ 代码检查 hook 已安装\n')
    }

    // 3. 列出已安装的 hooks
    console.log('3. 已安装的 hooks:')
    const installed = await hookManager.listInstalledHooks()
    for (const hook of installed) {
      const enabled = await hookManager.isHookEnabled(hook)
      console.log(`   ${enabled ? '✓' : '✗'} ${hook}`)
    }
    console.log()

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function customHooksExample() {
  console.log('=== 自定义 Hooks 示例 ===\n')

  const hookManager = new HookManager()

  // 示例 1: 自动添加 issue 编号
  const prepareCommitMsgHook: HookConfig = {
    type: 'prepare-commit-msg',
    enabled: true,
    script: `#!/bin/sh
# 自动从分支名提取 issue 编号并添加到提交信息

commit_msg_file=$1
branch_name=$(git symbolic-ref --short HEAD)

# 提取 issue 编号（例如: feature/ISSUE-123-description）
issue_number=$(echo "$branch_name" | grep -oE '[A-Z]+-[0-9]+')

if [ -n "$issue_number" ]; then
  sed -i.bak "1s/^/[$issue_number] /" "$commit_msg_file"
  rm -f "$commit_msg_file.bak"
fi

exit 0`
  }

  // 示例 2: 检查代码中的 TODO 和 FIXME
  const preCommitCheckHook: HookConfig = {
    type: 'pre-commit',
    enabled: true,
    script: `#!/bin/sh
# 检查代码中的 TODO 和 FIXME

echo "检查代码中的 TODO/FIXME..."

# 获取暂存的文件
files=$(git diff --cached --name-only --diff-filter=ACM)

# 检查每个文件
for file in $files; do
  if grep -q "TODO\\|FIXME" "$file"; then
    echo "⚠️  警告: $file 包含 TODO 或 FIXME"
  fi
done

echo "✅ 检查完成"
exit 0`
  }

  // 示例 3: 阻止推送到受保护分支
  const prePushProtectHook: HookConfig = {
    type: 'pre-push',
    enabled: true,
    script: `#!/bin/sh
# 阻止直接推送到 main/master 分支

protected_branches="main master"
current_branch=$(git symbolic-ref --short HEAD)

for branch in $protected_branches; do
  if [ "$current_branch" = "$branch" ]; then
    echo "❌ 错误: 不允许直接推送到 $branch 分支"
    echo "请创建功能分支并通过 Pull Request 合并"
    exit 1
  fi
done

echo "✅ 推送检查通过"
exit 0`
  }

  try {
    console.log('安装自定义 hooks...\n')

    console.log('1. 安装 prepare-commit-msg hook（自动添加 issue 编号）...')
    await hookManager.installHook(prepareCommitMsgHook)
    console.log('✅ 已安装\n')

    console.log('2. 安装 pre-commit hook（检查 TODO/FIXME）...')
    await hookManager.installHook(preCommitCheckHook)
    console.log('✅ 已安装\n')

    console.log('3. 安装 pre-push hook（保护主分支）...')
    await hookManager.installHook(prePushProtectHook)
    console.log('✅ 已安装\n')

    console.log('所有自定义 hooks 已安装成功！\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function hooksTemplatesExample() {
  console.log('=== Hook 模板使用示例 ===\n')

  const hookManager = new HookManager()

  // 列出所有可用模板
  console.log('可用的 Hook 模板:\n')

  const templates = HookManager.listTemplates()
  templates.forEach((template, index) => {
    console.log(`${index + 1}. ${template.name}`)
    console.log(`   描述: ${template.description}\n`)
  })

  try {
    // 安装完整工作流模板
    console.log('安装完整工作流模板...')
    const fullTemplate = HookManager.getTemplate('full-workflow')
    if (fullTemplate) {
      await hookManager.installFromTemplate(fullTemplate)
      console.log('✅ 完整工作流 hooks 已安装\n')

      console.log('包含的 hooks:')
      fullTemplate.hooks.forEach(hook => {
        console.log(`   - ${hook.type}`)
      })
      console.log()
    }

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function hooksManagementExample() {
  console.log('=== Hooks 管理示例 ===\n')

  const hookManager = new HookManager()

  try {
    // 1. 备份现有 hooks
    console.log('1. 备份现有 hooks...')
    await hookManager.backupHooks()
    console.log('✅ Hooks 已备份到 .git/hooks-backup-{timestamp}\n')

    // 2. 禁用特定 hook
    console.log('2. 临时禁用 pre-push hook...')
    await hookManager.disableHook('pre-push')
    console.log('✅ pre-push hook 已禁用\n')

    // 3. 重新启用 hook
    console.log('3. 重新启用 pre-push hook...')
    await hookManager.enableHook('pre-push')
    console.log('✅ pre-push hook 已启用\n')

    // 4. 查看 hook 内容
    console.log('4. 查看 commit-msg hook 的内容...')
    const content = await hookManager.getHookContent('commit-msg')
    if (content) {
      console.log('Hook 脚本:')
      console.log('---')
      console.log(content.substring(0, 200) + '...')
      console.log('---\n')
    }

    // 5. 卸载特定 hook
    console.log('5. 卸载不需要的 hook...')
    await hookManager.uninstallHook('post-update')
    console.log('✅ post-update hook 已卸载\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function teamHooksExample() {
  console.log('=== 团队协作 Hooks 配置 ===\n')

  console.log('团队统一 Hooks 配置策略:\n')

  console.log('1. 在项目中添加 hooks 配置文件:')
  console.log('   创建 .git-hooks/ 目录存放 hook 脚本')
  console.log('   在 package.json 中添加安装脚本\n')

  console.log('2. package.json 配置示例:')
  console.log('```json')
  console.log('{')
  console.log('  "scripts": {')
  console.log('    "prepare": "node scripts/install-hooks.js"')
  console.log('  }')
  console.log('}')
  console.log('```\n')

  console.log('3. scripts/install-hooks.js 示例:')
  console.log('```javascript')
  console.log("const { HookManager } = require('@ldesign/git')")
  console.log('')
  console.log('async function installHooks() {')
  console.log('  const manager = new HookManager()')
  console.log('  ')
  console.log("  const template = HookManager.getTemplate('full-workflow')")
  console.log('  await manager.installFromTemplate(template)')
  console.log('  ')
  console.log("  console.log('✅ 团队 hooks 已安装')")
  console.log('}')
  console.log('')
  console.log('installHooks().catch(console.error)')
  console.log('```\n')

  console.log('4. 好处:')
  console.log('   ✓ 团队统一的代码质量标准')
  console.log('   ✓ 自动化的提交信息验证')
  console.log('   ✓ 防止常见错误')
  console.log('   ✓ 新成员无需手动配置\n')
}

// 运行所有示例
async function runAllExamples() {
  await basicHooksExample()
  await customHooksExample()
  await hooksTemplatesExample()
  await hooksManagementExample()
  await teamHooksExample()
}

if (require.main === module) {
  runAllExamples().catch(console.error)
}


