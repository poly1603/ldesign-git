import { useState, useEffect } from 'react'
import { gitApi } from '../../services/api'
import {
  Stethoscope, CheckCircle, AlertTriangle, XCircle,
  RefreshCw, Loader2, ChevronRight, Info
} from 'lucide-react'

interface HealthCheck {
  name: string
  status: 'pass' | 'warning' | 'error'
  message: string
  suggestion?: string
}

interface DiagnosisResult {
  checks: HealthCheck[]
  summary: {
    passed: number
    warnings: number
    errors: number
  }
}

export default function DoctorPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiagnosisResult | null>(null)

  const runDiagnosis = async () => {
    setLoading(true)
    try {
      const response = await gitApi.runDiagnosis()
      if (response.data?.success) {
        setResult(response.data.data)
      }
    } catch (error) {
      console.error('诊断失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnosis()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500/10 border-green-500/30'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30'
      case 'error':
        return 'bg-red-500/10 border-red-500/30'
      default:
        return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Stethoscope className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Git 健康检查</h2>
              <p className="text-sm text-gray-500">诊断 Git 配置和仓库状态</p>
            </div>
          </div>
          <button
            onClick={runDiagnosis}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>重新检查</span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && !result ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">正在运行诊断...</p>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* 摘要 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{result.summary.passed}</div>
                <div className="text-sm text-gray-500 mt-1">通过</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-500">{result.summary.warnings}</div>
                <div className="text-sm text-gray-500 mt-1">警告</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-500">{result.summary.errors}</div>
                <div className="text-sm text-gray-500 mt-1">错误</div>
              </div>
            </div>

            {/* 检查结果列表 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">检查项目</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {result.checks.map((check, index) => (
                  <div
                    key={index}
                    className={`px-4 py-4 ${getStatusBg(check.status)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">{check.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            check.status === 'pass' ? 'bg-green-500/20 text-green-400' :
                            check.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {check.status === 'pass' ? '通过' : check.status === 'warning' ? '警告' : '错误'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{check.message}</p>
                        {check.suggestion && (
                          <div className="mt-2 flex items-start space-x-2 text-sm text-blue-400">
                            <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{check.suggestion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Stethoscope className="w-12 h-12 mb-4 opacity-50" />
            <p>点击"重新检查"开始诊断</p>
          </div>
        )}
      </div>
    </div>
  )
}
