import { Command } from 'commander'
import { ReflogManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createReflogCommand(): Command {
  const reflog = new Command('reflog')
    .description('Git Reflog - 引用日志管理')

  // 列出 reflog
  reflog
    .command('list [ref]')
    .alias('ls')
    .description('列出引用日志')
    .option('-n, --limit <number>', '限制显示条数', '20')
    .action(async (ref: string = 'HEAD', options) => {
      const spinner = display.createSpinner('获取引用日志...')
      spinner.start()

      try {
        const manager = new ReflogManager()
        const limit = parseInt(options.limit)
        const entries = await manager.list(ref, limit)

        spinner.succeed(`引用日志: ${ref}`)

        if (entries.length === 0) {
          display.info('没有引用日志')
          return
        }

        display.title('Reflog 历史')

        const table = display.createTable(['索引', '操作', '提交', '时间', '描述'])

        for (const entry of entries) {
          table.push([
            `${ref}@{${entry.index}}`,
            display.colors.cyan(entry.operation),
            display.colors.dim(entry.hash.substring(0, 7)),
            new Date(entry.date).toLocaleString(),
            entry.message.length > 40 ? entry.message.substring(0, 40) + '...' : entry.message
          ])
        }

        console.log(table.toString())
        display.info(`显示 ${entries.length} 条记录`)
      } catch (error: any) {
        spinner.fail('获取引用日志失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 显示详情
  reflog
    .command('show <ref>')
    .description('显示特定引用的详情')
    .action(async (ref: string) => {
      const spinner = display.createSpinner(`获取 ${ref} 详情...`)
      spinner.start()

      try {
        const manager = new ReflogManager()
        const details = await manager.show(ref)

        spinner.succeed(`引用详情: ${ref}`)
        console.log(details)
      } catch (error: any) {
        spinner.fail('获取详情失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 检查引用是否存在
  reflog
    .command('exists <ref>')
    .description('检查引用是否存在')
    .action(async (ref: string) => {
      const spinner = display.createSpinner(`检查引用 ${ref}...`)
      spinner.start()

      try {
        const manager = new ReflogManager()
        const exists = await manager.exists(ref)

        if (exists) {
          spinner.succeed(`引用 ${ref} 存在`)
        } else {
          spinner.fail(`引用 ${ref} 不存在`)
        }
      } catch (error: any) {
        spinner.fail('检查失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除条目
  reflog
    .command('delete <ref>')
    .description('删除指定的 reflog 条目')
    .option('--rewrite', '重写引用')
    .option('--update-ref', '更新引用')
    .action(async (ref: string, options) => {
      const spinner = display.createSpinner(`删除 reflog 条目 ${ref}...`)
      spinner.start()

      try {
        const manager = new ReflogManager()
        await manager.delete(ref, {
          rewrite: options.rewrite,
          updateRef: options.updateRef
        })

        spinner.succeed(`已删除 reflog 条目: ${ref}`)
      } catch (error: any) {
        spinner.fail('删除失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 过期旧条目
  reflog
    .command('expire')
    .description('清理过期的 reflog 条目')
    .option('--expire <time>', '过期时间，如 30.days.ago')
    .option('--expire-unreachable <time>', '不可达条目的过期时间')
    .option('--all', '处理所有引用')
    .option('--verbose', '详细模式')
    .action(async (options) => {
      const spinner = display.createSpinner('清理过期条目...')
      spinner.start()

      try {
        const manager = new ReflogManager()
        await manager.expire({
          expireTime: options.expire,
          expireUnreachable: options.expireUnreachable,
          all: options.all,
          verbose: options.verbose
        })

        spinner.succeed('过期条目已清理')
      } catch (error: any) {
        spinner.fail('清理失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 恢复到指定状态（便捷命令）
  reflog
    .command('recover <ref>')
    .description('恢复到指定的 reflog 状态（便捷命令）')
    .action(async (ref: string) => {
      display.title('恢复说明')
      display.info(`要恢复到 ${ref}，请运行以下命令：`)
      display.newLine()
      console.log(display.colors.cyan(`  git reset --hard ${ref}`))
      display.newLine()
      display.warning('注意：此操作会丢失当前工作区的更改')
      display.info('请先确保已保存所有更改或使用 stash')
    })

  return reflog
}
