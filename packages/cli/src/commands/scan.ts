import { Command } from 'commander'
import { ScanManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createScanCommand(): Command {
  const scan = new Command('scan')
    .description('安全扫描')

  // 完整扫描
  scan
    .command('full')
    .description('运行完整安全扫描')
    .option('--history', '包含 Git 历史')
    .action(async (options) => {
      const spinner = display.createSpinner('运行安全扫描...')
      spinner.start()

      try {
        const manager = new ScanManager()
        const result = await manager.fullScan({
          scanHistory: options.history
        })

        spinner.succeed('扫描完成')
        
        displayScanResult(result)
      } catch (error: any) {
        spinner.fail('扫描失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 扫描敏感信息
  scan
    .command('secrets')
    .description('扫描敏感信息')
    .option('--history', '包含 Git 历史')
    .action(async (options) => {
      const spinner = display.createSpinner('扫描敏感信息...')
      spinner.start()

      try {
        const manager = new ScanManager()
        const secrets = await manager.scanSecrets(options.history)

        spinner.succeed(`扫描完成，发现 ${secrets.length} 个问题`)

        if (secrets.length === 0) {
          display.success('未发现敏感信息泄露')
          return
        }

        const table = display.createTable(['类型', '文件', '行号', '严重程度'])

        for (const s of secrets) {
          const severityColor = getSeverityColor(s.severity)
          table.push([
            s.type,
            s.file,
            s.line.toString(),
            severityColor(s.severity)
          ])
        }

        console.log(table.toString())

        // 统计
        const critical = secrets.filter(s => s.severity === 'critical').length
        const high = secrets.filter(s => s.severity === 'high').length

        if (critical > 0 || high > 0) {
          display.newLine()
          display.error(`发现 ${critical} 个严重问题, ${high} 个高风险问题`)
          display.info('请立即处理敏感信息泄露！')
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('扫描失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 扫描大文件
  scan
    .command('large-files')
    .alias('large')
    .description('扫描大文件')
    .option('-t, --threshold <mb>', '大小阈值（MB）', '5')
    .action(async (options) => {
      const spinner = display.createSpinner('扫描大文件...')
      spinner.start()

      try {
        const manager = new ScanManager()
        const files = await manager.scanLargeFiles()

        spinner.succeed(`扫描完成，发现 ${files.length} 个大文件`)

        if (files.length === 0) {
          display.success('未发现大文件')
          return
        }

        const table = display.createTable(['文件', '大小', '位置'])

        for (const f of files) {
          table.push([
            f.path,
            f.sizeFormatted,
            f.inHistory ? display.colors.warning('Git 历史') : '工作区'
          ])
        }

        console.log(table.toString())

        const inHistory = files.filter(f => f.inHistory).length
        if (inHistory > 0) {
          display.newLine()
          display.warning(`${inHistory} 个大文件在 Git 历史中`)
          display.info('建议使用 git-filter-repo 清理历史中的大文件')
        }

        display.newLine()
        display.info('建议使用 Git LFS 管理大文件: lgit lfs track')
      } catch (error: any) {
        spinner.fail('扫描失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 扫描重复文件
  scan
    .command('duplicates')
    .alias('dup')
    .description('扫描重复文件')
    .action(async () => {
      const spinner = display.createSpinner('扫描重复文件...')
      spinner.start()

      try {
        const manager = new ScanManager()
        const result = await manager.fullScan()

        spinner.succeed(`扫描完成，发现 ${result.duplicates.length} 组重复文件`)

        if (result.duplicates.length === 0) {
          display.success('未发现重复文件')
          return
        }

        for (const dup of result.duplicates.slice(0, 10)) {
          display.newLine()
          display.info(`重复组 (${formatSize(dup.size * dup.files.length)} 可节省):`)
          for (const file of dup.files) {
            console.log(`  ${display.colors.dim('•')} ${file}`)
          }
        }

        if (result.duplicates.length > 10) {
          display.newLine()
          display.info(`... 还有 ${result.duplicates.length - 10} 组重复文件`)
        }
      } catch (error: any) {
        spinner.fail('扫描失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 扫描暂存区
  scan
    .command('staged')
    .description('扫描暂存区中的敏感信息')
    .action(async () => {
      const spinner = display.createSpinner('扫描暂存区...')
      spinner.start()

      try {
        const manager = new ScanManager()
        const secrets = await manager.scanStaged()

        if (secrets.length === 0) {
          spinner.succeed('暂存区安全')
          display.success('未发现敏感信息')
          return
        }

        spinner.fail(`发现 ${secrets.length} 个敏感信息`)

        const table = display.createTable(['类型', '文件', '行号', '严重程度'])

        for (const s of secrets) {
          const severityColor = getSeverityColor(s.severity)
          table.push([
            s.type,
            s.file,
            s.line.toString(),
            severityColor(s.severity)
          ])
        }

        console.log(table.toString())
        
        display.newLine()
        display.error('请在提交前移除敏感信息！')
        process.exit(1)
      } catch (error: any) {
        spinner.fail('扫描失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 快速扫描
  scan
    .command('quick')
    .description('快速扫描（仅工作区）')
    .action(async () => {
      const spinner = display.createSpinner('快速扫描...')
      spinner.start()

      try {
        const manager = new ScanManager()
        const result = await manager.quickScan()

        spinner.succeed('扫描完成')
        displayScanResult(result)
      } catch (error: any) {
        spinner.fail('扫描失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 生成报告
  scan
    .command('report')
    .description('生成扫描报告')
    .option('-o, --output <file>', '输出文件')
    .option('--history', '包含 Git 历史')
    .action(async (options) => {
      const spinner = display.createSpinner('生成报告...')
      spinner.start()

      try {
        const manager = new ScanManager()
        const result = await manager.fullScan({ scanHistory: options.history })
        const report = manager.generateReport(result)

        if (options.output) {
          const fs = await import('fs')
          fs.writeFileSync(options.output, report)
          spinner.succeed(`报告已保存到: ${options.output}`)
        } else {
          spinner.stop()
          console.log(report)
        }
      } catch (error: any) {
        spinner.fail('生成报告失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 默认命令
  scan
    .action(async () => {
      const spinner = display.createSpinner('运行快速扫描...')
      spinner.start()

      try {
        const manager = new ScanManager()
        const result = await manager.quickScan()

        spinner.succeed('扫描完成')
        displayScanResult(result)
      } catch (error: any) {
        spinner.fail('扫描失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return scan
}

function displayScanResult(result: any): void {
  display.newLine()
  display.title('扫描摘要')
  
  display.keyValue('敏感信息', result.summary.secretsFound)
  display.keyValue('大文件', result.summary.largeFilesFound)
  display.keyValue('重复文件', result.summary.duplicatesFound)
  
  if (result.issues.length > 0) {
    display.newLine()
    display.title('问题和建议')
    for (const issue of result.issues) {
      console.log(`  ${display.colors.warning('⚠')} ${issue}`)
    }
  }

  if (result.summary.totalIssues === 0) {
    display.newLine()
    display.success('仓库安全检查通过')
  } else {
    display.newLine()
    display.warning(`发现 ${result.summary.totalIssues} 个问题需要关注`)
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return display.colors.error
    case 'high':
      return display.colors.warning
    case 'medium':
      return display.colors.yellow
    case 'low':
      return display.colors.info
    default:
      return display.colors.dim
  }
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}
