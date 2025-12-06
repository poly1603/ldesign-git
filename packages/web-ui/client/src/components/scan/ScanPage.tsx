import { useState, useEffect } from 'react'
import { gitApi } from '../../services/api'
import {
  Shield, AlertTriangle, FileWarning, HardDrive,
  RefreshCw, Loader2, CheckCircle, Eye, EyeOff
} from 'lucide-react'

interface SecretFinding {
  type: string
  file: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  line?: number
}

interface LargeFile {
  path: string
  size: number
  sizeFormatted: string
}

interface ScanResult {
  secrets: SecretFinding[]
  largeFiles: LargeFile[]
  summary: {
    secretsFound: number
    largeFilesFound: number
  }
}

export default function ScanPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [includeHistory, setIncludeHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<'secrets' | 'large'>('secrets')

  const runScan = async () => {
    setLoading(true)
    try {
      const response = await gitApi.runScan(includeHistory)
      if (response.data?.success) {
        setResult(response.data.data)
      }
    } catch (error) {
      console.error('扫描失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runScan()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10'
      case 'high':
        return 'text-orange-500 bg-orange-500/10'
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'low':
        return 'text-blue-500 bg-blue-500/10'
      default:
        return 'text-gray-500 bg-gray-500/10'
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">安全扫描</h2>
              <p className="text-sm text-gray-500">扫描敏感信息和大文件</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={includeHistory}
                onChange={(e) => setIncludeHistory(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>包含历史</span>
            </label>
            <button
              onClick={runScan}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>开始扫描</span>
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && !result ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <p className="text-gray-500">正在扫描仓库...</p>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* 摘要 */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-xl p-4 border ${
                result.summary.secretsFound > 0 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-center space-x-3">
                  {result.summary.secretsFound > 0 ? (
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  )}
                  <div>
                    <div className={`text-2xl font-bold ${
                      result.summary.secretsFound > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {result.summary.secretsFound}
                    </div>
                    <div className="text-sm text-gray-500">敏感信息</div>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl p-4 border ${
                result.summary.largeFilesFound > 0 
                  ? 'bg-yellow-500/10 border-yellow-500/30' 
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-center space-x-3">
                  <HardDrive className={`w-8 h-8 ${
                    result.summary.largeFilesFound > 0 ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <div>
                    <div className={`text-2xl font-bold ${
                      result.summary.largeFilesFound > 0 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {result.summary.largeFilesFound}
                    </div>
                    <div className="text-sm text-gray-500">大文件</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 标签切换 */}
            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('secrets')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'secrets'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileWarning className="w-4 h-4" />
                <span>敏感信息 ({result.secrets.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('large')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'large'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>大文件 ({result.largeFiles.length})</span>
              </button>
            </div>

            {/* 结果列表 */}
            {activeTab === 'secrets' ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {result.secrets.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {result.secrets.map((finding, index) => (
                      <div key={index} className="px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">{finding.type}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(finding.severity)}`}>
                                  {finding.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1 font-mono">{finding.file}</p>
                              {finding.line && (
                                <p className="text-xs text-gray-400 mt-0.5">Line {finding.line}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                    <p>未发现敏感信息</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {result.largeFiles.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {result.largeFiles.map((file, index) => (
                      <div key={index} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <HardDrive className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{file.path}</span>
                        </div>
                        <span className="text-sm font-medium text-yellow-500">{file.sizeFormatted}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                    <p>未发现大文件</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Shield className="w-12 h-12 mb-4 opacity-50" />
            <p>点击"开始扫描"检查仓库</p>
          </div>
        )}
      </div>
    </div>
  )
}
