import { Command } from 'commander'
import { CompletionManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createCompletionCommand(): Command {
  const completion = new Command('completion')
    .description('生成 Shell 补全脚本')

  // Bash 补全
  completion
    .command('bash')
    .description('生成 Bash 补全脚本')
    .action(() => {
      const manager = new CompletionManager('lgit')
      console.log(manager.generate('bash'))
    })

  // Zsh 补全
  completion
    .command('zsh')
    .description('生成 Zsh 补全脚本')
    .action(() => {
      const manager = new CompletionManager('lgit')
      console.log(manager.generate('zsh'))
    })

  // Fish 补全
  completion
    .command('fish')
    .description('生成 Fish 补全脚本')
    .action(() => {
      const manager = new CompletionManager('lgit')
      console.log(manager.generate('fish'))
    })

  // PowerShell 补全
  completion
    .command('powershell')
    .alias('pwsh')
    .description('生成 PowerShell 补全脚本')
    .action(() => {
      const manager = new CompletionManager('lgit')
      console.log(manager.generate('powershell'))
    })

  // 安装说明
  completion
    .command('install')
    .description('显示安装说明')
    .option('-s, --shell <shell>', 'Shell 类型 (bash, zsh, fish, powershell)')
    .action((options) => {
      const manager = new CompletionManager('lgit')
      const shells = manager.getSupportedShells()

      if (options.shell) {
        if (!shells.includes(options.shell)) {
          display.error(`不支持的 shell: ${options.shell}`)
          display.info(`支持的 shell: ${shells.join(', ')}`)
          process.exit(1)
        }

        display.title(`${options.shell} 补全安装说明`)
        console.log(manager.getInstallInstructions(options.shell))
      } else {
        display.title('Shell 补全安装说明')
        
        for (const shell of shells) {
          display.newLine()
          console.log(display.colors.cyan(display.colors.bold(`=== ${shell.toUpperCase()} ===`)))
          display.newLine()
          console.log(manager.getInstallInstructions(shell as any))
        }
      }
    })

  // 默认命令：显示帮助
  completion
    .action(() => {
      const manager = new CompletionManager('lgit')
      const shells = manager.getSupportedShells()

      display.title('Shell 补全')
      display.info('支持的 Shell:')
      display.list(shells)

      display.newLine()
      display.info('使用方法:')
      console.log('  lgit completion bash      # 生成 Bash 补全')
      console.log('  lgit completion zsh       # 生成 Zsh 补全')
      console.log('  lgit completion fish      # 生成 Fish 补全')
      console.log('  lgit completion powershell # 生成 PowerShell 补全')
      console.log('  lgit completion install   # 显示安装说明')

      display.newLine()
      display.info('快速安装示例 (Bash):')
      console.log(display.colors.dim('  lgit completion bash >> ~/.bashrc'))
      console.log(display.colors.dim('  source ~/.bashrc'))
    })

  return completion
}
