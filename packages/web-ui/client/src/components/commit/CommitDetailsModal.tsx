import { useState, useEffect } from 'react'
import { X, GitCommit, User, Clock, FileText, Plus, Minus, Edit, Loader2 } from 'lucide-react'
import { gitApi } from '../../services/api'

interface CommitDetails {
  hash: string
  author: { name: string; email: string; date: string }
  committer: { name: string; email: string; date: string }
  subject: string
  body: string
  parents: string[]
  files: { status: string; path: string }[]
  stats: string
}

interface Props {
  hash: string
  onClose: () => void
}

export default function CommitDetailsModal({ hash, onClose }: Props) {
  const [details, setDetails] = useState<CommitDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await gitApi.getCommitDetails(hash)
        if (response.data?.success) {
          setDetails(response.data.data)
        } else {
          setError('获取提交详情失败')
        }
      } catch (err: any) {
        setError(err.message || '获取提交详情失败')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [hash])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'A': return <Plus className="w-4 h-4 text-green-400" />
      case 'D': return <Minus className="w-4 h-4 text-red-400" />
      case 'M': return <Edit className="w-4 h-4 text-yellow-400" />
      default: return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'A': return '新增'
      case 'D': return '删除'
      case 'M': return '修改'
      case 'R': return '重命名'
      case 'C': return '复制'
      default: return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <GitCommit className="w-5 h-5 text-blue-400" />
            <span className="font-mono text-sm text-gray-300">{hash.substring(0, 8)}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : details ? (
            <div className="space-y-6">
              {/* Subject & Body */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">{details.subject}</h2>
                {details.body && (
                  <pre className="text-gray-400 text-sm whitespace-pre-wrap font-sans">
                    {details.body}
                  </pre>
                )}
              </div>

              {/* Author & Committer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">作者</div>
                  <div className="flex items-center gap-2 text-white">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>{details.author.name}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{details.author.email}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <Clock className="w-3 h-3" />
                    {formatDate(details.author.date)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">提交者</div>
                  <div className="flex items-center gap-2 text-white">
                    <User className="w-4 h-4 text-green-400" />
                    <span>{details.committer.name}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{details.committer.email}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <Clock className="w-3 h-3" />
                    {formatDate(details.committer.date)}
                  </div>
                </div>
              </div>

              {/* Parents */}
              {details.parents.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">父提交</div>
                  <div className="flex flex-wrap gap-2">
                    {details.parents.map((parent, i) => (
                      <span key={i} className="font-mono text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                        {parent.substring(0, 8)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Changed Files */}
              <div>
                <div className="text-sm text-gray-500 mb-3">
                  变更文件 ({details.files.length})
                </div>
                <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                  {details.files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2">
                      {getStatusIcon(file.status)}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        file.status === 'A' ? 'bg-green-900/50 text-green-400' :
                        file.status === 'D' ? 'bg-red-900/50 text-red-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {getStatusLabel(file.status)}
                      </span>
                      <span className="font-mono text-sm text-gray-300 truncate">{file.path}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              {details.stats && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">统计</div>
                  <pre className="text-xs text-gray-400 bg-gray-800 p-3 rounded-lg overflow-x-auto">
                    {details.stats}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
