import { Command } from 'commander'
import inquirer from 'inquirer'
import { CleanupManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createCleanupCommand(): Command {
  const cleanup = new Command('cleanup')
    .description('Git 仓库清理')

  // 清理已合并分支
  cleanup
    .command('branches')
    .alias('br')
    .description('清理已合并的分支')
    .option('-n, --dry-run', '仅预览，不实际删除')
    .option('-p, --protect <branches>', '保护的分支（逗号分隔）')
    .option('--stale', '清理远程已删除的本地分支')
    .action(async (options) => {
      const spinner = display.createSpinner('分析分支...')
      spinner.start()

      try {
        const manager = new CleanupManager()
        const protect = options.protect?.split(',').map((b: string) => b.trim()) || []

        if (options.stale) {
          const result = await manager.cleanupStaleBranches('origin', { dryRun: options.dryRun })
          
          if (result.count === 0) {
            spinner.succeed('没有过期的分支')
            return
          }

          if (options.dryRun) {
            spinner.succeed(`将删除 ${result.count} 个过期分支`)
            display.list(result.items)
          } else {
            spinner.succeed(`已删除 ${result.count} 个过期分支`)
          }
        } else {
          const result = await manager.cleanupMergedBranches({ 
            dryRun: options.dryRun,
            protect 
          })

          if (result.count === 0) {
            spinner.succeed('没有可清理的已合并分支')
            return
          }

          if (options.dryRun) {
            spinner.succeed(`将删除 ${result.count} 个已合并分支`)
            display.list(result.items)
            display.newLine()
            display.info('运行不带 --dry-run 以实际删除')
          } else {
            spinner.succeed(`已删除 ${result.count} 个已合并分支`)
            display.list(result.items)
          }
        }
      } catch (error: any) {
        spinner.fail('清理失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清理远程跟踪
  cleanup
    .command('remote [name]')
    .description('清理远程跟踪分支')
    .action(async (name = 'origin') => {
      const spinner = display.createSpinner(`清理远程 ${name}...`)
      spinner.start()

      try {
        const manager = new CleanupManager()
        const result = await manager.pruneRemote(name)

        if (result.count > 0) {
          spinner.succeed(`清理了 ${result.count} 个远程跟踪分支`)
        } else {
          spinner.succeed('远程跟踪分支已是最新')
        }
      } catch (error: any) {
        spinner.fail('清理失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // Git GC
  cleanup
    .command('gc')
    .description('运行 Git 垃圾回收')
    .option('--aggressive', '深度清理（更慢但更彻底）')
    .option('--prune <date>', '清理指定日期之前的对象', 'now')
    .action(async (options) => {
      const spinner = display.createSpinner('运行垃圾回收...')
      spinner.start()

      try {
        const manager = new CleanupManager()
        const result = await manager.gc({
          aggressive: options.aggressive,
          prune: options.prune
        })

        spinner.succeed('垃圾回收完成')
        
        if (result.freed && result.freed > 0) {
          display.success(`释放了 ${manager.formatSize(result.freed)} 空间`)
        }
      } catch (error: any) {
        spinner.fail('垃圾回收失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清理 stash
  cleanup
    .command('stash')
    .description('清理旧的 stash')
    .option('-k, --keep <n>', '保留的 stash 数量', '10')
    .action(async (options) => {
      const spinner = display.createSpinner('清理 stash...')
      spinner.start()

      try {
        const manager = new CleanupManager()
        const keep = parseInt(options.keep) || 10
        const result = await manager.cleanupStash({ keep })

        if (result.count === 0) {
          spinner.succeed('没有需要清理的 stash')
        } else {
          spinner.succeed(`清理了 ${result.count} 个旧 stash`)
        }
      } catch (error: any) {
        spinner.fail('清理失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清理未跟踪文件
  cleanup
    .command('untracked')
    .description('清理未跟踪的文件')
    .option('-n, --dry-run', '仅预览')
    .option('-d, --directories', '包含目录')
    .option('-x, --ignored', '包含被忽略的文件')
    .action(async (options) => {
      try {
        const manager = new CleanupManager()

        // 先预览
        const preview = await manager.cleanUntracked({
          directories: options.directories,
          ignored: options.ignored,
          dryRun: true
        })

        if (preview.count === 0) {
          display.success('没有未跟踪的文件')
          return
        }

        display.title('将删除以下文件')
        for (const file of preview.items.slice(0, 20)) {
          console.log(`  ${display.colors.dim('•')} ${file}`)
        }
        if (preview.items.length > 20) {
          display.info(`... 还有 ${preview.items.length - 20} 个文件`)
        }

        if (options.dryRun) {
          display.newLine()
          display.info('运行不带 --dry-run 以实际删除')
          return
        }

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: display.colors.error(`确定要删除 ${preview.count} 个文件？`),
            default: false
          }
        ])

        if (!confirm) {
          display.info('操作已取消')
          return
        }

        const spinner = display.createSpinner('清理文件...')
        spinner.start()

        const result = await manager.cleanUntracked({
          directories: options.directories,
          ignored: options.ignored,
          force: true
        })

        spinner.succeed(`已删除 ${result.count} 个文件`)
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 完整清理
  cleanup
    .command('all')
    .description('运行完整清理')
    .option('--aggressive', '深度清理')
    .option('--stash', '包含 stash 清理')
    .action(async (options) => {
      try {
        const manager = new CleanupManager()

        // 预览
        display.title('清理预览')
        const preview = await manager.preview()
        
        display.keyValue('已合并分支', preview.mergedBranches.length)
        display.keyValue('过期分支', preview.staleBranches.length)
        display.keyValue('Stash 数量', preview.stashCount)
        display.keyValue('.git 目录大小', manager.formatSize(preview.gitDirSize))

        if (preview.mergedBranches.length > 0) {
          display.newLine()
          display.info('将删除的分支:')
          display.list(preview.mergedBranches.slice(0, 5))
          if (preview.mergedBranches.length > 5) {
            console.log(display.colors.dim(`... 还有 ${preview.mergedBranches.length - 5} 个`))
          }
        }

        display.newLine()
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: '确定要运行完整清理？',
            default: true
          }
        ])

        if (!confirm) {
          display.info('操作已取消')
          return
        }

        const spinner = display.createSpinner('运行完整清理...')
        spinner.start()

        const results = await manager.fullCleanup({
          stash: options.stash,
          aggressive: options.aggressive
        })

        spinner.succeed('清理完成')

        display.newLine()
        for (const r of results) {
          if (r.count > 0 || (r.freed && r.freed > 0)) {
            let msg = `${r.type}: ${r.count} 项`
            if (r.freed && r.freed > 0) {
              msg += ` (释放 ${manager.formatSize(r.freed)})`
            }
            display.success(msg)
          }
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 预览
  cleanup
    .command('preview')
    .description('预览可清理的内容')
    .action(async () => {
      const spinner = display.createSpinner('分析仓库...')
      spinner.start()

      try {
        const manager = new CleanupManager()
        const preview = await manager.preview()

        spinner.succeed('清理预览')

        display.keyValue('已合并分支', preview.mergedBranches.length)
        display.keyValue('过期分支', preview.staleBranches.length)
        display.keyValue('Stash 数量', preview.stashCount)
        display.keyValue('.git 目录大小', manager.formatSize(preview.gitDirSize))

        if (preview.mergedBranches.length > 0) {
          display.newLine()
          display.title('已合并分支')
          display.list(preview.mergedBranches)
        }

        if (preview.staleBranches.length > 0) {
          display.newLine()
          display.title('过期分支')
          display.list(preview.staleBranches)
        }
      } catch (error: any) {
        spinner.fail('分析失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return cleanup
}
