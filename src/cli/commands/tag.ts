import { Command } from 'commander'
import inquirer from 'inquirer'
import { TagManager } from '../../core'
import * as display from '../utils/display'

export function createTagCommand(): Command {
  const tag = new Command('tag')
    .description('标签管理命令')

  // 列出所有标签
  tag
    .command('list')
    .alias('ls')
    .description('列出所有标签')
    .option('-p, --pattern <pattern>', '匹配模式（支持通配符）')
    .option('-s, --sorted', '按版本号排序')
    .action(async (options) => {
      const spinner = display.createSpinner('获取标签列表...')
      spinner.start()

      try {
        const manager = new TagManager()

        let tags: string[]
        if (options.pattern) {
          tags = await manager.listTagsWithPattern(options.pattern)
        } else if (options.sorted) {
          tags = await manager.listTagsSorted()
        } else {
          tags = await manager.listTags()
        }

        spinner.succeed('标签列表')

        if (tags.length === 0) {
          display.info('暂无标签')
          return
        }

        const table = display.createTable(['标签名'])
        tags.forEach(tagName => {
          table.push([tagName])
        })

        console.log(table.toString())
        display.info(`总共 ${tags.length} 个标签`)
      } catch (error: any) {
        spinner.fail('获取标签列表失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 创建标签
  tag
    .command('create <name>')
    .description('创建标签')
    .option('-a, --annotated', '创建注释标签')
    .option('-m, --message <message>', '标签消息')
    .option('-r, --ref <ref>', '引用（提交/分支）')
    .option('-f, --force', '强制创建（覆盖已存在的标签）')
    .action(async (name, options) => {
      const spinner = display.createSpinner(`创建标签 ${name}...`)
      spinner.start()

      try {
        const manager = new TagManager()

        if (options.annotated || options.message) {
          const message = options.message || await promptForMessage(name)
          await manager.createAnnotatedTag(name, message, options.ref)
        } else {
          await manager.createLightweightTag(name, options.ref)
        }

        spinner.succeed(`成功创建标签 ${display.colors.cyan(name)}`)

        if (options.annotated || options.message) {
          display.info('这是一个注释标签')
        } else {
          display.info('这是一个轻量级标签')
        }
      } catch (error: any) {
        spinner.fail('创建标签失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 删除标签
  tag
    .command('delete <name>')
    .alias('del')
    .description('删除标签')
    .option('-r, --remote', '删除远程标签')
    .action(async (name, options) => {
      // 确认删除
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `确定要删除标签 ${display.colors.yellow(name)} 吗？`,
          default: false
        }
      ])

      if (!confirmed) {
        display.info('取消删除')
        return
      }

      const spinner = display.createSpinner(`删除标签 ${name}...`)
      spinner.start()

      try {
        const manager = new TagManager()

        if (options.remote) {
          await manager.deleteRemoteTag(name)
          spinner.succeed(`成功删除远程标签 ${display.colors.cyan(name)}`)
        } else {
          await manager.deleteTag(name)
          spinner.succeed(`成功删除标签 ${display.colors.cyan(name)}`)
        }
      } catch (error: any) {
        spinner.fail('删除标签失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 推送标签
  tag
    .command('push <name>')
    .description('推送标签到远程')
    .option('-r, --remote <remote>', '远程名称', 'origin')
    .option('-a, --all', '推送所有标签')
    .action(async (name, options) => {
      const spinner = display.createSpinner('推送标签...')
      spinner.start()

      try {
        const manager = new TagManager()

        if (options.all || name === '--all') {
          await manager.pushAllTags(options.remote)
          spinner.succeed(`成功推送所有标签到 ${display.colors.cyan(options.remote)}`)
        } else {
          await manager.pushTag(name, options.remote)
          spinner.succeed(`成功推送标签 ${display.colors.cyan(name)} 到 ${display.colors.cyan(options.remote)}`)
        }
      } catch (error: any) {
        spinner.fail('推送标签失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 标签信息
  tag
    .command('info <name>')
    .description('查看标签详细信息')
    .action(async (name) => {
      const spinner = display.createSpinner(`获取标签信息 ${name}...`)
      spinner.start()

      try {
        const manager = new TagManager()
        const info = await manager.getTagInfo(name)

        spinner.stop()

        if (!info) {
          display.error(`标签 ${name} 不存在`)
          process.exit(1)
        }

        display.title(`标签信息: ${name}`)
        display.keyValue('类型', info.type === 'annotated' ? '注释标签' : '轻量级标签')
        display.keyValue('提交', info.commit.substring(0, 7))

        if (info.date) {
          display.keyValue('日期', new Date(info.date).toLocaleString('zh-CN'))
        }

        if (info.message) {
          display.keyValue('消息', info.message)
        }
      } catch (error: any) {
        spinner.fail('获取标签信息失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 最新标签
  tag
    .command('latest')
    .description('查看最新标签')
    .action(async () => {
      const spinner = display.createSpinner('获取最新标签...')
      spinner.start()

      try {
        const manager = new TagManager()
        const latestTag = await manager.getLatestTag()

        spinner.stop()

        if (!latestTag) {
          display.info('暂无标签')
          return
        }

        display.success(`最新标签: ${display.colors.cyan(latestTag)}`)
      } catch (error: any) {
        spinner.fail('获取最新标签失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  return tag
}

/**
 * 提示输入标签消息
 */
async function promptForMessage(tagName: string): Promise<string> {
  const { message } = await inquirer.prompt([
    {
      type: 'input',
      name: 'message',
      message: '请输入标签消息:',
      default: `Release ${tagName}`
    }
  ])
  return message
}


