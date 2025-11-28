import { Command } from 'commander'
import { MonorepoManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createMonorepoCommand(): Command {
  const monorepo = new Command('monorepo')
    .description('Monorepo 管理命令')

  // 发现包
  monorepo
    .command('discover')
    .description('发现 monorepo 中的所有包')
    .action(async () => {
      const spinner = display.createSpinner('发现包...')
      spinner.start()

      try {
        const manager = new MonorepoManager()
        const packages = await manager.discoverPackages()

        spinner.succeed('包发现完成')

        if (packages.length === 0) {
          display.info('没有发现包')
          return
        }

        display.title('Monorepo 包')

        const table = display.createTable(['包名', '路径', '版本'])

        packages.forEach(pkg => {
          table.push([
            display.colors.cyan(pkg.name),
            pkg.path,
            display.colors.dim(pkg.version)
          ])
        })

        console.log(table.toString())
        display.info(`总共 ${packages.length} 个包`)
      } catch (error: any) {
        spinner.fail('发现包失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 检测变更的包
  monorepo
    .command('changed')
    .description('检测变更的包')
    .option('--since <ref>', '相对于指定提交的变更', 'HEAD~1')
    .action(async (options) => {
      const spinner = display.createSpinner('检测变更的包...')
      spinner.start()

      try {
        const manager = new MonorepoManager()
        const changed = await manager.detectChangedPackages(options.since)

        spinner.succeed('变更检测完成')

        if (changed.length === 0) {
          display.info('没有变更的包')
          return
        }

        display.title(`变更的包 (since ${options.since})`)

        const table = display.createTable(['包名', '变更类型', '文件数'])

        changed.forEach(pkg => {
          const changeType = pkg.changeType || 'unknown'
          const fileCount = pkg.changedFiles?.length || 0
          
          table.push([
            display.colors.cyan(pkg.name),
            changeType,
            fileCount.toString()
          ])
        })

        console.log(table.toString())
        display.info(`总共 ${changed.length} 个包有变更`)
      } catch (error: any) {
        spinner.fail('检测变更失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 获取受影响的包
  monorepo
    .command('affected <package>')
    .description('获取受指定包影响的所有包')
    .action(async (packageName) => {
      const spinner = display.createSpinner(`分析 ${packageName} 的影响...`)
      spinner.start()

      try {
        const manager = new MonorepoManager()
        const affected = await manager.getAffectedPackages([packageName])

        spinner.succeed('影响分析完成')

        display.title(`受 ${packageName} 影响的包`)

        if (affected.length === 0) {
          display.info('没有受影响的包')
          return
        }

        display.list(affected.map(name => display.colors.cyan(name)))
        display.info(`总共 ${affected.length} 个包受影响`)
      } catch (error: any) {
        spinner.fail('分析影响失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 版本升级
  monorepo
    .command('bump <package> <type>')
    .description('升级包版本 (major/minor/patch)')
    .action(async (packageName, bumpType) => {
      if (!['major', 'minor', 'patch'].includes(bumpType)) {
        display.error('无效的版本类型，必须是 major、minor 或 patch')
        process.exit(1)
      }

      const spinner = display.createSpinner(`升级 ${packageName} 版本...`)
      spinner.start()

      try {
        const manager = new MonorepoManager()
        const result = await manager.bumpVersion(
          packageName,
          bumpType as 'major' | 'minor' | 'patch'
        )

        spinner.succeed('版本升级成功')

        display.title('版本升级结果')
        result.forEach(item => {
          display.keyValue(
            item.package,
            `${display.colors.dim(item.oldVersion)} → ${display.colors.cyan(item.newVersion)}`
          )
        })
      } catch (error: any) {
        spinner.fail('版本升级失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 依赖图
  monorepo
    .command('graph')
    .description('显示包依赖关系图')
    .option('--json', '输出 JSON 格式')
    .action(async (options) => {
      const spinner = display.createSpinner('构建依赖图...')
      spinner.start()

      try {
        const manager = new MonorepoManager()
        const graph = await manager.getDependencyGraph()

        spinner.succeed('依赖图构建完成')

        if (options.json) {
          console.log(JSON.stringify(graph, null, 2))
          return
        }

        display.title('包依赖关系图')

        Object.entries(graph).forEach(([pkg, deps]) => {
          if (deps.length > 0) {
            console.log(`${display.colors.cyan(pkg)} 依赖于:`)
            deps.forEach(dep => {
              console.log(`  ${display.colors.dim('→')} ${dep}`)
            })
            display.newLine()
          }
        })
      } catch (error: any) {
        spinner.fail('构建依赖图失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 发布顺序
  monorepo
    .command('publish-order')
    .description('计算包的发布顺序')
    .action(async () => {
      const spinner = display.createSpinner('计算发布顺序...')
      spinner.start()

      try {
        const manager = new MonorepoManager()
        const order = await manager.getPublishOrder()

        spinner.succeed('发布顺序计算完成')

        display.title('推荐的发布顺序')

        order.forEach((pkg, index) => {
          console.log(`${display.colors.dim(`${index + 1}.`)} ${display.colors.cyan(pkg)}`)
        })

        display.newLine()
        display.info('按此顺序发布可确保依赖关系正确')
      } catch (error: any) {
        spinner.fail('计算发布顺序失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return monorepo
}