import { useState, useEffect } from 'react'
import { gitApi } from '../../services/api'
import { 
  Settings, User, Key, Globe, Palette, Bell, Shield, 
  Save, RefreshCw, Check, AlertCircle, Eye, EyeOff,
  Terminal, GitBranch, FileCode, Sparkles, Copy, Plus,
  LogIn, KeyRound, Trash2, ExternalLink, Loader2
} from 'lucide-react'
import { ThemeSettings, useTheme } from '../common/ThemeProvider'

interface GitConfig {
  name: string
  email: string
}

interface SSHKey {
  name: string
  type: string
  fingerprint: string
  createdAt: string
}

interface GitCredential {
  id: string
  provider: 'github' | 'gitlab' | 'bitbucket' | 'gitee' | 'custom'
  name: string
  url: string
  username?: string
  token?: string
  connected: boolean
}

export default function SettingsPage() {
  const { resolvedTheme } = useTheme()
  const [gitConfig, setGitConfig] = useState<GitConfig>({ name: '', email: '' })
  const [aiConfig, setAiConfig] = useState({ apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' })
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [language, setLanguage] = useState('zh')
  
  // SSH 相关状态
  const [sshKeys, setSSHKeys] = useState<SSHKey[]>([])
  const [generatingKey, setGeneratingKey] = useState(false)
  const [newKeyEmail, setNewKeyEmail] = useState('')
  const [newKeyType, setNewKeyType] = useState<'ed25519' | 'rsa'>('ed25519')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  
  // Git 源登录相关
  const [credentials, setCredentials] = useState<GitCredential[]>([
    { id: '1', provider: 'github', name: 'GitHub', url: 'https://github.com', connected: false },
    { id: '2', provider: 'gitlab', name: 'GitLab', url: 'https://gitlab.com', connected: false },
    { id: '3', provider: 'gitee', name: 'Gitee', url: 'https://gitee.com', connected: false },
  ])
  const [showCredentialForm, setShowCredentialForm] = useState(false)
  const [newCredential, setNewCredential] = useState({ provider: 'github', name: '', url: '', username: '', token: '' })

  useEffect(() => {
    fetchGitConfig()
  }, [])

  const fetchGitConfig = async () => {
    // Git config would be fetched from backend in real implementation
    // For now, we'll use placeholder
  }

  const handleSaveAIConfig = async () => {
    if (!aiConfig.apiKey) {
      alert('请输入 API Key')
      return
    }
    
    setSaveStatus('saving')
    try {
      await gitApi.setAIConfig(aiConfig.apiKey, aiConfig.baseUrl, aiConfig.model)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('保存失败:', error)
      setSaveStatus('error')
    }
  }

  const Section = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-transparent">
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  )

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false, rightElement }: any) => (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-50"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )

  const SelectField = ({ label, value, onChange, options }: any) => (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
        </div>

        {/* AI 配置 */}
        <Section icon={Sparkles} title="AI 配置">
          <p className="text-sm text-gray-400 mb-4">
            配置 AI 服务以启用智能提交信息生成功能。支持 DeepSeek、OpenAI 兼容接口。
          </p>
          <InputField
            label="API Key"
            type={showApiKey ? 'text' : 'password'}
            value={aiConfig.apiKey}
            onChange={(v: string) => setAiConfig({ ...aiConfig, apiKey: v })}
            placeholder="sk-..."
            rightElement={
              <button onClick={() => setShowApiKey(!showApiKey)} className="text-gray-400 hover:text-white">
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <InputField
            label="API Base URL"
            value={aiConfig.baseUrl}
            onChange={(v: string) => setAiConfig({ ...aiConfig, baseUrl: v })}
            placeholder="https://api.deepseek.com"
          />
          <SelectField
            label="模型"
            value={aiConfig.model}
            onChange={(v: string) => setAiConfig({ ...aiConfig, model: v })}
            options={[
              { value: 'deepseek-chat', label: 'DeepSeek Chat' },
              { value: 'deepseek-coder', label: 'DeepSeek Coder' },
              { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
              { value: 'gpt-4', label: 'GPT-4' },
            ]}
          />
          <button
            onClick={handleSaveAIConfig}
            disabled={saveStatus === 'saving'}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {saveStatus === 'saving' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveStatus === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveStatus === 'saving' ? '保存中...' : saveStatus === 'success' ? '已保存' : '保存配置'}</span>
          </button>
        </Section>

        {/* 界面设置 */}
        <Section icon={Palette} title="界面设置">
          <ThemeSettings />
          <div className="mt-4">
            <SelectField
              label="语言"
              value={language}
              onChange={setLanguage}
              options={[
                { value: 'zh', label: '简体中文' },
                { value: 'en', label: 'English (开发中)' },
              ]}
            />
          </div>
        </Section>

        {/* SSH 密钥管理 */}
        <Section icon={KeyRound} title="SSH 密钥">
          <p className="text-sm text-gray-400 mb-4">
            生成和管理 SSH 密钥，用于安全连接到 Git 远程仓库。
          </p>
          
          {/* 生成新密钥 */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-white font-medium mb-3">生成新密钥</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <InputField
                label="邮箱地址"
                value={newKeyEmail}
                onChange={setNewKeyEmail}
                placeholder="your@email.com"
              />
              <SelectField
                label="密钥类型"
                value={newKeyType}
                onChange={(v: string) => setNewKeyType(v as 'ed25519' | 'rsa')}
                options={[
                  { value: 'ed25519', label: 'Ed25519 (推荐)' },
                  { value: 'rsa', label: 'RSA (4096 bit)' },
                ]}
              />
            </div>
            <button
              onClick={async () => {
                if (!newKeyEmail) {
                  alert('请输入邮箱地址')
                  return
                }
                setGeneratingKey(true)
                try {
                  const response = await gitApi.generateSSHKey(newKeyEmail, newKeyType)
                  if (response.data?.success) {
                    setGeneratedKey(response.data.data?.publicKey || '')
                  }
                } catch (error) {
                  console.error('生成 SSH 密钥失败:', error)
                  alert('生成 SSH 密钥失败，请检查后端服务')
                } finally {
                  setGeneratingKey(false)
                }
              }}
              disabled={generatingKey}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {generatingKey ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>生成密钥</span>
            </button>
          </div>

          {/* 显示生成的公钥 */}
          {generatedKey && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-medium">公钥已生成</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey)
                    setCopiedKey(true)
                    setTimeout(() => setCopiedKey(false), 2000)
                  }}
                  className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey ? '已复制' : '复制'}
                </button>
              </div>
              <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
                {generatedKey}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                将此公钥添加到你的 GitHub/GitLab 账户的 SSH Keys 设置中
              </p>
            </div>
          )}

          {/* SSH 密钥列表提示 */}
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>密钥文件保存在 ~/.ssh 目录下</span>
          </div>
        </Section>

        {/* Git 源登录 */}
        <Section icon={LogIn} title="Git 源登录">
          <p className="text-sm text-gray-400 mb-4">
            配置 Git 仓库托管服务的访问凭据。
          </p>
          
          {/* 已配置的源 */}
          <div className="space-y-3 mb-4">
            {credentials.map(cred => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    cred.provider === 'github' ? 'bg-gray-600' :
                    cred.provider === 'gitlab' ? 'bg-orange-600/20' :
                    cred.provider === 'gitee' ? 'bg-red-600/20' :
                    'bg-blue-600/20'
                  }`}>
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{cred.name}</div>
                    <div className="text-xs text-gray-500">{cred.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cred.connected ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                      <Check className="w-3 h-3" /> 已连接
                    </span>
                  ) : (
                    <button 
                      onClick={() => setShowCredentialForm(true)}
                      className="text-xs text-primary hover:text-primary-hover bg-primary/10 px-2 py-1 rounded"
                    >
                      配置
                    </button>
                  )}
                  <a
                    href={cred.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* 添加新源 */}
          <button
            onClick={() => setShowCredentialForm(true)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
            添加自定义源
          </button>

          {/* 凭据表单对话框 */}
          {showCredentialForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold text-white mb-4">配置 Git 源凭据</h3>
                <InputField
                  label="用户名"
                  value={newCredential.username}
                  onChange={(v: string) => setNewCredential({ ...newCredential, username: v })}
                  placeholder="用户名"
                />
                <InputField
                  label="访问令牌 (Token)"
                  type="password"
                  value={newCredential.token}
                  onChange={(v: string) => setNewCredential({ ...newCredential, token: v })}
                  placeholder="ghp_xxxx..."
                />
                <p className="text-xs text-gray-500 mb-4">
                  访问令牌需要在对应平台的设置中生成，需要具有 repo 权限。
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCredentialForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      // 保存凭据逻辑
                      setShowCredentialForm(false)
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Git 默认配置 */}
        <Section icon={GitBranch} title="Git 配置">
          <InputField
            label="用户名"
            value={gitConfig.name}
            onChange={(v: string) => setGitConfig({ ...gitConfig, name: v })}
            placeholder="Your Name"
          />
          <InputField
            label="邮箱"
            value={gitConfig.email}
            onChange={(v: string) => setGitConfig({ ...gitConfig, email: v })}
            placeholder="your@email.com"
          />
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span>这些设置将应用于当前仓库</span>
          </div>
        </Section>

        {/* 终端设置 */}
        <Section icon={Terminal} title="终端设置">
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
              <span className="text-white">显示命令输出</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
              <span className="text-white">操作前确认危险命令</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
              <span className="text-white">自动拉取远程更新</span>
              <input type="checkbox" className="w-5 h-5 accent-primary" />
            </label>
          </div>
        </Section>

        {/* 关于 */}
        <Section icon={Shield} title="关于">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>版本</span>
              <span className="text-white">0.4.0</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>项目</span>
              <span className="text-white">@ldesign/git</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>许可证</span>
              <span className="text-white">MIT</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
