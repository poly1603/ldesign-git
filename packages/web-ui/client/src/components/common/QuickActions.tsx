import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Download, Upload, RefreshCw, Save, GitBranch, Tag,
  Archive, RotateCcw, Trash2, GitMerge, ChevronUp, ChevronDown,
  Loader2
} from 'lucide-react'
import { useGitStore } from '../../store/gitStore'

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  action: () => Promise<void> | void
  color: string
  description?: string
}

export default function QuickActions() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  
  const { pull, push, fetch, fetchAll, status } = useGitStore()

  const hasChanges = status && !status.isClean

  const executeAction = async (action: QuickAction) => {
    setLoadingAction(action.id)
    try {
      await action.action()
    } finally {
      setLoadingAction(null)
    }
  }

  const actions: QuickAction[] = [
    {
      id: 'pull',
      label: '拉取',
      icon: Download,
      action: () => pull(),
      color: 'text-blue-400 hover:bg-blue-500/20',
      description: '从远程拉取更新'
    },
    {
      id: 'push',
      label: '推送',
      icon: Upload,
      action: () => push(),
      color: 'text-green-400 hover:bg-green-500/20',
      description: '推送到远程仓库'
    },
    {
      id: 'fetch',
      label: '获取',
      icon: RefreshCw,
      action: () => fetch(),
      color: 'text-purple-400 hover:bg-purple-500/20',
      description: '获取远程更新'
    },
    {
      id: 'refresh',
      label: '刷新',
      icon: RotateCcw,
      action: () => fetchAll(),
      color: 'text-gray-400 hover:bg-gray-500/20',
      description: '刷新仓库状态'
    },
  ]

  const secondaryActions: QuickAction[] = [
    {
      id: 'commit',
      label: '提交',
      icon: Save,
      action: () => navigate('/changes'),
      color: hasChanges ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-gray-500',
      description: hasChanges ? '查看并提交变更' : '无变更'
    },
    {
      id: 'branch',
      label: '新建分支',
      icon: GitBranch,
      action: () => navigate('/branches?action=create'),
      color: 'text-cyan-400 hover:bg-cyan-500/20',
      description: '创建新分支'
    },
    {
      id: 'tag',
      label: '新建标签',
      icon: Tag,
      action: () => navigate('/tags?action=create'),
      color: 'text-orange-400 hover:bg-orange-500/20',
      description: '创建新标签'
    },
    {
      id: 'stash',
      label: '贮藏',
      icon: Archive,
      action: () => navigate('/stash?action=save'),
      color: 'text-pink-400 hover:bg-pink-500/20',
      description: '贮藏当前变更'
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white">快捷操作</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-4 gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => executeAction(action)}
                disabled={loadingAction !== null}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors ${action.color} disabled:opacity-50`}
                title={action.description}
              >
                {loadingAction === action.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <action.icon className="w-5 h-5" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3" />

          {/* Secondary Actions */}
          <div className="grid grid-cols-4 gap-2">
            {secondaryActions.map((action) => (
              <button
                key={action.id}
                onClick={() => executeAction(action)}
                disabled={loadingAction !== null || (action.id === 'commit' && !hasChanges)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors ${action.color} disabled:opacity-50`}
                title={action.description}
              >
                {loadingAction === action.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <action.icon className="w-5 h-5" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 浮动快捷操作按钮
export function FloatingQuickActions() {
  const [open, setOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const { pull, push, fetch } = useGitStore()

  const actions = [
    { id: 'pull', icon: Download, action: () => pull(), color: 'bg-blue-600 hover:bg-blue-500' },
    { id: 'push', icon: Upload, action: () => push(), color: 'bg-green-600 hover:bg-green-500' },
    { id: 'fetch', icon: RefreshCw, action: () => fetch(), color: 'bg-purple-600 hover:bg-purple-500' },
  ]

  const executeAction = async (id: string, action: () => Promise<void>) => {
    setLoadingAction(id)
    try {
      await action()
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Action buttons */}
      <div className={`flex flex-col gap-2 mb-2 transition-all duration-200 ${
        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => executeAction(action.id, action.action)}
            disabled={loadingAction !== null}
            className={`p-3 rounded-full shadow-lg transition-all ${action.color} text-white disabled:opacity-50`}
          >
            {loadingAction === action.id ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <action.icon className="w-5 h-5" />
            )}
          </button>
        ))}
      </div>

      {/* Main toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`p-4 rounded-full shadow-lg transition-all ${
          open ? 'bg-gray-600 rotate-45' : 'bg-blue-600 hover:bg-blue-500'
        } text-white`}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
