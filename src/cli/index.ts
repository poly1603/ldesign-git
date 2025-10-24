#!/usr/bin/env node

import { Command } from 'commander'
import { GitManager } from '../core'
import { createBranchCommand } from './commands/branch'
import { createTagCommand } from './commands/tag'
import { createCommitCommand } from './commands/commit'
import { createWorkflowCommand } from './commands/workflow'
import { createAnalyzeCommand, createReportCommand } from './commands/analyze'
import { createConflictCommand } from './commands/conflict'
import { createHooksCommand } from './commands/hooks'
import * as display from './utils/display'

const program = new Command()

program
  .name('ldesign-git')
  .description('LDesign Git 工具 - 功能强大的 Git 操作插件')
  .version('0.2.0')

// 基础命令
program
  .command('status')
  .alias('st')
  .description('查看 Git 状态')
  .action(async () => {
    const spinner = display.createSpinner('获取仓库状态...')
    spinner.start()

    try {
      const git = new GitManager()
      const status = await git.status()

      spinner.succeed('仓库状态')

      display.title('Git 状态')

      if (status.current) {
        display.keyValue('当前分支', status.current)
      }

      if (status.ahead > 0 || status.behind > 0) {
        display.newLine()
        if (status.ahead > 0) {
          display.keyValue('领先远程', `${status.ahead} 个提交`)
        }
        if (status.behind > 0) {
          display.keyValue('落后远程', `${status.behind} 个提交`)
        }
      }

      // 显示变更文件
      const totalChanges = status.modified.length + status.created.length + status.deleted.length

      if (totalChanges > 0) {
        display.newLine()
        const table = display.createTable(['状态', '文件'])

        status.modified.forEach(file => {
          table.push([display.colors.warning('M'), file])
        })
        status.created.forEach(file => {
          table.push([display.colors.success('A'), file])
        })
        status.deleted.forEach(file => {
          table.push([display.colors.error('D'), file])
        })

        console.log(table.toString())
      } else {
        display.newLine()
        display.success('工作区干净')
      }
    } catch (error: any) {
      spinner.fail('获取状态失败')
      display.error(error.message)
      process.exit(1)
    }
  })

program
  .command('init')
  .description('初始化 Git 仓库')
  .action(async () => {
    const spinner = display.createSpinner('初始化 Git 仓库...')
    spinner.start()

    try {
      const git = new GitManager()
      await git.init()
      spinner.succeed('Git 仓库初始化成功')
      display.box('仓库已初始化，可以开始使用 Git 了！', {
        title: '成功',
        type: 'success'
      })
    } catch (error: any) {
      spinner.fail('初始化失败')
      display.error(error.message)
      process.exit(1)
    }
  })

// 添加子命令
program.addCommand(createBranchCommand())
program.addCommand(createTagCommand())
program.addCommand(createCommitCommand())
program.addCommand(createWorkflowCommand())
program.addCommand(createAnalyzeCommand())
program.addCommand(createReportCommand())
program.addCommand(createConflictCommand())
program.addCommand(createHooksCommand())

// 错误处理
program.exitOverride()

try {
  program.parse()
} catch (error: any) {
  if (error.code === 'commander.help' || error.code === 'commander.helpDisplayed') {
    // 正常的帮助显示，不做处理
  } else if (error.code === 'commander.version') {
    // 正常的版本显示，不做处理
  } else {
    display.error(`错误: ${error.message}`)
    process.exit(1)
  }
}


