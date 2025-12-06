import { Command } from 'commander'
import { DoctorManager, type HealthCheckResult } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createDoctorCommand(): Command {
  const doctor = new Command('doctor')
    .description('Git 健康检查')

  // 完整检查
  doctor
    .command('check')
    .alias('c')
    .description('运行完整健康检查')
    .option('-q, --quick', '快速检查（仅检查关键项）')
    .action(async (options) => {
      const spinner = display.createSpinner('正在检查...')
      spinner.start()

      try {
        const manager = new DoctorManager()
        
        let checks
        if (options.quick) {
          checks = await manager.quickCheck()
        } else {
          const report = await manager.runFullDiagnosis()
          checks = report.checks
          
          spinner.succeed(`Git 健康检查完成 (Git ${report.gitVersion})`)
          display.newLine()
        }

        // 显示检查结果
        const table = display.createTable(['检查项', '状态', '详情'])

        for (const check of checks) {
          const statusIcon = getStatusIcon(check.status)
          const statusColor = getStatusColor(check.status)
          
          table.push([
            check.name,
            statusColor(statusIcon + ' ' + check.status),
            check.message
          ])
        }

        console.log(table.toString())

        // 显示建议
        const suggestions = checks.filter((c: HealthCheckResult) => c.suggestion)
        if (suggestions.length > 0) {
          display.newLine()
          display.title('建议')
          for (const s of suggestions) {
            console.log(`  ${display.colors.dim(s.name)}: ${display.colors.yellow(s.suggestion!)}`)
          }
        }

        // 显示摘要
        const passed = checks.filter((c: HealthCheckResult) => c.status === 'pass').length
        const warnings = checks.filter((c: HealthCheckResult) => c.status === 'warning').length
        const errors = checks.filter((c: HealthCheckResult) => c.status === 'error').length

        display.newLine()
        display.box(
          `✓ 通过: ${passed}  ⚠ 警告: ${warnings}  ✗ 错误: ${errors}`,
          { 
            title: '检查摘要', 
            type: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'success' 
          }
        )

        if (errors > 0) {
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('检查失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 默认命令
  doctor
    .action(async () => {
      const spinner = display.createSpinner('正在检查...')
      spinner.start()

      try {
        const manager = new DoctorManager()
        const report = await manager.runFullDiagnosis()

        spinner.succeed(`Git 健康检查完成 (Git ${report.gitVersion})`)
        display.newLine()

        // 显示检查结果
        for (const check of report.checks) {
          const statusIcon = getStatusIcon(check.status)
          const statusColor = getStatusColor(check.status)
          
          console.log(`${statusColor(statusIcon)} ${check.name}: ${check.message}`)
          
          if (check.suggestion) {
            console.log(`   ${display.colors.dim('→ ' + check.suggestion)}`)
          }
        }

        // 显示摘要
        display.newLine()
        const { passed, warnings, errors } = report.summary
        
        if (errors > 0) {
          display.error(`发现 ${errors} 个问题需要修复`)
        } else if (warnings > 0) {
          display.warning(`有 ${warnings} 个建议可以改进`)
        } else {
          display.success('Git 配置健康！')
        }

        if (errors > 0) {
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('检查失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return doctor
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pass':
      return '✓'
    case 'warning':
      return '⚠'
    case 'error':
      return '✗'
    default:
      return '•'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pass':
      return display.colors.success
    case 'warning':
      return display.colors.warning
    case 'error':
      return display.colors.error
    default:
      return display.colors.info
  }
}
