import { Command } from 'commander'
import { ArchiveManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createArchiveCommand(): Command {
  const archive = new Command('archive')
    .description('创建 Git 归档')

  // 创建归档
  archive
    .command('create <ref>')
    .description('创建归档文件')
    .option('-f, --format <format>', '归档格式 (zip, tar, tar.gz)', 'zip')
    .option('-o, --output <file>', '输出文件名')
    .option('-p, --prefix <prefix>', '文件前缀')
    .action(async (ref: string, options) => {
      const spinner = display.createSpinner(`创建归档 ${ref}...`)
      spinner.start()

      try {
        const manager = new ArchiveManager()
        const result = await manager.create(ref, {
          format: options.format,
          output: options.output,
          prefix: options.prefix
        })

        spinner.succeed('归档创建成功')
        
        display.keyValue('文件', result.path)
        display.keyValue('大小', formatSize(result.size))
        display.keyValue('格式', result.format)
        display.keyValue('引用', result.ref)
      } catch (error: any) {
        spinner.fail('创建归档失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 创建发布归档
  archive
    .command('release <tag>')
    .description('创建发布归档')
    .option('-f, --format <format>', '归档格式', 'tar.gz')
    .action(async (tag: string, options) => {
      const spinner = display.createSpinner(`创建发布归档 ${tag}...`)
      spinner.start()

      try {
        const manager = new ArchiveManager()
        const result = await manager.createRelease(tag, {
          format: options.format
        })

        spinner.succeed('发布归档创建成功')
        
        display.box(
          `文件: ${result.path}\n大小: ${formatSize(result.size)}`,
          { title: `Release ${tag}`, type: 'success' }
        )
      } catch (error: any) {
        spinner.fail('创建发布归档失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 预览归档内容
  archive
    .command('preview <ref>')
    .description('预览归档内容')
    .option('-n, --count <n>', '显示文件数量', '20')
    .action(async (ref: string, options) => {
      const spinner = display.createSpinner('获取文件列表...')
      spinner.start()

      try {
        const manager = new ArchiveManager()
        const files = await manager.preview(ref)
        const count = parseInt(options.count) || 20

        spinner.succeed(`归档预览: ${ref}`)
        
        display.keyValue('文件总数', files.length)
        display.newLine()
        
        display.title('文件列表')
        for (const file of files.slice(0, count)) {
          console.log(`  ${display.colors.dim('•')} ${file}`)
        }

        if (files.length > count) {
          display.info(`... 还有 ${files.length - count} 个文件`)
        }
      } catch (error: any) {
        spinner.fail('预览失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出可归档的引用
  archive
    .command('list')
    .alias('ls')
    .description('列出可归档的分支和标签')
    .action(async () => {
      const spinner = display.createSpinner('获取引用列表...')
      spinner.start()

      try {
        const manager = new ArchiveManager()
        const refs = await manager.listRefs()

        spinner.succeed('可归档的引用')
        
        if (refs.tags.length > 0) {
          display.title('标签')
          for (const tag of refs.tags.slice(0, 10)) {
            console.log(`  ${display.colors.cyan(tag)}`)
          }
          if (refs.tags.length > 10) {
            display.info(`... 还有 ${refs.tags.length - 10} 个标签`)
          }
        }

        if (refs.branches.length > 0) {
          display.newLine()
          display.title('分支')
          for (const branch of refs.branches) {
            console.log(`  ${display.colors.success(branch)}`)
          }
        }

        if (refs.commits.length > 0) {
          display.newLine()
          display.title('最近提交')
          for (const commit of refs.commits) {
            console.log(`  ${display.colors.warning(commit.hash)} ${commit.message}`)
          }
        }
      } catch (error: any) {
        spinner.fail('获取引用失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 批量创建归档
  archive
    .command('batch <refs...>')
    .description('批量创建归档')
    .option('-f, --format <format>', '归档格式', 'zip')
    .action(async (refs: string[], options) => {
      const spinner = display.createSpinner(`创建 ${refs.length} 个归档...`)
      spinner.start()

      try {
        const manager = new ArchiveManager()
        const results = await manager.createMultiple(refs, {
          format: options.format
        })

        spinner.succeed(`创建了 ${results.length} 个归档`)
        
        const table = display.createTable(['引用', '文件', '大小'])
        for (const r of results) {
          table.push([r.ref, r.path, formatSize(r.size)])
        }
        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('批量创建失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 支持的格式
  archive
    .command('formats')
    .description('列出支持的归档格式')
    .action(() => {
      const manager = new ArchiveManager()
      const formats = manager.getSupportedFormats()
      
      display.title('支持的归档格式')
      for (const f of formats) {
        console.log(`  ${display.colors.cyan(f)}`)
      }
    })

  return archive
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}
