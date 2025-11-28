import { Command } from 'commander'
import inquirer from 'inquirer'
import simpleGit from 'simple-git'
import { MergeManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createRebaseCommand(): Command {
  const rebase = new Command('rebase')
    .description('变基和 Cherry-pick 操作')

  // 基础 rebase
  rebase
    .command('start <branch>')
    .description('开始变基到指定分支')
    .option('-i, --interactive', '交互式变基')
    .option('--onto <newbase>', '指定新的基底')
    .action(async (branch, options) => {
      const spinner = display.createSpinner(`变基到 ${branch}...`)
      spinner.start()

      try {
        const manager = new MergeManager()
        
        await manager.rebase(branch, {
          interactive: options.interactive,
          onto: options.onto
        })

        spinner.succeed(`成功变基到 ${display.colors.cyan(branch)}`)
        
        if (options.interactive) {
          display.info('交互式变基已启动，请在编辑器中完成操作')
        }
      } catch (error: any) {
        spinner.fail('变基失败')
        display.error(error.message)
        
        // 检查是否有冲突
        const hasConflicts = error.message.includes('conflict') || 
                            error.message.includes('冲突')
        
        if (hasConflicts) {
          display.newLine()
          display.warning('检测到冲突！')
          display.info('请解决冲突后运行:')
          display.info('  ldesign-git rebase continue  # 继续变基')
          display.info('  ldesign-git rebase skip      # 跳过当前提交')
          display.info('  ldesign-git rebase abort     # 中止变基')
        }
        
        process.exit(1)
      }
    })

  // 继续 rebase
  rebase
    .command('continue')
    .description('解决冲突后继续变基')
    .action(async () => {
      const spinner = display.createSpinner('继续变基...')
      spinner.start()

      try {
        const manager = new MergeManager()
        
        // 检查是否在变基中
        const isRebasing = await manager.isRebasing()
        if (!isRebasing) {
          spinner.fail('当前不在变基过程中')
          display.info('没有需要继续的变基操作')
          return
        }

        // 检查是否还有冲突
        const hasConflicts = await manager.hasConflicts()
        if (hasConflicts) {
          spinner.fail('仍有未解决的冲突')
          display.error('请先解决所有冲突')
          display.info('使用以下命令查看冲突: ldesign-git conflict list')
          process.exit(1)
        }

        // 继续变基
        const git = simpleGit()
        await git.raw(['rebase', '--continue'])

        spinner.succeed('变基已继续')
      } catch (error: any) {
        spinner.fail('继续变基失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 跳过当前提交
  rebase
    .command('skip')
    .description('跳过当前提交并继续变基')
    .action(async () => {
      const spinner = display.createSpinner('跳过当前提交...')
      spinner.start()

      try {
        const manager = new MergeManager()
        
        // 检查是否在变基中
        const isRebasing = await manager.isRebasing()
        if (!isRebasing) {
          spinner.fail('当前不在变基过程中')
          return
        }

        const git = simpleGit()
        await git.raw(['rebase', '--skip'])

        spinner.succeed('已跳过当前提交')
      } catch (error: any) {
        spinner.fail('跳过失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 中止 rebase
  rebase
    .command('abort')
    .description('中止变基操作')
    .action(async () => {
      // 确认中止
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: display.colors.yellow('确定要中止变基吗？所有变更将被撤销。'),
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消中止')
        return
      }

      const spinner = display.createSpinner('中止变基...')
      spinner.start()

      try {
        const manager = new MergeManager()
        
        // 检查是否在变基中
        const isRebasing = await manager.isRebasing()
        if (!isRebasing) {
          spinner.succeed('当前不在变基过程中')
          return
        }

        const git = simpleGit()
        await git.raw(['rebase', '--abort'])

        spinner.succeed('变基已中止')
      } catch (error: any) {
        spinner.fail('中止失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // Cherry-pick
  rebase
    .command('cherry-pick <commit...>')
    .description('Cherry-pick 一个或多个提交')
    .option('--no-commit', '不自动提交')
    .action(async (commits, options) => {
      const commitList = Array.isArray(commits) ? commits : [commits]
      const spinner = display.createSpinner(`Cherry-pick ${commitList.length} 个提交...`)
      spinner.start()

      try {
        const manager = new MergeManager()

        for (const commit of commitList) {
          await manager.cherryPick(commit, {
            noCommit: !options.commit
          })
        }

        spinner.succeed(`成功 cherry-pick ${commitList.length} 个提交`)
        
        commitList.forEach(commit => {
          display.info(`  ✓ ${display.colors.cyan(commit.substring(0, 7))}`)
        })

        if (!options.commit) {
          display.newLine()
          display.info('变更已应用但未提交，请手动提交')
        }
      } catch (error: any) {
        spinner.fail('Cherry-pick 失败')
        display.error(error.message)
        
        // 检查是否有冲突
        const hasConflicts = error.message.includes('conflict') || 
                            error.message.includes('冲突')
        
        if (hasConflicts) {
          display.newLine()
          display.warning('检测到冲突！')
          display.info('请解决冲突后运行:')
          display.info('  ldesign-git cherry-pick-continue   # 继续 cherry-pick')
          display.info('  ldesign-git cherry-pick-abort      # 中止 cherry-pick')
        }
        
        process.exit(1)
      }
    })

  // Cherry-pick 继续
  rebase
    .command('cherry-pick-continue')
    .description('解决冲突后继续 cherry-pick')
    .action(async () => {
      const spinner = display.createSpinner('继续 cherry-pick...')
      spinner.start()

      try {
        const manager = new MergeManager()
        
        // 检查是否在 cherry-pick 中
        const isCherryPicking = await manager.isCherryPicking()
        if (!isCherryPicking) {
          spinner.fail('当前不在 cherry-pick 过程中')
          return
        }

        // 检查是否还有冲突
        const hasConflicts = await manager.hasConflicts()
        if (hasConflicts) {
          spinner.fail('仍有未解决的冲突')
          display.error('请先解决所有冲突')
          process.exit(1)
        }

        const git = simpleGit()
        await git.raw(['cherry-pick', '--continue'])

        spinner.succeed('Cherry-pick 已继续')
      } catch (error: any) {
        spinner.fail('继续 cherry-pick 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // Cherry-pick 中止
  rebase
    .command('cherry-pick-abort')
    .description('中止 cherry-pick 操作')
    .action(async () => {
      const spinner = display.createSpinner('中止 cherry-pick...')
      spinner.start()

      try {
        const manager = new MergeManager()
        
        // 检查是否在 cherry-pick 中
        const isCherryPicking = await manager.isCherryPicking()
        if (!isCherryPicking) {
          spinner.succeed('当前不在 cherry-pick 过程中')
          return
        }

        const git = simpleGit()
        await git.raw(['cherry-pick', '--abort'])

        spinner.succeed('Cherry-pick 已中止')
      } catch (error: any) {
        spinner.fail('中止失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看状态
  rebase
    .command('status')
    .description('查看当前变基或 cherry-pick 状态')
    .action(async () => {
      try {
        const manager = new MergeManager()

        const isRebasing = await manager.isRebasing()
        const isCherryPicking = await manager.isCherryPicking()
        const hasConflicts = await manager.hasConflicts()

        if (!isRebasing && !isCherryPicking) {
          display.info('当前没有进行中的变基或 cherry-pick 操作')
          return
        }

        display.title('操作状态')

        if (isRebasing) {
          display.keyValue('状态', display.colors.cyan('变基中'))
        } else if (isCherryPicking) {
          display.keyValue('状态', display.colors.cyan('Cherry-pick 中'))
        }

        if (hasConflicts) {
          const conflicts = await manager.getConflicts()
          display.keyValue('冲突文件', display.colors.error(conflicts.length.toString()))
          
          display.newLine()
          display.warning('冲突的文件:')
          conflicts.forEach(conflict => {
            console.log(`  ${display.colors.error('✗')} ${conflict.file}`)
          })
        } else {
          display.keyValue('冲突', display.colors.success('无'))
        }

        display.newLine()
        display.info('可用命令:')
        
        if (isRebasing) {
          display.info('  ldesign-git rebase continue  # 继续变基')
          display.info('  ldesign-git rebase skip      # 跳过当前提交')
          display.info('  ldesign-git rebase abort     # 中止变基')
        } else if (isCherryPicking) {
          display.info('  ldesign-git cherry-pick-continue  # 继续 cherry-pick')
          display.info('  ldesign-git cherry-pick-abort     # 中止 cherry-pick')
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  return rebase
}