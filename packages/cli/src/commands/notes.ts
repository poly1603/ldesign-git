import { Command } from 'commander'
import inquirer from 'inquirer'
import { NotesManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createNotesCommand(): Command {
  const notes = new Command('notes')
    .description('Git Notes - 提交备注管理')

  // 添加 note
  notes
    .command('add <ref> <message>')
    .description('为提交添加备注')
    .option('-f, --force', '覆盖已有备注')
    .option('-n, --namespace <ns>', '指定命名空间')
    .action(async (ref: string, message: string, options) => {
      const spinner = display.createSpinner(`添加备注到 ${ref}...`)
      spinner.start()

      try {
        const manager = new NotesManager()
        await manager.add(ref, message, {
          force: options.force,
          namespace: options.namespace
        })

        spinner.succeed(`备注已添加到 ${ref}`)
        display.box(message, { title: '备注内容', type: 'success' })
      } catch (error: any) {
        spinner.fail('添加备注失败')
        display.error(error.message)
        if (error.message.includes('already exists')) {
          display.info('使用 --force 选项覆盖已有备注')
        }
        process.exit(1)
      }
    })

  // 显示 note
  notes
    .command('show [ref]')
    .description('显示提交的备注')
    .option('-n, --namespace <ns>', '指定命名空间')
    .action(async (ref: string = 'HEAD', options) => {
      const spinner = display.createSpinner(`获取 ${ref} 的备注...`)
      spinner.start()

      try {
        const manager = new NotesManager()
        const content = await manager.show(ref, options.namespace)

        spinner.succeed(`备注: ${ref}`)
        display.box(content.trim(), { title: '备注内容', type: 'info' })
      } catch (error: any) {
        spinner.fail('获取备注失败')
        if (error.message.includes('No note found')) {
          display.info(`提交 ${ref} 没有备注`)
        } else {
          display.error(error.message)
        }
        process.exit(1)
      }
    })

  // 列出所有 notes
  notes
    .command('list')
    .alias('ls')
    .description('列出所有备注')
    .option('-n, --namespace <ns>', '指定命名空间')
    .action(async (options) => {
      const spinner = display.createSpinner('获取备注列表...')
      spinner.start()

      try {
        const manager = new NotesManager()
        const notesList = await manager.list(options.namespace)

        spinner.succeed('备注列表')

        if (notesList.length === 0) {
          display.info('没有备注')
          return
        }

        display.title('Git Notes')

        const table = display.createTable(['提交', '备注内容'])

        for (const note of notesList) {
          const contentPreview = note.content.length > 60
            ? note.content.substring(0, 60).replace(/\n/g, ' ') + '...'
            : note.content.replace(/\n/g, ' ')

          table.push([
            display.colors.cyan(note.ref.substring(0, 12)),
            contentPreview
          ])
        }

        console.log(table.toString())
        display.info(`共 ${notesList.length} 条备注`)
      } catch (error: any) {
        spinner.fail('获取备注列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 追加到 note
  notes
    .command('append <ref> <message>')
    .description('追加内容到已有备注')
    .option('-n, --namespace <ns>', '指定命名空间')
    .action(async (ref: string, message: string, options) => {
      const spinner = display.createSpinner(`追加备注到 ${ref}...`)
      spinner.start()

      try {
        const manager = new NotesManager()
        await manager.append(ref, message, options.namespace)

        spinner.succeed(`备注已追加到 ${ref}`)
      } catch (error: any) {
        spinner.fail('追加备注失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除 note
  notes
    .command('remove <ref>')
    .alias('rm')
    .description('删除提交的备注')
    .option('-n, --namespace <ns>', '指定命名空间')
    .action(async (ref: string, options) => {
      // 确认删除
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要删除 ${ref} 的备注吗？`,
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消删除')
        return
      }

      const spinner = display.createSpinner(`删除 ${ref} 的备注...`)
      spinner.start()

      try {
        const manager = new NotesManager()
        await manager.remove(ref, options.namespace)

        spinner.succeed(`已删除 ${ref} 的备注`)
      } catch (error: any) {
        spinner.fail('删除备注失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 复制 note
  notes
    .command('copy <from> <to>')
    .description('复制备注到另一个提交')
    .option('-f, --force', '覆盖目标已有备注')
    .option('-n, --namespace <ns>', '指定命名空间')
    .action(async (fromRef: string, toRef: string, options) => {
      const spinner = display.createSpinner(`复制备注 ${fromRef} -> ${toRef}...`)
      spinner.start()

      try {
        const manager = new NotesManager()
        await manager.copy(fromRef, toRef, {
          force: options.force,
          namespace: options.namespace
        })

        spinner.succeed(`备注已复制: ${fromRef} -> ${toRef}`)
      } catch (error: any) {
        spinner.fail('复制备注失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 合并 notes
  notes
    .command('merge <ref>')
    .description('合并远程 notes')
    .option('-n, --namespace <ns>', '指定命名空间')
    .action(async (ref: string, options) => {
      const spinner = display.createSpinner(`合并 notes 从 ${ref}...`)
      spinner.start()

      try {
        const manager = new NotesManager()
        await manager.merge(ref, options.namespace)

        spinner.succeed(`Notes 已合并: ${ref}`)
      } catch (error: any) {
        spinner.fail('合并失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清理无效 notes
  notes
    .command('prune')
    .description('清理无效的 notes')
    .option('-n, --namespace <ns>', '指定命名空间')
    .action(async (options) => {
      const spinner = display.createSpinner('清理无效 notes...')
      spinner.start()

      try {
        const manager = new NotesManager()
        await manager.prune(options.namespace)

        spinner.succeed('无效 notes 已清理')
      } catch (error: any) {
        spinner.fail('清理失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return notes
}
