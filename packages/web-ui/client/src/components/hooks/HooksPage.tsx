import { useState, useEffect } from 'react'
import { gitApi } from '../../services/api'
import { FileCode, Save, RefreshCw, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'

interface Hook {
  name: string
  enabled: boolean
  content: string
}

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([])
  const [selectedHook, setSelectedHook] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchHooks()
  }, [])

  const fetchHooks = async () => {
    setLoading(true)
    try {
      const response = await gitApi.getHooks()
      if (response.data?.success) {
        setHooks(response.data.data || [])
      }
    } catch (error) {
      console.error('获取 Hooks 失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectHook = (name: string) => {
    setSelectedHook(name)
    const hook = hooks.find(h => h.name === name)
    setEditContent(hook?.content || getDefaultHookContent(name))
  }

  const handleToggle = async (name: string) => {
    const hook = hooks.find(h => h.name === name)
    if (!hook) return
    
    setSaving(true)
    try {
      await gitApi.saveHook(name, hook.content || getDefaultHookContent(name), !hook.enabled)
      await fetchHooks()
    } catch (error) {
      console.error('切换 Hook 失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!selectedHook) return
    const hook = hooks.find(h => h.name === selectedHook)
    if (!hook) return
    
    setSaving(true)
    try {
      await gitApi.saveHook(selectedHook, editContent, hook.enabled)
      await fetchHooks()
      alert('Hook 已保存')
    } catch (error) {
      console.error('保存 Hook 失败:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultHookContent = (name: string) => {
    return `#!/bin/sh
# ${name} hook
# 这个 hook 在 ${getHookDescription(name)} 时执行

# 在下面添加你的命令
`
  }

  const getHookDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'pre-commit': '提交前',
      'prepare-commit-msg': '准备提交信息时',
      'commit-msg': '提交信息输入后',
      'post-commit': '提交完成后',
      'pre-push': '推送前',
      'pre-rebase': '变基前',
      'post-checkout': '检出后',
      'post-merge': '合并后'
    }
    return descriptions[name] || name
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-900">
      {/* 左侧 Hook 列表 */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Git Hooks</h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {hooks.map(hook => (
            <div
              key={hook.name}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-800 hover:bg-gray-800 ${
                selectedHook === hook.name ? 'bg-gray-800 border-l-2 border-l-orange-500' : ''
              }`}
              onClick={() => handleSelectHook(hook.name)}
            >
              <div>
                <p className="text-sm text-white font-medium">{hook.name}</p>
                <p className="text-xs text-gray-500">{getHookDescription(hook.name)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(hook.name) }}
                disabled={saving}
                className="text-gray-400 hover:text-white"
              >
                {hook.enabled ? (
                  <ToggleRight className="w-6 h-6 text-green-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧编辑器 */}
      <div className="flex-1 flex flex-col">
        {selectedHook ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">{selectedHook}</span>
                {hooks.find(h => h.name === selectedHook)?.enabled && (
                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">已启用</span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '保存中...' : '保存'}</span>
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 w-full p-4 bg-gray-950 text-gray-300 font-mono text-sm resize-none focus:outline-none"
              placeholder="输入 Hook 脚本..."
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p>选择一个 Hook 进行编辑</p>
          </div>
        )}
      </div>
    </div>
  )
}
