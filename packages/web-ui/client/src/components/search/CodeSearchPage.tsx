import { useState } from 'react'
import { Search, FileCode, Loader2, AlertCircle, Code, Hash } from 'lucide-react'
import { gitApi } from '../../services/api'

interface SearchResult {
  file: string
  line: number
  content: string
}

export default function CodeSearchPage() {
  const [query, setQuery] = useState('')
  const [pattern, setPattern] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    setSearched(true)
    
    try {
      const response = await gitApi.searchCode(query, {
        pattern: pattern || undefined,
        caseSensitive,
        regex: useRegex
      })
      if (response.data?.success) {
        setResults(response.data.data || [])
      } else {
        setError('搜索失败')
      }
    } catch (err: any) {
      setError(err.message || '搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const highlightMatch = (content: string, query: string) => {
    if (!query || useRegex) return content
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, caseSensitive ? 'g' : 'gi')
    const parts = content.split(regex)
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-500/30 text-yellow-200">{part}</mark> : part
    )
  }

  // Group results by file
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.file]) acc[result.file] = []
    acc[result.file].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold text-white">代码搜索</h1>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索代码..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              搜索
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <input
              type="text"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="文件模式 (如 *.ts)"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
            />
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={e => setCaseSensitive(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
              区分大小写
            </label>
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={e => setUseRegex(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
              正则表达式
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-400 gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Code className="w-12 h-12 mb-4 opacity-50" />
            <p>输入关键词搜索代码</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p>未找到匹配结果</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-sm text-gray-400 mb-4">
              找到 {results.length} 个结果，共 {Object.keys(groupedResults).length} 个文件
            </div>
            
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([file, fileResults]) => (
                <div key={file} className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span className="font-mono text-sm text-white">{file}</span>
                    <span className="text-xs text-gray-500 ml-auto">{fileResults.length} 处匹配</span>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {fileResults.map((result, i) => (
                      <div key={i} className="flex hover:bg-gray-800/50">
                        <div className="flex items-center justify-end w-16 px-3 py-1 text-xs text-gray-500 bg-gray-900/50 border-r border-gray-800 font-mono">
                          <Hash className="w-3 h-3 mr-1" />
                          {result.line}
                        </div>
                        <pre className="flex-1 px-4 py-1 text-sm text-gray-300 overflow-x-auto font-mono">
                          {highlightMatch(result.content, query)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
