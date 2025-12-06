import { useState, useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import {
  FileText, Plus, Minus, Edit3, AlertCircle, Check, X,
  ChevronDown, ChevronRight, RefreshCw, Trash2, RotateCcw,
  FolderOpen, File, GitCommit, Eye, EyeOff, Search,
  CheckSquare, Square, MinusSquare, Send, Sparkles, Loader2
} from 'lucide-react'
import { gitApi } from '../../services/api'
import DiffViewer from '../common/DiffViewer'

type FileChange = {
  path: string
  status: 'modified' | 'created' | 'deleted' | 'untracked' | 'renamed'
  staged: boolean
}

export default function NewChangesPage() {
  const { status, fetchStatus, addFiles, resetFiles, discardChanges, commit } = useGitStore()
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [commitMessage, setCommitMessage] = useState('')
  const [showDiff, setShowDiff] = useState<string | null>(null)
  const [diffContent, setDiffContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  // 整理文件列表
  const allChanges: FileChange[] = [
    ...(status?.modified || []).map(p => ({ path: p, status: 'modified' as const, staged: false })),
    ...(status?.created || []).map(p => ({ path: p, status: 'created' as const, staged: false })),
    ...(status?.deleted || []).map(p => ({ path: p, status: 'deleted' as const, staged: false })),
    ...(status?.notAdded || []).map(p => ({ path: p, status: 'untracked' as const, staged: false })),
  ]

  const filteredChanges = searchTerm
    ? allChanges.filter(f => f.path.toLowerCase().includes(searchTerm.toLowerCase()))
    : allChanges

  // 按文件夹分组
  const groupedChanges = filteredChanges.reduce((acc, file) => {
    const parts = file.path.split('/')
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '根目录'
    if (!acc[folder]) acc[folder] = []
    acc[folder].push(file)
    return acc
  }, {} as Record<string, FileChange[]>)

  const handleSelectAll = () => {
    if (selectedFiles.size === allChanges.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(allChanges.map(f => f.path)))
    }
  }

  const handleSelectFile = (path: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(path)) {
      newSelected.delete(path)
    } else {
      newSelected.add(path)
    }
    setSelectedFiles(newSelected)
  }

  const handleStageSelected = async () => {
    if (selectedFiles.size === 0) return
    setLoading(true)
    try {
      await addFiles(Array.from(selectedFiles))
      setSelectedFiles(new Set())
    } finally {
      setLoading(false)
    }
  }

  const handleUnstageSelected = async () => {
    if (selectedFiles.size === 0) return
    setLoading(true)
    try {
      await resetFiles(Array.from(selectedFiles))
      setSelectedFiles(new Set())
    } finally {
      setLoading(false)
    }
  }

  const handleDiscardSelected = async () => {
    if (selectedFiles.size === 0) return
    if (!confirm(`确定要丢弃 ${selectedFiles.size} 个文件的更改吗？此操作不可撤销。`)) return
    setLoading(true)
    try {
      await discardChanges(Array.from(selectedFiles))
      setSelectedFiles(new Set())
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!commitMessage.trim()) return
    setLoading(true)
    try {
      // 先暂存所有选中的文件
      if (selectedFiles.size > 0) {
        await addFiles(Array.from(selectedFiles))
      }
      await commit(commitMessage)
      setCommitMessage('')
      setSelectedFiles(new Set())
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCommit = async () => {
    if (!commitMessage.trim() || allChanges.length === 0) return
    setLoading(true)
    try {
      // 暂存所有文件
      await addFiles(allChanges.map(f => f.path))
      await commit(commitMessage)
      setCommitMessage('')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDiff = async (path: string) => {
    if (showDiff === path) {
      setShowDiff(null)
      return
    }
    setShowDiff(path) // 先设置选中状态
    setDiffContent('') // 清空之前的内容
    try {
      const response = await gitApi.getFileDiff(path)
      if (response.data?.success) {
        setDiffContent(response.data.data || '无差异')
      } else {
        setDiffContent(`获取差异失败: ${response.data?.error || '未知错误'}`)
      }
    } catch (error: any) {
      console.error('获取差异失败:', error)
      setDiffContent(`获取差异失败: ${error.message || '网络错误'}`)
    }
  }

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  const handleAIGenerateCommitMessage = async () => {
    if (allChanges.length === 0) return
    
    setAiGenerating(true)
    try {
      // 获取所有变更文件的 diff
      const diffPromises = allChanges.slice(0, 10).map(f => 
        gitApi.getFileDiff(f.path).then(r => r.data?.data || '').catch(() => '')
      )
      const diffs = await Promise.all(diffPromises)
      const combinedDiff = diffs.filter(Boolean).join('\n\n')
      
      if (!combinedDiff.trim()) {
        alert('无法获取变更内容')
        return
      }
      
      const response = await gitApi.generateCommitMessage(combinedDiff, 'zh')
      if (response.data?.success && response.data.data) {
        setCommitMessage(response.data.data)
      } else {
        alert(response.data?.error || '生成失败')
      }
    } catch (error: any) {
      console.error('AI 生成失败:', error)
      alert('AI 生成失败: ' + (error.message || '未知错误'))
    } finally {
      setAiGenerating(false)
    }
  }

  const getStatusIcon = (status: FileChange['status']) => {
    switch (status) {
      case 'modified': return <Edit3 className="w-4 h-4 text-yellow-400" />
      case 'created': return <Plus className="w-4 h-4 text-green-400" />
      case 'deleted': return <Minus className="w-4 h-4 text-red-400" />
      case 'untracked': return <AlertCircle className="w-4 h-4 text-gray-400" />
      default: return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: FileChange['status']) => {
    switch (status) {
      case 'modified': return 'M'
      case 'created': return 'A'
      case 'deleted': return 'D'
      case 'untracked': return '?'
      default: return ''
    }
  }

  const getStatusColor = (status: FileChange['status']) => {
    switch (status) {
      case 'modified': return 'text-yellow-400 bg-yellow-400/10'
      case 'created': return 'text-green-400 bg-green-400/10'
      case 'deleted': return 'text-red-400 bg-red-400/10'
      case 'untracked': return 'text-gray-400 bg-gray-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">变更</h2>
            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
              {allChanges.length} 个文件
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchStatus()}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
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
            placeholder="搜索文件..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧文件列表 */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          {/* 批量操作 */}
          {allChanges.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white"
              >
                {selectedFiles.size === allChanges.length ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : selectedFiles.size > 0 ? (
                  <MinusSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>全选</span>
              </button>
              
              {selectedFiles.size > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleStageSelected}
                    disabled={loading}
                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                  >
                    暂存 ({selectedFiles.size})
                  </button>
                  <button
                    onClick={handleDiscardSelected}
                    disabled={loading}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                  >
                    丢弃
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 文件列表 */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(groupedChanges).length > 0 ? (
              Object.entries(groupedChanges).map(([folder, files]) => (
                <div key={folder}>
                  {/* 文件夹头 */}
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="w-full px-4 py-2 flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  >
                    {expandedFolders.has(folder) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <FolderOpen className="w-4 h-4" />
                    <span className="flex-1 text-left truncate">{folder}</span>
                    <span className="text-xs text-gray-500">{files.length}</span>
                  </button>
                  
                  {/* 文件列表 */}
                  {(expandedFolders.has(folder) || expandedFolders.size === 0) && (
                    <div>
                      {files.map((file) => (
                        <div
                          key={file.path}
                          className={`group flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
                            showDiff === file.path ? 'bg-gray-100 dark:bg-gray-800' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleSelectFile(file.path)}
                            className="mr-3"
                          >
                            {selectedFiles.has(file.path) ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                            )}
                          </button>
                          
                          <span className={`w-6 h-6 flex items-center justify-center text-xs font-mono rounded mr-2 ${getStatusColor(file.status)}`}>
                            {getStatusLabel(file.status)}
                          </span>
                          
                          <button
                            onClick={() => handleViewDiff(file.path)}
                            className="flex-1 text-left truncate text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                          >
                            {file.path.split('/').pop()}
                          </button>
                          
                          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                            <button
                              onClick={() => handleViewDiff(file.path)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              title="查看差异"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                await addFiles([file.path])
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-green-500"
                              title="暂存"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('确定要丢弃此文件的更改吗？')) {
                                  await discardChanges([file.path])
                                }
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-red-500"
                              title="丢弃更改"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Check className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg">工作区干净</p>
                <p className="text-sm mt-1">没有未提交的更改</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧差异预览和提交 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Diff 预览 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {showDiff ? `差异: ${showDiff}` : '选择文件查看差异'}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              {showDiff ? (
                <DiffViewer diff={diffContent} fileName={showDiff} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-50 dark:bg-gray-950">
                  <FileText className="w-12 h-12 mb-4 opacity-50" />
                  <p>点击文件名查看差异</p>
                </div>
              )}
            </div>
          </div>

          {/* 提交面板 */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <GitCommit className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">提交更改</span>
              </div>
              <button
                onClick={handleAIGenerateCommitMessage}
                disabled={aiGenerating || allChanges.length === 0}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5"
                title="使用 AI 生成提交信息"
              >
                {aiGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{aiGenerating ? '生成中...' : 'AI 生成'}</span>
              </button>
            </div>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="输入提交信息，或点击 AI 生成按钮自动生成..."
              className="w-full h-20 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                {selectedFiles.size > 0 
                  ? `将提交 ${selectedFiles.size} 个选中的文件`
                  : '将提交所有更改'}
              </span>
              <div className="flex items-center space-x-2">
                {selectedFiles.size > 0 ? (
                  <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || loading}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>提交选中</span>
                  </button>
                ) : (
                  <button
                    onClick={handleQuickCommit}
                    disabled={!commitMessage.trim() || allChanges.length === 0 || loading}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>提交全部</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
