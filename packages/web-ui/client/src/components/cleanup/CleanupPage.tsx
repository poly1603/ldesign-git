import { useState, useEffect } from 'react'
import { gitApi } from '../../services/api'
import {
  Trash2, GitBranch, Archive, RefreshCw, Loader2,
  AlertTriangle, CheckCircle, HardDrive, Zap
} from 'lucide-react'

interface CleanupPreview {
  mergedBranches: string[]
  stashCount: number
}

export default function CleanupPage() {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<CleanupPreview | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ type: string; message: string } | null>(null)

  const loadPreview = async () => {
    setLoading(true)
    try {
      const response = await gitApi.previewCleanup()
      if (response.data?.success) {
        setPreview(response.data.data)
      }
    } catch (error) {
      console.error('加载预览失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPreview()
  }, [])

  const handleCleanupBranches = async (dryRun = true) => {
    setActionLoading('branches')
    try {
      const response = await gitApi.cleanupBranches({ merged: true, dryRun })
      if (response.data?.success) {
        const data = response.data.data
        if (dryRun) {
          setResult({ type: 'info', message: `将删除 ${data.count} 个已合并分支` })
        } else {
          setResult({ type: 'success', message: `已删除 ${data.count} 个分支` })
          loadPreview()
        }
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRunGC = async (aggressive = false) => {
    setActionLoading('gc')
    try {
      await gitApi.runGC(aggressive)
      setResult({ type: 'success', message: aggressive ? '深度垃圾回收完成' : '垃圾回收完成' })
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handlePruneRemote = async () => {
    setActionLoading('prune')
    try {
      await gitApi.pruneRemoteBranches()
      setResult({ type: 'success', message: '远程分支已清理' })
      loadPreview()
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCleanupStash = async () => {
    setActionLoading('stash')
    try {
      const response = await gitApi.cleanupStash(5)
      if (response.data?.success) {
        setResult({ type: 'success', message: `已清理 ${response.data.data.count} 个旧 stash` })
        loadPreview()
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setActionLoading(null)
    }
  }

  const CleanupAction = ({ 
    id, icon: Icon, title, description, action, color, disabled = false 
  }: {
    id: string
    icon: any
    title: string
    description: string
    action: () => void
    color: string
    disabled?: boolean
  }) => (
    <button
      onClick={action}
      disabled={actionLoading !== null || disabled}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        disabled 
          ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {actionLoading === id ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </button>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">仓库清理</h2>
              <p className="text-sm text-gray-500">清理分支、stash 和优化仓库</p>
            </div>
          </div>
          <button
            onClick={loadPreview}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 结果提示 */}
        {result && (
          <div className={`mb-4 p-4 rounded-xl flex items-center space-x-3 ${
            result.type === 'success' ? 'bg-green-500/10 border border-green-500/30' :
            result.type === 'error' ? 'bg-red-500/10 border border-red-500/30' :
            'bg-blue-500/10 border border-blue-500/30'
          }`}>
            {result.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : result.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-sm">{result.message}</span>
            <button 
              onClick={() => setResult(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}

        {/* 预览统计 */}
        {preview && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <GitBranch className="w-8 h-8 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold text-orange-500">{preview.mergedBranches.length}</div>
                  <div className="text-sm text-gray-500">可清理分支</div>
                </div>
              </div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Archive className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-500">{preview.stashCount}</div>
                  <div className="text-sm text-gray-500">Stash 数量</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 清理操作 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">清理操作</h3>
          
          <CleanupAction
            id="branches"
            icon={GitBranch}
            title="清理已合并分支"
            description={preview ? `删除 ${preview.mergedBranches.length} 个已合并到主分支的本地分支` : '加载中...'}
            action={() => handleCleanupBranches(false)}
            color="bg-orange-500/20 text-orange-400"
            disabled={!preview || preview.mergedBranches.length === 0}
          />

          <CleanupAction
            id="prune"
            icon={RefreshCw}
            title="清理远程跟踪分支"
            description="删除远程已不存在的本地跟踪分支"
            action={handlePruneRemote}
            color="bg-blue-500/20 text-blue-400"
          />

          <CleanupAction
            id="stash"
            icon={Archive}
            title="清理旧 Stash"
            description="保留最近 5 个 stash，删除其余的"
            action={handleCleanupStash}
            color="bg-purple-500/20 text-purple-400"
            disabled={!preview || preview.stashCount <= 5}
          />

          <CleanupAction
            id="gc"
            icon={HardDrive}
            title="垃圾回收"
            description="运行 git gc 清理松散对象，优化仓库"
            action={() => handleRunGC(false)}
            color="bg-green-500/20 text-green-400"
          />

          <CleanupAction
            id="gc-aggressive"
            icon={Zap}
            title="深度垃圾回收"
            description="运行 git gc --aggressive，更彻底但更慢"
            action={() => handleRunGC(true)}
            color="bg-yellow-500/20 text-yellow-400"
          />
        </div>

        {/* 可清理分支列表 */}
        {preview && preview.mergedBranches.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">可清理的分支</h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {preview.mergedBranches.map((branch, index) => (
                <div key={index} className="px-4 py-3 flex items-center space-x-3">
                  <GitBranch className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{branch}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
