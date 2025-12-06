import { useState, useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import { gitApi } from '../../services/api'
import { GitBranch, ArrowRight, GitCommit, FileText, RefreshCw, ChevronDown } from 'lucide-react'
import DiffViewer from '../common/DiffViewer'

export default function ComparePage() {
  const { branches, fetchBranches } = useGitStore()
  const [baseBranch, setBaseBranch] = useState('')
  const [compareBranch, setCompareBranch] = useState('')
  const [compareResult, setCompareResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showBaseDropdown, setShowBaseDropdown] = useState(false)
  const [showCompareDropdown, setShowCompareDropdown] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    if (branches.length > 0 && !baseBranch) {
      const current = branches.find(b => b.current)
      if (current) setBaseBranch(current.name)
    }
  }, [branches])

  const handleCompare = async () => {
    if (!baseBranch || !compareBranch || baseBranch === compareBranch) return
    
    setLoading(true)
    try {
      const response = await gitApi.compareBranches(baseBranch, compareBranch)
      if (response.data?.success) {
        setCompareResult(response.data.data)
      }
    } catch (error) {
      console.error('比较失败:', error)
      alert('分支比较失败')
    } finally {
      setLoading(false)
    }
  }

  // 分离本地分支和远程分支
  const localBranches = branches.filter(b => !b.name.startsWith('remotes/'))
  const remoteBranches = branches.filter(b => b.name.startsWith('remotes/'))

  const BranchSelector = ({ 
    value, 
    onChange, 
    show, 
    setShow, 
    label 
  }: { 
    value: string
    onChange: (v: string) => void
    show: boolean
    setShow: (v: boolean) => void
    label: string
  }) => (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-white min-w-[200px]"
      >
        <GitBranch className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-left truncate">{value || label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {show && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-80 overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 border border-gray-200 dark:border-gray-700">
          {/* 本地分支 */}
          {localBranches.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs text-gray-500 font-medium bg-gray-100 dark:bg-gray-900 sticky top-0">
                本地分支
              </div>
              {localBranches.map(b => (
                <button
                  key={b.name}
                  onClick={() => { onChange(b.name); setShow(false) }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    b.name === value ? 'bg-gray-100 dark:bg-gray-700 text-primary' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {b.name} {b.current && <span className="text-green-400">(当前)</span>}
                </button>
              ))}
            </>
          )}
          {/* 远程分支 */}
          {remoteBranches.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs text-gray-500 font-medium bg-gray-100 dark:bg-gray-900 sticky top-0">
                远程分支
              </div>
              {remoteBranches.map(b => (
                <button
                  key={b.name}
                  onClick={() => { onChange(b.name); setShow(false) }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    b.name === value ? 'bg-gray-100 dark:bg-gray-700 text-primary' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {b.name.replace('remotes/', '')}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部选择器 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <BranchSelector
            value={baseBranch}
            onChange={setBaseBranch}
            show={showBaseDropdown}
            setShow={setShowBaseDropdown}
            label="选择基准分支"
          />
          <ArrowRight className="w-5 h-5 text-gray-500" />
          <BranchSelector
            value={compareBranch}
            onChange={setCompareBranch}
            show={showCompareDropdown}
            setShow={setShowCompareDropdown}
            label="选择比较分支"
          />
          <button
            onClick={handleCompare}
            disabled={!baseBranch || !compareBranch || baseBranch === compareBranch || loading}
            className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
            <span>比较</span>
          </button>
        </div>
      </div>

      {/* 比较结果 */}
      <div className="flex-1 overflow-hidden">
        {compareResult ? (
          <div className="h-full flex flex-col">
            {/* 统计信息 */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-850">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">{compareResult.ahead}</span>
                  <span className="text-gray-400">个提交领先</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">{compareResult.behind}</span>
                  <span className="text-gray-400">个提交落后</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GitCommit className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{compareResult.commits?.length || 0} 个提交差异</span>
                </div>
              </div>
            </div>

            {/* 提交列表和差异 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 提交列表 */}
              <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-auto bg-white dark:bg-transparent">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">提交列表</h3>
                </div>
                {compareResult.commits?.map((c: any, i: number) => (
                  <div key={i} className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <code className="text-xs text-blue-500 dark:text-blue-400">{c.hash}</code>
                    <p className="text-sm text-gray-900 dark:text-white truncate mt-1">{c.message}</p>
                  </div>
                ))}
                {(!compareResult.commits || compareResult.commits.length === 0) && (
                  <p className="p-4 text-gray-500 text-center">没有提交差异</p>
                )}
              </div>

              {/* 差异视图 */}
              <div className="flex-1 overflow-hidden">
                {compareResult.diff ? (
                  <DiffViewer diff={compareResult.diff} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>没有文件差异</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <GitBranch className="w-16 h-16 mb-4 opacity-30" />
            <p>选择两个分支进行比较</p>
          </div>
        )}
      </div>
    </div>
  )
}
