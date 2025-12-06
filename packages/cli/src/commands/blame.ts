import { Command } from 'commander'
import { BlameAnalyzer } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createBlameCommand(): Command {
  const blame = new Command('blame')
    .description('Git Blame - 代码溯源和贡献分析')

  // 分析文件
  blame
    .command('file <path>')
    .alias('f')
    .description('分析文件的每一行来源')
    .option('-l, --lines <range>', '指定行范围，如 1-50')
    .action(async (filePath: string, options) => {
      const spinner = display.createSpinner(`分析文件 ${filePath}...`)
      spinner.start()

      try {
        const analyzer = new BlameAnalyzer()
        const lines = await analyzer.analyzeFile(filePath)

        spinner.succeed(`文件分析完成: ${filePath}`)

        if (lines.length === 0) {
          display.info('文件为空或未追踪')
          return
        }

        // 处理行范围
        let displayLines = lines
        if (options.lines) {
          const [start, end] = options.lines.split('-').map(Number)
          displayLines = lines.filter(l => l.lineNumber >= start && l.lineNumber <= end)
        }

        // 限制显示数量
        const maxDisplay = 50
        if (displayLines.length > maxDisplay) {
          display.warning(`显示前 ${maxDisplay} 行（共 ${displayLines.length} 行）`)
          displayLines = displayLines.slice(0, maxDisplay)
        }

        display.title('Blame 结果')

        const table = display.createTable(['行', '作者', '提交', '日期', '内容'])

        for (const line of displayLines) {
          const contentPreview = line.content.length > 40
            ? line.content.substring(0, 40) + '...'
            : line.content

          table.push([
            line.lineNumber.toString(),
            display.colors.cyan(line.author.substring(0, 12)),
            display.colors.dim(line.commit.substring(0, 7)),
            line.timestamp.toLocaleDateString(),
            contentPreview
          ])
        }

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('分析文件失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 作者统计
  blame
    .command('stats <path>')
    .alias('s')
    .description('显示文件的作者贡献统计')
    .action(async (filePath: string) => {
      const spinner = display.createSpinner(`统计作者贡献...`)
      spinner.start()

      try {
        const analyzer = new BlameAnalyzer()
        const stats = await analyzer.getAuthorStats(filePath)

        spinner.succeed('作者贡献统计')

        if (stats.length === 0) {
          display.info('没有贡献数据')
          return
        }

        display.title(`文件: ${filePath}`)

        const table = display.createTable(['作者', '邮箱', '行数', '占比', '提交数'])

        for (const author of stats) {
          table.push([
            display.colors.cyan(author.name),
            display.colors.dim(author.email),
            author.lines.toString(),
            `${author.percentage.toFixed(1)}%`,
            author.commits.length.toString()
          ])
        }

        console.log(table.toString())

        // 显示总计
        const totalLines = stats.reduce((sum, a) => sum + a.lines, 0)
        display.newLine()
        display.keyValue('总行数', totalLines)
        display.keyValue('贡献者数', stats.length)
      } catch (error: any) {
        spinner.fail('统计失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 最近修改
  blame
    .command('recent <path>')
    .alias('r')
    .description('查找最近修改的代码行')
    .option('-d, --days <days>', '天数范围', '30')
    .action(async (filePath: string, options) => {
      const spinner = display.createSpinner(`查找最近 ${options.days} 天的修改...`)
      spinner.start()

      try {
        const analyzer = new BlameAnalyzer()
        const days = parseInt(options.days)
        const changes = await analyzer.findRecentChanges(filePath, days)

        spinner.succeed(`最近 ${days} 天的修改`)

        if (changes.length === 0) {
          display.info(`最近 ${days} 天没有修改`)
          return
        }

        display.title(`最近修改: ${filePath}`)

        const table = display.createTable(['行', '作者', '日期', '内容'])

        // 限制显示
        const displayChanges = changes.slice(0, 30)

        for (const line of displayChanges) {
          const contentPreview = line.content.length > 50
            ? line.content.substring(0, 50) + '...'
            : line.content

          table.push([
            line.lineNumber.toString(),
            display.colors.cyan(line.author),
            line.timestamp.toLocaleDateString(),
            contentPreview
          ])
        }

        console.log(table.toString())

        if (changes.length > 30) {
          display.info(`还有 ${changes.length - 30} 行未显示`)
        }

        display.newLine()
        display.keyValue('修改行数', changes.length)
      } catch (error: any) {
        spinner.fail('查找失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 生成报告
  blame
    .command('report <path>')
    .description('生成 Blame 报告')
    .option('-f, --format <format>', '输出格式: table, markdown, json', 'table')
    .action(async (filePath: string, options) => {
      const spinner = display.createSpinner('生成报告...')
      spinner.start()

      try {
        const analyzer = new BlameAnalyzer()

        if (options.format === 'markdown') {
          const markdown = await analyzer.exportMarkdown(filePath)
          spinner.succeed('Markdown 报告')
          console.log(markdown)
        } else if (options.format === 'json') {
          const json = await analyzer.exportJSON(filePath)
          spinner.succeed('JSON 报告')
          console.log(json)
        } else {
          const report = await analyzer.generateReport(filePath)
          spinner.succeed('Blame 报告')

          display.title(`报告: ${report.filePath}`)
          display.keyValue('总行数', report.totalLines)
          display.keyValue('贡献者数', report.authors.length)
          display.keyValue('最早修改', report.firstModified.toLocaleDateString())
          display.keyValue('最近修改', report.lastModified.toLocaleDateString())

          display.newLine()
          display.title('主要贡献者')

          const table = display.createTable(['排名', '作者', '行数', '占比'])

          report.authors.slice(0, 10).forEach((author, index) => {
            table.push([
              `#${index + 1}`,
              display.colors.cyan(author.name),
              author.lines.toString(),
              `${author.percentage.toFixed(1)}%`
            ])
          })

          console.log(table.toString())
        }
      } catch (error: any) {
        spinner.fail('生成报告失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return blame
}
