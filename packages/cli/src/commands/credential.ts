import { Command } from 'commander'
import inquirer from 'inquirer'
import { CredentialManager } from '@ldesign/git-core'
import * as display from '../utils/display'

export function createCredentialCommand(): Command {
  const credential = new Command('credential')
    .alias('cred')
    .description('Git 凭证管理')

  // 获取当前凭证助手
  credential
    .command('helper')
    .description('管理凭证助手')
    .option('-s, --set <helper>', '设置凭证助手')
    .option('-g, --global', '全局设置')
    .option('--timeout <seconds>', '缓存超时（仅用于 cache）')
    .action(async (options) => {
      try {
        const manager = new CredentialManager()

        if (options.set) {
          const spinner = display.createSpinner('设置凭证助手...')
          spinner.start()

          await manager.setHelper(options.set, {
            global: options.global,
            timeout: options.timeout ? parseInt(options.timeout) : undefined
          })

          spinner.succeed(`凭证助手已设置为: ${options.set}`)
        } else {
          const current = await manager.getHelper()
          
          if (current) {
            display.keyValue('当前凭证助手', current)
          } else {
            display.info('未配置凭证助手')
          }

          display.newLine()
          display.title('推荐设置')
          const recommended = manager.getRecommendedHelper()
          display.info(`推荐使用: ${display.colors.cyan(recommended)}`)
          display.info(`设置命令: lgit credential helper --set ${recommended} --global`)
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出可用的凭证助手
  credential
    .command('list-helpers')
    .description('列出可用的凭证助手')
    .action(async () => {
      const spinner = display.createSpinner('检查可用助手...')
      spinner.start()

      try {
        const manager = new CredentialManager()
        const helpers = await manager.listAvailableHelpers()

        spinner.succeed('可用的凭证助手')

        const table = display.createTable(['助手', '状态', '描述'])

        for (const h of helpers) {
          table.push([
            h.name,
            h.available ? display.colors.success('可用') : display.colors.dim('不可用'),
            h.description
          ])
        }

        console.log(table.toString())
      } catch (error: any) {
        spinner.fail('检查失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 存储凭证
  credential
    .command('store')
    .description('存储凭证')
    .option('-h, --host <host>', '主机名')
    .option('-u, --username <username>', '用户名')
    .action(async (options) => {
      try {
        const manager = new CredentialManager()

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'host',
            message: '主机名:',
            default: options.host || 'github.com'
          },
          {
            type: 'input',
            name: 'username',
            message: '用户名:',
            default: options.username
          },
          {
            type: 'password',
            name: 'password',
            message: '密码/Token:',
            mask: '*'
          }
        ])

        const spinner = display.createSpinner('存储凭证...')
        spinner.start()

        await manager.store({
          host: answers.host,
          username: answers.username,
          password: answers.password
        })

        spinner.succeed('凭证已存储')
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 列出存储的凭证
  credential
    .command('list')
    .alias('ls')
    .description('列出存储的凭证（仅限 store 助手）')
    .action(async () => {
      try {
        const manager = new CredentialManager()
        const credentials = await manager.listStoredCredentials()

        if (credentials.length === 0) {
          display.info('没有存储的凭证')
          return
        }

        display.title('存储的凭证')

        const table = display.createTable(['协议', '主机', '用户名'])

        for (const c of credentials) {
          table.push([c.protocol, c.host, c.username])
        }

        console.log(table.toString())
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 清除凭证
  credential
    .command('clear [host]')
    .description('清除凭证')
    .option('-a, --all', '清除所有凭证')
    .action(async (host: string | undefined, options) => {
      try {
        const manager = new CredentialManager()

        if (options.all) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: display.colors.error('确定要清除所有存储的凭证？'),
              default: false
            }
          ])

          if (!confirm) {
            display.info('操作已取消')
            return
          }

          const spinner = display.createSpinner('清除所有凭证...')
          spinner.start()

          await manager.clearAllStoredCredentials()
          spinner.succeed('所有凭证已清除')
        } else if (host) {
          const spinner = display.createSpinner(`清除 ${host} 的凭证...`)
          spinner.start()

          await manager.erase({ host })
          spinner.succeed(`${host} 的凭证已清除`)
        } else {
          display.error('请指定主机名或使用 --all 选项')
          process.exit(1)
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 测试凭证
  credential
    .command('test <url>')
    .description('测试凭证是否有效')
    .action(async (url: string) => {
      const spinner = display.createSpinner('测试凭证...')
      spinner.start()

      try {
        const manager = new CredentialManager()
        const result = await manager.testCredential(url)

        if (result.valid) {
          spinner.succeed('凭证有效')
        } else {
          spinner.fail('凭证无效或无权限')
          if (result.error) {
            display.error(result.error)
          }
          process.exit(1)
        }
      } catch (error: any) {
        spinner.fail('测试失败')
        display.error(error.message)
        process.exit(1)
      }
    })

  // 检查认证方式
  credential
    .command('auth-type [remote]')
    .description('检查远程仓库的认证方式')
    .action(async (remote = 'origin') => {
      try {
        const manager = new CredentialManager()
        const authType = await manager.getRemoteAuthType(remote)

        display.keyValue('远程仓库', remote)
        display.keyValue('认证方式', authType.toUpperCase())

        if (authType === 'https') {
          display.newLine()
          display.info('HTTPS 认证需要配置凭证助手')
          display.info('运行: lgit credential helper --set store --global')
        } else if (authType === 'ssh') {
          display.newLine()
          display.info('SSH 认证需要配置 SSH 密钥')
          display.info('运行: lgit credential ssh-keygen 生成密钥')
        }
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  // 生成 SSH 密钥
  credential
    .command('ssh-keygen')
    .description('生成 SSH 密钥')
    .option('-t, --type <type>', '密钥类型 (ed25519, rsa)', 'ed25519')
    .option('-e, --email <email>', '邮箱地址')
    .option('-f, --filename <name>', '密钥文件名')
    .action(async (options) => {
      try {
        const manager = new CredentialManager()

        let email = options.email
        if (!email) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'email',
              message: '邮箱地址:',
              validate: (input: string) => {
                if (!input.includes('@')) {
                  return '请输入有效的邮箱地址'
                }
                return true
              }
            }
          ])
          email = answers.email
        }

        const { passphrase } = await inquirer.prompt([
          {
            type: 'password',
            name: 'passphrase',
            message: '密钥密码（可选）:',
            mask: '*'
          }
        ])

        const spinner = display.createSpinner('生成 SSH 密钥...')
        spinner.start()

        const result = await manager.generateSSHKey({
          email,
          type: options.type,
          filename: options.filename,
          passphrase
        })

        spinner.succeed('SSH 密钥已生成')

        display.newLine()
        display.keyValue('私钥路径', result.path)
        display.keyValue('公钥路径', `${result.path}.pub`)

        display.newLine()
        display.title('公钥内容（添加到 GitHub/GitLab）')
        console.log(display.colors.dim(result.publicKey))

        display.newLine()
        display.info('将上面的公钥添加到你的 Git 服务商:')
        display.info('  GitHub: https://github.com/settings/keys')
        display.info('  GitLab: https://gitlab.com/-/profile/keys')
      } catch (error: any) {
        display.error(error.message)
        process.exit(1)
      }
    })

  return credential
}
