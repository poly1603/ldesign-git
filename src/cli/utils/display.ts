import chalk from 'chalk'
import ora, { Ora } from 'ora'
import Table from 'cli-table3'
import boxen from 'boxen'

/**
 * CLI 显示工具 - 美化命令行输出
 */

// 颜色工具
export const colors = {
  success: (text: string) => chalk.green(text),
  error: (text: string) => chalk.red(text),
  warning: (text: string) => chalk.yellow(text),
  info: (text: string) => chalk.blue(text),
  dim: (text: string) => chalk.dim(text),
  bold: (text: string) => chalk.bold(text),
  cyan: (text: string) => chalk.cyan(text),
  magenta: (text: string) => chalk.magenta(text)
}

// 图标
export const icons = {
  success: chalk.green('✓'),
  error: chalk.red('✗'),
  warning: chalk.yellow('⚠'),
  info: chalk.blue('ℹ'),
  arrow: chalk.cyan('→'),
  bullet: chalk.dim('•')
}

/**
 * 创建进度指示器
 */
export function createSpinner(text: string): Ora {
  return ora({
    text,
    color: 'cyan'
  })
}

/**
 * 显示成功消息
 */
export function success(message: string): void {
  console.log(`${icons.success} ${colors.success(message)}`)
}

/**
 * 显示错误消息
 */
export function error(message: string): void {
  console.log(`${icons.error} ${colors.error(message)}`)
}

/**
 * 显示警告消息
 */
export function warning(message: string): void {
  console.log(`${icons.warning} ${colors.warning(message)}`)
}

/**
 * 显示信息消息
 */
export function info(message: string): void {
  console.log(`${icons.info} ${colors.info(message)}`)
}

/**
 * 显示标题
 */
export function title(text: string): void {
  console.log('\n' + chalk.bold.cyan(text) + '\n')
}

/**
 * 显示分隔线
 */
export function separator(): void {
  console.log(chalk.dim('─'.repeat(50)))
}

/**
 * 创建表格
 */
export function createTable(headers: string[]): Table.Table {
  return new Table({
    head: headers.map(h => chalk.cyan(h)),
    style: {
      head: [],
      border: ['dim']
    }
  })
}

/**
 * 显示框消息
 */
export function box(message: string, options: {
  title?: string
  type?: 'success' | 'error' | 'warning' | 'info'
} = {}): void {
  let borderColor: 'green' | 'red' | 'yellow' | 'blue' = 'cyan'

  if (options.type === 'success') borderColor = 'green'
  else if (options.type === 'error') borderColor = 'red'
  else if (options.type === 'warning') borderColor = 'yellow'
  else if (options.type === 'info') borderColor = 'blue'

  console.log(boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor,
    title: options.title
  }))
}

/**
 * 显示列表
 */
export function list(items: string[], bullet = icons.bullet): void {
  items.forEach(item => {
    console.log(`  ${bullet} ${item}`)
  })
}

/**
 * 显示键值对
 */
export function keyValue(key: string, value: string | number): void {
  console.log(`  ${colors.dim(key)}: ${chalk.white(value)}`)
}

/**
 * 显示进度条（简单文本版）
 */
export function progressBar(current: number, total: number, label?: string): string {
  const percentage = Math.floor((current / total) * 100)
  const filled = Math.floor((current / total) * 20)
  const empty = 20 - filled

  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  const text = label ? `${label} ` : ''

  return `${text}${colors.cyan(bar)} ${percentage}% (${current}/${total})`
}

/**
 * 清空控制台
 */
export function clear(): void {
  console.clear()
}

/**
 * 显示空行
 */
export function newLine(count = 1): void {
  console.log('\n'.repeat(count - 1))
}


