import { Command } from 'commander'
import { CommitAnalyzer } from '../../core'
import { RepositoryAnalyzer, ReportGenerator } from '../../analytics'
import * as fs from 'fs/promises'
import * as display from '../utils/display'

export function createAnalyzeCommand(): Command {
  const analyze = new Command('analyze')
    .description('仓库分析命令')

  // 提交分析
  analyze
    .command('commits')
    .description('分析提交历史')
    .option('-n, --number <count>', '分析的提交数量', '1000')
    .option('--author <author>', '只分析指定作者的提交')
    .action(async (options) => {
      const spinner = display.createSpinner('分析提交历史...')
      spinner.start()

      try {
        const analyzer = new CommitAnalyzer()
        const maxCount = parseInt(options.number)

        let analytics
        if (options.author) {
          const stats = await analyzer.analyzeByAuthor(options.author, maxCount)
          spinner.succeed('提交分析完成')

          display.title(`${options.author} 的提交统计`)
          display.keyValue('总提交数', stats.total)
          display.keyValue('最新提交', stats.latest?.message || '无')
        } else {
          analytics = await analyzer.analyzeCommitsDetailed(maxCount)
          spinner.succeed('提交分析完成')

          display.title('提交统计')
          display.keyValue('总提交数', analytics.totalCommits)
          display.keyValue('平均每天', analytics.avgCommitsPerDay.toFixed(2))
          display.keyValue('平均每人', analytics.avgCommitsPerAuthor.toFixed(2))

          // 提交类型分布
          display.newLine()
          display.title('提交类型分布')
          const table = display.createTable(['类型', '数量', '占比'])

          Object.entries(analytics.commitsByType)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .forEach(([type, count]) => {
              const percentage = ((count / analytics.totalCommits) * 100).toFixed(1)
              table.push([
                display.colors.cyan(type),
                count.toString(),
                `${percentage}%`
              ])
            })

          console.log(table.toString())

          // Top 贡献者
          display.newLine()
          display.title('Top 10 贡献者')
          const contributorTable = display.createTable(['排名', '贡献者', '提交数', '占比'])

          analytics.topContributors.slice(0, 10).forEach((contributor, index) => {
            contributorTable.push([
              (index + 1).toString(),
              contributor.author,
              contributor.commits.toString(),
              `${contributor.percentage.toFixed(1)}%`
            ])
          })

          console.log(contributorTable.toString())

          // 活跃度分析
          display.newLine()
          display.title('提交活跃度')
          display.info('按星期统计:')
          Object.entries(analytics.commitsByDayOfWeek)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .forEach(([day, count]) => {
              console.log(`  ${display.icons.bullet} ${day}: ${count} 次`)
            })
        }
      } catch (error: any) {
        spinner.fail('分析失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 贡献者分析
  analyze
    .command('contributors')
    .description('分析贡献者')
    .option('-l, --limit <number>', '显示贡献者数量', '10')
    .action(async (options) => {
      const spinner = display.createSpinner('分析贡献者...')
      spinner.start()

      try {
        const analyzer = new CommitAnalyzer()
        const limit = parseInt(options.limit)
        const contributors = await analyzer.getTopContributors(limit)

        spinner.succeed('贡献者分析完成')

        display.title(`Top ${limit} 贡献者`)

        const table = display.createTable(['排名', '贡献者', '提交数', '占比'])

        contributors.forEach((contributor, index) => {
          const rank = index + 1
          let rankDisplay = rank.toString()

          if (rank === 1) rankDisplay = display.colors.success('🥇 1')
          else if (rank === 2) rankDisplay = display.colors.warning('🥈 2')
          else if (rank === 3) rankDisplay = display.colors.cyan('🥉 3')

          table.push([
            rankDisplay,
            contributor.author,
            display.colors.bold(contributor.commits.toString()),
            display.colors.dim(`${contributor.percentage.toFixed(1)}%`)
          ])
        })

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('分析失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 仓库分析
  analyze
    .command('repository')
    .alias('repo')
    .description('分析仓库整体情况')
    .action(async () => {
      const spinner = display.createSpinner('分析仓库...')
      spinner.start()

      try {
        const analyzer = new RepositoryAnalyzer()
        const metrics = await analyzer.analyzeRepository()

        spinner.succeed('仓库分析完成')

        display.title('仓库概览')
        display.keyValue('总文件数', metrics.totalFiles)
        display.keyValue('总分支数', metrics.branchMetrics.total)
        display.keyValue('活跃分支', metrics.branchMetrics.active)
        display.keyValue('陈旧分支', metrics.branchMetrics.stale)
        display.keyValue('总贡献者', metrics.contributors.total)
        display.keyValue('活跃贡献者', metrics.contributors.active)

        // 语言分布
        display.newLine()
        display.title('语言分布')
        const langTable = display.createTable(['语言', '文件数', '占比'])

        Object.entries(metrics.languageDistribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .forEach(([language, count]) => {
            const percentage = ((count / metrics.totalFiles) * 100).toFixed(1)
            langTable.push([
              language,
              count.toString(),
              `${percentage}%`
            ])
          })

        console.log(langTable.toString())

        // 最常变更的文件
        if (metrics.mostChangedFiles.length > 0) {
          display.newLine()
          display.title('最常变更的文件 (Top 10)')
          const fileTable = display.createTable(['文件', '变更次数'])

          metrics.mostChangedFiles.slice(0, 10).forEach(file => {
            fileTable.push([file.path, file.changeCount.toString()])
          })

          console.log(fileTable.toString())
        }

        // 核心贡献者
        if (metrics.contributors.coreContributors.length > 0) {
          display.newLine()
          display.title('核心贡献者')
          display.list(metrics.contributors.coreContributors, display.icons.success)
        }
      } catch (error: any) {
        spinner.fail('分析失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return analyze
}

export function createReportCommand(): Command {
  const report = new Command('report')
    .description('生成分析报告')
    .option('-f, --format <format>', '报告格式 (markdown/json/csv/html)', 'markdown')
    .option('-o, --output <file>', '输出文件路径')
    .action(async (options) => {
      const spinner = display.createSpinner('生成报告...')
      spinner.start()

      try {
        const generator = new ReportGenerator()
        const format = options.format as 'markdown' | 'json' | 'csv' | 'html'

        let content: string
        switch (format) {
          case 'markdown':
            content = await generator.generateMarkdownReport()
            break
          case 'json':
            content = await generator.generateJsonReport()
            break
          case 'csv':
            content = await generator.generateCsvReport()
            break
          case 'html':
            content = await generator.generateHtmlReport()
            break
          default:
            throw new Error(`不支持的格式: ${format}`)
        }

        spinner.succeed('报告生成完成')

        // 如果指定了输出文件，保存到文件
        if (options.output) {
          await fs.writeFile(options.output, content, 'utf-8')
          display.success(`报告已保存到: ${display.colors.cyan(options.output)}`)
        } else {
          // 否则输出到控制台
          display.newLine()
          console.log(content)
        }

        // 显示摘要
        if (!options.output || format !== 'markdown') {
          display.newLine()
          const summary = await generator.generateSummary()
          console.log(summary)
        }
      } catch (error: any) {
        spinner.fail('生成报告失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return report
}

