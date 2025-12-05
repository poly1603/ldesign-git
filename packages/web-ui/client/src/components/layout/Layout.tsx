import { Outlet, Link, useLocation } from 'react-router-dom'
import { GitBranch, GitCommit, FileText, RefreshCw, Home, AlertCircle, FolderGit2 } from 'lucide-react'
import { useGitStore } from '../../store/gitStore'

export default function Layout() {
  const location = useLocation()
  const { status, error, clearError } = useGitStore()

  const navItems = [
    { path: '/dashboard', icon: Home, label: '仪表盘' },
    { path: '/branches', icon: GitBranch, label: '分支' },
    { path: '/commits', icon: GitCommit, label: '提交历史' },
    { path: '/changes', icon: FileText, label: '变更' },
    { path: '/sync', icon: RefreshCw, label: '同步' },
    { path: '/submodules', icon: FolderGit2, label: '子模块' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <GitBranch className="w-8 h-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">LDesign Git UI</h1>
            </div>
            
            {status && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">当前分支:</span>
                  <span className="font-semibold text-primary-600">{status.current}</span>
                </div>
                {!status.isClean && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    有未提交的更改
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}