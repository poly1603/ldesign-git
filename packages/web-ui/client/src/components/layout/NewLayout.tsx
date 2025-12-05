import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  GitBranch, GitCommit, FileText, RefreshCw, Home, FolderGit2,
  Tag, Archive, Globe, Settings, ChevronLeft, ChevronRight,
  Plus, Download, Upload, RotateCcw, Search, Bell, Terminal,
  Loader2, CheckCircle2, XCircle, AlertTriangle, Zap,
  GitMerge, GitPullRequest, Clock, Eye, FolderTree, Folder,
  BarChart3, FileCode, GitCompare, Code, Network
} from 'lucide-react'
import { useGitStore } from '../../store/gitStore'

export default function NewLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  
  const { 
    status, branches, commits, stashes, remotes, tags,
    loading, error, clearError,
    fetchAll, fetch, pull, push, commit
  } = useGitStore()

  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentBranch = branches.find(b => b.current)
  const hasChanges = status && !status.isClean
  const totalChanges = status ? 
    (status.modified?.length || 0) + (status.created?.length || 0) + 
    (status.deleted?.length || 0) + (status.notAdded?.length || 0) : 0

  const primaryNavItems = [
    { path: '/dashboard', icon: Home, label: '概览', shortcut: '1' },
    { path: '/changes', icon: FileText, label: '变更', badge: totalChanges || null, shortcut: '2' },
    { path: '/commits', icon: GitCommit, label: '提交', shortcut: '3' },
    { path: '/branches', icon: GitBranch, label: '分支', badge: branches.length || null, shortcut: '4' },
  ]

  const secondaryNavItems = [
    { path: '/tags', icon: Tag, label: '标签', badge: tags.length || null },
    { path: '/stash', icon: Archive, label: '贮藏', badge: stashes.length || null },
    { path: '/remotes', icon: Globe, label: '远程' },
    { path: '/submodules', icon: FolderGit2, label: '子模块' },
    { path: '/compare', icon: GitCompare, label: '分支比较' },
    { path: '/graph', icon: Network, label: '分支图' },
    { path: '/search', icon: Code, label: '代码搜索' },
    { path: '/browser', icon: Folder, label: '文件浏览' },
    { path: '/stats', icon: BarChart3, label: '统计' },
    { path: '/hooks', icon: FileCode, label: 'Hooks' },
  ]

  const quickActions = [
    { icon: Download, label: '拉取', action: () => pull(), color: 'text-blue-500' },
    { icon: Upload, label: '推送', action: () => push(), color: 'text-green-500' },
    { icon: RefreshCw, label: '获取', action: () => fetch(), color: 'text-purple-500' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* 顶部工具栏 */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm">LDesign Git</span>
          </div>
          
          {/* 当前分支 */}
          {currentBranch && (
            <button
              onClick={() => navigate('/branches')}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
            >
              <GitBranch className="w-4 h-4 text-green-400" />
              <span>{currentBranch.name}</span>
              {status?.ahead > 0 && (
                <span className="text-xs text-green-400">↑{status.ahead}</span>
              )}
              {status?.behind > 0 && (
                <span className="text-xs text-orange-400">↓{status.behind}</span>
              )}
            </button>
          )}
        </div>

        {/* 中间搜索栏 */}
        <button
          onClick={() => setShowCommandPalette(true)}
          className="flex items-center space-x-2 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-400 min-w-[300px] transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>搜索命令...</span>
          <kbd className="ml-auto px-1.5 py-0.5 bg-gray-600 rounded text-xs">Ctrl+K</kbd>
        </button>

        {/* 右侧快捷操作 */}
        <div className="flex items-center space-x-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              disabled={loading}
              className={`p-2 hover:bg-gray-700 rounded-md transition-colors ${action.color}`}
              title={action.label}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <action.icon className="w-4 h-4" />
              )}
            </button>
          ))}
          
          <div className="w-px h-6 bg-gray-700" />
          
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-700 rounded-md transition-colors text-gray-400"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-300">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={clearError} className="text-red-400 hover:text-red-300 text-sm">
            关闭
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <aside className={`${sidebarCollapsed ? 'w-14' : 'w-56'} bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-200 flex-shrink-0`}>
          {/* 主导航 */}
          <nav className="flex-1 py-2 overflow-y-auto">
            <div className="px-2 space-y-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors group ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.badge !== null && item.badge > 0 && (
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                            isActive ? 'bg-blue-500' : 'bg-gray-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="my-4 mx-3 border-t border-gray-700" />

            <div className="px-2 space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide">
                  更多
                </div>
              )}
              {secondaryNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.badge !== null && item.badge > 0 && (
                          <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-600">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* 折叠按钮 */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-3 border-t border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 mx-auto" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-hidden bg-gray-900">
          <Outlet />
        </main>
      </div>

      {/* 底部状态栏 */}
      <footer className="h-6 bg-blue-600 flex items-center justify-between px-4 text-xs text-white flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <GitBranch className="w-3 h-3" />
            <span>{currentBranch?.name || 'No Branch'}</span>
          </div>
          
          {status?.tracking && (
            <div className="flex items-center space-x-2">
              {status.ahead > 0 && <span>↑ {status.ahead}</span>}
              {status.behind > 0 && <span>↓ {status.behind}</span>}
            </div>
          )}
          
          {hasChanges && (
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>{totalChanges} 个变更</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {loading && (
            <div className="flex items-center space-x-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>处理中...</span>
            </div>
          )}
          <span className="text-blue-200">LDesign Git v0.4.0</span>
        </div>
      </footer>

      {/* 命令面板 */}
      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} />
      )}
    </div>
  )
}

// 命令面板组件
function CommandPalette({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { pull, push, fetch, fetchAll } = useGitStore()

  const commands = [
    { label: '拉取 (Pull)', action: () => { pull(); onClose() }, icon: Download },
    { label: '推送 (Push)', action: () => { push(); onClose() }, icon: Upload },
    { label: '获取 (Fetch)', action: () => { fetch(); onClose() }, icon: RefreshCw },
    { label: '刷新状态', action: () => { fetchAll(); onClose() }, icon: RotateCcw },
    { label: '查看变更', action: () => { navigate('/changes'); onClose() }, icon: FileText },
    { label: '查看分支', action: () => { navigate('/branches'); onClose() }, icon: GitBranch },
    { label: '查看提交', action: () => { navigate('/commits'); onClose() }, icon: GitCommit },
    { label: '查看标签', action: () => { navigate('/tags'); onClose() }, icon: Tag },
    { label: '查看贮藏', action: () => { navigate('/stash'); onClose() }, icon: Archive },
    { label: '设置', action: () => { navigate('/settings'); onClose() }, icon: Settings },
  ]

  const filtered = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="输入命令..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={cmd.action}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <cmd.icon className="w-4 h-4 text-gray-400" />
              <span>{cmd.label}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              没有找到匹配的命令
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
