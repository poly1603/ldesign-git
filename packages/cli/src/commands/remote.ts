import { Command } from 'commander'
import inquirer from 'inquirer'
import { RemoteManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createRemoteCommand(): Command {
  const remote = new Command('remote')
    .description('远程仓库管理命令')

  // 列出所有远程仓库
  remote
    .command('list')
    .alias('ls')
    .description('列出所有远程仓库')
    .option('-v, --verbose', '显示详细信息（URL）')
    .action(async (options) => {
      const spinner = display.createSpinner('获取远程仓库列表...')
      spinner.start()

      try {
        const manager = new RemoteManager()
        const remotes = await manager.list()

        spinner.succeed('远程仓库列表')

        if (remotes.length === 0) {
          display.info('没有配置远程仓库')
          return
        }

        display.title('远程仓库')

        if (options.verbose) {
          // 详细模式：显示 fetch 和 push URL
          const table = display.createTable(['名称', '类型', 'URL'])
          
          remotes.forEach(remote => {
            table.push([
              display.colors.cyan(remote.name),
              remote.type === 'fetch' ? 'Fetch' : 'Push',
              remote.url
            ])
          })
          
          console.log(table.toString())
        } else {
          // 简洁模式：只显示远程名称和 fetch URL
          const table = display.createTable(['名称', 'URL'])
          const uniqueRemotes = new Map<string, string>()
          
          // 只保留 fetch URL
          remotes.forEach(remote => {
            if (remote.type === 'fetch') {
              uniqueRemotes.set(remote.name, remote.url)
            }
          })
          
          uniqueRemotes.forEach((url, name) => {
            table.push([display.colors.cyan(name), url])
          })
          
          console.log(table.toString())
        }

        const uniqueNames = new Set(remotes.map(r => r.name))
        display.info(`总共 ${uniqueNames.size} 个远程仓库`)
      } catch (error: any) {
        spinner.fail('获取远程仓库列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 添加远程仓库
  remote
    .command('add <name> <url>')
    .description('添加远程仓库')
    .action(async (name, url) => {
      const spinner = display.createSpinner(`添加远程仓库 ${name}...`)
      spinner.start()

      try {
        const manager = new RemoteManager()
        
        // 验证远程是否已存在
        const exists = await manager.exists(name)
        if (exists) {
          spinner.fail('添加失败')
          display.error(`远程仓库 ${name} 已存在`)
          process.exit(1)
        }

        await manager.add(name, url)
        spinner.succeed(`成功添加远程仓库 ${display.colors.cyan(name)}`)
        display.info(`URL: ${url}`)
      } catch (error: any) {
        spinner.fail('添加远程仓库失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除远程仓库
  remote
    .command('remove <name>')
    .alias('rm')
    .description('删除远程仓库')
    .action(async (name) => {
      // 确认删除
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要删除远程仓库 ${display.colors.yellow(name)} 吗？`,
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消删除')
        return
      }

      const spinner = display.createSpinner(`删除远程仓库 ${name}...`)
      spinner.start()

      try {
        const manager = new RemoteManager()
        await manager.remove(name)
        spinner.succeed(`成功删除远程仓库 ${display.colors.cyan(name)}`)
      } catch (error: any) {
        spinner.fail('删除远程仓库失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 重命名远程仓库
  remote
    .command('rename <oldName> <newName>')
    .description('重命名远程仓库')
    .action(async (oldName, newName) => {
      const spinner = display.createSpinner(`重命名远程仓库 ${oldName} -> ${newName}...`)
      spinner.start()

      try {
        const manager = new RemoteManager()
        await manager.rename(oldName, newName)
        spinner.succeed(
          `成功重命名：${display.colors.cyan(oldName)} → ${display.colors.cyan(newName)}`
        )
      } catch (error: any) {
        spinner.fail('重命名远程仓库失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 显示远程仓库详情
  remote
    .command('show <name>')
    .description('显示远程仓库详情')
    .action(async (name) => {
      const spinner = display.createSpinner(`获取远程仓库 ${name} 的详情...`)
      spinner.start()

      try {
        const manager = new RemoteManager()
        const info = await manager.show(name)

        spinner.succeed(`远程仓库详情: ${name}`)

        display.title(`远程仓库: ${name}`)
        console.log(info)
      } catch (error: any) {
        spinner.fail('获取远程仓库详情失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 设置远程 URL
  remote
    .command('set-url <name> <url>')
    .description('设置远程仓库 URL')
    .option('--push', '仅设置 push URL')
    .action(async (name, url, options) => {
      const type = options.push ? 'push' : undefined
      const spinner = display.createSpinner(`设置远程仓库 ${name} 的 URL...`)
      spinner.start()

      try {
        const manager = new RemoteManager()
        await manager.setUrl(name, url, type)
        
        const urlType = type === 'push' ? 'Push' : 'Fetch'
        spinner.succeed(`成功设置 ${display.colors.cyan(name)} 的 ${urlType} URL`)
        display.info(`URL: ${url}`)
      } catch (error: any) {
        spinner.fail('设置 URL 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 拉取远程更新
  remote
    .command('fetch <name>')
    .description('拉取远程仓库的更新')
    .option('--prune', '清理已删除的远程分支')
    .option('--tags', '拉取所有标签')
    .action(async (name, options) => {
      const spinner = display.createSpinner(`从 ${name} 拉取更新...`)
      spinner.start()

      try {
        const manager = new RemoteManager()
        await manager.fetch(name, {
          prune: options.prune,
          tags: options.tags
        })

        spinner.succeed(`成功从 ${display.colors.cyan(name)} 拉取更新`)
        
        if (options.prune) {
          display.info('已清理远程分支')
        }
        if (options.tags) {
          display.info('已拉取所有标签')
        }
      } catch (error: any) {
        spinner.fail('拉取更新失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清理远程分支
  remote
    .command('prune <name>')
    .description('清理已删除的远程分支')
    .action(async (name) => {
      const spinner = display.createSpinner(`清理 ${name} 的远程分支...`)
      spinner.start()

      try {
        const manager = new RemoteManager()
        await manager.prune(name)
        spinner.succeed(`成功清理 ${display.colors.cyan(name)} 的远程分支`)
      } catch (error: any) {
        spinner.fail('清理远程分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 获取默认远程
  remote
    .command('get-default')
    .description('获取默认远程仓库')
    .action(async () => {
      const spinner = display.createSpinner('获取默认远程仓库...')
      spinner.start()

      try {
        const manager = new RemoteManager()
        const defaultRemote = await manager.getDefault()

        spinner.succeed('默认远程仓库')

        if (defaultRemote) {
          display.keyValue('默认远程', display.colors.cyan(defaultRemote))
        } else {
          display.info('未设置默认远程仓库（通常为 origin）')
        }
      } catch (error: any) {
        spinner.fail('获取默认远程仓库失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return remote
}