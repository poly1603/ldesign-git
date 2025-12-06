import { useState, useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import { gitApi } from '../../services/api'
import {
  Globe, Plus, Trash2, RefreshCw, Download, Upload, X,
  ExternalLink, Copy, Check
} from 'lucide-react'

export default function RemotesPage() {
  const { remotes, fetchRemotes, fetch, pull, push } = useGitStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchRemotes()
  }, [])

  const handleRemove = async (name: string) => {
    if (!confirm(`确定要移除远程仓库 "${name}" 吗？`)) return
    setLoading(true)
    try {
      await gitApi.removeRemote(name)
      await fetchRemotes()
    } catch (error) {
      console.error('移除远程仓库失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFetch = async (remote: string) => {
    setLoading(true)
    try {
      await gitApi.fetch(remote)
      alert(`已从 ${remote} 获取更新`)
    } catch (error) {
      console.error('获取失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  // 按远程仓库分组
  const groupedRemotes = remotes.reduce((acc, remote) => {
    if (!acc[remote.name]) {
      acc[remote.name] = { name: remote.name, urls: {} }
    }
    acc[remote.name].urls[remote.type] = remote.url
    return acc
  }, {} as Record<string, { name: string; urls: Record<string, string> }>)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">远程仓库</h2>
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              {Object.keys(groupedRemotes).length} 个远程
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchRemotes()}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加远程</span>
            </button>
          </div>
        </div>
      </div>

      {/* 远程仓库列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(groupedRemotes).length > 0 ? (
          <div className="space-y-4">
            {Object.values(groupedRemotes).map((remote) => (
              <div
                key={remote.name}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Globe className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-semibold">{remote.name}</h4>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFetch(remote.name)}
                      disabled={loading}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>获取</span>
                    </button>
                    <button
                      onClick={() => handleRemove(remote.name)}
                      disabled={loading}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-red-500"
                      title="移除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {remote.urls.fetch && (
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Fetch URL</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-mono mt-0.5 truncate max-w-md">
                          {remote.urls.fetch}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyUrl(remote.urls.fetch!)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        title="复制"
                      >
                        {copiedUrl === remote.urls.fetch ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  {remote.urls.push && remote.urls.push !== remote.urls.fetch && (
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Push URL</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-mono mt-0.5 truncate max-w-md">
                          {remote.urls.push}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyUrl(remote.urls.push!)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        title="复制"
                      >
                        {copiedUrl === remote.urls.push ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Globe className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">暂无远程仓库</p>
            <p className="text-sm mt-1">点击上方按钮添加远程仓库</p>
          </div>
        )}
      </div>

      {/* 添加远程仓库模态框 */}
      {showAddModal && (
        <AddRemoteModal
          onClose={() => setShowAddModal(false)}
          onRefresh={fetchRemotes}
        />
      )}
    </div>
  )
}

// 添加远程仓库模态框
function AddRemoteModal({
  onClose,
  onRefresh
}: {
  onClose: () => void
  onRefresh: () => void
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return

    setLoading(true)
    setError('')
    try {
      await gitApi.addRemote(name, url)
      await onRefresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">添加远程仓库</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="origin"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !url.trim() || loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
