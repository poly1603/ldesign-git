import { useState, useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import { gitApi } from '../../services/api'
import {
  Archive, Plus, Trash2, Play, RefreshCw, X,
  Clock, GitBranch, AlertCircle
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function StashPage() {
  const { stashes, status, fetchStashes, fetchStatus } = useGitStore()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStashes()
    fetchStatus()
  }, [])

  const hasChanges = status && !status.isClean

  const handlePop = async (index: number) => {
    if (!confirm('确定要应用并删除此贮藏吗？')) return
    setLoading(true)
    try {
      await gitApi.stashPop(index)
      await Promise.all([fetchStashes(), fetchStatus()])
    } catch (error) {
      console.error('应用贮藏失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (index: number) => {
    setLoading(true)
    try {
      await gitApi.stashApply(index)
      await fetchStatus()
      alert('贮藏已应用（保留贮藏记录）')
    } catch (error) {
      console.error('应用贮藏失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = async (index: number) => {
    if (!confirm('确定要删除此贮藏吗？此操作不可撤销。')) return
    setLoading(true)
    try {
      await gitApi.stashDrop(index)
      await fetchStashes()
    } catch (error) {
      console.error('删除贮藏失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('确定要清空所有贮藏吗？此操作不可撤销。')) return
    setLoading(true)
    try {
      await gitApi.stashClear()
      await fetchStashes()
    } catch (error) {
      console.error('清空贮藏失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-white">贮藏管理</h2>
            <span className="px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full">
              {stashes.length} 个贮藏
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchStashes()}
              className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {stashes.length > 0 && (
              <button
                onClick={handleClear}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>清空全部</span>
              </button>
            )}
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!hasChanges}
              className="flex items-center space-x-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>保存贮藏</span>
            </button>
          </div>
        </div>

        {!hasChanges && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span>当前工作区没有可贮藏的更改</span>
          </div>
        )}
      </div>

      {/* 贮藏列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {stashes.length > 0 ? (
          <div className="space-y-3">
            {stashes.map((stash) => (
              <div
                key={stash.index}
                className="group bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-amber-600/20 rounded-lg">
                      <Archive className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-gray-500">
                          stash@{'{' + stash.index + '}'}
                        </span>
                        <span className="text-white font-medium">
                          {stash.message || '未命名贮藏'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {stash.branch}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {dayjs(stash.date).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                    <button
                      onClick={() => handleApply(stash.index)}
                      disabled={loading}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                      title="应用贮藏（保留）"
                    >
                      应用
                    </button>
                    <button
                      onClick={() => handlePop(stash.index)}
                      disabled={loading}
                      className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                      title="应用并删除"
                    >
                      弹出
                    </button>
                    <button
                      onClick={() => handleDrop(stash.index)}
                      disabled={loading}
                      className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Archive className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">暂无贮藏</p>
            <p className="text-sm mt-1">使用贮藏可以临时保存未提交的更改</p>
          </div>
        )}
      </div>

      {/* 保存贮藏模态框 */}
      {showSaveModal && (
        <SaveStashModal
          onClose={() => setShowSaveModal(false)}
          onRefresh={() => {
            fetchStashes()
            fetchStatus()
          }}
        />
      )}
    </div>
  )
}

// 保存贮藏模态框
function SaveStashModal({
  onClose,
  onRefresh
}: {
  onClose: () => void
  onRefresh: () => void
}) {
  const [message, setMessage] = useState('')
  const [includeUntracked, setIncludeUntracked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')
    try {
      await gitApi.stashSave(message || undefined, includeUntracked)
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
          <h3 className="text-lg font-semibold text-white">保存贮藏</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">贮藏信息（可选）</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="描述这次贮藏的内容..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              autoFocus
            />
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUntracked}
              onChange={(e) => setIncludeUntracked(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-300">包含未跟踪的文件</span>
          </label>

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
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? '保存中...' : '保存贮藏'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
