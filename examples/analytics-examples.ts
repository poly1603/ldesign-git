/**
 * @ldesign/git 统计分析示例
 */

import { CommitAnalyzer, RepositoryAnalyzer, ReportGenerator } from '@ldesign/git'
import * as fs from 'fs/promises'

async function commitAnalysisExample() {
  console.log('=== 提交分析示例 ===\n')

  const analyzer = new CommitAnalyzer()

  try {
    // 1. 基础提交统计
    console.log('1. 基础提交统计...')
    const basicStats = await analyzer.analyzeCommits(100)
    console.log(`总提交数: ${basicStats.total}`)
    console.log(`贡献者数: ${basicStats.authors}`)

    if (basicStats.latest) {
      console.log(`最新提交: ${basicStats.latest.message}`)
      console.log(`提交者: ${basicStats.latest.author}`)
    }
    console.log()

    // 2. 详细提交分析
    console.log('2. 详细提交分析...')
    const detailedAnalytics = await analyzer.analyzeCommitsDetailed(1000)

    console.log(`总提交数: ${detailedAnalytics.totalCommits}`)
    console.log(`平均每天提交: ${detailedAnalytics.avgCommitsPerDay.toFixed(2)}`)
    console.log(`平均每人提交: ${detailedAnalytics.avgCommitsPerAuthor.toFixed(2)}`)
    console.log()

    // 3. 提交类型分布
    console.log('3. 提交类型分布:')
    Object.entries(detailedAnalytics.commitsByType)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = ((count / detailedAnalytics.totalCommits) * 100).toFixed(1)
        console.log(`   ${type.padEnd(10)}: ${count.toString().padStart(4)} (${percentage}%)`)
      })
    console.log()

    // 4. Top 贡献者
    console.log('4. Top 5 贡献者:')
    detailedAnalytics.topContributors.slice(0, 5).forEach((contributor, index) => {
      console.log(`   ${index + 1}. ${contributor.author.padEnd(20)} - ${contributor.commits} 次提交 (${contributor.percentage.toFixed(1)}%)`)
    })
    console.log()

    // 5. 活跃度分析
    console.log('5. 提交活跃度（按星期）:')
    Object.entries(detailedAnalytics.commitsByDayOfWeek)
      .sort(([, a], [, b]) => b - a)
      .forEach(([day, count]) => {
        console.log(`   ${day.padEnd(10)}: ${'█'.repeat(Math.min(count, 50))} ${count}`)
      })
    console.log()

    // 6. 按作者分析
    console.log('6. 分析特定作者的提交...')
    const authorName = detailedAnalytics.topContributors[0]?.author
    if (authorName) {
      const authorStats = await analyzer.analyzeByAuthor(authorName, 100)
      console.log(`   ${authorName} 的提交数: ${authorStats.total}`)
      console.log(`   最新提交: ${authorStats.latest?.message || '无'}`)
    }
    console.log()

    // 7. 按时间范围分析
    console.log('7. 最近 30 天的提交...')
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const rangeStats = await analyzer.analyzeByTimeRange(thirtyDaysAgo, now)
    console.log(`   期间提交数: ${rangeStats.total}`)
    console.log(`   参与人数: ${rangeStats.authors}`)
    console.log()

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function repositoryAnalysisExample() {
  console.log('=== 仓库分析示例 ===\n')

  const analyzer = new RepositoryAnalyzer()

  try {
    // 1. 整体仓库分析
    console.log('1. 仓库整体分析...')
    const metrics = await analyzer.analyzeRepository()

    console.log(`总文件数: ${metrics.totalFiles}`)
    console.log(`总分支数: ${metrics.branchMetrics.total}`)
    console.log(`活跃分支: ${metrics.branchMetrics.active}`)
    console.log(`陈旧分支: ${metrics.branchMetrics.stale}`)
    console.log(`总贡献者: ${metrics.contributors.total}`)
    console.log(`活跃贡献者: ${metrics.contributors.active}`)
    console.log()

    // 2. 语言分布
    console.log('2. 语言分布:')
    Object.entries(metrics.languageDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([language, count]) => {
        const percentage = ((count / metrics.totalFiles) * 100).toFixed(1)
        console.log(`   ${language.padEnd(15)}: ${count.toString().padStart(4)} 文件 (${percentage}%)`)
      })
    console.log()

    // 3. 最常变更的文件
    if (metrics.mostChangedFiles.length > 0) {
      console.log('3. 最常变更的文件 (Top 5):')
      metrics.mostChangedFiles.slice(0, 5).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.path} - ${file.changeCount} 次变更`)
      })
      console.log()
    }

    // 4. 核心贡献者
    if (metrics.contributors.coreContributors.length > 0) {
      console.log('4. 核心贡献者:')
      metrics.contributors.coreContributors.forEach(contributor => {
        console.log(`   ⭐ ${contributor}`)
      })
      console.log()
    }

    // 5. 分支分析
    console.log('5. 分析所有分支...')
    const branchAnalytics = await analyzer.analyzeAllBranches()

    const staleBranches = branchAnalytics.filter(b => b.isStale)
    console.log(`陈旧分支数 (>90天): ${staleBranches.length}`)

    if (staleBranches.length > 0) {
      console.log('\n陈旧分支列表:')
      staleBranches.slice(0, 5).forEach(branch => {
        console.log(`   - ${branch.name} (最后更新: ${new Date(branch.lastCommitDate).toLocaleDateString('zh-CN')})`)
      })
    }
    console.log()

    // 6. 仓库年龄
    console.log('6. 仓库年龄...')
    const age = await analyzer.getRepositoryAge()
    console.log(`   仓库已存在 ${age} 天 (约 ${(age / 365).toFixed(1)} 年)`)
    console.log()

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function reportGenerationExample() {
  console.log('=== 报告生成示例 ===\n')

  const generator = new ReportGenerator()

  try {
    // 1. 生成完整报告
    console.log('1. 生成完整报告对象...')
    const report = await generator.generateReport()

    console.log('报告概览:')
    console.log(`   总提交数: ${report.summary.commits}`)
    console.log(`   贡献者数: ${report.summary.contributors}`)
    console.log(`   分支数: ${report.summary.branches}`)
    console.log(`   标签数: ${report.summary.tags}`)
    console.log(`   文件数: ${report.summary.files}`)
    console.log()

    // 2. 生成 Markdown 报告
    console.log('2. 生成 Markdown 报告...')
    const mdReport = await generator.generateMarkdownReport()
    await fs.writeFile('git-report.md', mdReport, 'utf-8')
    console.log('✅ Markdown 报告已保存到: git-report.md\n')

    // 3. 生成 JSON 报告
    console.log('3. 生成 JSON 报告...')
    const jsonReport = await generator.generateJsonReport()
    await fs.writeFile('git-report.json', jsonReport, 'utf-8')
    console.log('✅ JSON 报告已保存到: git-report.json\n')

    // 4. 生成 CSV 报告
    console.log('4. 生成 CSV 报告...')
    const csvReport = await generator.generateCsvReport()
    await fs.writeFile('git-report.csv', csvReport, 'utf-8')
    console.log('✅ CSV 报告已保存到: git-report.csv\n')

    // 5. 生成 HTML 报告
    console.log('5. 生成 HTML 报告...')
    const htmlReport = await generator.generateHtmlReport()
    await fs.writeFile('git-report.html', htmlReport, 'utf-8')
    console.log('✅ HTML 报告已保存到: git-report.html\n')

    // 6. 生成简要摘要
    console.log('6. 生成简要摘要...')
    const summary = await generator.generateSummary()
    console.log(summary)
    console.log()

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

async function dataVisualizationExample() {
  console.log('=== 数据可视化准备示例 ===\n')

  const commitAnalyzer = new CommitAnalyzer()

  try {
    const analytics = await commitAnalyzer.analyzeCommitsDetailed()

    // 准备图表数据
    console.log('准备可视化数据...\n')

    // 1. 提交类型饼图数据
    console.log('1. 提交类型分布（饼图数据）:')
    const pieData = Object.entries(analytics.commitsByType)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        label: type,
        value: count,
        percentage: ((count / analytics.totalCommits) * 100).toFixed(1)
      }))
    console.log(JSON.stringify(pieData, null, 2))
    console.log()

    // 2. 提交趋势折线图数据
    console.log('2. 最近活动趋势（折线图数据）:')
    const lineData = analytics.recentActivity.map(item => ({
      date: item.date,
      commits: item.commits
    }))
    console.log(JSON.stringify(lineData.slice(0, 7), null, 2))
    console.log()

    // 3. 贡献者柱状图数据
    console.log('3. Top 贡献者（柱状图数据）:')
    const barData = analytics.topContributors.slice(0, 10).map(c => ({
      author: c.author,
      commits: c.commits,
      percentage: c.percentage.toFixed(1)
    }))
    console.log(JSON.stringify(barData.slice(0, 5), null, 2))
    console.log()

    console.log('💡 这些数据可以直接用于前端图表库（如 ECharts、Chart.js）\n')

  } catch (error: any) {
    console.error('错误:', error.message)
  }
}

// 运行所有示例
async function runAllExamples() {
  await commitAnalysisExample()
  await repositoryAnalysisExample()
  await reportGenerationExample()
  await dataVisualizationExample()
}

if (require.main === module) {
  runAllExamples().catch(console.error)
}


