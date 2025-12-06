import { useState, useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import { gitApi } from '../../services/api'
import {
  Tag, Plus, Trash2, Upload, RefreshCw, Search, X,
  Clock, User, ExternalLink
} from 'lucide-react'
import dayjs from 'dayjs'

export default function TagsPage() {
  const { tags, fetchTags } = useGitStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (name: string) => {
    if (!confirm(`确定要删除标签 "${name}" 吗？`)) return
    setLoading(true)
    try {
      await gitApi.deleteTag(name)
      await fetchTags()
    } catch (error) {
      console.error('删除标签失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePush = async (name: string) => {
    setLoading(true)
    try {
      await gitApi.pushTag(name)
      alert(`标签 "${name}" 已推送到远程`)
    } catch (error) {
      console.error('推送标签失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">标签管理</h2>
            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
              {tags.length} 个标签
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchTags()}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新建标签</span>
            </button>
          </div>
        </div>

        {/* 搜索 */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索标签..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* 标签列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTags.length > 0 ? (
          <div className="space-y-2">
            {filteredTags.map((tag) => (
              <div
                key={tag.name}
                className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-semibold">{tag.name}</h4>
                      {tag.message && (
                        <p className="text-sm text-gray-400 mt-1">{tag.message}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          {tag.commit.substring(0, 7)}
                        </code>
                        {tag.tagger && (
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {tag.tagger}
                          </span>
                        )}
                        {tag.date && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {dayjs(tag.date).format('YYYY-MM-DD')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                    <button
                      onClick={() => handlePush(tag.name)}
                      disabled={loading}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-green-500"
                      title="推送到远程"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.name)}
                      disabled={loading}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-red-500"
                      title="删除标签"
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
            <Tag className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">暂无标签</p>
            <p className="text-sm mt-1">点击上方按钮创建新标签</p>
          </div>
        )}
      </div>

      {/* 创建标签模态框 */}
      {showCreateModal && (
        <CreateTagModal
          onClose={() => setShowCreateModal(false)}
          onRefresh={fetchTags}
        />
      )}
    </div>
  )
}

// 创建标签模态框
function CreateTagModal({
  onClose,
  onRefresh
}: {
  onClose: () => void
  onRefresh: () => void
}) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [annotated, setAnnotated] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')
    try {
      await gitApi.createTag(name, message || undefined, annotated)
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
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">新建标签</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">标签名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="v1.0.0"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">标签信息（可选）</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Release notes..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary"
            />
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={annotated}
              onChange={(e) => setAnnotated(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">创建带注释的标签</span>
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
              disabled={!name.trim() || loading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? '创建中...' : '创建标签'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
