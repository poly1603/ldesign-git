import { Command } from 'commander'
import { BisectManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createBisectCommand(): Command {
  const bisect = new Command('bisect')
    .description('Git 二分查找 - 定位问题提交')

  // 开始二分查找
  bisect
    .command('start <bad> <good>')
    .description('开始二分查找')
    .action(async (bad: string, good: string) => {
      const spinner = display.createSpinner('开始二分查找...')
      spinner.start()

      try {
        const manager = new BisectManager()
        await manager.start(bad, good)

        spinner.succeed('二分查找已开始')
        display.box(
          `坏提交: ${bad}\n好提交: ${good}\n\n请测试当前版本，然后使用:\n• ldesign-git bisect good  - 如果当前版本正常\n• ldesign-git bisect bad   - 如果当前版本有问题\n• ldesign-git bisect skip  - 如果无法测试当前版本`,
          { title: 'Bisect 已启动', type: 'info' }
        )
      } catch (error: any) {
        spinner.fail('开始二分查找失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 标记为好
  bisect
    .command('good')
    .description('标记当前提交为好的（没有问题）')
    .action(async () => {
      const spinner = display.createSpinner('标记为好...')
      spinner.start()

      try {
        const manager = new BisectManager()
        await manager.markGood()

        spinner.succeed('已标记为好的提交')
        display.info('继续测试下一个提交...')
      } catch (error: any) {
        spinner.fail('标记失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 标记为坏
  bisect
    .command('bad')
    .description('标记当前提交为坏的（有问题）')
    .action(async () => {
      const spinner = display.createSpinner('标记为坏...')
      spinner.start()

      try {
        const manager = new BisectManager()
        await manager.markBad()

        spinner.succeed('已标记为坏的提交')
        display.info('继续测试下一个提交...')
      } catch (error: any) {
        spinner.fail('标记失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 跳过当前提交
  bisect
    .command('skip')
    .description('跳过当前提交（无法测试）')
    .action(async () => {
      const spinner = display.createSpinner('跳过当前提交...')
      spinner.start()

      try {
        const manager = new BisectManager()
        await manager.skip()

        spinner.succeed('已跳过当前提交')
        display.info('继续测试下一个提交...')
      } catch (error: any) {
        spinner.fail('跳过失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 重置二分查找
  bisect
    .command('reset')
    .description('重置二分查找，返回原始状态')
    .action(async () => {
      const spinner = display.createSpinner('重置二分查找...')
      spinner.start()

      try {
        const manager = new BisectManager()
        await manager.reset()

        spinner.succeed('二分查找已重置')
        display.info('已返回原始分支')
      } catch (error: any) {
        spinner.fail('重置失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 自动运行测试
  bisect
    .command('run <command>')
    .description('自动运行测试命令进行二分查找')
    .action(async (command: string) => {
      const spinner = display.createSpinner(`运行自动测试: ${command}`)
      spinner.start()

      try {
        const manager = new BisectManager()
        const result = await manager.run(command)

        spinner.succeed('找到问题提交！')

        display.newLine()
        display.title('问题提交')

        const table = display.createTable(['属性', '值'])
        table.push(['提交', display.colors.error(result.commit.substring(0, 12))])
        table.push(['信息', result.message])
        table.push(['作者', result.author])
        table.push(['时间', result.date.toLocaleString()])

        console.log(table.toString())

        display.box(
          `问题首次出现在提交 ${result.commit.substring(0, 7)}\n作者: ${result.author}\n\n使用 'ldesign-git bisect reset' 返回原始分支`,
          { title: '🎯 Bisect 完成', type: 'success' }
        )
      } catch (error: any) {
        spinner.fail('自动测试失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看状态
  bisect
    .command('status')
    .description('查看当前二分查找状态')
    .action(async () => {
      const spinner = display.createSpinner('获取状态...')
      spinner.start()

      try {
        const manager = new BisectManager()
        const status = await manager.getStatus()

        spinner.succeed('Bisect 状态')

        if (!status.isBisecting) {
          display.info('当前没有进行中的二分查找')
          return
        }

        display.title('二分查找进行中')

        display.keyValue('当前提交', status.current || '-')
        display.keyValue('坏提交', status.bad || '-')
        display.keyValue('好提交数', status.good?.length.toString() || '0')

        display.newLine()
        display.info('使用 good/bad/skip 命令继续测试')
      } catch (error: any) {
        spinner.fail('获取状态失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 可视化日志
  bisect
    .command('log')
    .description('可视化二分查找日志')
    .action(async () => {
      const spinner = display.createSpinner('获取日志...')
      spinner.start()

      try {
        const manager = new BisectManager()
        const log = await manager.visualize()

        spinner.succeed('Bisect 日志')

        if (log.trim()) {
          console.log(log)
        } else {
          display.info('没有二分查找日志')
        }
      } catch (error: any) {
        spinner.fail('获取日志失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return bisect
}
