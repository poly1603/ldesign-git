#!/usr/bin/env node

import { Command } from 'commander'
import { GitManager } from '@ldesign/git-core'
import { createBranchCommand } from './commands/branch'
import { createTagCommand } from './commands/tag'
import { createCommitCommand } from './commands/commit'
import { createWorkflowCommand } from './commands/workflow'
import { createAnalyzeCommand, createReportCommand } from './commands/analyze'
import { createConflictCommand } from './commands/conflict'
import { createHooksCommand } from './commands/hooks'
import { createRemoteCommand } from './commands/remote'
import { createStashCommand } from './commands/stash'
import { createDiffCommand } from './commands/diff'
import { createLogCommand } from './commands/log'
import { createConfigCommand } from './commands/config'
import { createRebaseCommand } from './commands/rebase'
import { createSubmoduleCommand } from './commands/submodule'
import { createUICommand } from './commands/ui'
import { createLFSCommand } from './commands/lfs'
import { createWorktreeCommand } from './commands/worktree'
import { createMonorepoCommand } from './commands/monorepo'
import { createBisectCommand } from './commands/bisect'
import { createBlameCommand } from './commands/blame'
import { createReflogCommand } from './commands/reflog'
import { createNotesCommand } from './commands/notes'
import * as display from './utils/display'

const program = new Command()

program
  .name('ldesign-git')
  .description('LDesign Git 工具 - 功能强大的 Git 操作插件')
  .version('0.4.0')

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

// 便捷命令：clone
program
  .command('clone <url> [path]')
  .description('克隆远程仓库')
  .option('--depth <depth>', '克隆深度（浅克隆）', parseInt)
  .option('-b, --branch <branch>', '指定分支')
  .option('--recurse-submodules', '递归克隆子模块')
  .action(async (url: string, localPath: string | undefined, options) => {
    const targetPath = localPath || url.split('/').pop()?.replace('.git', '') || 'repo'
    const spinner = display.createSpinner(`克隆仓库到 ${targetPath}...`)
    spinner.start()

    try {
      const git = new GitManager()
      await git.clone(url, targetPath, {
        depth: options.depth,
        branch: options.branch,
        recursive: options.recurseSubmodules
      })

      spinner.succeed(`仓库已克隆到 ${targetPath}`)
      display.box(`URL: ${url}\n路径: ${targetPath}`, { title: '克隆完成', type: 'success' })
    } catch (error: any) {
      spinner.fail('克隆失败')
      display.error(error.message)
      process.exit(1)
    }
  })

// 便捷命令：pull
program
  .command('pull [remote] [branch]')
  .description('拉取远程更新')
  .option('-r, --rebase', '使用 rebase 而不是 merge')
  .action(async (remote: string = 'origin', branch?: string, options?) => {
    const spinner = display.createSpinner('拉取远程更新...')
    spinner.start()

    try {
      const git = new GitManager()
      if (options?.rebase) {
        // 使用 rebase 拉取
        await git.getRawGit().pull(remote, branch, { '--rebase': null })
      } else {
        await git.pull(remote, branch)
      }

      spinner.succeed('拉取成功')
    } catch (error: any) {
      spinner.fail('拉取失败')
      display.error(error.message)
      process.exit(1)
    }
  })

// 便捷命令：push
program
  .command('push [remote] [branch]')
  .description('推送到远程仓库')
  .option('-f, --force', '强制推送')
  .option('-u, --set-upstream', '设置上游分支')
  .option('--tags', '推送所有标签')
  .action(async (remote: string = 'origin', branch?: string, options?) => {
    const spinner = display.createSpinner('推送到远程...')
    spinner.start()

    try {
      const git = new GitManager()
      const rawGit = git.getRawGit()
      const pushOptions: Record<string, null> = {}
      
      if (options?.force) pushOptions['--force'] = null
      if (options?.setUpstream) pushOptions['-u'] = null
      if (options?.tags) pushOptions['--tags'] = null

      await rawGit.push(remote, branch, pushOptions)

      spinner.succeed('推送成功')
    } catch (error: any) {
      spinner.fail('推送失败')
      display.error(error.message)
      process.exit(1)
    }
  })

// 便捷命令：checkout
program
  .command('checkout <target>')
  .alias('co')
  .description('切换分支或恢复文件')
  .option('-b', '创建并切换到新分支')
  .action(async (target: string, options) => {
    const spinner = display.createSpinner(`切换到 ${target}...`)
    spinner.start()

    try {
      const git = new GitManager()
      if (options.b) {
        await git.checkout(target, { createBranch: true })
        spinner.succeed(`已创建并切换到分支 ${target}`)
      } else {
        await git.checkout(target)
        spinner.succeed(`已切换到 ${target}`)
      }
    } catch (error: any) {
      spinner.fail('切换失败')
      display.error(error.message)
      process.exit(1)
    }
  })

