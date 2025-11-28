import { Command } from 'commander'
import inquirer from 'inquirer'
import { WorkflowAutomation } from '@ldesign/git-core/automation'
import type { WorkflowType } from '@ldesign/git-core/types'
import * as display from '../utils/display'

export function createWorkflowCommand(): Command {
  const workflow = new Command('workflow')
    .description('工作流自动化命令')

  // 初始化工作流
  workflow
    .command('init [type]')
    .description('初始化工作流（git-flow/github-flow/gitlab-flow）')
    .action(async (type?: string) => {
      try {
        // 如果没有提供类型，交互式选择
        let workflowType: WorkflowType

        if (!type) {
          const { selected } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selected',
              message: '选择工作流类型:',
              choices: [
                { name: 'Git Flow - 完整的分支模型（main/develop/feature/release/hotfix）', value: 'git-flow' },
                { name: 'GitHub Flow - 简化的分支模型（main + feature）', value: 'github-flow' },
                { name: 'GitLab Flow - 环境分支模型', value: 'gitlab-flow' }
              ]
            }
          ])
          workflowType = selected
        } else {
          workflowType = type as WorkflowType
        }

        const spinner = display.createSpinner(`初始化 ${workflowType}...`)
        spinner.start()

        const config = WorkflowAutomation.getDefaultConfig(workflowType)
        const wf = new WorkflowAutomation(config)

        if (workflowType === 'git-flow') {
          await wf.initGitFlow()
        }

        spinner.succeed(`成功初始化 ${display.colors.cyan(workflowType)} 工作流`)

        display.newLine()
        display.box(
          `工作流配置:\n` +
          `- 主分支: ${config.branches.main}\n` +
          (config.branches.develop ? `- 开发分支: ${config.branches.develop}\n` : '') +
          `- 功能分支前缀: ${config.prefixes?.feature}\n` +
          (config.prefixes?.release ? `- 发布分支前缀: ${config.prefixes.release}\n` : '') +
          (config.prefixes?.hotfix ? `- 热修复分支前缀: ${config.prefixes.hotfix}` : ''),
          { title: '配置信息', type: 'success' }
        )
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 功能分支命令
  const feature = workflow
    .command('feature')
    .description('功能分支管理')

  feature
    .command('start <name>')
    .description('开始新功能开发')
    .option('-b, --base <branch>', '基础分支', 'develop')
    .option('-p, --push', '推送到远程')
    .action(async (name, options) => {
      const spinner = display.createSpinner(`创建功能分支 ${name}...`)
      spinner.start()

      try {
        const config = WorkflowAutomation.getDefaultConfig('git-flow')
        const wf = new WorkflowAutomation(config)

        const featureBranch = await wf.startFeature({
          name,
          baseBranch: options.base,
          push: options.push
        })

        spinner.succeed(`成功创建功能分支 ${display.colors.cyan(featureBranch)}`)

        display.newLine()
        display.info('现在可以开始开发新功能了！')
        display.info(`完成后使用: ${display.colors.cyan(`ldesign-git workflow feature finish ${name}`)}`)
      } catch (error: any) {
        spinner.fail('创建功能分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  feature
    .command('finish <name>')
    .description('完成功能开发并合并')
    .option('--no-delete', '不删除功能分支')
    .action(async (name, options) => {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要完成功能 ${display.colors.yellow(name)} 并合并到 develop 吗？`,
          default: true
        }
      ])

      if (!confirmed) {
        display.info('取消操作')
        return
      }

      const spinner = display.createSpinner(`完成功能分支 ${name}...`)
      spinner.start()

      try {
        const config = WorkflowAutomation.getDefaultConfig('git-flow')
        const wf = new WorkflowAutomation(config)

        await wf.finishFeature(name, options.delete !== false)

        spinner.succeed(`成功完成功能 ${display.colors.cyan(name)}`)

        display.newLine()
        display.success('功能已合并到 develop 分支')
        if (options.delete !== false) {
          display.info('功能分支已删除')
        }
      } catch (error: any) {
        spinner.fail('完成功能失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 发布分支命令
  const release = workflow
    .command('release')
    .description('发布分支管理')

  release
    .command('start <version>')
    .description('开始新版本发布')
    .option('-b, --base <branch>', '基础分支', 'develop')
    .option('-p, --push', '推送到远程')
    .action(async (version, options) => {
      const spinner = display.createSpinner(`创建发布分支 ${version}...`)
      spinner.start()

      try {
        const config = WorkflowAutomation.getDefaultConfig('git-flow')
        const wf = new WorkflowAutomation(config)

        const releaseBranch = await wf.startRelease({
          version,
          baseBranch: options.base,
          push: options.push
        })

        spinner.succeed(`成功创建发布分支 ${display.colors.cyan(releaseBranch)}`)

        display.newLine()
        display.box(
          `发布分支已创建！\n\n` +
          `接下来的步骤:\n` +
          `1. 更新版本号和 CHANGELOG\n` +
          `2. 进行测试和 bug 修复\n` +
          `3. 完成发布: ${display.colors.cyan(`ldesign-git workflow release finish ${version}`)}`,
          { title: '发布流程', type: 'info' }
        )
      } catch (error: any) {
        spinner.fail('创建发布分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  release
    .command('finish <version>')
    .description('完成版本发布')
    .option('--no-delete', '不删除发布分支')
    .option('--no-tag', '不创建标签')
    .action(async (version, options) => {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要完成版本 ${display.colors.yellow(version)} 的发布吗？\n  这将合并到 main 和 develop 分支`,
          default: true
        }
      ])

      if (!confirmed) {
        display.info('取消发布')
        return
      }

      const spinner = display.createSpinner(`完成发布 ${version}...`)
      spinner.start()

      try {
        const config = WorkflowAutomation.getDefaultConfig('git-flow')
        config.versionTag!.enabled = options.tag !== false
        const wf = new WorkflowAutomation(config)

        await wf.finishRelease(version, options.delete !== false)

        spinner.succeed(`成功发布版本 ${display.colors.cyan(version)}`)

        display.newLine()
        display.box(
          `版本 ${version} 已发布！\n\n` +
          `✓ 已合并到 main 分支\n` +
          `✓ 已合并到 develop 分支\n` +
          (options.tag !== false ? `✓ 已创建标签 v${version}\n` : '') +
          (options.delete !== false ? `✓ 已删除发布分支` : ''),
          { title: '发布完成', type: 'success' }
        )
      } catch (error: any) {
        spinner.fail('完成发布失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 热修复分支命令
  const hotfix = workflow
    .command('hotfix')
    .description('热修复分支管理')

  hotfix
    .command('start <name>')
    .description('开始热修复')
    .option('-b, --base <branch>', '基础分支', 'main')
    .option('-p, --push', '推送到远程')
    .action(async (name, options) => {
      const spinner = display.createSpinner(`创建热修复分支 ${name}...`)
      spinner.start()

      try {
        const config = WorkflowAutomation.getDefaultConfig('git-flow')
        const wf = new WorkflowAutomation(config)

        const hotfixBranch = await wf.startHotfix({
          name,
          baseBranch: options.base,
          push: options.push
        })

        spinner.succeed(`成功创建热修复分支 ${display.colors.cyan(hotfixBranch)}`)

        display.newLine()
        display.warning('⚠️  这是一个紧急修复，请尽快修复并发布')
        display.info(`完成后使用: ${display.colors.cyan(`ldesign-git workflow hotfix finish ${name}`)}`)
      } catch (error: any) {
        spinner.fail('创建热修复分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  hotfix
    .command('finish <name>')
    .description('完成热修复')
    .option('-v, --version <version>', '版本号')
    .option('--no-delete', '不删除热修复分支')
    .option('--no-tag', '不创建标签')
    .action(async (name, options) => {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要完成热修复 ${display.colors.yellow(name)} 吗？`,
          default: true
        }
      ])

      if (!confirmed) {
        display.info('取消操作')
        return
      }

      const spinner = display.createSpinner(`完成热修复 ${name}...`)
      spinner.start()

      try {
        const config = WorkflowAutomation.getDefaultConfig('git-flow')
        config.versionTag!.enabled = options.tag !== false
        const wf = new WorkflowAutomation(config)

        await wf.finishHotfix(name, options.version, options.delete !== false)

        spinner.succeed(`成功完成热修复 ${display.colors.cyan(name)}`)

        display.newLine()
        display.success('热修复已合并到 main 和 develop 分支')
        if (options.version && options.tag !== false) {
          display.info(`已创建标签 v${options.version}`)
        }
      } catch (error: any) {
        spinner.fail('完成热修复失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return workflow
}


