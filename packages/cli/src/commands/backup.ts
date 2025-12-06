import { Command } from 'commander'
import { BackupManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createBackupCommand(): Command {
  const backup = new Command('backup')
    .description('Git 仓库备份管理')

  // 创建备份
  backup
    .command('create [output]')
    .description('创建仓库备份')
    .option('-t, --type <type>', '备份类型 (bundle, mirror, full)', 'bundle')
    .option('--all', '包含所有引用')
    .action(async (output: string | undefined, options) => {
      const spinner = display.createSpinner('创建备份...')
      spinner.start()

      try {
        const manager = new BackupManager()
        let result

        switch (options.type) {
          case 'mirror':
            if (!output) {
              spinner.fail('镜像备份需要指定目标目录')
              process.exit(1)
            }
            result = await manager.createMirror(output)
            break
          case 'full':
            if (!output) {
              spinner.fail('完整备份需要指定目标目录')
              process.exit(1)
            }
            result = await manager.createFull(output, { excludeNodeModules: true })
            break
          case 'bundle':
          default:
            result = await manager.createBundle(output, { all: options.all })
            break
        }

        spinner.succeed('备份创建成功')
        
        display.box(
          `文件: ${result.path}\n` +
          `大小: ${formatSize(result.size)}\n` +
          `类型: ${result.type}\n` +
          `分支: ${result.branches}\n` +
          `标签: ${result.tags}\n` +
          `提交: ${result.commits}`,
          { title: '备份信息', type: 'success' }
        )
      } catch (error: any) {
        spinner.fail('创建备份失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 从备份恢复
  backup
    .command('restore <bundle> <target>')
    .description('从 bundle 备份恢复')
    .action(async (bundle: string, target: string) => {
      const spinner = display.createSpinner(`恢复备份到 ${target}...`)
      spinner.start()

      try {
        const manager = new BackupManager()
        const result = await manager.restoreFromBundle(bundle, target)

        spinner.succeed('恢复成功')
        
        display.keyValue('路径', result.path)
        display.keyValue('分支', result.branches.join(', '))
        display.keyValue('标签', result.tags.join(', ') || '无')
      } catch (error: any) {
        spinner.fail('恢复失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出备份
  backup
    .command('list [dir]')
    .alias('ls')
    .description('列出现有备份')
    .action(async (dir?: string) => {
      const spinner = display.createSpinner('查找备份...')
      spinner.start()

      try {
        const manager = new BackupManager()
        const backups = await manager.listBackups(dir)

        spinner.succeed(`找到 ${backups.length} 个备份`)

        if (backups.length === 0) {
          display.info('没有找到备份文件')
          return
        }

        const table = display.createTable(['ID', '大小', '日期'])

        for (const b of backups) {
          table.push([
            b.id,
            formatSize(b.size),
            b.timestamp.toLocaleString()
          ])
        }

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('列出备份失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 验证备份
  backup
    .command('verify <bundle>')
    .description('验证 bundle 备份')
    .action(async (bundle: string) => {
      const spinner = display.createSpinner('验证备份...')
      spinner.start()

      try {
        const manager = new BackupManager()
        const result = await manager.verifyBundle(bundle)

        if (result.valid) {
          spinner.succeed('备份有效')
          
          if (result.refs && result.refs.length > 0) {
            display.title('包含的引用')
            for (const ref of result.refs.slice(0, 10)) {
              console.log(`  ${display.colors.dim('•')} ${ref}`)
            }
            if (result.refs.length > 10) {
              display.info(`... 还有 ${result.refs.length - 10} 个引用`)
            }
          }
        } else {
          spinner.fail('备份无效或已损坏')
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('验证失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清理旧备份
  backup
    .command('cleanup [dir]')
    .description('清理旧备份')
    .option('-k, --keep <n>', '保留的备份数量', '5')
    .action(async (dir: string | undefined, options) => {
      const spinner = display.createSpinner('清理旧备份...')
      spinner.start()

      try {
        const manager = new BackupManager()
        const keep = parseInt(options.keep) || 5
        const deleted = await manager.cleanupBackups(dir, keep)

        if (deleted.length === 0) {
          spinner.succeed('没有需要清理的备份')
        } else {
          spinner.succeed(`清理了 ${deleted.length} 个旧备份`)
          
          for (const d of deleted) {
            console.log(`  ${display.colors.dim('•')} ${d}`)
          }
        }
      } catch (error: any) {
        spinner.fail('清理失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 自动备份
  backup
    .command('auto')
    .description('自动备份（如果需要）')
    .option('-d, --dir <dir>', '备份目录')
    .option('--max-age <days>', '最大备份年龄（天）', '7')
    .option('--min-commits <n>', '最少提交数', '10')
    .action(async (options) => {
      const spinner = display.createSpinner('检查是否需要备份...')
      spinner.start()

      try {
        const manager = new BackupManager()
        const result = await manager.autoBackup({
          backupDir: options.dir,
          maxAge: parseInt(options.maxAge) || 7,
          minCommits: parseInt(options.minCommits) || 10
        })

        if (result) {
          spinner.succeed('已创建新备份')
          display.keyValue('文件', result.path)
          display.keyValue('大小', formatSize(result.size))
        } else {
          spinner.succeed('不需要备份')
        }
      } catch (error: any) {
        spinner.fail('自动备份失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 导出统计
  backup
    .command('stats')
    .description('导出仓库统计信息')
    .action(async () => {
      const spinner = display.createSpinner('收集统计信息...')
      spinner.start()

      try {
        const manager = new BackupManager()
        const stats = await manager.exportStats()

        spinner.succeed('仓库统计')
        
        display.keyValue('总提交数', stats.totalCommits)
        display.keyValue('分支数', stats.branches.length)
        display.keyValue('标签数', stats.tags.length)
        display.keyValue('首次提交', stats.firstCommit)
        display.keyValue('最后提交', stats.lastCommit)
        
        display.newLine()
        display.title('贡献者排行')
        
        const table = display.createTable(['贡献者', '提交数'])
        for (const c of stats.contributors.slice(0, 10)) {
          table.push([c.name, c.commits.toString()])
        }
        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('获取统计失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return backup
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
