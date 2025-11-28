import { Command } from 'commander'
import simpleGit from 'simple-git'
import { DiffManager } from '@ldesign/git-core'
import * as display from '../utils/display'
import chalk from 'chalk'

export function createLogCommand(): Command {
  const log = new Command('log')
    .description('查看提交历史')
    .option('-n, --number <count>', '限制显示的提交数量', '20')
    .option('--oneline', '单行简洁显示')
    .option('--graph', '图形化显示分支结构')
    .option('--stat', '显示每次提交的文件变更统计')
    .option('--author <name>', '按作者过滤')
    .option('--since <date>', '显示指定日期之后的提交')
    .option('--until <date>', '显示指定日期之前的提交')
    .option('--grep <pattern>', '按提交消息过滤')
    .argument('[file]', '查看指定文件的提交历史')
    .action(async (file, options) => {
      const spinner = display.createSpinner('获取提交历史...')
      spinner.start()

      try {
        const git = simpleGit()
        
        // 构建 log 选项
        const logOptions: any = {
          maxCount: parseInt(options.number),
          file: file || undefined
        }

        // 获取提交历史
        const result = await git.log(logOptions)
        
        spinner.succeed('提交历史')

        if (result.all.length === 0) {
          display.info('没有提交历史')
          return
        }

        // 根据选项过滤
        let commits = [...result.all]

        if (options.author) {
          commits = commits.filter(c => 
            c.author_name.toLowerCase().includes(options.author.toLowerCase())
          )
        }

        if (options.grep) {
          commits = commits.filter(c => 
            c.message.toLowerCase().includes(options.grep.toLowerCase())
          )
        }

        if (options.since) {
          const sinceDate = new Date(options.since)
          commits = commits.filter(c => new Date(c.date) >= sinceDate)
        }

        if (options.until) {
          const untilDate = new Date(options.until)
          commits = commits.filter(c => new Date(c.date) <= untilDate)
        }

        // 显示提交历史
        if (options.oneline) {
          displayOneline(commits)
        } else if (options.graph) {
          displayGraph(commits)
        } else if (options.stat) {
          await displayWithStat(commits)
        } else {
          displayDetailed(commits)
        }

        display.newLine()
        display.info(`显示 ${commits.length} 个提交`)
      } catch (error: any) {
        spinner.fail('获取提交历史失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看文件历史
  log
    .command('file <path>')
    .description('查看指定文件的提交历史')
    .option('-n, --number <count>', '限制显示的提交数量', '10')
    .option('-p, --patch', '显示每次提交的差异')
    .action(async (path, options) => {
      const spinner = display.createSpinner(`获取文件 ${path} 的历史...`)
      spinner.start()

      try {
        const manager = new DiffManager()
        const commits = await manager.getFileHistory(path, parseInt(options.number))

        spinner.succeed(`文件历史: ${path}`)

        if (commits.length === 0) {
          display.info('该文件没有提交历史')
          return
        }

        display.title(`文件: ${path}`)

        const table = display.createTable(['提交', '作者', '日期', '消息'])

        commits.forEach(commit => {
          table.push([
            display.colors.cyan(commit.hash.substring(0, 7)),
            commit.author,
            display.colors.dim(new Date(commit.date).toLocaleDateString()),
            commit.message.split('\n')[0]
          ])
        })

        console.log(table.toString())
        display.info(`显示 ${commits.length} 个提交`)

        if (options.patch) {
          display.newLine()
          display.info('使用 `ldesign-git diff commits <from> <to>` 查看详细差异')
        }
      } catch (error: any) {
        spinner.fail('获取文件历史失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看特定提交
  log
    .command('show <commit>')
    .description('查看指定提交的详细信息')
    .option('--stat', '显示文件变更统计')
    .action(async (commitHash, options) => {
      const spinner = display.createSpinner(`获取提交 ${commitHash} 的详情...`)
      spinner.start()

      try {
        const git = simpleGit()
        const result = await git.show([commitHash])

        spinner.succeed(`提交详情: ${commitHash}`)

        // 解析提交信息
        const lines = result.split('\n')
        const commitLine = lines.find(l => l.startsWith('commit'))
        const authorLine = lines.find(l => l.startsWith('Author:'))
        const dateLine = lines.find(l => l.startsWith('Date:'))
        
        display.title('提交信息')
        
        if (commitLine) {
          display.keyValue('提交', display.colors.cyan(commitLine.split(' ')[1]?.substring(0, 7) || ''))
        }
        if (authorLine) {
          display.keyValue('作者', authorLine.replace('Author:', '').trim())
        }
        if (dateLine) {
          display.keyValue('日期', dateLine.replace('Date:', '').trim())
        }

        // 提取消息
        const messageStart = lines.findIndex(l => l.trim() === '') + 1
        const messageEnd = lines.findIndex((l, i) => i > messageStart && (l.startsWith('diff') || l.trim() === ''))
        
        if (messageStart > 0 && messageEnd > messageStart) {
          const message = lines.slice(messageStart, messageEnd).join('\n').trim()
          display.newLine()
          display.info('消息:')
          console.log(chalk.white(message))
        }

        if (options.stat) {
          // 显示统计信息
          const diffManager = new DiffManager()
          try {
            const stats = await diffManager.getDiffStats(`${commitHash}~1`, commitHash)
            display.newLine()
            display.title('变更统计')
            display.keyValue('文件数', stats.filesChanged)
            display.keyValue('新增', display.colors.success(`+${stats.insertions}`))
            display.keyValue('删除', display.colors.error(`-${stats.deletions}`))
          } catch (e) {
            // 忽略统计错误（可能是第一个提交）
          }
        }
      } catch (error: any) {
        spinner.fail('获取提交详情失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return log
}

/**
 * 单行显示
 */
function displayOneline(commits: any[]): void {
  display.title('提交历史（单行模式）')
  
  commits.forEach(commit => {
    const hash = display.colors.cyan(commit.hash.substring(0, 7))
    const message = commit.message.split('\n')[0]
    const author = display.colors.dim(`(${commit.author_name})`)
    
    console.log(`${hash} ${message} ${author}`)
  })
}

/**
 * 图形化显示
 */
function displayGraph(commits: any[]): void {
  display.title('提交历史（图形模式）')
  
  commits.forEach((commit, index) => {
    const isLast = index === commits.length - 1
    const branch = isLast ? '└──' : '├──'
    const hash = display.colors.cyan(commit.hash.substring(0, 7))
    const message = commit.message.split('\n')[0]
    const author = display.colors.dim(commit.author_name)
    const date = display.colors.dim(new Date(commit.date).toLocaleDateString())
    
    console.log(`${branch} ${hash} ${message}`)
    console.log(`${isLast ? '    ' : '│   '} ${author} • ${date}`)
    
    if (!isLast) {
      console.log('│')
    }
  })
}

/**
 * 详细显示
 */
function displayDetailed(commits: any[]): void {
  display.title('提交历史')
  
  commits.forEach((commit, index) => {
    if (index > 0) {
      display.separator()
    }

    console.log(display.colors.bold(display.colors.cyan(`提交 ${commit.hash.substring(0, 7)}`)))
    display.keyValue('作者', `${commit.author_name} <${commit.author_email}>`)
    display.keyValue('日期', new Date(commit.date).toLocaleString())
    
    display.newLine()
    const message = commit.message.trim()
    const lines = message.split('\n')
    
    console.log(chalk.white(`    ${lines[0]}`))
    
    if (lines.length > 1) {
      lines.slice(1).forEach(line => {
        if (line.trim()) {
          console.log(chalk.dim(`    ${line}`))
        }
      })
    }
  })
}

/**
 * 带统计信息显示
 */
async function displayWithStat(commits: any[]): Promise<void> {
  display.title('提交历史（带统计）')
  
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i]
    
    if (i > 0) {
      display.separator()
    }

    console.log(display.colors.bold(display.colors.cyan(`提交 ${commit.hash.substring(0, 7)}`)))
    display.keyValue('作者', commit.author_name)
    display.keyValue('日期', new Date(commit.date).toLocaleDateString())
    
    const message = commit.message.split('\n')[0]
    display.keyValue('消息', message)

    try {
      // 获取该提交的统计信息
      const diffManager = new DiffManager()
      const stats = await diffManager.getDiffStats(`${commit.hash}~1`, commit.hash)
      
      display.keyValue('变更', `${stats.filesChanged} 个文件`)
      display.keyValue('新增', display.colors.success(`+${stats.insertions}`))
      display.keyValue('删除', display.colors.error(`-${stats.deletions}`))
    } catch (e) {
      // 第一个提交可能没有父提交
      display.keyValue('变更', '初始提交')
    }
  }
}