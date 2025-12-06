import { useState, useEffect } from 'react'
import { gitApi } from '../../services/api'
import { History, RefreshCw, RotateCcw, GitCommit, Clock, User, AlertTriangle, CheckCircle, Copy, Check } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface ReflogEntry {
  hash: string
  ref: string
  action: string
  date: string
  author: string
}

export default function ReflogPage() {
  const [entries, setEntries] = useState<ReflogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<ReflogEntry | null>(null)
  const [resetMode, setResetMode] = useState<'soft' | 'mixed' | 'hard'>('mixed')
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  useEffect(() => {
    fetchReflog()
  }, [])

  const fetchReflog = async () => {
    setLoading(true)
    try {
      const response = await gitApi.getReflog(200)
      if (response.data?.success) {
        setEntries(response.data.data || [])
      }
    } catch (err) {
      console.error('获取 Reflog 失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!selectedEntry) return
    if (!confirm(`确定要重置到 ${selectedEntry.ref} 吗？\n模式: ${resetMode}\n此操作${resetMode === 'hard' ? '会丢失所有未提交的更改！' : '可能会影响暂存区状态。'}`)) {
      return
    }
    
    setResetting(true)
    try {
      await gitApi.resetToReflog(selectedEntry.hash, resetMode)
      alert('重置成功！')
      fetchReflog()
      setSelectedEntry(null)
    } catch (err: any) {
      alert('重置失败: ' + (err.message || '未知错误'))
    } finally {
      setResetting(false)
    }
  }

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const getActionColor = (action: string) => {
    if (action.includes('commit')) return 'text-green-500 bg-green-500/10'
    if (action.includes('checkout')) return 'text-blue-500 bg-blue-500/10'
    if (action.includes('merge')) return 'text-purple-500 bg-purple-500/10'
    if (action.includes('rebase')) return 'text-orange-500 bg-orange-500/10'
    if (action.includes('reset')) return 'text-red-500 bg-red-500/10'
    if (action.includes('pull')) return 'text-cyan-500 bg-cyan-500/10'
    if (action.includes('cherry-pick')) return 'text-pink-500 bg-pink-500/10'
    return 'text-gray-500 bg-gray-500/10'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('commit')) return <GitCommit className="w-4 h-4" />
    if (action.includes('checkout')) return <History className="w-4 h-4" />
    if (action.includes('reset')) return <RotateCcw className="w-4 h-4" />
    return <GitCommit className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <History className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">引用日志 (Reflog)</h1>
            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
              {entries.length} 条记录
            </span>
          </div>
          <button
            onClick={fetchReflog}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <p className="mt-2 text-sm text-gray-500">
          Reflog 记录了 HEAD 的所有变更历史，可用于恢复误操作。
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧列表 */}
        <div className="flex-1 overflow-y-auto">
          {entries.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((entry, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedEntry(entry)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    selectedEntry?.hash === entry.hash ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getActionColor(entry.action)}`}>
                      {getActionIcon(entry.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                          {entry.ref}
                        </code>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyHash(entry.hash) }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="复制完整哈希"
                        >
                          {copiedHash === entry.hash ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {entry.action}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {entry.author}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {dayjs(entry.date).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <History className="w-12 h-12 mb-4 opacity-50" />
              <p>暂无 Reflog 记录</p>
            </div>
          )}
        </div>

        {/* 右侧详情/操作面板 */}
        {selectedEntry && (
          <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">重置到此位置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">引用</label>
                <code className="block px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                  {selectedEntry.ref}
                </code>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">完整哈希</label>
                <code className="block px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                  {selectedEntry.hash}
                </code>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">操作</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedEntry.action}</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-2">重置模式</label>
                <div className="space-y-2">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={resetMode === 'soft'}
                      onChange={() => setResetMode('soft')}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm text-gray-900 dark:text-white font-medium">Soft</span>
                      <p className="text-xs text-gray-500">仅移动 HEAD，保留所有更改在暂存区</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={resetMode === 'mixed'}
                      onChange={() => setResetMode('mixed')}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm text-gray-900 dark:text-white font-medium">Mixed（默认）</span>
                      <p className="text-xs text-gray-500">移动 HEAD，重置暂存区，保留工作目录</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={resetMode === 'hard'}
                      onChange={() => setResetMode('hard')}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm text-red-500 font-medium flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Hard
                      </span>
                      <p className="text-xs text-gray-500">完全重置，丢弃所有未提交的更改</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <button
                onClick={handleReset}
                disabled={resetting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {resetting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>{resetting ? '重置中...' : '执行重置'}</span>
              </button>
              
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-full px-4 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
