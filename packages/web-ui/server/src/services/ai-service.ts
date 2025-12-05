import https from 'https'

interface AIConfig {
  apiKey: string
  baseUrl?: string
  model?: string
}

interface CommitMessageRequest {
  diff: string
  language?: 'zh' | 'en'
}

const DEFAULT_CONFIG: Partial<AIConfig> = {
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat'
}

export class AIService {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async generateCommitMessage(request: CommitMessageRequest): Promise<string> {
    const { diff, language = 'zh' } = request

    // 限制 diff 长度避免 token 过多
    const maxDiffLength = 8000
    const truncatedDiff = diff.length > maxDiffLength 
      ? diff.substring(0, maxDiffLength) + '\n... (diff truncated)'
      : diff

    const systemPrompt = language === 'zh' 
      ? `你是一个专业的 Git 提交信息生成助手。根据提供的 diff 内容，生成简洁、清晰的提交信息。
规则：
1. 使用中文
2. 第一行是简短摘要（不超过50字），使用动词开头，如：添加、修复、优化、重构、更新、删除等
3. 如果需要详细说明，空一行后写详细描述
4. 只输出提交信息，不要有其他解释`
      : `You are a professional Git commit message generator. Generate concise and clear commit messages based on the provided diff.
Rules:
1. Use English
2. First line is a short summary (max 50 chars), start with verb: Add, Fix, Update, Refactor, Remove, etc.
3. If details needed, add a blank line then write description
4. Only output the commit message, no explanations`

    const userPrompt = `请根据以下 diff 生成提交信息：\n\n${truncatedDiff}`

    return this.callAPI(systemPrompt, userPrompt)
  }

  private async callAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = new URL('/v1/chat/completions', this.config.baseUrl)
    
    const requestBody = JSON.stringify({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.error) {
              reject(new Error(json.error.message || 'API error'))
            } else if (json.choices && json.choices[0]?.message?.content) {
              resolve(json.choices[0].message.content.trim())
            } else {
              reject(new Error('Invalid API response'))
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`))
          }
        })
      })

      req.on('error', reject)
      req.write(requestBody)
      req.end()
    })
  }
}

// 默认配置 - 用户可以通过环境变量覆盖
let aiService: AIService | null = null

export function getAIService(): AIService | null {
  if (!aiService) {
    const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-97c9b60244e54a73bd40b069935ba145'
    if (apiKey) {
      aiService = new AIService({
        apiKey,
        baseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com',
        model: process.env.AI_MODEL || 'deepseek-chat'
      })
    }
  }
  return aiService
}

export function setAIConfig(config: AIConfig): void {
  aiService = new AIService(config)
}
