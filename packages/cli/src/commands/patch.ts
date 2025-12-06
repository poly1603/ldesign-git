import { Command } from 'commander'
import { PatchManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createPatchCommand(): Command {
  const patch = new Command('patch')
    .description('Git 补丁管理')

  // 创建补丁
  patch
    .command('create <range>')
    .description('创建补丁文件')
    .option('-o, --output <dir>', '输出目录')
    .option('--stdout', '输出到标准输出')
    .action(async (range: string, options) => {
      const spinner = display.createSpinner(`创建补丁: ${range}...`)
      spinner.start()

      try {
        const manager = new PatchManager()
        const patches = await manager.create(range, {
          output: options.output,
          stdout: options.stdout
        })

        if (options.stdout) {
          spinner.stop()
          // stdout 模式直接输出
          return
        }

        spinner.succeed(`创建了 ${patches.length} 个补丁`)
        
        for (const p of patches) {
          console.log(`  ${display.colors.success('✓')} ${p.filename}`)
          console.log(`    ${display.colors.dim(p.subject)}`)
        }
      } catch (error: any) {
        spinner.fail('创建补丁失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 从工作区创建补丁
  patch
    .command('diff')
    .description('从工作区更改创建补丁')
    .option('-s, --staged', '仅包含暂存的更改')
    .option('-o, --output <file>', '输出文件')
    .action(async (options) => {
      const spinner = display.createSpinner('创建补丁...')
      spinner.start()

      try {
        const manager = new PatchManager()
        const result = await manager.createFromWorking({
          staged: options.staged,
          output: options.output
        })

        if (options.output) {
          spinner.succeed(`补丁已保存到: ${result}`)
        } else {
          spinner.stop()
          console.log(result)
        }
      } catch (error: any) {
        spinner.fail('创建补丁失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 应用补丁
  patch
    .command('apply <file>')
    .description('应用补丁')
    .option('-3, --three-way', '使用三方合并')
    .option('-R, --reverse', '反向应用')
    .option('--check', '仅检查是否可以应用')
    .action(async (file: string, options) => {
      const spinner = display.createSpinner(`应用补丁: ${file}...`)
      spinner.start()

      try {
        const manager = new PatchManager()
        const result = await manager.apply(file, {
          check: options.check,
          threeWay: options.threeWay,
          reverse: options.reverse
        })

        if (options.check) {
          if (result.success) {
            spinner.succeed('补丁可以应用')
          } else {
            spinner.fail('补丁无法应用')
            if (result.conflicts) {
              display.list(result.conflicts)
            }
            process.exit(1)
          }
          return
        }

        if (result.success) {
          spinner.succeed('补丁应用成功')
        } else {
          spinner.fail('补丁应用失败')
          if (result.conflicts) {
            display.warning('冲突:')
            display.list(result.conflicts)
          }
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('应用补丁失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 使用 git am 应用
  patch
    .command('am <file>')
    .description('使用 git am 应用补丁（作为提交）')
    .option('-3, --three-way', '使用三方合并')
    .option('-s, --signoff', '添加签名')
    .action(async (file: string, options) => {
      const spinner = display.createSpinner(`应用补丁: ${file}...`)
      spinner.start()

      try {
        const manager = new PatchManager()
        const result = await manager.am(file, {
          threeWay: options.threeWay,
          signoff: options.signoff
        })

        if (result.success) {
          spinner.succeed('补丁应用成功')
        } else {
          spinner.fail('补丁应用失败')
          if (result.conflicts) {
            display.warning('冲突:')
            display.list(result.conflicts)
            display.newLine()
            display.info('解决冲突后运行: lgit patch am-continue')
          }
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('应用补丁失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 继续 git am
  patch
    .command('am-continue')
    .description('继续 git am')
    .action(async () => {
      const spinner = display.createSpinner('继续应用补丁...')
      spinner.start()

      try {
        const manager = new PatchManager()
        const result = await manager.amContinue()

        if (result.success) {
          spinner.succeed('补丁应用成功')
        } else {
          spinner.fail('仍有冲突需要解决')
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('操作失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 中止 git am
  patch
    .command('am-abort')
    .description('中止 git am')
    .action(async () => {
      const spinner = display.createSpinner('中止...')
      spinner.start()

      try {
        const manager = new PatchManager()
        await manager.amAbort()
        spinner.succeed('已中止')
      } catch (error: any) {
        spinner.fail('中止失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 检查补丁
  patch
    .command('check <file>')
    .description('检查补丁是否可以应用')
    .action(async (file: string) => {
      const spinner = display.createSpinner('检查补丁...')
      spinner.start()

      try {
        const manager = new PatchManager()
        const result = await manager.check(file)

        if (result.canApply) {
          spinner.succeed('补丁可以应用')
        } else {
          spinner.fail('补丁无法应用')
          if (result.issues) {
            display.list(result.issues)
          }
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('检查失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出补丁
  patch
    .command('list [dir]')
    .alias('ls')
    .description('列出目录中的补丁文件')
    .action(async (dir?: string) => {
      const spinner = display.createSpinner('查找补丁文件...')
      spinner.start()

      try {
        const manager = new PatchManager()
        const patches = await manager.listPatches(dir)

        spinner.succeed(`找到 ${patches.length} 个补丁`)

        if (patches.length === 0) {
          return
        }

        const table = display.createTable(['文件', '主题', '文件数', '+/-'])

        for (const p of patches) {
          table.push([
            p.filename,
            p.subject.substring(0, 40),
            p.stats.files.toString(),
            `+${p.stats.additions}/-${p.stats.deletions}`
          ])
        }

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('列出补丁失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 显示补丁信息
  patch
    .command('show <file>')
    .description('显示补丁详细信息')
    .action(async (file: string) => {
      try {
        const manager = new PatchManager()
        const info = await manager.getPatchInfo(file)

        display.title('补丁信息')
        display.keyValue('文件', info.filename)
        display.keyValue('主题', info.subject)
        display.keyValue('作者', info.author)
        display.keyValue('日期', info.date)
        display.keyValue('文件数', info.stats.files)
        display.keyValue('添加', `+${info.stats.additions}`)
        display.keyValue('删除', `-${info.stats.deletions}`)

        display.newLine()
        const stat = await manager.stat(file)
        console.log(stat)
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 反向应用
  patch
    .command('reverse <file>')
    .description('反向应用补丁')
    .action(async (file: string) => {
      const spinner = display.createSpinner(`反向应用: ${file}...`)
      spinner.start()

      try {
        const manager = new PatchManager()
        const result = await manager.reverse(file)

        if (result.success) {
          spinner.succeed('反向应用成功')
        } else {
          spinner.fail('反向应用失败')
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('反向应用失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return patch
}
