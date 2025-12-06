import simpleGit, { SimpleGit } from 'simple-git'

/**
 * Git 别名信息
 */
export interface GitAlias {
  name: string
  command: string
  scope: 'local' | 'global' | 'system'
}

/**
 * 预设别名模板
 */
export interface AliasTemplate {
  name: string
  description: string
  aliases: Array<{ name: string; command: string; description: string }>
}

/**
 * Git 别名管理器
 * 
 * 管理 Git 命令别名
 * 
 * @example
 * ```ts
 * const alias = new AliasManager()
 * await alias.add('st', 'status')
 * await alias.add('co', 'checkout')
 * ```
 */
export class AliasManager {
  private git: SimpleGit

  constructor(baseDir?: string) {
    this.git = simpleGit(baseDir || process.cwd())
  }

  /**
   * 获取所有别名
   */
  async list(scope?: 'local' | 'global' | 'system'): Promise<GitAlias[]> {
    const aliases: GitAlias[] = []
    
    const scopes: Array<'local' | 'global' | 'system'> = scope 
      ? [scope] 
      : ['local', 'global', 'system']

    for (const s of scopes) {
      try {
        const scopeFlag = s === 'local' ? '--local' : s === 'global' ? '--global' : '--system'
        const result = await this.git.raw(['config', scopeFlag, '--get-regexp', '^alias\\.'])
        
        const lines = result.split('\n').filter(l => l.trim())
        for (const line of lines) {
          const match = line.match(/^alias\.(\S+)\s+(.+)$/)
          if (match) {
            aliases.push({
              name: match[1],
              command: match[2],
              scope: s
            })
          }
        }
      } catch {
        // 该 scope 没有别名
      }
    }

    return aliases
  }

  /**
   * 获取单个别名
   */
  async get(name: string): Promise<GitAlias | null> {
    const aliases = await this.list()
    return aliases.find(a => a.name === name) || null
  }

  /**
   * 添加别名
   */
  async add(name: string, command: string, options?: { global?: boolean }): Promise<void> {
    const scopeFlag = options?.global ? '--global' : '--local'
    await this.git.raw(['config', scopeFlag, `alias.${name}`, command])
  }

  /**
   * 删除别名
   */
  async remove(name: string, options?: { global?: boolean }): Promise<void> {
    const scopeFlag = options?.global ? '--global' : '--local'
    await this.git.raw(['config', scopeFlag, '--unset', `alias.${name}`])
  }

  /**
   * 更新别名
   */
  async update(name: string, command: string, options?: { global?: boolean }): Promise<void> {
    await this.add(name, command, options)
  }

  /**
   * 检查别名是否存在
   */
  async exists(name: string): Promise<boolean> {
    const alias = await this.get(name)
    return alias !== null
  }

  /**
   * 批量添加别名
   */
  async addBatch(aliases: Array<{ name: string; command: string }>, options?: { global?: boolean }): Promise<void> {
    for (const alias of aliases) {
      await this.add(alias.name, alias.command, options)
    }
  }

  /**
   * 导出别名为配置
   */
  async export(scope?: 'local' | 'global'): Promise<string> {
    const aliases = await this.list(scope)
    const lines = aliases.map(a => `[alias]\n\t${a.name} = ${a.command}`)
    return lines.join('\n')
  }

  /**
   * 从配置导入别名
   */
  async import(config: string, options?: { global?: boolean }): Promise<number> {
    const aliasRegex = /^\s*(\w+)\s*=\s*(.+)$/gm
    let match
    let count = 0

    while ((match = aliasRegex.exec(config)) !== null) {
      await this.add(match[1], match[2].trim(), options)
      count++
    }

    return count
  }

  /**
   * 获取常用别名模板
   */
  getTemplates(): AliasTemplate[] {
    return [
      {
        name: 'basic',
        description: '基础别名',
        aliases: [
          { name: 'st', command: 'status', description: '查看状态' },
          { name: 'co', command: 'checkout', description: '切换分支' },
          { name: 'br', command: 'branch', description: '分支操作' },
          { name: 'ci', command: 'commit', description: '提交' },
          { name: 'df', command: 'diff', description: '查看差异' },
          { name: 'lg', command: 'log --oneline --graph', description: '查看日志' }
        ]
      },
      {
        name: 'advanced',
        description: '高级别名',
        aliases: [
          { name: 'unstage', command: 'reset HEAD --', description: '取消暂存' },
          { name: 'last', command: 'log -1 HEAD', description: '最后一次提交' },
          { name: 'amend', command: 'commit --amend --no-edit', description: '修改提交' },
          { name: 'undo', command: 'reset --soft HEAD~1', description: '撤销提交' },
          { name: 'discard', command: 'checkout -- .', description: '丢弃更改' },
          { name: 'aliases', command: 'config --get-regexp alias', description: '查看别名' }
        ]
      },
      {
        name: 'workflow',
        description: '工作流别名',
        aliases: [
          { name: 'save', command: 'stash push -m', description: '保存工作' },
          { name: 'pop', command: 'stash pop', description: '恢复工作' },
          { name: 'wip', command: '!git add -A && git commit -m "WIP"', description: 'WIP 提交' },
          { name: 'sync', command: '!git fetch --all && git rebase origin/main', description: '同步主分支' },
          { name: 'cleanup', command: 'branch --merged | grep -v main | xargs git branch -d', description: '清理分支' },
          { name: 'recent', command: 'branch --sort=-committerdate --format="%(refname:short)"', description: '最近分支' }
        ]
      },
      {
        name: 'log',
        description: '日志别名',
        aliases: [
          { name: 'hist', command: 'log --pretty=format:"%h %ad | %s%d [%an]" --graph --date=short', description: '历史' },
          { name: 'today', command: 'log --since=midnight --oneline', description: '今日提交' },
          { name: 'week', command: 'log --since="1 week ago" --oneline', description: '本周提交' },
          { name: 'contributors', command: 'shortlog -sn --no-merges', description: '贡献者' },
          { name: 'filelog', command: 'log --follow -p --', description: '文件历史' },
          { name: 'graph', command: 'log --graph --abbrev-commit --decorate --all', description: '分支图' }
        ]
      }
    ]
  }

  /**
   * 应用别名模板
   */
  async applyTemplate(templateName: string, options?: { global?: boolean }): Promise<number> {
    const template = this.getTemplates().find(t => t.name === templateName)
    if (!template) {
      throw new Error(`模板 ${templateName} 不存在`)
    }

    await this.addBatch(template.aliases, options)
    return template.aliases.length
  }

  /**
   * 搜索别名
   */
  async search(keyword: string): Promise<GitAlias[]> {
    const aliases = await this.list()
    const lower = keyword.toLowerCase()
    return aliases.filter(a => 
      a.name.toLowerCase().includes(lower) || 
      a.command.toLowerCase().includes(lower)
    )
  }

  /**
   * 执行别名命令
   */
  async run(aliasName: string, args: string[] = []): Promise<string> {
    const alias = await this.get(aliasName)
    if (!alias) {
      throw new Error(`别名 ${aliasName} 不存在`)
    }

    // 如果是 shell 命令（以 ! 开头）
    if (alias.command.startsWith('!')) {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      const result = await execAsync(`${alias.command.substring(1)} ${args.join(' ')}`)
      return result.stdout
    }

    // 普通 git 命令
    const cmdParts = alias.command.split(' ')
    return await this.git.raw([...cmdParts, ...args])
  }
}
