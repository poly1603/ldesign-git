import { Command } from 'commander'
import inquirer from 'inquirer'
import { WorktreeManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createWorktreeCommand(): Command {
  const worktree = new Command('worktree')
    .description('Git 工作树管理命令')

  // 列出所有工作树
  worktree
    .command('list')
    .alias('ls')
    .description('列出所有工作树')
    .action(async () => {
      const spinner = display.createSpinner('获取工作树列表...')
      spinner.start()

      try {
        const manager = new WorktreeManager()
        const worktrees = await manager.list()

        spinner.succeed('工作树列表')

        if (worktrees.length === 0) {
          display.info('没有额外的工作树')
          return
        }

        display.title('Git 工作树')

        const table = display.createTable(['路径', '分支', '提交', '状态'])

        worktrees.forEach(wt => {
          const statusFlags = []
          if (wt.isPrimary) statusFlags.push('主')
          if (wt.locked) statusFlags.push('锁定')
          if (wt.isBare) statusFlags.push('裸仓库')
          
          const status = statusFlags.length > 0 ? statusFlags.join(', ') : '-'

          table.push([
            wt.path,
            display.colors.cyan(wt.branch),
            display.colors.dim(wt.commit.substring(0, 7)),
            status
          ])
        })

        console.log(table.toString())
        display.info(`总共 ${worktrees.length} 个工作树`)
      } catch (error: any) {
        spinner.fail('获取工作树列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 添加工作树
  worktree
    .command('add <path> [branch]')
    .description('添加新的工作树')
    .option('-b, --new-branch', '创建新分支')
    .option('-f, --force', '强制添加')
    .option('--detach', '分离 HEAD')
    .action(async (path, branch, options) => {
      const spinner = display.createSpinner(`添加工作树 ${path}...`)
      spinner.start()

      try {
        const manager = new WorktreeManager()
        
        await manager.add(path, branch, {
          force: options.force,
          detach: options.detach,
          checkout: branch
        })

        spinner.succeed(`成功添加工作树 ${display.colors.cyan(path)}`)
        if (branch) {
          display.keyValue('分支', branch)
        }
      } catch (error: any) {
        spinner.fail('添加工作树失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除工作树
  worktree
    .command('remove <path>')
    .alias('rm')
    .description('删除工作树')
    .option('-f, --force', '强制删除')
    .action(async (path, options) => {
      // 确认删除
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要删除工作树 ${display.colors.yellow(path)} 吗？`,
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消删除')
        return
      }

      const spinner = display.createSpinner(`删除工作树 ${path}...`)
      spinner.start()

      try {
        const manager = new WorktreeManager()
        await manager.remove(path, options.force)

        spinner.succeed(`成功删除工作树 ${display.colors.cyan(path)}`)
      } catch (error: any) {
        spinner.fail('删除工作树失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 移动工作树
  worktree
    .command('move <oldPath> <newPath>')
    .alias('mv')
    .description('移动工作树到新位置')
    .action(async (oldPath, newPath) => {
      const spinner = display.createSpinner(`移动工作树 ${oldPath} -> ${newPath}...`)
      spinner.start()

      try {
        const manager = new WorktreeManager()
        await manager.move(oldPath, newPath)

        spinner.succeed(
          `成功移动工作树：${display.colors.cyan(oldPath)} → ${display.colors.cyan(newPath)}`
        )
      } catch (error: any) {
        spinner.fail('移动工作树失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 锁定工作树
  worktree
    .command('lock <path> [reason]')
    .description('锁定工作树')
    .action(async (path, reason) => {
      const spinner = display.createSpinner(`锁定工作树 ${path}...`)
      spinner.start()

      try {
        const manager = new WorktreeManager()
        await manager.lock(path, reason)

        spinner.succeed(`成功锁定工作树 ${display.colors.cyan(path)}`)
        if (reason) {
          display.keyValue('原因', reason)
        }
      } catch (error: any) {
        spinner.fail('锁定工作树失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 解锁工作树
  worktree
    .command('unlock <path>')
    .description('解锁工作树')
    .action(async (path) => {
      const spinner = display.createSpinner(`解锁工作树 ${path}...`)
      spinner.start()

      try {
        const manager = new WorktreeManager()
        await manager.unlock(path)

        spinner.succeed(`成功解锁工作树 ${display.colors.cyan(path)}`)
      } catch (error: any) {
        spinner.fail('解锁工作树失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清理工作树
  worktree
    .command('prune')
    .description('清理已删除的工作树')
    .action(async () => {
      const spinner = display.createSpinner('清理工作树...')
      spinner.start()

      try {
        const manager = new WorktreeManager()
        await manager.prune()

        spinner.succeed('成功清理工作树')
      } catch (error: any) {
        spinner.fail('清理工作树失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return worktree
}