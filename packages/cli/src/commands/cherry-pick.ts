import { Command } from 'commander'
import inquirer from 'inquirer'
import { CherryPickManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createCherryPickCommand(): Command {
  const cp = new Command('cherry-pick')
    .alias('cp')
    .description('Cherry-pick 操作')

  // 挑选单个提交
  cp
    .command('pick <commit>')
    .description('挑选提交')
    .option('-n, --no-commit', '不自动提交')
    .option('-e, --edit', '编辑提交信息')
    .option('-s, --signoff', '添加签名')
    .option('-m, --mainline <n>', '合并提交的父编号', parseInt)
    .action(async (commit: string, options) => {
      const spinner = display.createSpinner(`Cherry-pick ${commit}...`)
      spinner.start()

      try {
        const manager = new CherryPickManager()
        
        // 预览
        const preview = await manager.preview(commit)
        spinner.info('提交信息')
        
        display.keyValue('提交', preview.commit.substring(0, 7))
        display.keyValue('作者', preview.author)
        display.keyValue('信息', preview.message)
        display.keyValue('文件', `${preview.files.length} 个文件`)
        display.keyValue('变更', `+${preview.additions} -${preview.deletions}`)
        
        display.newLine()
        
        spinner.start('执行 cherry-pick...')
        
        const result = await manager.pick(commit, {
          noCommit: options.noCommit,
          edit: options.edit,
          signoff: options.signoff,
          mainline: options.mainline
        })

        if (result.success) {
          spinner.succeed(`Cherry-pick 成功: ${commit}`)
        } else {
          spinner.fail('Cherry-pick 存在冲突')
          if (result.conflicts && result.conflicts.length > 0) {
            display.warning('冲突文件:')
            display.list(result.conflicts)
            display.newLine()
            display.info('解决冲突后运行: lgit cherry-pick continue')
          }
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('Cherry-pick 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 挑选多个提交
  cp
    .command('multi <commits...>')
    .description('挑选多个提交')
    .option('-n, --no-commit', '不自动提交')
    .action(async (commits: string[], options) => {
      const spinner = display.createSpinner(`Cherry-pick ${commits.length} 个提交...`)
      spinner.start()

      try {
        const manager = new CherryPickManager()
        const results = await manager.pickMultiple(commits, {
          noCommit: options.noCommit
        })

        const success = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length

        if (failed === 0) {
          spinner.succeed(`成功 cherry-pick ${success} 个提交`)
        } else {
          spinner.warn(`Cherry-pick: ${success} 成功, ${failed} 失败`)
          
          const failedResult = results.find(r => !r.success)
          if (failedResult?.conflicts) {
            display.warning('冲突文件:')
            display.list(failedResult.conflicts)
          }
        }
      } catch (error: any) {
        spinner.fail('Cherry-pick 失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 继续 cherry-pick
  cp
    .command('continue')
    .description('继续 cherry-pick（解决冲突后）')
    .action(async () => {
      const spinner = display.createSpinner('继续 cherry-pick...')
      spinner.start()

      try {
        const manager = new CherryPickManager()
        const result = await manager.continue()

        if (result.success) {
          spinner.succeed('Cherry-pick 继续成功')
        } else {
          spinner.fail('仍有冲突需要解决')
          if (result.conflicts) {
            display.list(result.conflicts)
          }
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('操作失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 中止 cherry-pick
  cp
    .command('abort')
    .description('中止 cherry-pick')
    .action(async () => {
      const spinner = display.createSpinner('中止 cherry-pick...')
      spinner.start()

      try {
        const manager = new CherryPickManager()
        await manager.abort()
        spinner.succeed('Cherry-pick 已中止')
      } catch (error: any) {
        spinner.fail('中止失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 跳过当前提交
  cp
    .command('skip')
    .description('跳过当前提交')
    .action(async () => {
      const spinner = display.createSpinner('跳过当前提交...')
      spinner.start()

      try {
        const manager = new CherryPickManager()
        await manager.skip()
        spinner.succeed('已跳过当前提交')
      } catch (error: any) {
        spinner.fail('跳过失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看状态
  cp
    .command('status')
    .description('查看 cherry-pick 状态')
    .action(async () => {
      try {
        const manager = new CherryPickManager()
        const status = await manager.getStatus()

        if (!status.inProgress) {
          display.info('当前没有进行中的 cherry-pick')
          return
        }

        display.title('Cherry-pick 状态')
        
        if (status.currentCommit) {
          display.keyValue('当前提交', status.currentCommit.substring(0, 7))
        }

        if (status.conflicts.length > 0) {
          display.newLine()
          display.warning('冲突文件:')
          display.list(status.conflicts)
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查找可 cherry-pick 的提交
  cp
    .command('find')
    .description('查找可 cherry-pick 的提交')
    .option('-b, --branch <branch>', '从指定分支查找')
    .option('-a, --author <author>', '按作者筛选')
    .option('--since <date>', '起始日期')
    .option('--grep <pattern>', '搜索提交信息')
    .option('-n, --count <n>', '显示数量', '10')
    .action(async (options) => {
      const spinner = display.createSpinner('查找提交...')
      spinner.start()

      try {
        const manager = new CherryPickManager()
        const commits = await manager.findCommits({
          branch: options.branch,
          author: options.author,
          since: options.since,
          grep: options.grep,
          maxCount: parseInt(options.count) || 10
        })

        spinner.succeed(`找到 ${commits.length} 个提交`)

        if (commits.length === 0) {
          return
        }

        const table = display.createTable(['Hash', '信息', '作者', '日期'])

        for (const c of commits) {
          table.push([
            c.hash.substring(0, 7),
            c.message.substring(0, 50),
            c.author,
            c.date
          ])
        }

        console.log(table.toString())
        
        display.newLine()
        display.info('使用 lgit cherry-pick pick <hash> 来挑选提交')
      } catch (error: any) {
        spinner.fail('查找失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 交互式选择
  cp
    .command('interactive')
    .alias('i')
    .description('交互式选择要 cherry-pick 的提交')
    .option('-b, --branch <branch>', '从指定分支选择')
    .action(async (options) => {
      try {
        const manager = new CherryPickManager()
        const commits = await manager.findCommits({
          branch: options.branch,
          maxCount: 20
        })

        if (commits.length === 0) {
          display.info('没有找到可选的提交')
          return
        }

        const { selected } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selected',
            message: '选择要 cherry-pick 的提交:',
            choices: commits.map(c => ({
              name: `${c.hash.substring(0, 7)} - ${c.message.substring(0, 50)} (${c.author})`,
              value: c.hash
            }))
          }
        ])

        if (selected.length === 0) {
          display.info('未选择任何提交')
          return
        }

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确定 cherry-pick ${selected.length} 个提交？`,
            default: true
          }
        ])

        if (!confirm) {
          display.info('操作已取消')
          return
        }

        const spinner = display.createSpinner(`Cherry-pick ${selected.length} 个提交...`)
        spinner.start()

        const results = await manager.pickMultiple(selected)
        const success = results.filter(r => r.success).length

        spinner.succeed(`成功 cherry-pick ${success}/${selected.length} 个提交`)
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  return cp
}
