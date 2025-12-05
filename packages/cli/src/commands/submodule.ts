import { Command } from 'commander'
import { SubmoduleManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createSubmoduleCommand(): Command {
  const submodule = new Command('submodule')
    .alias('sm')
    .description('子模块管理')

  // 列出所有子模块
  submodule
    .command('list')
    .alias('ls')
    .description('列出所有子模块')
    .action(async () => {
      const spinner = display.createSpinner('获取子模块列表...')
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        const submodules = await manager.listSubmodules()

        spinner.succeed('子模块列表')

        if (submodules.length === 0) {
          display.info('没有找到子模块')
          return
        }

        const table = display.createTable(['名称', '路径', '分支', '状态', 'Commit'])

        for (const sub of submodules) {
          const statusColor = getStatusColor(sub.status)
          table.push([
            sub.name,
            sub.path,
            sub.branch || '-',
            statusColor(sub.status),
            sub.commit.substring(0, 7)
          ])
        }

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('获取子模块列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 添加子模块
  submodule
    .command('add <url> <path>')
    .description('添加子模块')
    .option('-b, --branch <branch>', '指定分支')
    .option('-f, --force', '强制添加')
    .option('--depth <depth>', '克隆深度', parseInt)
    .action(async (url: string, path: string, options) => {
      const spinner = display.createSpinner(`添加子模块 ${path}...`)
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        await manager.addSubmodule(url, path, {
          branch: options.branch,
          force: options.force,
          depth: options.depth
        })

        spinner.succeed(`子模块 ${path} 添加成功`)
        display.box(`URL: ${url}\n路径: ${path}${options.branch ? `\n分支: ${options.branch}` : ''}`, {
          title: '子模块已添加',
          type: 'success'
        })
      } catch (error: any) {
        spinner.fail('添加子模块失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 初始化子模块
  submodule
    .command('init')
    .description('初始化子模块')
    .option('-r, --recursive', '递归初始化')
    .action(async (options) => {
      const spinner = display.createSpinner('初始化子模块...')
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        await manager.initSubmodules(options.recursive)

        spinner.succeed('子模块初始化成功')
      } catch (error: any) {
        spinner.fail('初始化子模块失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 更新子模块
  submodule
    .command('update [path]')
    .description('更新子模块')
    .option('-r, --recursive', '递归更新')
    .option('-f, --force', '强制更新')
    .option('--remote', '更新到远程最新')
    .action(async (path: string | undefined, options) => {
      const spinner = display.createSpinner(path ? `更新子模块 ${path}...` : '更新所有子模块...')
      spinner.start()

      try {
        const manager = new SubmoduleManager()

        if (options.remote) {
          await manager.updateSubmodulesToLatest()
        } else if (path) {
          await manager.updateSubmodule(path, {
            recursive: options.recursive,
            force: options.force
          })
        } else {
          await manager.updateSubmodules({
            recursive: options.recursive,
            force: options.force
          })
        }

        spinner.succeed(path ? `子模块 ${path} 更新成功` : '所有子模块更新成功')
      } catch (error: any) {
        spinner.fail('更新子模块失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除子模块
  submodule
    .command('remove <path>')
    .alias('rm')
    .description('删除子模块')
    .action(async (path: string) => {
      const spinner = display.createSpinner(`删除子模块 ${path}...`)
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        await manager.removeSubmodule(path)

        spinner.succeed(`子模块 ${path} 删除成功`)
      } catch (error: any) {
        spinner.fail('删除子模块失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 同步子模块
  submodule
    .command('sync')
    .description('同步子模块 URL')
    .action(async () => {
      const spinner = display.createSpinner('同步子模块...')
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        await manager.syncSubmodules()

        spinner.succeed('子模块同步成功')
      } catch (error: any) {
        spinner.fail('同步子模块失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 拉取所有子模块
  submodule
    .command('pull')
    .description('拉取所有子模块的最新代码')
    .action(async () => {
      const spinner = display.createSpinner('拉取子模块...')
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        await manager.pullAllSubmodules()

        spinner.succeed('所有子模块拉取成功')
      } catch (error: any) {
        spinner.fail('拉取子模块失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看子模块状态摘要
  submodule
    .command('summary')
    .description('查看子模块状态摘要')
    .action(async () => {
      const spinner = display.createSpinner('获取子模块摘要...')
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        const summary = await manager.getSubmodulesSummary()

        spinner.succeed('子模块摘要')

        if (summary.trim()) {
          console.log(summary)
        } else {
          display.info('子模块没有变更')
        }
      } catch (error: any) {
        spinner.fail('获取子模块摘要失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 检查子模块是否有未提交的更改
  submodule
    .command('status')
    .alias('st')
    .description('检查子模块状态')
    .action(async () => {
      const spinner = display.createSpinner('检查子模块状态...')
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        const hasChanges = await manager.hasUncommittedChanges()
        const submodules = await manager.listSubmodules()

        spinner.succeed('子模块状态')

        if (submodules.length === 0) {
          display.info('没有找到子模块')
          return
        }

        display.newLine()
        if (hasChanges) {
          display.warning('存在未提交的更改')
        } else {
          display.success('所有子模块工作区干净')
        }

        display.newLine()
        display.title('子模块详情')

        const table = display.createTable(['路径', '状态', '分支', 'Commit'])

        for (const sub of submodules) {
          const statusColor = getStatusColor(sub.status)
          table.push([
            sub.path,
            statusColor(sub.status),
            sub.branch || '-',
            sub.commit.substring(0, 7)
          ])
        }

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('检查子模块状态失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 在子模块中执行命令
  submodule
    .command('foreach <command>')
    .description('在所有子模块中执行命令')
    .action(async (command: string) => {
      const spinner = display.createSpinner(`在子模块中执行: ${command}`)
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        const result = await manager.foreachSubmodule(command)

        spinner.succeed('命令执行完成')
        console.log(result)
      } catch (error: any) {
        spinner.fail('执行命令失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 设置子模块分支
  submodule
    .command('set-branch <path> <branch>')
    .description('设置子模块的跟踪分支')
    .action(async (path: string, branch: string) => {
      const spinner = display.createSpinner(`设置子模块 ${path} 的分支为 ${branch}...`)
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        await manager.setSubmoduleBranch(path, branch)

        spinner.succeed(`子模块 ${path} 的分支已设置为 ${branch}`)
      } catch (error: any) {
        spinner.fail('设置分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 克隆包含子模块的仓库
  submodule
    .command('clone <url> [path]')
    .description('克隆包含子模块的仓库')
    .action(async (url: string, localPath?: string) => {
      const targetPath = localPath || url.split('/').pop()?.replace('.git', '') || 'repo'
      const spinner = display.createSpinner(`克隆仓库到 ${targetPath}...`)
      spinner.start()

      try {
        const manager = new SubmoduleManager()
        await manager.cloneWithSubmodules(url, targetPath)

        spinner.succeed(`仓库已克隆到 ${targetPath}（包含子模块）`)
      } catch (error: any) {
        spinner.fail('克隆失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return submodule
}

function getStatusColor(status: string) {
  switch (status) {
    case 'initialized':
    case 'up-to-date':
      return display.colors.success
    case 'modified':
      return display.colors.warning
    case 'uninitialized':
      return display.colors.error
    default:
      return display.colors.info
  }
}
