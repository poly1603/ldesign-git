import { useState, useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import {
  GitBranch, Plus, Trash2, Edit3, GitMerge, Check, X,
  ChevronRight, RefreshCw, Search, MoreVertical,
  ArrowUpRight, ArrowDownRight, ExternalLink, Copy
} from 'lucide-react'

export default function NewBranchesPage() {
  const { 
    branches, status, fetchBranches, 
    createBranch, deleteBranch, checkoutBranch, mergeBranch 
  } = useGitStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'local' | 'remote'>('all')

  useEffect(() => {
    fetchBranches()
  }, [])

  const currentBranch = branches.find(b => b.current)
  
  const filteredBranches = branches.filter(b => {
    if (searchTerm && !b.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (filter === 'local' && b.name.startsWith('remotes/')) return false
    if (filter === 'remote' && !b.name.startsWith('remotes/')) return false
    return true
  })

  // 分组显示
  const localBranches = filteredBranches.filter(b => !b.name.startsWith('remotes/'))
  const remoteBranches = filteredBranches.filter(b => b.name.startsWith('remotes/'))

  const handleCheckout = async (name: string) => {
    try {
      await checkoutBranch(name)
    } catch (error) {
      console.error('切换分支失败:', error)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`确定要删除分支 "${name}" 吗？`)) return
    try {
      await deleteBranch(name)
    } catch (error) {
      console.error('删除分支失败:', error)
    }
  }

  const handleMerge = async (name: string) => {
    try {
      await mergeBranch(name)
    } catch (error) {
      console.error('合并分支失败:', error)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">分支管理</h2>
            <div className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              {(['all', 'local', 'remote'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filter === f
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'local' ? '本地' : '远程'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchBranches()}
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
              <span>新建分支</span>
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
            placeholder="搜索分支..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* 分支列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 当前分支 */}
        {currentBranch && (
          <div className="mb-6">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-2">当前分支</h3>
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <GitBranch className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-semibold">{currentBranch.name}</h4>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                      <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">
                        {currentBranch.commit.substring(0, 7)}
                      </code>
                      {status?.tracking && (
                        <span className="flex items-center space-x-2">
                          <span>→ {status.tracking}</span>
                          {status.ahead > 0 && (
                            <span className="text-green-400 flex items-center">
                              <ArrowUpRight className="w-3 h-3 mr-0.5" />
                              {status.ahead}
                            </span>
                          )}
                          {status.behind > 0 && (
                            <span className="text-orange-400 flex items-center">
                              <ArrowDownRight className="w-3 h-3 mr-0.5" />
                              {status.behind}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 本地分支 */}
        {localBranches.length > 0 && filter !== 'remote' && (
          <div className="mb-6">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-2">
              本地分支 ({localBranches.filter(b => !b.current).length})
            </h3>
            <div className="space-y-1">
              {localBranches.filter(b => !b.current).map((branch) => (
                <BranchItem
                  key={branch.name}
                  branch={branch}
                  currentBranchName={currentBranch?.name}
                  onCheckout={() => handleCheckout(branch.name)}
                  onDelete={() => handleDelete(branch.name)}
                  onMerge={() => handleMerge(branch.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 远程分支 */}
        {remoteBranches.length > 0 && filter !== 'local' && (
          <div>
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-2">
              远程分支 ({remoteBranches.length})
            </h3>
            <div className="space-y-1">
              {remoteBranches.map((branch) => (
                <BranchItem
                  key={branch.name}
                  branch={branch}
                  currentBranchName={currentBranch?.name}
                  isRemote
                  onCheckout={() => handleCheckout(branch.name.replace('remotes/', ''))}
                />
              ))}
            </div>
          </div>
        )}

        {filteredBranches.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <GitBranch className="w-12 h-12 mb-4 opacity-50" />
            <p>没有找到匹配的分支</p>
          </div>
        )}
      </div>

      {/* 创建分支模态框 */}
      {showCreateModal && (
        <CreateBranchModal
          currentBranch={currentBranch?.name}
          branches={branches}
          onClose={() => setShowCreateModal(false)}
          onCreate={createBranch}
        />
      )}
    </div>
  )
}

// 分支项组件
function BranchItem({ 
  branch, 
  currentBranchName,
  isRemote = false,
  onCheckout, 
  onDelete, 
  onMerge 
}: {
  branch: { name: string; commit: string; current: boolean }
  currentBranchName?: string
  isRemote?: boolean
  onCheckout?: () => void
  onDelete?: () => void
  onMerge?: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="group flex items-center px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <GitBranch className={`w-4 h-4 mr-3 ${isRemote ? 'text-purple-400' : 'text-primary'}`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900 dark:text-white truncate">{branch.name}</span>
          {isRemote && (
            <span className="px-1.5 py-0.5 bg-purple-900/50 text-purple-400 text-xs rounded">
              远程
            </span>
          )}
        </div>
        <code className="text-xs text-gray-500 font-mono">
          {branch.commit.substring(0, 7)}
        </code>
      </div>

      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
        {onCheckout && (
          <button
            onClick={onCheckout}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-green-500"
            title="切换到此分支"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        {onMerge && !isRemote && (
          <button
            onClick={onMerge}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-primary"
            title={`合并到 ${currentBranchName}`}
          >
            <GitMerge className="w-4 h-4" />
          </button>
        )}
        {onDelete && !isRemote && (
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-red-500"
            title="删除分支"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 创建分支模态框
function CreateBranchModal({ 
  currentBranch,
  branches,
  onClose, 
  onCreate 
}: {
  currentBranch?: string
  branches: { name: string }[]
  onClose: () => void
  onCreate: (name: string, startPoint?: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [startPoint, setStartPoint] = useState(currentBranch || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setLoading(true)
    setError('')
    try {
      await onCreate(name, startPoint || undefined)
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">新建分支</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">分支名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="feature/new-feature"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">基于分支</label>
            <select
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary"
            >
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
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
              disabled={!name.trim() || loading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? '创建中...' : '创建分支'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
