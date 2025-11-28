import { Command } from 'commander'
import inquirer from 'inquirer'
import { GitConfigManager } from '@ldesign/git-core'
import type { ConfigScope } from '@ldesign/git-core/types'
import * as display from '../utils/display'

export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Git 配置管理命令')

  // 列出所有配置
  config
    .command('list')
    .alias('ls')
    .description('列出 Git 配置')
    .option('--local', '只显示本地配置')
    .option('--global', '只显示全局配置')
    .option('--system', '只显示系统配置')
    .action(async (options) => {
      const spinner = display.createSpinner('获取配置...')
      spinner.start()

      try {
        const manager = new GitConfigManager()
        
        let scope: ConfigScope | undefined
        if (options.local) scope = 'local'
        else if (options.global) scope = 'global'
        else if (options.system) scope = 'system'

        const configs = await manager.list(scope)

        spinner.succeed('Git 配置')

        const scopeText = scope ? ` (${scope})` : ''
        display.title(`Git 配置${scopeText}`)

        if (Object.keys(configs).length === 0) {
          display.info('没有配置项')
          return
        }

        const table = display.createTable(['配置键', '配置值'])

        Object.entries(configs).forEach(([key, value]) => {
          table.push([
            display.colors.cyan(key),
            value
          ])
        })

        console.log(table.toString())
        display.info(`总共 ${Object.keys(configs).length} 个配置项`)
      } catch (error: any) {
        spinner.fail('获取配置失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 获取配置值
  config
    .command('get <key>')
    .description('获取指定配置的值')
    .option('--local', '从本地配置获取')
    .option('--global', '从全局配置获取')
    .option('--system', '从系统配置获取')
    .action(async (key, options) => {
      const spinner = display.createSpinner(`获取配置 ${key}...`)
      spinner.start()

      try {
        const manager = new GitConfigManager()
        
        let scope: ConfigScope | undefined
        if (options.local) scope = 'local'
        else if (options.global) scope = 'global'
        else if (options.system) scope = 'system'

        const value = await manager.get(key, scope)

        spinner.succeed(`配置值: ${key}`)

        display.keyValue(key, display.colors.cyan(value))
      } catch (error: any) {
        spinner.fail('获取配置失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 设置配置值
  config
    .command('set <key> <value>')
    .description('设置配置值')
    .option('--local', '设置到本地配置（默认）')
    .option('--global', '设置到全局配置')
    .option('--system', '设置到系统配置')
    .action(async (key, value, options) => {
      const spinner = display.createSpinner(`设置配置 ${key}...`)
      spinner.start()

      try {
        const manager = new GitConfigManager()
        
        let scope: ConfigScope = 'local'
        if (options.global) scope = 'global'
        else if (options.system) scope = 'system'

        await manager.set(key, value, scope)

        spinner.succeed(`成功设置配置 ${display.colors.cyan(key)}`)
        display.keyValue('作用域', scope)
        display.keyValue('值', value)
      } catch (error: any) {
        spinner.fail('设置配置失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除配置
  config
    .command('unset <key>')
    .description('删除指定配置')
    .option('--local', '从本地配置删除（默认）')
    .option('--global', '从全局配置删除')
    .option('--system', '从系统配置删除')
    .action(async (key, options) => {
      // 确认删除
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要删除配置 ${display.colors.yellow(key)} 吗？`,
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消删除')
        return
      }

      const spinner = display.createSpinner(`删除配置 ${key}...`)
      spinner.start()

      try {
        const manager = new GitConfigManager()
        
        let scope: ConfigScope = 'local'
        if (options.global) scope = 'global'
        else if (options.system) scope = 'system'

        await manager.unset(key, scope)

        spinner.succeed(`成功删除配置 ${display.colors.cyan(key)}`)
      } catch (error: any) {
        spinner.fail('删除配置失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 配置用户信息（交互式）
  config
    .command('user')
    .description('配置用户信息（交互式）')
    .option('--global', '设置到全局配置')
    .action(async (options) => {
      try {
        const manager = new GitConfigManager()
        const scope: ConfigScope = options.global ? 'global' : 'local'

        // 获取当前用户信息
        let currentUser
        try {
          currentUser = await manager.getUserInfo(scope)
        } catch {
          currentUser = { name: '', email: '' }
        }

        display.title(`配置用户信息 (${scope})`)

        if (currentUser.name || currentUser.email) {
          display.info('当前配置:')
          if (currentUser.name) {
            display.keyValue('  用户名', currentUser.name)
          }
          if (currentUser.email) {
            display.keyValue('  邮箱', currentUser.email)
          }
          display.newLine()
        }

        // 交互式输入
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '用户名:',
            default: currentUser.name,
            validate: (input) => {
              if (!input.trim()) {
                return '用户名不能为空'
              }
              return true
            }
          },
          {
            type: 'input',
            name: 'email',
            message: '邮箱:',
            default: currentUser.email,
            validate: (input) => {
              if (!input.trim()) {
                return '邮箱不能为空'
              }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
                return '邮箱格式不正确'
              }
              return true
            }
          }
        ])

        const spinner = display.createSpinner('保存用户信息...')
        spinner.start()

        await manager.setUserInfo(answers.name, answers.email, scope)

        spinner.succeed('用户信息配置成功')

        display.newLine()
        display.keyValue('用户名', display.colors.cyan(answers.name))
        display.keyValue('邮箱', display.colors.cyan(answers.email))
        display.keyValue('作用域', scope)
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看配置文件路径
  config
    .command('path')
    .description('查看配置文件路径')
    .option('--local', '本地配置文件路径')
    .option('--global', '全局配置文件路径')
    .option('--system', '系统配置文件路径')
    .action(async (options) => {
      try {
        const manager = new GitConfigManager()

        display.title('Git 配置文件路径')

        if (options.local || (!options.global && !options.system)) {
          try {
            const localPath = await manager.getConfigPath('local')
            display.keyValue('本地配置', localPath)
          } catch (e) {
            display.keyValue('本地配置', display.colors.dim('未初始化'))
          }
        }

        if (options.global || (!options.local && !options.system)) {
          try {
            const globalPath = await manager.getConfigPath('global')
            display.keyValue('全局配置', globalPath)
          } catch (e) {
            display.keyValue('全局配置', display.colors.dim('未找到'))
          }
        }

        if (options.system || (!options.local && !options.global)) {
          try {
            const systemPath = await manager.getConfigPath('system')
            display.keyValue('系统配置', systemPath)
          } catch (e) {
            display.keyValue('系统配置', display.colors.dim('未找到'))
          }
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出所有配置（含作用域）
  config
    .command('list-all')
    .description('列出所有配置（包含作用域信息）')
    .action(async () => {
      const spinner = display.createSpinner('获取所有配置...')
      spinner.start()

      try {
        const manager = new GitConfigManager()
        const allConfigs = await manager.listAll()

        spinner.succeed('所有 Git 配置')

        if (allConfigs.length === 0) {
          display.info('没有配置项')
          return
        }

        display.title('所有 Git 配置')

        const table = display.createTable(['作用域', '配置键', '配置值'])

        allConfigs.forEach(config => {
          const scopeColor = 
            config.scope === 'local' ? display.colors.cyan :
            config.scope === 'global' ? display.colors.magenta :
            display.colors.dim

          table.push([
            scopeColor(config.scope),
            config.key,
            config.value
          ])
        })

        console.log(table.toString())
        display.info(`总共 ${allConfigs.length} 个配置项`)
      } catch (error: any) {
        spinner.fail('获取配置失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return config
}