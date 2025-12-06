import { useState } from 'react'
import { gitApi } from '../../services/api'
import {
  Wrench, Archive, FileText, Download, Upload,
  Loader2, CheckCircle, AlertTriangle, Package,
  FolderArchive, FileCode, RefreshCw
} from 'lucide-react'

type ToolTab = 'backup' | 'archive' | 'patch'

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>('backup')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Backup state
  const [backupType, setBackupType] = useState('bundle')

  // Archive state  
  const [archiveRef, setArchiveRef] = useState('HEAD')
  const [archiveFormat, setArchiveFormat] = useState('zip')
  const [refs, setRefs] = useState<{ branches: string[]; tags: string[] } | null>(null)

  // Patch state
  const [patchRange, setPatchRange] = useState('HEAD~1..HEAD')

  const loadRefs = async () => {
    try {
      const response = await gitApi.getArchiveRefs()
      if (response.data?.success) {
        setRefs(response.data.data)
      }
    } catch (error) {
      console.error('加载引用失败:', error)
    }
  }

  const handleCreateBackup = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await gitApi.createBackup(undefined, backupType)
      if (response.data?.success) {
        const data = response.data.data
        setResult({ type: 'success', message: `备份已创建: ${data.path} (${(data.size / 1024 / 1024).toFixed(2)} MB)` })
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateArchive = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await gitApi.createArchive(archiveRef, { format: archiveFormat })
      if (response.data?.success) {
        const data = response.data.data
        setResult({ type: 'success', message: `归档已创建: ${data.path} (${(data.size / 1024 / 1024).toFixed(2)} MB)` })
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePatch = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await gitApi.createPatch(patchRange)
      if (response.data?.success) {
        const files = response.data.data
        setResult({ type: 'success', message: `已创建 ${files.length} 个补丁文件` })
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'backup' as const, label: '备份', icon: Package },
    { id: 'archive' as const, label: '归档', icon: FolderArchive },
    { id: 'patch' as const, label: '补丁', icon: FileCode },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <Wrench className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Git 工具</h2>
            <p className="text-sm text-gray-500">备份、归档和补丁管理</p>
          </div>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setResult(null)
                if (tab.id === 'archive' && !refs) loadRefs()
              }}
              className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 结果提示 */}
        {result && (
          <div className={`mb-4 p-4 rounded-xl flex items-center space-x-3 ${
            result.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            {result.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm flex-1">{result.message}</span>
            <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        )}

        {/* 备份工具 */}
        {activeTab === 'backup' && (
          <div className="max-w-xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="w-6 h-6 text-indigo-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">创建备份</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                创建仓库的完整备份，可用于恢复或迁移。
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    备份类型
                  </label>
                  <select
                    value={backupType}
                    onChange={(e) => setBackupType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="bundle">Bundle（推荐）</option>
                    <option value="mirror">Mirror</option>
                    <option value="full">完整备份</option>
                  </select>
                </div>

                <button
                  onClick={handleCreateBackup}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span>创建备份</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 归档工具 */}
        {activeTab === 'archive' && (
          <div className="max-w-xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FolderArchive className="w-6 h-6 text-indigo-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">创建归档</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                从指定的分支或标签创建归档文件。
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    引用（分支/标签/提交）
                  </label>
                  <input
                    type="text"
                    value={archiveRef}
                    onChange={(e) => setArchiveRef(e.target.value)}
                    placeholder="HEAD"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                  {refs && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {refs.branches.slice(0, 5).map((b) => (
                        <button
                          key={b}
                          onClick={() => setArchiveRef(b)}
                          className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20"
                        >
                          {b}
                        </button>
                      ))}
                      {refs.tags.slice(0, 3).map((t) => (
                        <button
                          key={t}
                          onClick={() => setArchiveRef(t)}
                          className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded hover:bg-orange-500/20"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    格式
                  </label>
                  <div className="flex space-x-2">
                    {['zip', 'tar', 'tar.gz'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setArchiveFormat(fmt)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          archiveFormat === fmt
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateArchive}
                  disabled={loading || !archiveRef}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Archive className="w-5 h-5" />
                  )}
                  <span>创建归档</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 补丁工具 */}
        {activeTab === 'patch' && (
          <div className="max-w-xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileCode className="w-6 h-6 text-indigo-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">创建补丁</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                从提交范围创建补丁文件，可通过邮件分享或手动应用。
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    提交范围
                  </label>
                  <input
                    type="text"
                    value={patchRange}
                    onChange={(e) => setPatchRange(e.target.value)}
                    placeholder="HEAD~3..HEAD"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['HEAD~1..HEAD', 'HEAD~3..HEAD', 'HEAD~5..HEAD', 'main..HEAD'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setPatchRange(range)}
                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreatePatch}
                  disabled={loading || !patchRange}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  <span>创建补丁</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
