#!/usr/bin/env node

import { Command } from 'commander'
import { GitManager } from '../core'

const program = new Command()

program
  .name('ldesign-git')
  .description('LDesign Git 工具')
  .version('0.1.0')

program
  .command('status')
  .description('查看 Git 状态')
  .action(async () => {
    const git = new GitManager()
    const status = await git.status()
    console.log(status)
  })

program
  .command('init')
  .description('初始化 Git 仓库')
  .action(async () => {
    const git = new GitManager()
    await git.init()
    console.log('✅ Git 仓库初始化成功')
  })

program.parse()


