import { Command } from 'commander'
import inquirer from 'inquirer'
import { StashManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createStashCommand(): Command {
  const stash = new Command('stash')
    .description('暂存区管理命令')

  // 保存到 stash
  stash
    .command('save [message]')
    .alias('push')
    .description('保存当前更改到 stash')
    .option('-u, --include-untracked', '包含未跟踪的文件')
    .option('-a, --all', '包含所有文件（含 ignored）')
    .option('-k, --keep-index', '保持暂存区状态')
    .action(async (message, options) => {
      const spinner = display.createSpinner('保存到 stash...')
      spinner.start()

      try {
        const manager = new StashManager()
        await manager.save({
          message,
          includeUntracked: options.includeUntracked || options.all,
          keepIndex: options.keepIndex
        })

        spinner.succeed('成功保存到 stash')
        if (message) {
          display.info(`消息: ${message}`)
        }
      } catch (error: any) {
        spinner.fail('保存到 stash 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出所有 stash
  stash
    .command('list')
    .alias('ls')
    .description('列出所有 stash')
    .action(async () => {
      const spinner = display.createSpinner('获取 stash 列表...')
      spinner.start()

      try {
        const manager = new StashManager()
        const stashes = await manager.list()

        spinner.succeed('Stash 列表')

        if (stashes.length === 0) {
          display.info('没有保存的 stash')
          return
        }

        display.title('已保存的 Stash')

        const table = display.createTable(['索引', '消息', '日期'])

        stashes.forEach(s => {
          table.push([
            display.colors.cyan(s.index.toString()),
            s.message,
            display.colors.dim(s.date)
          ])
        })

        console.log(table.toString())
        display.info(`总共 ${stashes.length} 个 stash`)
      } catch (error: any) {
        spinner.fail('获取 stash 列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 显示 stash 详情
  stash
    .command('show [index]')
    .description('显示 stash 的详细信息')
    .action(async (index = '0') => {
      const spinner = display.createSpinner(`获取 stash@{${index}} 详情...`)
      spinner.start()

      try {
        const manager = new StashManager()
        const content = await manager.show(parseInt(index))

        spinner.succeed(`Stash@{${index}} 详情`)

        display.title(`Stash@{${index}}`)
        console.log(content)
      } catch (error: any) {
        spinner.fail('获取 stash 详情失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 应用 stash
  stash
    .command('apply [index]')
    .description('应用 stash（不删除）')
    .option('--index', '恢复暂存区状态')
    .action(async (index = '0', options) => {
      const spinner = display.createSpinner(`应用 stash@{${index}}...`)
      spinner.start()

      try {
        const manager = new StashManager()
        
        if (options.index) {
          await manager.applyKeepIndex(parseInt(index))
        } else {
          await manager.apply(parseInt(index))
        }

        spinner.succeed(`成功应用 stash@{${display.colors.cyan(index)}}`)
        display.info('Stash 仍然保留在列表中')
      } catch (error: any) {
        spinner.fail('应用 stash 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 应用并删除 stash
  stash
    .command('pop [index]')
    .description('应用 stash 并删除')
    .action(async (index = '0') => {
      const spinner = display.createSpinner(`弹出 stash@{${index}}...`)
      spinner.start()

      try {
        const manager = new StashManager()
        await manager.pop(parseInt(index))

        spinner.succeed(`成功弹出 stash@{${display.colors.cyan(index)}}`)
        display.info('Stash 已从列表中删除')
      } catch (error: any) {
        spinner.fail('弹出 stash 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除指定 stash
  stash
    .command('drop <index>')
    .description('删除指定的 stash')
    .action(async (index) => {
      // 确认删除
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要删除 stash@{${display.colors.yellow(index)}} 吗？`,
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消删除')
        return
      }

      const spinner = display.createSpinner(`删除 stash@{${index}}...`)
      spinner.start()

      try {
        const manager = new StashManager()
        await manager.drop(parseInt(index))

        spinner.succeed(`成功删除 stash@{${display.colors.cyan(index)}}`)
      } catch (error: any) {
        spinner.fail('删除 stash 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清空所有 stash
  stash
    .command('clear')
    .description('清空所有 stash')
    .action(async () => {
      // 确认清空
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: display.colors.yellow('确定要清空所有 stash 吗？此操作不可恢复！'),
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消清空')
        return
      }

      const spinner = display.createSpinner('清空所有 stash...')
      spinner.start()

      try {
        const manager = new StashManager()
        await manager.clear()

        spinner.succeed('成功清空所有 stash')
      } catch (error: any) {
        spinner.fail('清空 stash 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 从 stash 创建分支
  stash
    .command('branch <branchName> [index]')
    .description('从 stash 创建新分支')
    .action(async (branchName, index = '0') => {
      const spinner = display.createSpinner(`从 stash@{${index}} 创建分支 ${branchName}...`)
      spinner.start()

      try {
        const manager = new StashManager()
        await manager.branch(branchName, parseInt(index))

        spinner.succeed(
          `成功创建分支 ${display.colors.cyan(branchName)} 并应用 stash@{${index}}`
        )
        display.info('Stash 已从列表中删除')
      } catch (error: any) {
        spinner.fail('创建分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 获取 stash 数量
  stash
    .command('count')
    .description('获取 stash 数量')
    .action(async () => {
      try {
        const manager = new StashManager()
        const count = await manager.count()

        display.title('Stash 统计')
        display.keyValue('总数', count)

        if (count > 0) {
          const latest = await manager.getLatest()
          if (latest) {
            display.newLine()
            display.info('最新的 stash:')
            display.keyValue('  索引', latest.index)
            display.keyValue('  消息', latest.message)
            display.keyValue('  日期', latest.date)
          }
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  return stash
}