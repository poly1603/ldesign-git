import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  GitBranch, GitCommit, FileText, RefreshCw, Home, FolderGit2,
  Tag, Archive, Globe, Settings, ChevronLeft, ChevronRight,
  Plus, Download, Upload, RotateCcw, Search, Bell, Terminal,
  Loader2, CheckCircle2, XCircle, AlertTriangle, Zap,
  GitMerge, GitPullRequest, Clock, Eye, FolderTree, Folder,
  BarChart3, FileCode, GitCompare, Code, Network, Keyboard, History,
  Stethoscope, Trash2, Shield, Wrench
} from 'lucide-react'
import { useGitStore } from '../../store/gitStore'
import { useToast } from '../common/Toast'
import { ThemeToggleButton, AccentColorPicker, useTheme } from '../common/ThemeProvider'
import CommandPalette from '../common/CommandPalette'
import HotkeysHelp from '../common/HotkeysHelp'
import { useHotkey, useSequenceHotkey } from '../../hooks/useHotkeys'

export default function NewLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showHotkeysHelp, setShowHotkeysHelp] = useState(false)
  const toast = useToast()
  
  const { 
    status, branches, commits, stashes, remotes, tags,
    loading, error, clearError,
    fetchAll, fetch, pull, push, commit
  } = useGitStore()

  // 全局快捷键
  useHotkey('Ctrl+k', () => setShowCommandPalette(true))
  useHotkey('?', () => setShowHotkeysHelp(true))
  useHotkey('Ctrl+r', () => fetchAll())
  useHotkey('Ctrl+Shift+p', () => pull())
  useHotkey('Ctrl+Shift+u', () => push())
  useHotkey('Ctrl+Shift+f', () => fetch())
  
  // 序列快捷键 (G + 字母)
  useSequenceHotkey(['g', 'd'], () => navigate('/dashboard'))
  useSequenceHotkey(['g', 'c'], () => navigate('/changes'))
  useSequenceHotkey(['g', 'h'], () => navigate('/commits'))
  useSequenceHotkey(['g', 'b'], () => navigate('/branches'))
  useSequenceHotkey(['g', 't'], () => navigate('/tags'))
  useSequenceHotkey(['g', 's'], () => navigate('/stash'))
  useSequenceHotkey(['g', 'r'], () => navigate('/remotes'))

  // 关闭面板快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCommandPalette(false)
        setShowHotkeysHelp(false)
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
    { path: '/reflog', icon: History, label: 'Reflog' },
    { path: '/doctor', icon: Stethoscope, label: '健康检查' },
    { path: '/cleanup', icon: Trash2, label: '清理' },
    { path: '/scan', icon: Shield, label: '安全扫描' },
    { path: '/tools', icon: Wrench, label: '工具' },
  ]

  const quickActions = [
    { icon: Download, label: '拉取', action: () => pull(), color: 'text-blue-500' },
    { icon: Upload, label: '推送', action: () => push(), color: 'text-green-500' },
    { icon: RefreshCw, label: '获取', action: () => fetch(), color: 'text-purple-500' },
  ]

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* 顶部工具栏 */}
      <header className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">LDesign Git</span>
          </div>
          
          {/* 当前分支 */}
          {currentBranch && (
            <button
              onClick={() => navigate('/branches')}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-sm transition-colors"
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
          className="flex items-center space-x-2 px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 min-w-[300px] transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>搜索命令...</span>
          <kbd className="ml-auto px-1.5 py-0.5 bg-gray-300 dark:bg-gray-600 rounded text-xs">Ctrl+K</kbd>
        </button>

        {/* 右侧快捷操作 */}
        <div className="flex items-center space-x-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              disabled={loading}
              className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors ${action.color}`}
              title={action.label}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <action.icon className="w-4 h-4" />
              )}
            </button>
          ))}
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
          
          <ThemeToggleButton />
          <AccentColorPicker />
          
          <button
            onClick={() => setShowHotkeysHelp(true)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
            title="键盘快捷键 (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
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
        <aside className={`${sidebarCollapsed ? 'w-14' : 'w-56'} bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200 flex-shrink-0`}>
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
                        ? 'sidebar-active'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.badge !== null && item.badge > 0 && (
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                            isActive ? 'bg-primary text-white' : 'bg-gray-300 dark:bg-gray-600'
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

            <div className="my-4 mx-3 border-t border-gray-200 dark:border-gray-700" />

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
                        ? 'sidebar-active'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.badge !== null && item.badge > 0 && (
                          <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-300 dark:bg-gray-600">
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
            className="p-3 border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 mx-auto" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>

      {/* 底部状态栏 */}
      <footer className="h-6 bg-primary flex items-center justify-between px-4 text-xs text-white flex-shrink-0">
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
          <span className="text-white/80">LDesign Git v0.5.0</span>
        </div>
      </footer>

      {/* 命令面板 */}
      <CommandPalette 
        open={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
      />

      {/* 快捷键帮助 */}
      <HotkeysHelp 
        open={showHotkeysHelp} 
        onClose={() => setShowHotkeysHelp(false)} 
      />
    </div>
  )
}
