import { Command } from 'commander'
import { GitManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createStatsCommand(): Command {
  const stats = new Command('stats')
    .description('仓库统计信息')

  // 总览
  stats
    .command('summary')
    .alias('s')
    .description('显示仓库统计总览')
    .action(async () => {
      const spinner = display.createSpinner('收集统计信息...')
      spinner.start()

      try {
        const git = new GitManager()
        const rawGit = git.getRawGit()
        
        // 获取基本信息
        const branches = await rawGit.branch()
        const tags = await rawGit.tags()
        const log = await rawGit.log()
        const status = await git.status()
        const remotes = await rawGit.getRemotes(true)

        spinner.succeed('仓库统计')

        display.keyValue('当前分支', branches.current)
        display.keyValue('本地分支数', branches.all.length)
        display.keyValue('标签数', tags.all.length)
        display.keyValue('总提交数', log.total)
        display.keyValue('远程仓库', remotes.length)
        
        if (!status.isClean) {
          display.keyValue('未提交更改', 
            `${status.modified.length} 修改, ${status.created.length} 新增, ${status.deleted.length} 删除`
          )
        } else {
          display.keyValue('工作区状态', '干净')
        }

        // 最近提交
        if (log.latest) {
          display.newLine()
          display.title('最近提交')
          display.keyValue('提交', log.latest.hash.substring(0, 7))
          display.keyValue('作者', log.latest.author_name)
          display.keyValue('日期', log.latest.date)
          display.keyValue('信息', log.latest.message)
        }
      } catch (error: any) {
        spinner.fail('获取统计失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 作者统计
  stats
    .command('author')
    .alias('a')
    .description('按作者统计贡献')
    .option('-n, --count <n>', '显示数量', '10')
    .action(async (options) => {
      const spinner = display.createSpinner('统计贡献者...')
      spinner.start()

      try {
        const git = new GitManager()
        const rawGit = git.getRawGit()
        
        const result = await rawGit.raw(['shortlog', '-sn', '--no-merges'])
        const lines = result.split('\n').filter(l => l.trim())
        
        spinner.succeed('贡献者统计')

        const count = parseInt(options.count) || 10
        const table = display.createTable(['排名', '提交数', '贡献者'])

        lines.slice(0, count).forEach((line, index) => {
          const match = line.trim().match(/^(\d+)\s+(.+)$/)
          if (match) {
            table.push([
              (index + 1).toString(),
              match[1],
              match[2]
            ])
          }
        })

        console.log(table.toString())

        if (lines.length > count) {
          display.info(`共 ${lines.length} 位贡献者`)
        }
      } catch (error: any) {
        spinner.fail('统计失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 时间线统计
  stats
    .command('timeline')
    .alias('t')
    .description('按时间统计提交')
    .option('--since <date>', '起始日期', '1 year ago')
    .action(async (options) => {
      const spinner = display.createSpinner('统计时间线...')
      spinner.start()

      try {
        const git = new GitManager()
        const rawGit = git.getRawGit()
        
        // 按月统计
        const result = await rawGit.raw([
          'log',
          `--since=${options.since}`,
          '--format=%ad',
          '--date=format:%Y-%m'
        ])
        
        const months = result.split('\n').filter(l => l.trim())
        const monthCounts = new Map<string, number>()
        
        for (const month of months) {
          const count = monthCounts.get(month) || 0
          monthCounts.set(month, count + 1)
        }

        spinner.succeed('提交时间线')

        // 排序并显示
        const sortedMonths = Array.from(monthCounts.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))

        const maxCount = Math.max(...sortedMonths.map(m => m[1]))
        const barWidth = 30

        for (const [month, count] of sortedMonths) {
          const barLength = Math.round((count / maxCount) * barWidth)
          const bar = '█'.repeat(barLength) + '░'.repeat(barWidth - barLength)
          console.log(`  ${month}  ${display.colors.cyan(bar)} ${count}`)
        }

        display.newLine()
        display.keyValue('总提交数', months.length)
      } catch (error: any) {
        spinner.fail('统计失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 文件统计
  stats
    .command('files')
    .alias('f')
    .description('统计文件变更频率')
    .option('-n, --count <n>', '显示数量', '20')
    .action(async (options) => {
      const spinner = display.createSpinner('统计文件变更...')
      spinner.start()

      try {
        const git = new GitManager()
        const rawGit = git.getRawGit()
        
        const result = await rawGit.raw([
          'log',
          '--name-only',
          '--pretty=format:',
          '-n', '500'
        ])
        
        const files = result.split('\n').filter(l => l.trim())
        const fileCounts = new Map<string, number>()
        
        for (const file of files) {
          const count = fileCounts.get(file) || 0
          fileCounts.set(file, count + 1)
        }

        spinner.succeed('文件变更频率')

        const count = parseInt(options.count) || 20
        const sorted = Array.from(fileCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, count)

        const table = display.createTable(['文件', '变更次数'])

        for (const [file, c] of sorted) {
          table.push([file, c.toString()])
        }

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('统计失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 活动统计
  stats
    .command('activity')
    .description('显示最近活动')
    .option('--week', '本周活动')
    .option('--month', '本月活动')
    .option('--today', '今日活动')
    .action(async (options) => {
      const spinner = display.createSpinner('获取活动...')
      spinner.start()

      try {
        const git = new GitManager()
        const rawGit = git.getRawGit()
        
        let since = '1 week ago'
        let label = '本周'
        
        if (options.today) {
          since = 'midnight'
          label = '今日'
        } else if (options.month) {
          since = '1 month ago'
          label = '本月'
        }

        const log = await rawGit.log({ '--since': since })
        
        spinner.succeed(`${label}活动`)

        if (log.total === 0) {
          display.info(`${label}没有提交`)
          return
        }

        display.keyValue('提交数', log.total)

        // 统计作者
        const authors = new Map<string, number>()
        for (const commit of log.all) {
          const count = authors.get(commit.author_name) || 0
          authors.set(commit.author_name, count + 1)
        }

        display.newLine()
        display.title('活跃贡献者')
        
        const sortedAuthors = Array.from(authors.entries())
          .sort((a, b) => b[1] - a[1])

        for (const [author, count] of sortedAuthors.slice(0, 5)) {
          console.log(`  ${display.colors.cyan(author)}: ${count} 次提交`)
        }

        // 最近提交
        display.newLine()
        display.title('最近提交')
        
        for (const commit of log.all.slice(0, 5)) {
          console.log(`  ${display.colors.warning(commit.hash.substring(0, 7))} ${commit.message}`)
          console.log(`    ${display.colors.dim(`${commit.author_name} - ${commit.date}`)}`)
        }
      } catch (error: any) {
        spinner.fail('获取活动失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 代码行数
  stats
    .command('lines')
    .alias('loc')
    .description('统计代码行数')
    .action(async () => {
      const spinner = display.createSpinner('统计代码行数...')
      spinner.start()

      try {
        const git = new GitManager()
        const rawGit = git.getRawGit()
        
        // 使用 git ls-files 获取跟踪的文件
        const result = await rawGit.raw(['ls-files'])
        const files = result.split('\n').filter(f => f.trim())

        // 按扩展名分组
        const extCounts = new Map<string, { files: number; lines: number }>()
        const fs = await import('fs')
        const path = await import('path')

        for (const file of files) {
          try {
            const ext = path.extname(file) || '(无扩展名)'
            const content = fs.readFileSync(file, 'utf-8')
            const lines = content.split('\n').length

            const current = extCounts.get(ext) || { files: 0, lines: 0 }
            extCounts.set(ext, {
              files: current.files + 1,
              lines: current.lines + lines
            })
          } catch {}
        }

        spinner.succeed('代码统计')

        const sorted = Array.from(extCounts.entries())
          .sort((a, b) => b[1].lines - a[1].lines)

        const table = display.createTable(['扩展名', '文件数', '行数'])

        let totalFiles = 0
        let totalLines = 0

        for (const [ext, { files: f, lines }] of sorted.slice(0, 15)) {
          table.push([ext, f.toString(), lines.toLocaleString()])
          totalFiles += f
          totalLines += lines
        }

        console.log(table.toString())

        display.newLine()
        display.keyValue('总文件数', totalFiles)
        display.keyValue('总行数', totalLines.toLocaleString())
      } catch (error: any) {
        spinner.fail('统计失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 默认命令
  stats
    .action(async () => {
      // 调用 summary
      const summaryCmd = stats.commands.find(c => c.name() === 'summary')
      if (summaryCmd) {
        await summaryCmd.parseAsync([], { from: 'user' })
      }
    })

  return stats
}