// 便捷命令：merge
program
  .command('merge <branch>')
  .description('合并分支')
  .option('--no-ff', '禁用快进合并')
  .option('--squash', '压缩合并')
  .option('-m, --message <message>', '合并提交信息')
  .action(async (branch: string, options) => {
    const spinner = display.createSpinner(`合并分支 ${branch}...`)
    spinner.start()

    try {
      const git = new GitManager()
      const rawGit = git.getRawGit()
      const mergeOptions: string[] = [branch]
      
      if (options.noFf) mergeOptions.unshift('--no-ff')
      if (options.squash) mergeOptions.unshift('--squash')
      if (options.message) mergeOptions.unshift('-m', options.message)

      await rawGit.merge(mergeOptions)

      spinner.succeed(`分支 ${branch} 合并成功`)
    } catch (error: any) {
      spinner.fail('合并失败')
      display.error(error.message)
      if (error.message.includes('conflict')) {
        display.info('存在冲突，请使用 ldesign-git conflict 命令查看和解决')
      }
      process.exit(1)
    }
  })

// 便捷命令：add
program
  .command('add [files...]')
  .description('添加文件到暂存区')
  .option('-A, --all', '添加所有文件')
  .action(async (files: string[], options) => {
    const spinner = display.createSpinner('添加文件到暂存区...')
    spinner.start()

    try {
      const git = new GitManager()
      if (options.all || files.length === 0) {
        await git.add('.')
        spinner.succeed('已添加所有文件')
      } else {
        await git.add(files)
        spinner.succeed(`已添加 ${files.length} 个文件`)
      }
    } catch (error: any) {
      spinner.fail('添加失败')
      display.error(error.message)
      process.exit(1)
    }
  })

// 便捷命令：reset
program
  .command('reset [target]')
  .description('重置当前 HEAD')
  .option('--soft', '软重置（保留更改在暂存区）')
  .option('--hard', '硬重置（丢弃所有更改）')
  .option('--mixed', '混合重置（默认，保留更改在工作区）')
  .action(async (target: string = 'HEAD', options) => {
    let mode: 'soft' | 'mixed' | 'hard' = 'mixed'
    if (options.soft) mode = 'soft'
    if (options.hard) mode = 'hard'

    const spinner = display.createSpinner(`重置到 ${target}...`)
    spinner.start()

    try {
      const git = new GitManager()
      await git.reset(mode, target)

      spinner.succeed(`已重置到 ${target} (${mode})`)
      if (mode === 'hard') {
        display.warning('所有未提交的更改已丢弃')
      }
    } catch (error: any) {
      spinner.fail('重置失败')
      display.error(error.message)
      process.exit(1)
    }
  })

// 便捷命令：fetch
program
  .command('fetch [remote]')
  .description('获取远程更新')
  .option('--all', '获取所有远程')
  .option('--prune', '删除远程已删除的分支')
  .option('--tags', '获取所有标签')
  .action(async (remote: string = 'origin', options) => {
    const spinner = display.createSpinner('获取远程更新...')
    spinner.start()

    try {
      const git = new GitManager()
      const rawGit = git.getRawGit()
      const args: string[] = ['fetch']
      
      if (options.all) {
        args.push('--all')
      } else {
        args.push(remote)
      }
      if (options.prune) args.push('--prune')
      if (options.tags) args.push('--tags')

      await rawGit.raw(args)

      spinner.succeed('获取远程更新成功')
    } catch (error: any) {
      spinner.fail('获取失败')
      display.error(error.message)
      process.exit(1)
    }
  })

// 添加子命令
program.addCommand(createBranchCommand())
program.addCommand(createTagCommand())
program.addCommand(createCommitCommand())
program.addCommand(createRemoteCommand())
program.addCommand(createStashCommand())
program.addCommand(createDiffCommand())
program.addCommand(createLogCommand())
program.addCommand(createConfigCommand())
program.addCommand(createRebaseCommand())
program.addCommand(createWorkflowCommand())
program.addCommand(createAnalyzeCommand())
program.addCommand(createReportCommand())
program.addCommand(createConflictCommand())
program.addCommand(createHooksCommand())
program.addCommand(createSubmoduleCommand())
program.addCommand(createUICommand())
program.addCommand(createLFSCommand())
program.addCommand(createWorktreeCommand())
program.addCommand(createMonorepoCommand())
program.addCommand(createBisectCommand())
program.addCommand(createBlameCommand())
program.addCommand(createReflogCommand())
program.addCommand(createNotesCommand())

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


