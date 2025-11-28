import { Command } from 'commander'
import inquirer from 'inquirer'
import { BranchManager } from '@ldesign/git-core'
import { BatchOperations } from '@ldesign/git-core/automation'
import * as display from '../utils/display'

export function createBranchCommand(): Command {
  const branch = new Command('branch')
    .description('分支管理命令')

  // 列出所有分支
  branch
    .command('list')
    .alias('ls')
    .description('列出所有分支')
    .option('-r, --remote', '只显示远程分支')
    .option('-a, --all', '显示所有分支（本地+远程）')
    .action(async (options) => {
      const spinner = display.createSpinner('获取分支列表...')
      spinner.start()

      try {
        const manager = new BranchManager()

        let branches: string[]
        if (options.remote) {
          branches = await manager.listRemoteBranches()
        } else if (options.all) {
          branches = await manager.listAllBranches()
        } else {
          const summary = await manager.listBranches()
          branches = summary.all
        }

        spinner.succeed('分支列表')

        const table = display.createTable(['分支名'])
        branches.forEach(branch => {
          table.push([branch])
        })

        console.log(table.toString())
        display.info(`总共 ${branches.length} 个分支`)
      } catch (error: any) {
        spinner.fail('获取分支列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 创建分支
  branch
    .command('create <name>')
    .description('创建新分支')
    .option('-s, --start-point <ref>', '起始点（提交/分支/标签）')
    .option('-c, --checkout', '创建后立即切换到新分支')
    .action(async (name, options) => {
      const spinner = display.createSpinner(`创建分支 ${name}...`)
      spinner.start()

      try {
        const manager = new BranchManager()
        await manager.createBranch(name, options.startPoint)

        if (options.checkout) {
          await manager.checkoutBranch(name)
          spinner.succeed(`创建并切换到分支 ${display.colors.cyan(name)}`)
        } else {
          spinner.succeed(`成功创建分支 ${display.colors.cyan(name)}`)
        }
      } catch (error: any) {
        spinner.fail('创建分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除分支
  branch
    .command('delete <name>')
    .alias('del')
    .description('删除分支')
    .option('-f, --force', '强制删除（即使未合并）')
    .option('-r, --remote', '删除远程分支')
    .action(async (name, options) => {
      // 确认删除
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要删除分支 ${display.colors.yellow(name)} 吗？`,
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消删除')
        return
      }

      const spinner = display.createSpinner(`删除分支 ${name}...`)
      spinner.start()

      try {
        const manager = new BranchManager()

        if (options.remote) {
          await manager.deleteRemoteBranch('origin', name)
          spinner.succeed(`成功删除远程分支 ${display.colors.cyan(name)}`)
        } else {
          await manager.deleteBranch(name, options.force)
          spinner.succeed(`成功删除分支 ${display.colors.cyan(name)}`)
        }
      } catch (error: any) {
        spinner.fail('删除分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 重命名分支
  branch
    .command('rename <oldName> <newName>')
    .description('重命名分支')
    .option('-f, --force', '强制重命名')
    .action(async (oldName, newName, options) => {
      const spinner = display.createSpinner(`重命名分支 ${oldName} -> ${newName}...`)
      spinner.start()

      try {
        const manager = new BranchManager()
        await manager.renameBranch(oldName, newName, options.force)
        spinner.succeed(`成功重命名分支：${display.colors.cyan(oldName)} → ${display.colors.cyan(newName)}`)
      } catch (error: any) {
        spinner.fail('重命名分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 比较分支
  branch
    .command('compare <branch1> <branch2>')
    .description('比较两个分支的差异')
    .action(async (branch1, branch2) => {
      const spinner = display.createSpinner(`比较分支 ${branch1} 和 ${branch2}...`)
      spinner.start()

      try {
        const manager = new BranchManager()
        const comparison = await manager.compareBranches(branch1, branch2)

        spinner.succeed('分支比较')

        display.title(`${branch1} vs ${branch2}`)
        display.keyValue('领先', `${comparison.ahead} 个提交`)
        display.keyValue('落后', `${comparison.behind} 个提交`)

        if (comparison.commits.length > 0) {
          display.newLine()
          display.info(`${branch1} 独有的提交：`)
          comparison.commits.slice(0, 5).forEach(commit => {
            console.log(`  ${display.colors.dim(commit.hash.substring(0, 7))} ${commit.message}`)
          })

          if (comparison.commits.length > 5) {
            display.info(`... 还有 ${comparison.commits.length - 5} 个提交`)
          }
        }
      } catch (error: any) {
        spinner.fail('比较分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清理已合并分支
  branch
    .command('cleanup')
    .description('清理已合并到主分支的分支')
    .option('-t, --target <branch>', '目标分支', 'main')
    .option('--dry-run', '只显示将要删除的分支，不实际删除')
    .action(async (options) => {
      const spinner = display.createSpinner('查找已合并的分支...')
      spinner.start()

      try {
        const manager = new BranchManager()
        const mergedBranches = await manager.getMergedBranches(options.target)

        // 排除主要分支
        const branchesToDelete = mergedBranches.filter(
          branch => !['main', 'master', 'develop', options.target].includes(branch.trim())
        )

        spinner.stop()

        if (branchesToDelete.length === 0) {
          display.info('没有需要清理的分支')
          return
        }

        display.title('已合并的分支')
        display.list(branchesToDelete)

        if (options.dryRun) {
          display.info(`将删除 ${branchesToDelete.length} 个分支（--dry-run 模式）`)
          return
        }

        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: `确定要删除这 ${branchesToDelete.length} 个分支吗？`,
            default: false
          }
        ])

        if (!confirmed) {
          display.info('取消清理')
          return
        }

        const batchSpinner = display.createSpinner('批量删除分支...')
        batchSpinner.start()

        const batch = new BatchOperations()
        const result = await batch.deleteBranches(branchesToDelete)

        batchSpinner.succeed('批量删除完成')

        display.newLine()
        display.success(`成功删除 ${result.succeeded} 个分支`)

        if (result.failed > 0) {
          display.warning(`失败 ${result.failed} 个分支`)
          result.results.filter(r => !r.success).forEach(r => {
            display.error(`  ${r.item}: ${r.error}`)
          })
        }
      } catch (error: any) {
        spinner.fail('清理分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 切换分支
  branch
    .command('checkout <name>')
    .alias('co')
    .description('切换到指定分支')
    .option('-b, --create', '如果分支不存在则创建')
    .action(async (name, options) => {
      const spinner = display.createSpinner(`切换到分支 ${name}...`)
      spinner.start()

      try {
        const manager = new BranchManager()
        await manager.checkoutBranch(name, { createBranch: options.create })
        spinner.succeed(`成功切换到分支 ${display.colors.cyan(name)}`)
      } catch (error: any) {
        spinner.fail('切换分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return branch
}

