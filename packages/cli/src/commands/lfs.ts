import { Command } from 'commander'
import { LFSManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createLFSCommand(): Command {
  const lfs = new Command('lfs')
    .description('Git LFS 管理命令')

  // 安装 LFS
  lfs
    .command('install')
    .description('安装 Git LFS')
    .option('--global', '全局安装')
    .action(async (options) => {
      const spinner = display.createSpinner('安装 Git LFS...')
      spinner.start()

      try {
        const manager = new LFSManager()
        
        // 检查是否已安装
        const isInstalled = await manager.isInstalled()
        if (isInstalled) {
          spinner.succeed('Git LFS 已经安装')
          display.info('无需重复安装')
          return
        }

        await manager.install()

        spinner.succeed('Git LFS 安装成功')
        display.info('LFS 已在当前仓库启用')
      } catch (error: any) {
        spinner.fail('安装 Git LFS 失败')
        display.error(error.message)
        display.info('请确保已安装 Git LFS 客户端：https://git-lfs.github.com/')
        process.exit(1)
      }
    })

  // 跟踪文件类型
  lfs
    .command('track <pattern>')
    .description('跟踪指定文件类型')
    .option('--lockable', '标记文件为可锁定')
    .action(async (pattern, options) => {
      const spinner = display.createSpinner(`跟踪 ${pattern}...`)
      spinner.start()

      try {
        const manager = new LFSManager()
        
        await manager.track(pattern, {
          lockable: options.lockable
        })

        spinner.succeed(`成功跟踪 ${display.colors.cyan(pattern)}`)
        display.info('已更新 .gitattributes 文件')
        
        if (options.lockable) {
          display.info('文件已标记为可锁定')
        }
      } catch (error: any) {
        spinner.fail('跟踪文件类型失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 取消跟踪
  lfs
    .command('untrack <pattern>')
    .description('取消跟踪指定文件类型')
    .action(async (pattern) => {
      const spinner = display.createSpinner(`取消跟踪 ${pattern}...`)
      spinner.start()

      try {
        const manager = new LFSManager()
        await manager.untrack(pattern)

        spinner.succeed(`成功取消跟踪 ${display.colors.cyan(pattern)}`)
      } catch (error: any) {
        spinner.fail('取消跟踪失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出跟踪的文件类型
  lfs
    .command('list-tracked')
    .description('列出所有跟踪的文件类型')
    .action(async () => {
      const spinner = display.createSpinner('获取跟踪列表...')
      spinner.start()

      try {
        const manager = new LFSManager()
        const tracked = await manager.listTracked()

        spinner.succeed('LFS 跟踪列表')

        if (tracked.length === 0) {
          display.info('没有跟踪的文件类型')
          return
        }

        display.title('跟踪的文件类型')
        display.list(tracked.map(p => display.colors.cyan(p)))
        display.info(`总共 ${tracked.length} 个模式`)
      } catch (error: any) {
        spinner.fail('获取跟踪列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出 LFS 文件
  lfs
    .command('list-files')
    .alias('ls')
    .description('列出所有 LFS 文件')
    .action(async () => {
      const spinner = display.createSpinner('获取 LFS 文件列表...')
      spinner.start()

      try {
        const manager = new LFSManager()
        const files = await manager.listFiles()

        spinner.succeed('LFS 文件列表')

        if (files.length === 0) {
          display.info('没有 LFS 文件')
          return
        }

        display.title('LFS 文件')

        const table = display.createTable(['文件', 'OID', '大小'])

        files.forEach(file => {
          table.push([
            file.path,
            display.colors.dim(file.oid.substring(0, 12) + '...'),
            formatSize(file.size)
          ])
        })

        console.log(table.toString())
        display.info(`总共 ${files.length} 个 LFS 文件`)
      } catch (error: any) {
        spinner.fail('获取文件列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // Pull LFS 文件
  lfs
    .command('pull')
    .description('拉取 LFS 文件')
    .option('-I, --include <pattern>', '包含特定文件')
    .option('-X, --exclude <pattern>', '排除特定文件')
    .action(async (options) => {
      const spinner = display.createSpinner('拉取 LFS 文件...')
      spinner.start()

      try {
        const manager = new LFSManager()
        
        await manager.pull({
          include: options.include,
          exclude: options.exclude
        })

        spinner.succeed('成功拉取 LFS 文件')
      } catch (error: any) {
        spinner.fail('拉取 LFS 文件失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // Push LFS 文件
  lfs
    .command('push [remote] [branch]')
    .description('推送 LFS 文件')
    .action(async (remote = 'origin', branch = 'HEAD') => {
      const spinner = display.createSpinner('推送 LFS 文件...')
      spinner.start()

      try {
        const manager = new LFSManager()
        
        await manager.push(remote, branch)

        spinner.succeed('成功推送 LFS 文件')
      } catch (error: any) {
        spinner.fail('推送 LFS 文件失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // Prune LFS 文件
  lfs
    .command('prune')
    .description('清理旧的 LFS 文件')
    .option('--dry-run', '只显示将要删除的文件')
    .option('--verify-remote', '验证远程文件')
    .action(async (options) => {
      const spinner = display.createSpinner('清理 LFS 文件...')
      spinner.start()

      try {
        const manager = new LFSManager()
        
        await manager.prune({
          dryRun: options.dryRun,
          verifyRemote: options.verifyRemote
        })

        if (options.dryRun) {
          spinner.succeed('预览模式：显示将要删除的文件')
        } else {
          spinner.succeed('成功清理 LFS 文件')
        }
      } catch (error: any) {
        spinner.fail('清理失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // LFS 状态
  lfs
    .command('status')
    .description('显示 LFS 状态')
    .action(async () => {
      const spinner = display.createSpinner('获取 LFS 状态...')
      spinner.start()

      try {
        const manager = new LFSManager()
        const status = await manager.getStatus()

        spinner.succeed('LFS 状态')

        display.title('Git LFS 状态')
        
        // 简化状态显示
        const files = await manager.listFiles()
        display.keyValue('LFS 文件总数', files.length)
        
        const totalSize = files.reduce((sum, f) => sum + f.size, 0)
        display.keyValue('总大小', formatSize(totalSize))
      } catch (error: any) {
        spinner.fail('获取状态失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return lfs
}

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
}