import { useState, useEffect } from 'react'
import { FolderGit2, Plus, Trash2, RefreshCw, Settings, Download, Upload, GitBranch, X } from 'lucide-react'

interface SubmoduleInfo {
  name: string
  path: string
  url: string
  branch?: string
  commit: string
  status: 'initialized' | 'uninitialized' | 'modified' | 'up-to-date'
}

export default function NewSubmodulesPage() {
  const [submodules, setSubmodules] = useState<SubmoduleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newSubmodule, setNewSubmodule] = useState({ url: '', path: '', branch: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchSubmodules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/submodules')
      const data = await res.json()
      if (data.success) setSubmodules(data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSubmodules() }, [])

  const handleAction = async (url: string, method = 'POST', body?: any) => {
    try {
      setActionLoading(true)
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      const data = await res.json()
      if (data.success) { fetchSubmodules(); return true }
      else { alert(data.error || '操作失败'); return false }
    } catch (e) { console.error(e); return false }
    finally { setActionLoading(false) }
  }

  const handleAdd = async () => {
    if (!newSubmodule.url || !newSubmodule.path) return alert('请填写 URL 和路径')
    if (await handleAction('/api/submodules', 'POST', newSubmodule)) {
      setNewSubmodule({ url: '', path: '', branch: '' })
      setShowAdd(false)
    }
  }

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      'initialized': 'bg-green-900/50 text-green-400',
      'up-to-date': 'bg-green-900/50 text-green-400',
      'modified': 'bg-yellow-900/50 text-yellow-400',
      'uninitialized': 'bg-red-900/50 text-red-400'
    }
    return styles[status] || 'bg-gray-700 text-gray-400'
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">子模块管理</h2>
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">{submodules.length} 个</span>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={fetchSubmodules} disabled={actionLoading} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm">
              <Plus className="w-4 h-4" /><span>添加子模块</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* 批量操作 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">批量操作</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleAction('/api/submodules/init', 'POST', { recursive: true })} disabled={actionLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900/70 disabled:opacity-50">
              <Settings className="w-4 h-4" /><span>初始化全部</span>
            </button>
            <button onClick={() => handleAction('/api/submodules/update', 'POST', { recursive: true })} disabled={actionLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-green-900/50 text-green-400 rounded hover:bg-green-900/70 disabled:opacity-50">
              <Download className="w-4 h-4" /><span>更新全部</span>
            </button>
            <button onClick={() => handleAction('/api/submodules/sync', 'POST')} disabled={actionLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-900/50 text-purple-400 rounded hover:bg-purple-900/70 disabled:opacity-50">
              <RefreshCw className="w-4 h-4" /><span>同步 URL</span>
            </button>
            <button onClick={() => handleAction('/api/submodules/pull', 'POST')} disabled={actionLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-900/50 text-orange-400 rounded hover:bg-orange-900/70 disabled:opacity-50">
              <Upload className="w-4 h-4" /><span>拉取全部</span>
            </button>
          </div>
        </div>

        {/* 子模块列表 */}
        {submodules.length > 0 ? (
          <div className="space-y-3">
            {submodules.map((sm) => (
              <div key={sm.path} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg"><FolderGit2 className="w-5 h-5 text-purple-400" /></div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-medium">{sm.name || sm.path}</h4>
                      <p className="text-sm text-gray-400 mt-1">{sm.path}</p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{sm.commit?.substring(0, 7) || '-'}</code>
                        {sm.branch && <span className="flex items-center"><GitBranch className="w-3 h-3 mr-1" />{sm.branch}</span>}
                        <span className={`px-2 py-0.5 rounded ${getStatusStyle(sm.status)}`}>{sm.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button onClick={() => handleAction('/api/submodules/update', 'POST', { path: sm.path })} disabled={actionLoading}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-green-500" title="更新">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if(confirm(`删除 ${sm.path}?`)) handleAction(`/api/submodules/${encodeURIComponent(sm.path)}`, 'DELETE') }} disabled={actionLoading}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-red-500" title="删除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FolderGit2 className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">没有找到子模块</p>
            <p className="text-sm mt-1">点击上方按钮添加新的子模块</p>
          </div>
        )}
      </div>

      {/* 添加模态框 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">添加子模块</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">仓库 URL</label>
                <input type="text" value={newSubmodule.url} onChange={(e) => setNewSubmodule({...newSubmodule, url: e.target.value})}
                  placeholder="https://github.com/user/repo.git" className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">本地路径</label>
                <input type="text" value={newSubmodule.path} onChange={(e) => setNewSubmodule({...newSubmodule, path: e.target.value})}
                  placeholder="libs/my-lib" className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">分支（可选）</label>
                <input type="text" value={newSubmodule.branch} onChange={(e) => setNewSubmodule({...newSubmodule, branch: e.target.value})}
                  placeholder="main" className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
                <button onClick={handleAdd} disabled={actionLoading} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg">
                  {actionLoading ? '添加中...' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
