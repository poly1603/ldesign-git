import { useState, useEffect, useCallback } from 'react'
import { GitBranch, Loader2, AlertCircle, RefreshCw, Tag, Eye, X, Copy, Check } from 'lucide-react'
import { gitApi } from '../../services/api'
import GitGraph from './GitGraph'

interface GraphLine {
  graph: string
  hash: string
  refs: string[]
  message: string
}

interface CommitDetail {
  hash: string
  author: { name: string; email: string; date: string }
  committer: { name: string; email: string; date: string }
  subject: string
  body: string
  parents: string[]
  files: { status: string; path: string }[]
  stats: string
}

export default function BranchGraphPage() {
  const [graphData, setGraphData] = useState<GraphLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(100)
  const [selectedCommit, setSelectedCommit] = useState<CommitDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchGraph()
  }, [limit])

  const fetchGraph = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await gitApi.getBranchGraph(limit)
      if (response.data?.success) {
        setGraphData(response.data.data || [])
      } else {
        setError('获取分支图失败')
      }
    } catch (err: any) {
      setError(err.message || '获取分支图失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCommitClick = useCallback(async (hash: string) => {
    if (!hash) return
    setLoadingDetail(true)
    try {
      const response = await gitApi.getCommitDetails(hash)
      if (response.data?.success) {
        setSelectedCommit(response.data.data)
      }
    } catch (err) {
      console.error('获取提交详情失败:', err)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const copyHash = () => {
    if (selectedCommit) {
      navigator.clipboard.writeText(selectedCommit.hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-950">
      {/* 主图形区域 */}
      <div className={`flex flex-col flex-1 min-w-0 ${selectedCommit ? 'w-1/2' : 'w-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-green-500" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">分支图</h1>
            <span className="text-sm text-gray-500">
              {graphData.filter(d => d.hash).length} 个提交
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={limit}
              onChange={e => setLimit(parseInt(e.target.value))}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={50}>最近 50 条</option>
              <option value={100}>最近 100 条</option>
              <option value={200}>最近 200 条</option>
              <option value={500}>最近 500 条</option>
            </select>
            
            <button
              onClick={fetchGraph}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500 gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : graphData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <GitBranch className="w-12 h-12 mb-4 opacity-50" />
              <p>没有提交记录</p>
            </div>
          ) : (
            <GitGraph data={graphData} onCommitClick={handleCommitClick} />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>提交</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-400/50" />
            <span>HEAD</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded text-xs">
              <GitBranch className="w-3 h-3 inline mr-0.5" />分支
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded text-xs">
              <Tag className="w-3 h-3 inline mr-0.5" />标签
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs">远程</span>
          </div>
        </div>
      </div>

      {/* 提交详情侧边栏 */}
      {selectedCommit && (
        <div className="w-96 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">提交详情</h2>
            <button
              onClick={() => setSelectedCommit(null)}
              className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Hash */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">提交哈希</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                    {selectedCommit.hash.substring(0, 12)}
                  </code>
                  <button
                    onClick={copyHash}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="复制完整哈希"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">提交信息</label>
                <p className="mt-1 text-gray-900 dark:text-white font-medium">
                  {selectedCommit.subject}
                </p>
                {selectedCommit.body && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedCommit.body}
                  </p>
                )}
              </div>

              {/* Author */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">作者</label>
                <div className="mt-1 text-sm">
                  <span className="text-gray-900 dark:text-white">{selectedCommit.author.name}</span>
                  <span className="text-gray-500 ml-2">&lt;{selectedCommit.author.email}&gt;</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatDate(selectedCommit.author.date)}
                </div>
              </div>

              {/* Parents */}
              {selectedCommit.parents.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">父提交</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedCommit.parents.map((parent, i) => (
                      <code
                        key={i}
                        onClick={() => handleCommitClick(parent)}
                        className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40"
                      >
                        {parent.substring(0, 7)}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  变更文件 ({selectedCommit.files.length})
                </label>
                <div className="mt-2 space-y-1 max-h-48 overflow-auto">
                  {selectedCommit.files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                        file.status === 'A' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        file.status === 'D' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        file.status === 'M' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {file.status}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 truncate" title={file.path}>
                        {file.path}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              {selectedCommit.stats && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">统计</label>
                  <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                    {selectedCommit.stats}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
