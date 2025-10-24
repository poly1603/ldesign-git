import * as fs from 'fs/promises'
import * as path from 'path'
import type { HookType, HookConfig, HookTemplate, GitOptions } from '../types'

/**
 * Hooks 管理器 - 管理 Git Hooks
 */
export class HookManager {
  private hooksDir: string

  constructor(private options: GitOptions = {}) {
    const baseDir = options.baseDir || process.cwd()
    this.hooksDir = path.join(baseDir, '.git', 'hooks')
  }

  /**
   * 安装 hook
   * @param config Hook 配置
   */
  async installHook(config: HookConfig): Promise<void> {
    const hookPath = path.join(this.hooksDir, config.type)

    // 确保 hooks 目录存在
    await fs.mkdir(this.hooksDir, { recursive: true })

    // 写入 hook 脚本
    await fs.writeFile(hookPath, config.script, { mode: 0o755 })

    if (!config.enabled) {
      await this.disableHook(config.type)
    }
  }

  /**
   * 卸载 hook
   * @param hookType Hook 类型
   */
  async uninstallHook(hookType: HookType): Promise<void> {
    const hookPath = path.join(this.hooksDir, hookType)

    try {
      await fs.unlink(hookPath)
    } catch (error) {
      // Hook 可能不存在，忽略错误
    }
  }

  /**
   * 启用 hook
   * @param hookType Hook 类型
   */
  async enableHook(hookType: HookType): Promise<void> {
    const hookPath = path.join(this.hooksDir, hookType)
    const disabledPath = `${hookPath}.disabled`

    try {
      // 如果存在 .disabled 文件，重命名回来
      await fs.rename(disabledPath, hookPath)
      // 确保可执行
      await fs.chmod(hookPath, 0o755)
    } catch (error) {
      // 可能已经是启用状态
    }
  }

  /**
   * 禁用 hook
   * @param hookType Hook 类型
   */
  async disableHook(hookType: HookType): Promise<void> {
    const hookPath = path.join(this.hooksDir, hookType)
    const disabledPath = `${hookPath}.disabled`

    try {
      await fs.rename(hookPath, disabledPath)
    } catch (error) {
      // Hook 可能不存在
    }
  }

