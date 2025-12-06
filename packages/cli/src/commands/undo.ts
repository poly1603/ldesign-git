import { Command } from 'commander'
import inquirer from 'inquirer'
import { UndoManager, type UndoActionType } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createUndoCommand(): Command {
  const undo = new Command('undo')
    .description('智能撤销向导')

  // 交互式撤销向导
  undo
    .action(async () => {
      try {
        const manager = new UndoManager()
        const state = await manager.analyzeState()

        display.title('当前仓库状态')

        // 显示状态
        if (state.isInMerge) {
          display.warning('当前正在进行合并操作')
        }
        if (state.isInRebase) {
          display.warning('当前正在进行变基操作')
        }
        if (state.isInCherryPick) {
          display.warning('当前正在进行 cherry-pick 操作')
        }
        if (state.hasStagedChanges) {
          display.info('有已暂存的更改')
        }
        if (state.hasUnstagedChanges) {
          display.info('有未暂存的更改')
        }
        if (state.lastCommit) {
          display.keyValue('最后提交', `${state.lastCommit.hash.substring(0, 7)} - ${state.lastCommit.message}`)
        }

        display.newLine()

        if (state.suggestions.length === 0) {
          display.info('当前没有可撤销的操作')
          return
        }

        // 选择操作
        const choices = state.suggestions.map(s => ({
          name: `${s.description}${s.dangerous ? display.colors.error(' [危险]') : ''}`,
          value: s.action,
          short: s.description
        }))

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '选择要执行的撤销操作:',
            choices
          }
        ])

        const selectedSuggestion = state.suggestions.find(s => s.action === action)
        
        // 危险操作确认
        if (selectedSuggestion?.dangerous) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: display.colors.error('⚠ 此操作不可撤销，确定继续？'),
              default: false
            }
          ])

          if (!confirm) {
            display.info('操作已取消')
            return
          }
        }

        const spinner = display.createSpinner('执行撤销操作...')
        spinner.start()

        await manager.executeUndo(action as UndoActionType)

        spinner.succeed('撤销完成')
        display.success(selectedSuggestion?.description || '操作完成')
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 取消暂存
  undo
    .command('unstage [files...]')
    .description('取消暂存文件')
    .action(async (files: string[]) => {
      const spinner = display.createSpinner('取消暂存...')
      spinner.start()

      try {
        const manager = new UndoManager()
        
        if (files && files.length > 0) {
          await manager.unstageFiles(files)
          spinner.succeed(`已取消暂存 ${files.length} 个文件`)
        } else {
          await manager.unstageAll()
          spinner.succeed('已取消暂存所有文件')
        }
      } catch (error: any) {
        spinner.fail('取消暂存失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 丢弃更改
  undo
    .command('discard [files...]')
    .description('丢弃工作区更改')
    .option('-f, --force', '强制丢弃（不确认）')
    .action(async (files: string[], options) => {
      try {
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: display.colors.error('⚠ 此操作将丢弃所有未提交的更改，确定继续？'),
              default: false
            }
          ])

          if (!confirm) {
            display.info('操作已取消')
            return
          }
        }

        const spinner = display.createSpinner('丢弃更改...')
        spinner.start()

        const manager = new UndoManager()
        
        if (files && files.length > 0) {
          await manager.discardFileChanges(files)
          spinner.succeed(`已丢弃 ${files.length} 个文件的更改`)
        } else {
          await manager.discardAllChanges()
          spinner.succeed('已丢弃所有更改')
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 撤销提交
  undo
    .command('commit')
    .description('撤销最后一次提交')
    .option('--soft', '软重置（保留更改在暂存区）')
    .option('--hard', '硬重置（丢弃所有更改）')
    .option('-n, --count <n>', '撤销的提交数量', '1')
    .action(async (options) => {
      try {
        const count = parseInt(options.count) || 1
        const target = `HEAD~${count}`

        if (options.hard) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: display.colors.error(`⚠ 硬重置将丢弃最近 ${count} 个提交的所有更改，确定继续？`),
              default: false
            }
          ])

          if (!confirm) {
            display.info('操作已取消')
            return
          }
        }

        const spinner = display.createSpinner(`撤销 ${count} 个提交...`)
        spinner.start()

        const manager = new UndoManager()
        
        if (options.hard) {
          await manager.resetHard(target)
        } else if (options.soft) {
          await manager.resetSoft(target)
        } else {
          await manager.resetMixed(target)
        }

        spinner.succeed(`已撤销 ${count} 个提交`)
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 修改提交
  undo
    .command('amend')
    .description('修改最后一次提交')
    .option('-m, --message <message>', '新的提交信息')
    .action(async (options) => {
      const spinner = display.createSpinner('修改提交...')
      spinner.start()

      try {
        const { simpleGit } = await import('simple-git')
        const git = simpleGit()
        
        if (options.message) {
          await git.commit(options.message, ['--amend'])
        } else {
          await git.commit('', ['--amend', '--no-edit'])
        }

        spinner.succeed('提交已修改')
      } catch (error: any) {
        spinner.fail('修改提交失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 中止合并
  undo
    .command('merge')
    .description('中止当前合并操作')
    .action(async () => {
      const spinner = display.createSpinner('中止合并...')
      spinner.start()

      try {
        const manager = new UndoManager()
        await manager.abortMerge()
        spinner.succeed('合并已中止')
      } catch (error: any) {
        spinner.fail('中止合并失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 中止变基
  undo
    .command('rebase')
    .description('中止当前变基操作')
    .action(async () => {
      const spinner = display.createSpinner('中止变基...')
      spinner.start()

      try {
        const manager = new UndoManager()
        await manager.abortRebase()
        spinner.succeed('变基已中止')
      } catch (error: any) {
        spinner.fail('中止变基失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 恢复已删除文件
  undo
    .command('restore <file>')
    .description('恢复已删除的文件')
    .option('-c, --commit <commit>', '从指定提交恢复')
    .action(async (file: string, options) => {
      const spinner = display.createSpinner(`恢复文件 ${file}...`)
      spinner.start()

      try {
        const manager = new UndoManager()
        await manager.restoreDeletedFile(file, options.commit)
        spinner.succeed(`文件 ${file} 已恢复`)
      } catch (error: any) {
        spinner.fail('恢复文件失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出可恢复的已删除文件
  undo
    .command('deleted')
    .description('列出最近删除的文件')
    .option('-n, --count <n>', '显示数量', '10')
    .action(async (options) => {
      const spinner = display.createSpinner('查找已删除文件...')
      spinner.start()

      try {
        const manager = new UndoManager()
        const count = parseInt(options.count) || 10
        const deletedFiles = await manager.getDeletedFiles(`HEAD~${count * 2}`)

        spinner.succeed('已删除文件列表')

        if (deletedFiles.length === 0) {
          display.info('未找到最近删除的文件')
          return
        }

        const table = display.createTable(['文件', '提交', '日期'])

        for (const file of deletedFiles.slice(0, count)) {
          table.push([file.path, file.commit, file.date])
        }

        console.log(table.toString())
        display.newLine()
        display.info(`使用 lgit undo restore <file> 来恢复文件`)
      } catch (error: any) {
        spinner.fail('查找失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return undo
}
