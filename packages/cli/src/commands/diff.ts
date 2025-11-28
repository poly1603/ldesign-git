import { Command } from 'commander'
import { DiffManager, GitManager } from '@ldesign/git-core'
import * as display from '../utils/display'
import chalk from 'chalk'

export function createDiffCommand(): Command {
  const diff = new Command('diff')
    .description('查看文件差异')
    .argument('[paths...]', '要比较的文件路径')
    .option('--staged', '查看暂存区的差异')
    .option('--cached', '查看暂存区的差异（同 --staged）')
    .option('--stat', '只显示统计信息')
    .option('--name-only', '只显示文件名')
    .option('--name-status', '显示文件名和状态')
    .action(async (paths, options) => {
      const spinner = display.createSpinner('获取差异...')
      spinner.start()

      try {
        const manager = new DiffManager()
        
        if (options.staged || options.cached) {
          // 暂存区差异
          const diffs = await manager.diffStaged()
          spinner.succeed('暂存区差异')
          
          displayDiffResult(diffs, options, '暂存区 vs HEAD')
        } else {
          // 工作区差异
          const diffs = await manager.diffWorkingDirectory()
          spinner.succeed('工作区差异')
          
          displayDiffResult(diffs, options, '工作区 vs 暂存区')
        }
      } catch (error: any) {
        spinner.fail('获取差异失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 比较两个提交
  diff
    .command('commits <from> <to>')
    .description('比较两个提交之间的差异')
    .option('--stat', '只显示统计信息')
    .option('--name-only', '只显示文件名')
    .action(async (from, to, options) => {
      const spinner = display.createSpinner(`比较 ${from}...${to}`)
      spinner.start()

      try {
        const manager = new DiffManager()
        const result = await manager.diffCommits(from, to)

        spinner.succeed(`差异: ${from}...${to}`)

        display.title(`${from} → ${to}`)
        display.keyValue('变更文件', result.files.length)
        display.keyValue('新增行数', display.colors.success(`+${result.totalInsertions}`))
        display.keyValue('删除行数', display.colors.error(`-${result.totalDeletions}`))

        if (options.nameOnly) {
          display.newLine()
          display.info('变更的文件:')
          result.files.forEach(file => {
            console.log(`  ${file.path}`)
          })
        } else if (options.stat) {
          displayFileStat(result.files)
        } else {
          displayDetailedDiff(result.files)
        }
      } catch (error: any) {
        spinner.fail('比较提交失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 比较两个分支
  diff
    .command('branches <branch1> <branch2>')
    .description('比较两个分支之间的差异')
    .option('--stat', '只显示统计信息')
    .action(async (branch1, branch2, options) => {
      const spinner = display.createSpinner(`比较分支 ${branch1} 和 ${branch2}`)
      spinner.start()

      try {
        const manager = new DiffManager()
        const result = await manager.diffBranches(branch1, branch2)

        spinner.succeed(`分支差异: ${branch1}...${branch2}`)

        display.title(`${branch1} vs ${branch2}`)
        display.keyValue('独有提交', result.commits.length)
        display.keyValue('变更文件', result.files.length)
        display.keyValue('新增行数', display.colors.success(`+${result.totalInsertions}`))
        display.keyValue('删除行数', display.colors.error(`-${result.totalDeletions}`))

        if (result.commits.length > 0) {
          display.newLine()
          display.info(`${branch1} 独有的提交:`)
          result.commits.slice(0, 5).forEach(commit => {
            console.log(`  ${display.colors.dim(commit.hash.substring(0, 7))} ${commit.message}`)
          })
          
          if (result.commits.length > 5) {
            display.info(`... 还有 ${result.commits.length - 5} 个提交`)
          }
        }

        if (options.stat) {
          display.newLine()
          displayFileStat(result.files)
        }
      } catch (error: any) {
        spinner.fail('比较分支失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 查看文件的差异
  diff
    .command('file <path>')
    .description('查看指定文件的差异')
    .option('--staged', '查看暂存区的差异')
    .action(async (path, options) => {
      const spinner = display.createSpinner(`获取文件 ${path} 的差异...`)
      spinner.start()

      try {
        const manager = new DiffManager()
        const content = await manager.showFileDiff(path, {
          staged: options.staged
        })

        spinner.succeed(`文件差异: ${path}`)

        display.title(path)
        console.log(highlightDiff(content))
      } catch (error: any) {
        spinner.fail('获取文件差异失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 统计信息
  diff
    .command('stat [from] [to]')
    .description('显示差异统计信息')
    .action(async (from, to) => {
      const spinner = display.createSpinner('计算统计信息...')
      spinner.start()

      try {
        const manager = new DiffManager()
        const stats = await manager.getDiffStats(from, to)

        spinner.succeed('差异统计')

        display.title('统计信息')
        display.keyValue('变更文件', stats.filesChanged)
        display.keyValue('新增行数', display.colors.success(`+${stats.insertions}`))
        display.keyValue('删除行数', display.colors.error(`-${stats.deletions}`))

        if (stats.files.length > 0) {
          display.newLine()
          displayFileStat(stats.files.map(f => ({
            path: f.path,
            type: 'modified' as const,
            insertions: f.insertions,
            deletions: f.deletions
          })))
        }
      } catch (error: any) {
        spinner.fail('获取统计信息失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return diff
}

/**
 * 显示差异结果
 */
function displayDiffResult(diffs: any[], options: any, title: string): void {
  if (diffs.length === 0) {
    display.info('没有差异')
    return
  }

  display.title(title)
  display.keyValue('变更文件', diffs.length)

  const totalInsertions = diffs.reduce((sum, d) => sum + d.insertions, 0)
  const totalDeletions = diffs.reduce((sum, d) => sum + d.deletions, 0)

  display.keyValue('新增行数', display.colors.success(`+${totalInsertions}`))
  display.keyValue('删除行数', display.colors.error(`-${totalDeletions}`))

  if (options.nameOnly) {
    display.newLine()
    display.info('变更的文件:')
    diffs.forEach(diff => {
      console.log(`  ${diff.path}`)
    })
  } else if (options.nameStatus) {
    display.newLine()
    const table = display.createTable(['状态', '文件'])
    diffs.forEach(diff => {
      const status = getStatusLabel(diff.type)
      table.push([status, diff.path])
    })
    console.log(table.toString())
  } else if (options.stat) {
    displayFileStat(diffs)
  } else {
    displayDetailedDiff(diffs)
  }
}

/**
 * 显示文件统计信息
 */
function displayFileStat(files: any[]): void {
  display.newLine()
  const table = display.createTable(['文件', '变更'])

  files.forEach(file => {
    const additions = display.colors.success(`+${file.insertions}`)
    const deletions = display.colors.error(`-${file.deletions}`)
    const changeBar = createChangeBar(file.insertions, file.deletions)
    
    table.push([
      file.path,
      `${additions} ${deletions} ${changeBar}`
    ])
  })

  console.log(table.toString())
}

/**
 * 显示详细差异
 */
function displayDetailedDiff(files: any[]): void {
  display.newLine()
  files.forEach((file, index) => {
    if (index > 0) {
      display.separator()
    }

    const status = getStatusLabel(file.type)
    console.log(`${status} ${display.colors.bold(file.path)}`)
    
    if (file.oldPath) {
      display.info(`  重命名自: ${file.oldPath}`)
    }

    display.keyValue('  新增', display.colors.success(`+${file.insertions}`))
    display.keyValue('  删除', display.colors.error(`-${file.deletions}`))

    if (file.binary) {
      display.info('  (二进制文件)')
    }
  })
}

/**
 * 创建变更条
 */
function createChangeBar(insertions: number, deletions: number): string {
  const total = insertions + deletions
  if (total === 0) return ''

  const maxWidth = 20
  const addWidth = Math.round((insertions / total) * maxWidth)
  const delWidth = maxWidth - addWidth

  const addBar = chalk.green('█'.repeat(addWidth))
  const delBar = chalk.red('█'.repeat(delWidth))

  return addBar + delBar
}

/**
 * 获取状态标签
 */
function getStatusLabel(type: string): string {
  switch (type) {
    case 'added':
      return display.colors.success('A')
    case 'modified':
      return display.colors.warning('M')
    case 'deleted':
      return display.colors.error('D')
    case 'renamed':
      return display.colors.cyan('R')
    default:
      return display.colors.dim('?')
  }
}

/**
 * 高亮 diff 内容
 */
function highlightDiff(content: string): string {
  return content
    .split('\n')
    .map(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return chalk.green(line)
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        return chalk.red(line)
      } else if (line.startsWith('@@')) {
        return chalk.cyan(line)
      } else if (line.startsWith('diff --git')) {
        return chalk.bold(line)
      } else {
        return chalk.dim(line)
      }
    })
    .join('\n')
}