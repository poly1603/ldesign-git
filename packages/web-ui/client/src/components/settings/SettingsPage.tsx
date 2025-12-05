import { useState, useEffect } from 'react'
import { gitApi } from '../../services/api'
import { 
  Settings, User, Key, Globe, Palette, Bell, Shield, 
  Save, RefreshCw, Check, AlertCircle, Eye, EyeOff,
  Terminal, GitBranch, FileCode, Sparkles
} from 'lucide-react'

interface GitConfig {
  name: string
  email: string
}

export default function SettingsPage() {
  const [gitConfig, setGitConfig] = useState<GitConfig>({ name: '', email: '' })
  const [aiConfig, setAiConfig] = useState({ apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' })
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('zh')

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
    <div className="bg-gray-800 rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2 bg-gray-700 rounded-lg">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
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
          className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="h-full overflow-auto bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-7 h-7 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">设置</h1>
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
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
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
          <SelectField
            label="主题"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'dark', label: '深色主题' },
              { value: 'light', label: '浅色主题 (开发中)' },
              { value: 'system', label: '跟随系统 (开发中)' },
            ]}
          />
          <SelectField
            label="语言"
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'zh', label: '简体中文' },
              { value: 'en', label: 'English (开发中)' },
            ]}
          />
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
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-500" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
              <span className="text-white">操作前确认危险命令</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-500" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
              <span className="text-white">自动拉取远程更新</span>
              <input type="checkbox" className="w-5 h-5 accent-blue-500" />
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
