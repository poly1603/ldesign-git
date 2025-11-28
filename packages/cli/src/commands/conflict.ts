import { Command } from 'commander'
import inquirer from 'inquirer'
import * as fs from 'fs/promises'
import { ConflictResolver } from '@ldesign/git-core/conflict'
import * as display from '../utils/display'

export function createConflictCommand(): Command {
  const conflict = new Command('conflict')
    .description('冲突解决命令')

  // 列出冲突
  conflict
    .command('list')
    .alias('ls')
    .description('列出所有冲突文件')
    .action(async () => {
      const spinner = display.createSpinner('检测冲突...')
      spinner.start()

      try {
        const resolver = new ConflictResolver()
        const conflicts = await resolver.detectConflicts()

        spinner.stop()

        if (conflicts.length === 0) {
          display.success('没有检测到冲突')
          return
        }

        display.title(`发现 ${conflicts.length} 个冲突文件`)

        const table = display.createTable(['文件', '状态'])

        conflicts.forEach(conflict => {
          let statusText = conflict.status
          if (conflict.status === 'both-modified') {
            statusText = display.colors.warning('双方都修改')
          }

          table.push([conflict.file, statusText])
        })

        console.log(table.toString())

        display.newLine()
        display.info(`使用 ${display.colors.cyan('ldesign-git conflict resolve')} 进行交互式解决`)
      } catch (error: any) {
        spinner.fail('检测冲突失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 交互式解决冲突
  conflict
    .command('resolve')
    .description('交互式解决冲突')
    .action(async () => {
      try {
        const resolver = new ConflictResolver()
        const conflicts = await resolver.detectConflicts()

        if (conflicts.length === 0) {
          display.success('没有检测到冲突')
          return
        }

        display.title(`检测到 ${conflicts.length} 个冲突文件`)

        for (const conflict of conflicts) {
          display.newLine()
          display.separator()
          display.info(`文件: ${display.colors.cyan(conflict.file)}`)

          // 尝试解析冲突标记
          try {
            const parsed = await resolver.parseConflictMarkers(conflict.file)
            if (parsed.hasConflicts) {
              display.warning(`包含 ${parsed.conflicts.length} 个冲突区域`)
            }
          } catch (error) {
            // 解析失败，继续
          }

          const { strategy } = await inquirer.prompt([
            {
              type: 'list',
              name: 'strategy',
              message: '选择解决策略:',
              choices: [
                { name: '使用我们的版本 (ours)', value: 'ours' },
                { name: '使用他们的版本 (theirs)', value: 'theirs' },
                { name: '手动解决后标记 (manual)', value: 'manual' },
                { name: '跳过此文件', value: 'skip' }
              ]
            }
          ])

          if (strategy === 'skip') {
            display.info('跳过此文件')
            continue
          }

          const resolveSpinner = display.createSpinner('解决冲突...')
          resolveSpinner.start()

          if (strategy === 'ours') {
            await resolver.resolveWithOurs(conflict.file)
            resolveSpinner.succeed(`使用我们的版本解决: ${conflict.file}`)
          } else if (strategy === 'theirs') {
            await resolver.resolveWithTheirs(conflict.file)
            resolveSpinner.succeed(`使用他们的版本解决: ${conflict.file}`)
          } else if (strategy === 'manual') {
            resolveSpinner.info('请手动编辑文件解决冲突，然后按回车继续...')

            await inquirer.prompt([
              {
                type: 'confirm',
                name: 'done',
                message: '已手动解决冲突？',
                default: true
              }
            ])

            await resolver.markAsResolved(conflict.file)
            display.success(`标记为已解决: ${conflict.file}`)
          }
        }

        // 检查是否还有冲突
        const remainingConflicts = await resolver.detectConflicts()

        display.newLine()
        display.separator()

        if (remainingConflicts.length === 0) {
          display.box(
            '所有冲突已解决！\n\n' +
            '下一步:\n' +
            '1. 检查解决结果\n' +
            '2. 继续操作（merge/rebase/cherry-pick）',
            { title: '冲突解决完成', type: 'success' }
          )

          const operation = await resolver.getCurrentOperation()
          if (operation) {
            const { shouldContinue } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'shouldContinue',
                message: `是否继续 ${operation} 操作？`,
                default: true
              }
            ])

            if (shouldContinue) {
              const continueSpinner = display.createSpinner(`继续 ${operation}...`)
              continueSpinner.start()

              await resolver.continueCurrentOperation()
              continueSpinner.succeed(`${operation} 操作已完成`)
            }
          }
        } else {
          display.warning(`还有 ${remainingConflicts.length} 个冲突未解决`)
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 中止当前操作
  conflict
    .command('abort')
    .description('中止当前的合并/变基/cherry-pick 操作')
    .action(async () => {
      try {
        const resolver = new ConflictResolver()
        const operation = await resolver.getCurrentOperation()

        if (!operation) {
          display.info('当前没有正在进行的操作')
          return
        }

        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: `确定要中止 ${display.colors.yellow(operation)} 操作吗？`,
            default: false
          }
        ])

        if (!confirmed) {
          display.info('取消中止')
          return
        }

        const spinner = display.createSpinner(`中止 ${operation}...`)
        spinner.start()

        await resolver.abortCurrentOperation()

        spinner.succeed(`已中止 ${display.colors.cyan(operation)} 操作`)
        display.warning('工作区已恢复到操作前的状态')
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 冲突报告
  conflict
    .command('report')
    .description('生成冲突报告')
    .option('-o, --output <file>', '输出文件路径')
    .action(async (options) => {
      const spinner = display.createSpinner('生成冲突报告...')
      spinner.start()

      try {
        const resolver = new ConflictResolver()
        const report = await resolver.generateConflictReport()

        spinner.succeed('冲突报告生成完成')

        if (options.output) {
          await fs.writeFile(options.output, report, 'utf-8')
          display.success(`报告已保存到: ${display.colors.cyan(options.output)}`)
        } else {
          display.newLine()
          console.log(report)
        }
      } catch (error: any) {
        spinner.fail('生成报告失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 批量解决冲突
  conflict
    .command('resolve-all')
    .description('批量解决所有冲突')
    .option('--ours', '全部使用我们的版本')
    .option('--theirs', '全部使用他们的版本')
    .action(async (options) => {
      if (!options.ours && !options.theirs) {
        display.error('请指定 --ours 或 --theirs 策略')
        process.exit(1)
      }

      try {
        const resolver = new ConflictResolver()
        const conflicts = await resolver.getConflictedFiles()

        if (conflicts.length === 0) {
          display.success('没有检测到冲突')
          return
        }

        const strategy = options.ours ? 'ours' : 'theirs'
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: `确定要使用 ${display.colors.yellow(strategy)} 策略解决所有 ${conflicts.length} 个冲突吗？`,
            default: false
          }
        ])

        if (!confirmed) {
          display.info('取消操作')
          return
        }

        const spinner = display.createSpinner('批量解决冲突...')
        spinner.start()

        if (options.ours) {
          await resolver.batchResolveWithOurs(conflicts)
        } else {
          await resolver.batchResolveWithTheirs(conflicts)
        }

        spinner.succeed(`成功解决 ${conflicts.length} 个冲突`)

        display.box(
          `所有冲突已使用 ${strategy} 策略解决\n\n` +
          `请检查解决结果并继续操作`,
          { title: '批量解决完成', type: 'success' }
        )
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  return conflict
}