  /**
   * 检查 hook 是否存在
   * @param hookType Hook 类型
   */
  async hookExists(hookType: HookType): Promise<boolean> {
    const hookPath = path.join(this.hooksDir, hookType)
    try {
      await fs.access(hookPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 检查 hook 是否启用
   * @param hookType Hook 类型
   */
  async isHookEnabled(hookType: HookType): Promise<boolean> {
    return await this.hookExists(hookType)
  }

  /**
   * 获取 hook 内容
   * @param hookType Hook 类型
   */
  async getHookContent(hookType: HookType): Promise<string | null> {
    const hookPath = path.join(this.hooksDir, hookType)

    try {
      return await fs.readFile(hookPath, 'utf-8')
    } catch {
      return null
    }
  }

  /**
   * 列出所有已安装的 hooks
   */
  async listInstalledHooks(): Promise<HookType[]> {
    try {
      const files = await fs.readdir(this.hooksDir)
      return files.filter(file => !file.includes('.') && !file.includes('sample')) as HookType[]
    } catch {
      return []
    }
  }

  /**
   * 批量安装 hooks
   * @param configs Hook 配置数组
   */
  async installHooks(configs: HookConfig[]): Promise<void> {
    for (const config of configs) {
      await this.installHook(config)
    }
  }

  /**
   * 从模板安装 hooks
   * @param template Hook 模板
   */
  async installFromTemplate(template: HookTemplate): Promise<void> {
    await this.installHooks(template.hooks)
  }

  /**
   * 获取预定义的 hook 模板
   */
  static getTemplates(): Record<string, HookTemplate> {
    return {
      'commit-msg-validation': {
        name: 'Commit Message Validation',
        description: '验证提交信息格式（Conventional Commits）',
        hooks: [
          {
            type: 'commit-msg',
            enabled: true,
            script: `#!/bin/sh
# Validate commit message format (Conventional Commits)

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Pattern for conventional commits
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?: .+"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "❌ 错误: 提交信息不符合 Conventional Commits 规范"
  echo ""
  echo "格式应为: type(scope): subject"
  echo ""
  echo "类型可以是:"
  echo "  - feat:     新功能"
  echo "  - fix:      修复 bug"
  echo "  - docs:     文档变更"
  echo "  - style:    代码格式（不影响代码运行的变动）"
  echo "  - refactor: 重构（既不是新增功能，也不是修改bug的代码变动）"
  echo "  - perf:     性能优化"
  echo "  - test:     增加测试"
  echo "  - build:    构建过程或辅助工具的变动"
  echo "  - ci:       CI 配置"
  echo "  - chore:    其他变动"
  echo "  - revert:   回滚"
  echo ""
  echo "示例: feat(user): 添加用户注册功能"
  exit 1
fi

exit 0`
          }
        ]
      },
      'pre-commit-lint': {
        name: 'Pre-commit Lint',
        description: '提交前运行代码检查',
        hooks: [
          {
            type: 'pre-commit',
            enabled: true,
            script: `#!/bin/sh
# Run linting before commit

echo "🔍 运行代码检查..."

# Run lint
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ 代码检查失败，请修复后再提交"
  exit 1
fi

echo "✅ 代码检查通过"
exit 0`
          }
        ]
      },
      'pre-push-test': {
        name: 'Pre-push Test',
        description: '推送前运行测试',
        hooks: [
          {
            type: 'pre-push',
            enabled: true,
            script: `#!/bin/sh
# Run tests before push

echo "🧪 运行测试..."

# Run tests
npm run test

if [ $? -ne 0 ]; then
  echo "❌ 测试失败，请修复后再推送"
  exit 1
fi

echo "✅ 测试通过"
exit 0`
          }
        ]
      },
      'prepare-commit-msg': {
        name: 'Prepare Commit Message',
        description: '自动添加分支名到提交信息',
        hooks: [
          {
            type: 'prepare-commit-msg',
            enabled: true,
            script: `#!/bin/sh
# Add branch name to commit message

commit_msg_file=$1
commit_source=$2

# Only add branch name if not amending
if [ -z "$commit_source" ]; then
  branch_name=$(git symbolic-ref --short HEAD)
  
  # Extract issue number if exists (e.g., feature/ISSUE-123-description)
  issue_number=$(echo "$branch_name" | grep -oE '[A-Z]+-[0-9]+')
  
  if [ -n "$issue_number" ]; then
    # Prepend issue number to commit message
    sed -i.bak "1s/^/[$issue_number] /" "$commit_msg_file"
    rm -f "$commit_msg_file.bak"
  fi
fi

exit 0`
          }
        ]
      },
      'full-workflow': {
        name: 'Full Workflow',
        description: '完整的工作流 hooks（包含提交验证、代码检查、测试）',
        hooks: [
          {
            type: 'pre-commit',
            enabled: true,
            script: `#!/bin/sh
echo "🔍 运行代码检查..."
npm run lint || exit 1
echo "✅ 代码检查通过"
exit 0`
          },
          {
            type: 'commit-msg',
            enabled: true,
            script: `#!/bin/sh
commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?: .+"
if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "❌ 提交信息格式错误"
  exit 1
fi
exit 0`
          },
          {
            type: 'pre-push',
            enabled: true,
            script: `#!/bin/sh
echo "🧪 运行测试..."
npm run test || exit 1
echo "✅ 测试通过"
exit 0`
          }
        ]
      }
    }
  }

  /**
   * 列出可用的模板
   */
  static listTemplates(): Array<{ name: string; description: string }> {
    const templates = HookManager.getTemplates()
    return Object.entries(templates).map(([key, template]) => ({
      name: key,
      description: template.description
    }))
  }

  /**
   * 获取指定模板
   * @param templateName 模板名称
   */
  static getTemplate(templateName: string): HookTemplate | null {
    const templates = HookManager.getTemplates()
    return templates[templateName] || null
  }

  /**
   * 备份现有的 hooks
   */
  async backupHooks(): Promise<void> {
    const installedHooks = await this.listInstalledHooks()
    const backupDir = path.join(this.hooksDir, '../hooks-backup-' + Date.now())

    await fs.mkdir(backupDir, { recursive: true })

    for (const hookType of installedHooks) {
      const sourcePath = path.join(this.hooksDir, hookType)
      const targetPath = path.join(backupDir, hookType)

      try {
        await fs.copyFile(sourcePath, targetPath)
      } catch (error) {
        console.error(`无法备份 hook: ${hookType}`, error)
      }
    }
  }

  /**
   * 卸载所有 hooks
   */
  async uninstallAllHooks(): Promise<void> {
    const installedHooks = await this.listInstalledHooks()

    for (const hookType of installedHooks) {
      await this.uninstallHook(hookType)
    }
  }
}


