import { Command } from 'commander'
import inquirer from 'inquirer'
import { SmartCommit } from '@ldesign/git-core/automation'
import { validateCommitMessage } from '@ldesign/git-core/utils'
import type { CommitType } from '@ldesign/git-core/types'
import * as display from '../utils/display'

export function createCommitCommand(): Command {
  const commit = new Command('commit')
    .description('智能提交命令')

  // 智能提交
  commit
    .command('smart')
    .description('智能提交（自动分析变更并生成提交信息）')
    .option('--no-interactive', '非交互模式，使用自动建议')
    .action(async (options) => {
      try {
        const smartCommit = new SmartCommit()

        // 分析变更
        const spinner = display.createSpinner('分析文件变更...')
        spinner.start()

        const suggestions = await smartCommit.analyzeChanges()
        const fileChanges = await smartCommit.getFileChanges()

        spinner.succeed('变更分析完成')

        // 显示变更统计
        display.title('文件变更统计')
        const added = fileChanges.filter(f => f.type === 'added').length
        const modified = fileChanges.filter(f => f.type === 'modified').length
        const deleted = fileChanges.filter(f => f.type === 'deleted').length
        const renamed = fileChanges.filter(f => f.type === 'renamed').length

        display.keyValue('新增', added)
        display.keyValue('修改', modified)
        display.keyValue('删除', deleted)
        display.keyValue('重命名', renamed)

        display.newLine()

        // 显示建议
        if (suggestions.length > 0) {
          display.title('建议的提交类型')
          suggestions.slice(0, 3).forEach((sug, index) => {
            const confidence = `${(sug.confidence * 100).toFixed(0)}%`
            console.log(`  ${index + 1}. ${display.colors.cyan(sug.type)} - ${sug.subject}`)
            console.log(`     ${display.colors.dim(`置信度: ${confidence}, 原因: ${sug.reason}`)}`)
          })

          display.newLine()
        }

        // 交互式选择
        if (options.interactive) {
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'type',
              message: '选择提交类型:',
              choices: [
                { name: 'feat:     新功能', value: 'feat' },
                { name: 'fix:      修复 Bug', value: 'fix' },
                { name: 'docs:     文档变更', value: 'docs' },
                { name: 'style:    代码格式', value: 'style' },
                { name: 'refactor: 重构', value: 'refactor' },
                { name: 'perf:     性能优化', value: 'perf' },
                { name: 'test:     测试', value: 'test' },
                { name: 'build:    构建系统', value: 'build' },
                { name: 'ci:       CI 配置', value: 'ci' },
                { name: 'chore:    其他变动', value: 'chore' }
              ],
              default: suggestions[0]?.type || 'feat'
            },
            {
              type: 'input',
              name: 'scope',
              message: '作用域（可选）:',
              default: ''
            },
            {
              type: 'input',
              name: 'subject',
              message: '简短描述:',
              default: suggestions[0]?.subject || '',
              validate: (input: string) => {
                if (input.length < 5) {
                  return '描述至少需要 5 个字符'
                }
                if (input.length > 72) {
                  return '描述不应超过 72 个字符'
                }
                return true
              }
            },
            {
              type: 'input',
              name: 'body',
              message: '详细描述（可选）:',
              default: ''
            },
            {
              type: 'confirm',
              name: 'breaking',
              message: '是否包含 Breaking Changes?',
              default: false
            }
          ])

          const commitSpinner = display.createSpinner('提交中...')
          commitSpinner.start()

          const message = smartCommit.generateCommitMessage({
            type: answers.type,
            scope: answers.scope || undefined,
            subject: answers.subject,
            body: answers.body || undefined,
            breaking: answers.breaking
          })

          await smartCommit.smartCommit({
            type: answers.type,
            scope: answers.scope || undefined,
            subject: answers.subject,
            body: answers.body || undefined,
            breaking: answers.breaking
          })

          commitSpinner.succeed('提交成功')

          display.newLine()
          display.box(message, { title: '提交信息', type: 'success' })
        } else {
          // 非交互模式，使用第一个建议
          if (suggestions.length === 0) {
            display.error('无法自动生成提交信息，请使用交互模式')
            process.exit(1)
          }

          const best = suggestions[0]
          const commitSpinner = display.createSpinner('自动提交中...')
          commitSpinner.start()

          await smartCommit.smartCommit({
            autoDetect: true
          })

          commitSpinner.succeed('提交成功')
          display.success(`类型: ${best.type}, 描述: ${best.subject}`)
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 验证提交信息
  commit
    .command('validate <message>')
    .description('验证提交信息格式')
    .action(async (message) => {
      display.title('验证提交信息')

      const validation = validateCommitMessage(message)

      if (validation.valid) {
        display.success('✓ 提交信息格式正确')

        if (validation.parsed) {
          display.newLine()
          display.keyValue('类型', validation.parsed.type || '')
          if (validation.parsed.scope) {
            display.keyValue('作用域', validation.parsed.scope)
          }
          display.keyValue('主题', validation.parsed.subject || '')
          if (validation.parsed.breaking) {
            display.warning('⚠ 包含 Breaking Changes')
          }
        }
      } else {
        display.error('✗ 提交信息格式错误')
        display.newLine()
        display.list(validation.errors.map(e => display.colors.error(e)))
      }

      if (validation.warnings.length > 0) {
        display.newLine()
        display.warning('警告:')
        display.list(validation.warnings.map(w => display.colors.warning(w)))
      }

      if (!validation.valid) {
        process.exit(1)
      }
    })

  // 分析变更
  commit
    .command('analyze')
    .description('分析当前变更并给出提交建议')
    .action(async () => {
      const spinner = display.createSpinner('分析变更...')
      spinner.start()

      try {
        const smartCommit = new SmartCommit()
        const suggestions = await smartCommit.analyzeChanges()
        const fileChanges = await smartCommit.getFileChanges()

        spinner.succeed('分析完成')

        // 显示文件变更
        display.title('文件变更')

        if (fileChanges.length === 0) {
          display.info('没有检测到文件变更')
          return
        }

        const table = display.createTable(['文件', '类型', '+', '-'])
        fileChanges.slice(0, 10).forEach(change => {
          let typeIcon = ''
          if (change.type === 'added') typeIcon = display.colors.success('A')
          else if (change.type === 'modified') typeIcon = display.colors.warning('M')
          else if (change.type === 'deleted') typeIcon = display.colors.error('D')
          else if (change.type === 'renamed') typeIcon = display.colors.info('R')

          table.push([
            change.path,
            typeIcon,
            display.colors.success(`+${change.insertions}`),
            display.colors.error(`-${change.deletions}`)
          ])
        })

        console.log(table.toString())

        if (fileChanges.length > 10) {
          display.info(`... 还有 ${fileChanges.length - 10} 个文件`)
        }

        // 显示建议
        display.newLine()
        display.title('提交建议')

        if (suggestions.length === 0) {
          display.warning('无法生成提交建议')
          return
        }

        suggestions.forEach((sug, index) => {
          const confidence = `${(sug.confidence * 100).toFixed(0)}%`
          console.log(`\n${display.colors.bold(`${index + 1}. ${sug.type}`)}: ${sug.subject}`)
          console.log(`   ${display.colors.dim(`置信度: ${confidence}`)}`)
          console.log(`   ${display.colors.dim(`原因: ${sug.reason}`)}`)
        })

        display.newLine()
        display.info(`建议使用: ${display.colors.cyan('ldesign-git commit smart')} 进行智能提交`)
      } catch (error: any) {
        spinner.fail('分析失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return commit
}


