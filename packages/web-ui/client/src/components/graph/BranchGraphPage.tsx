import { useState, useEffect } from 'react'
import { GitBranch, Loader2, AlertCircle, RefreshCw, Tag } from 'lucide-react'
import { gitApi } from '../../services/api'

interface GraphLine {
  graph: string
  hash: string
  refs: string[]
  message: string
}

export default function BranchGraphPage() {
  const [graphData, setGraphData] = useState<GraphLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(100)

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

  const renderGraphChar = (char: string, index: number) => {
    const colors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400', 'text-pink-400', 'text-cyan-400']
    
    if (char === '*') {
      return <span key={index} className="text-red-400 font-bold">●</span>
    } else if (char === '|') {
      return <span key={index} className={colors[index % colors.length]}>│</span>
    } else if (char === '\\') {
      return <span key={index} className={colors[index % colors.length]}>╲</span>
    } else if (char === '/') {
      return <span key={index} className={colors[index % colors.length]}>╱</span>
    } else if (char === '_') {
      return <span key={index} className={colors[index % colors.length]}>─</span>
    } else {
      return <span key={index}>{char}</span>
    }
  }

  const renderGraph = (graph: string) => {
    return (
      <span className="font-mono whitespace-pre">
        {graph.split('').map((char, i) => renderGraphChar(char, i))}
      </span>
    )
  }

  const renderRefs = (refs: string[]) => {
    return refs.map((ref, i) => {
      const isBranch = !ref.startsWith('tag:')
      const isHead = ref.includes('HEAD')
      const name = ref.replace('HEAD -> ', '').replace('tag: ', '')
      
      return (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium mr-1 ${
            isHead ? 'bg-red-900/50 text-red-300' :
            isBranch ? 'bg-green-900/50 text-green-300' :
            'bg-yellow-900/50 text-yellow-300'
          }`}
        >
          {isBranch ? <GitBranch className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
          {name}
        </span>
      )
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-green-400" />
          <h1 className="text-lg font-semibold text-white">分支图</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={limit}
            onChange={e => setLimit(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value={50}>最近 50 条</option>
            <option value={100}>最近 100 条</option>
            <option value={200}>最近 200 条</option>
            <option value={500}>最近 500 条</option>
          </select>
          
          <button
            onClick={fetchGraph}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-400 gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : graphData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <GitBranch className="w-12 h-12 mb-4 opacity-50" />
            <p>没有提交记录</p>
          </div>
        ) : (
          <div className="p-4 font-mono text-sm">
            {graphData.map((line, i) => (
              <div key={i} className="flex items-start hover:bg-gray-900/50 py-0.5">
                <div className="w-40 shrink-0 text-gray-600 overflow-hidden">
                  {renderGraph(line.graph)}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  {line.hash && (
                    <span className="text-yellow-500 shrink-0">{line.hash}</span>
                  )}
                  {line.refs.length > 0 && (
                    <span className="shrink-0">{renderRefs(line.refs)}</span>
                  )}
                  <span className="text-gray-300 truncate">{line.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="text-red-400 font-bold">●</span>
          <span>提交</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-400">│</span>
          <span>分支线</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-green-900/50 text-green-300 px-1 rounded">branch</span>
          <span>分支</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-yellow-900/50 text-yellow-300 px-1 rounded">tag</span>
          <span>标签</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-red-900/50 text-red-300 px-1 rounded">HEAD</span>
          <span>当前位置</span>
        </div>
      </div>
    </div>
  )
}
