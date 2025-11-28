import { Command } from 'commander'
import inquirer from 'inquirer'
import { HookManager } from '@ldesign/git-core/hooks'
import type { HookType } from '@ldesign/git-core/types'
import * as display from '../utils/display'

export function createHooksCommand(): Command {
  const hooks = new Command('hooks')
    .description('Git Hooks 管理命令')

  // 列出已安装的 hooks
  hooks
    .command('list')
    .alias('ls')
    .description('列出已安装的 hooks')
    .action(async () => {
      const spinner = display.createSpinner('获取 hooks 列表...')
      spinner.start()

      try {
        const manager = new HookManager()
        const installedHooks = await manager.listInstalledHooks()

        spinner.stop()

        if (installedHooks.length === 0) {
          display.info('暂无已安装的 hooks')
          display.newLine()
          display.info(`使用 ${display.colors.cyan('ldesign-git hooks templates')} 查看可用的模板`)
          return
        }

        display.title('已安装的 Hooks')

        const table = display.createTable(['Hook 类型', '状态'])

        for (const hookType of installedHooks) {
          const enabled = await manager.isHookEnabled(hookType)
          const status = enabled
            ? display.colors.success('✓ 启用')
            : display.colors.dim('✗ 禁用')

          table.push([hookType, status])
        }

        console.log(table.toString())
        display.info(`总共 ${installedHooks.length} 个 hooks`)
      } catch (error: any) {
        spinner.fail('获取 hooks 列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出模板
  hooks
    .command('templates')
    .description('列出可用的 hook 模板')
    .action(async () => {
      display.title('可用的 Hook 模板')

      const templates = HookManager.listTemplates()

      const table = display.createTable(['模板名称', '描述'])

      templates.forEach(template => {
        table.push([
          display.colors.cyan(template.name),
          template.description
        ])
      })

      console.log(table.toString())

      display.newLine()
      display.info(`使用 ${display.colors.cyan('ldesign-git hooks install <template>')} 安装模板`)
    })

  // 安装 hook 模板
  hooks
    .command('install <template>')
    .description('从模板安装 hooks')
    .action(async (templateName) => {
      try {
        const template = HookManager.getTemplate(templateName)

        if (!template) {
          display.error(`模板 ${templateName} 不存在`)
          display.info(`使用 ${display.colors.cyan('ldesign-git hooks templates')} 查看可用模板`)
          process.exit(1)
        }

        display.title(`安装模板: ${template.name}`)
        display.info(template.description)

        display.newLine()
        display.info('将安装以下 hooks:')
        display.list(template.hooks.map(h => h.type))

        display.newLine()
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: '确定要安装这些 hooks 吗？',
            default: true
          }
        ])

        if (!confirmed) {
          display.info('取消安装')
          return
        }

        const spinner = display.createSpinner('安装 hooks...')
        spinner.start()

        const manager = new HookManager()
        await manager.installFromTemplate(template)

        spinner.succeed('Hooks 安装成功')

        display.box(
          `已安装 ${template.hooks.length} 个 hooks\n\n` +
          `模板: ${template.name}\n` +
          `描述: ${template.description}`,
          { title: '安装完成', type: 'success' }
        )
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 启用 hook
  hooks
    .command('enable <type>')
    .description('启用指定的 hook')
    .action(async (type: HookType) => {
      const spinner = display.createSpinner(`启用 hook ${type}...`)
      spinner.start()

      try {
        const manager = new HookManager()

        const exists = await manager.hookExists(type)
        if (!exists) {
          spinner.fail('Hook 不存在')
          display.error(`Hook ${type} 未安装`)
          display.info('请先安装 hook 或使用模板安装')
          process.exit(1)
        }

        await manager.enableHook(type)
        spinner.succeed(`成功启用 hook ${display.colors.cyan(type)}`)
      } catch (error: any) {
        spinner.fail('启用 hook 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 禁用 hook
  hooks
    .command('disable <type>')
    .description('禁用指定的 hook')
    .action(async (type: HookType) => {
      const spinner = display.createSpinner(`禁用 hook ${type}...`)
      spinner.start()

      try {
        const manager = new HookManager()
        await manager.disableHook(type)
        spinner.succeed(`成功禁用 hook ${display.colors.cyan(type)}`)
      } catch (error: any) {
        spinner.fail('禁用 hook 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 卸载 hook
  hooks
    .command('uninstall <type>')
    .description('卸载指定的 hook')
    .action(async (type: HookType) => {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要卸载 hook ${display.colors.yellow(type)} 吗？`,
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消卸载')
        return
      }

      const spinner = display.createSpinner(`卸载 hook ${type}...`)
      spinner.start()

      try {
        const manager = new HookManager()
        await manager.uninstallHook(type)
        spinner.succeed(`成功卸载 hook ${display.colors.cyan(type)}`)
      } catch (error: any) {
        spinner.fail('卸载 hook 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看 hook 内容
  hooks
    .command('show <type>')
    .description('查看 hook 的内容')
    .action(async (type: HookType) => {
      try {
        const manager = new HookManager()
        const content = await manager.getHookContent(type)

        if (!content) {
          display.error(`Hook ${type} 不存在或无法读取`)
          process.exit(1)
        }

        display.title(`Hook 内容: ${type}`)
        display.separator()
        console.log(content)
        display.separator()
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 备份 hooks
  hooks
    .command('backup')
    .description('备份现有的 hooks')
    .action(async () => {
      const spinner = display.createSpinner('备份 hooks...')
      spinner.start()

      try {
        const manager = new HookManager()
        await manager.backupHooks()
        spinner.succeed('Hooks 备份完成')
        display.info('备份位置: .git/hooks-backup-{timestamp}')
      } catch (error: any) {
        spinner.fail('备份失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 卸载所有 hooks
  hooks
    .command('uninstall-all')
    .description('卸载所有 hooks')
    .action(async () => {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: display.colors.warning('⚠️  确定要卸载所有 hooks 吗？此操作不可恢复！'),
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消卸载')
        return
      }

      const spinner = display.createSpinner('卸载所有 hooks...')
      spinner.start()

      try {
        const manager = new HookManager()
        await manager.uninstallAllHooks()
        spinner.succeed('所有 hooks 已卸载')
        display.warning('建议在卸载前先备份')
      } catch (error: any) {
        spinner.fail('卸载失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return hooks
}


