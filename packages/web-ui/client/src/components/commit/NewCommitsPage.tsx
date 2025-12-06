import { useState, useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import { gitApi } from '../../services/api'
import {
  GitCommit, Search, RefreshCw, ChevronDown, ChevronRight,
  User, Clock, Copy, Check, Eye, RotateCcw, Tag,
  Filter, Calendar, GitBranch
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import DiffViewer from '../common/DiffViewer'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function NewCommitsPage() {
  const { commits, fetchCommits } = useGitStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [commitDiff, setCommitDiff] = useState<string>('')
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [limit, setLimit] = useState(50)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCommits(limit)
  }, [limit])

  const filteredCommits = commits.filter(c =>
    c.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.hash.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 按日期分组
  const groupedCommits = filteredCommits.reduce((acc, commit) => {
    const date = dayjs(commit.date).format('YYYY-MM-DD')
    if (!acc[date]) acc[date] = []
    acc[date].push(commit)
    return acc
  }, {} as Record<string, typeof commits>)

  const handleViewDiff = async (hash: string) => {
    if (selectedCommit === hash) {
      setSelectedCommit(null)
      return
    }
    setLoading(true)
    try {
      const response = await gitApi.getCommitDiff(hash)
      if (response.data?.success) {
        setCommitDiff(response.data.data || '无差异')
        setSelectedCommit(hash)
      }
    } catch (error) {
      console.error('获取差异失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const handleRevert = async (hash: string) => {
    if (!confirm(`确定要回退提交 ${hash.substring(0, 7)} 吗？`)) return
    try {
      await gitApi.revert(hash)
      await fetchCommits(limit)
      alert('提交已回退')
    } catch (error) {
      console.error('回退失败:', error)
    }
  }

  const handleLoadMore = () => {
    setLimit(prev => prev + 50)
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* 左侧提交列表 */}
      <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden bg-white dark:bg-transparent">
        {/* 工具栏 */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">提交历史</h2>
              <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                {filteredCommits.length} 条
              </span>
            </div>
            <button
              onClick={() => fetchCommits(limit)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* 搜索 */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索提交信息、作者或哈希..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* 提交列表 */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedCommits).map(([date, dateCommits]) => (
            <div key={date}>
              {/* 日期分隔 */}
              <div className="sticky top-0 z-10 px-4 py-2 bg-gray-100 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {dayjs(date).format('YYYY年M月D日')}
                </span>
                <span className="text-xs text-gray-600">
                  ({dateCommits.length} 条提交)
                </span>
              </div>

              {/* 提交项 */}
              {dateCommits.map((commit) => (
                <div
                  key={commit.hash}
                  className={`group px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    selectedCommit === commit.hash ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => handleViewDiff(commit.hash)}
                >
                  <div className="flex items-start space-x-3">
                    {/* 图标 */}
                    <div className="pt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <GitCommit className="w-4 h-4 text-primary" />
                      </div>
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                        {commit.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {commit.author_name}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {dayjs(commit.date).fromNow()}
                        </span>
                      </div>
                      
                      {/* 哈希和标签 */}
                      <div className="flex items-center space-x-2 mt-2">
                        <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                          {commit.hash.substring(0, 7)}
                        </code>
                        {commit.refs && (
                          <div className="flex items-center space-x-1">
                            {commit.refs.split(',').map((ref, i) => (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 text-xs rounded ${
                                  ref.includes('HEAD') 
                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                    : ref.includes('tag:')
                                    ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400'
                                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                                }`}
                              >
                                {ref.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyHash(commit.hash) }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        title="复制哈希"
                      >
                        {copiedHash === commit.hash ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRevert(commit.hash) }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-orange-500"
                        title="回退此提交"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* 加载更多 */}
          {commits.length >= limit && (
            <button
              onClick={handleLoadMore}
              className="w-full py-4 text-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              加载更多...
            </button>
          )}

          {filteredCommits.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <GitCommit className="w-12 h-12 mb-4 opacity-50" />
              <p>没有找到匹配的提交</p>
            </div>
          )}
        </div>
      </div>

      {/* 右侧差异预览 */}
      <div className="w-1/2 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {selectedCommit ? (
              <span className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>提交详情: {selectedCommit.substring(0, 7)}</span>
              </span>
            ) : (
              '选择提交查看详情'
            )}
          </h3>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500 bg-gray-100 dark:bg-gray-950">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : selectedCommit ? (
            <DiffViewer diff={commitDiff} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-100 dark:bg-gray-950">
              <GitCommit className="w-12 h-12 mb-4 opacity-50" />
              <p>点击左侧提交查看差异</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
