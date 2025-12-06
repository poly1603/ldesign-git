import { Command } from 'commander'
import inquirer from 'inquirer'
import { AliasManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createAliasCommand(): Command {
  const alias = new Command('alias')
    .description('Git 别名管理')

  // 列出别名
  alias
    .command('list')
    .alias('ls')
    .description('列出所有别名')
    .option('-g, --global', '仅显示全局别名')
    .option('-l, --local', '仅显示本地别名')
    .action(async (options) => {
      const spinner = display.createSpinner('获取别名列表...')
      spinner.start()

      try {
        const manager = new AliasManager()
        const scope = options.global ? 'global' : options.local ? 'local' : undefined
        const aliases = await manager.list(scope)

        spinner.succeed('Git 别名')

        if (aliases.length === 0) {
          display.info('没有配置别名')
          return
        }

        const table = display.createTable(['别名', '命令', '作用域'])

        for (const a of aliases) {
          table.push([
            display.colors.cyan(a.name),
            a.command,
            a.scope
          ])
        }

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('获取别名失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 添加别名
  alias
    .command('add <name> <command>')
    .description('添加别名')
    .option('-g, --global', '添加为全局别名')
    .action(async (name: string, command: string, options) => {
      const spinner = display.createSpinner(`添加别名 ${name}...`)
      spinner.start()

      try {
        const manager = new AliasManager()
        
        // 检查是否已存在
        const existing = await manager.get(name)
        if (existing) {
          spinner.warn(`别名 ${name} 已存在`)
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: '是否覆盖？',
              default: false
            }
          ])
          
          if (!overwrite) {
            display.info('操作已取消')
            return
          }
        }

        await manager.add(name, command, { global: options.global })
        spinner.succeed(`别名已添加: ${name} -> ${command}`)
      } catch (error: any) {
        spinner.fail('添加别名失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除别名
  alias
    .command('remove <name>')
    .alias('rm')
    .description('删除别名')
    .option('-g, --global', '删除全局别名')
    .action(async (name: string, options) => {
      const spinner = display.createSpinner(`删除别名 ${name}...`)
      spinner.start()

      try {
        const manager = new AliasManager()
        await manager.remove(name, { global: options.global })
        spinner.succeed(`别名 ${name} 已删除`)
      } catch (error: any) {
        spinner.fail('删除别名失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 搜索别名
  alias
    .command('search <keyword>')
    .description('搜索别名')
    .action(async (keyword: string) => {
      const spinner = display.createSpinner('搜索别名...')
      spinner.start()

      try {
        const manager = new AliasManager()
        const aliases = await manager.search(keyword)

        spinner.succeed(`搜索结果: "${keyword}"`)

        if (aliases.length === 0) {
          display.info('未找到匹配的别名')
          return
        }

        for (const a of aliases) {
          console.log(`  ${display.colors.cyan(a.name)} = ${a.command}`)
        }
      } catch (error: any) {
        spinner.fail('搜索失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 应用模板
  alias
    .command('template [name]')
    .description('应用别名模板')
    .option('-g, --global', '应用为全局别名')
    .option('-l, --list', '列出可用模板')
    .action(async (name: string | undefined, options) => {
      try {
        const manager = new AliasManager()
        const templates = manager.getTemplates()

        if (options.list || !name) {
          display.title('可用的别名模板')
          
          for (const t of templates) {
            console.log(`\n${display.colors.cyan(display.colors.bold(t.name))} - ${t.description}`)
            for (const a of t.aliases) {
              console.log(`  ${display.colors.dim(a.name.padEnd(12))} ${a.description}`)
            }
          }
          return
        }

        const template = templates.find(t => t.name === name)
        if (!template) {
          display.error(`模板 ${name} 不存在`)
          display.info(`可用模板: ${templates.map(t => t.name).join(', ')}`)
          process.exit(1)
        }

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确定应用 ${name} 模板（${template.aliases.length} 个别名）？`,
            default: true
          }
        ])

        if (!confirm) {
          display.info('操作已取消')
          return
        }

        const spinner = display.createSpinner(`应用模板 ${name}...`)
        spinner.start()

        const count = await manager.applyTemplate(name, { global: options.global })
        spinner.succeed(`已添加 ${count} 个别名`)

        display.newLine()
        display.info('已添加的别名:')
        for (const a of template.aliases) {
          console.log(`  ${display.colors.cyan(a.name)} = ${a.command}`)
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 导出别名
  alias
    .command('export')
    .description('导出别名配置')
    .option('-g, --global', '仅导出全局别名')
    .action(async (options) => {
      try {
        const manager = new AliasManager()
        const config = await manager.export(options.global ? 'global' : undefined)
        console.log(config)
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 执行别名
  alias
    .command('run <name> [args...]')
    .description('执行别名命令')
    .action(async (name: string, args: string[]) => {
      try {
        const manager = new AliasManager()
        const result = await manager.run(name, args)
        console.log(result)
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  return alias
}
