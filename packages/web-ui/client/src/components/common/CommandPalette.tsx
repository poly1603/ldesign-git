import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Download, Upload, RefreshCw, RotateCcw, FileText, GitBranch,
  GitCommit, Tag, Archive, Settings, Globe, FolderGit2, GitCompare,
  Network, Code, Folder, BarChart3, FileCode, Plus, Trash2, GitMerge,
  History, Save, Eye, Terminal, Moon, Sun, Keyboard, X, ChevronRight
} from 'lucide-react'
import { useGitStore } from '../../store/gitStore'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  shortcut?: string
  category: 'navigation' | 'git' | 'branch' | 'file' | 'settings' | 'view'
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pull, push, fetch, fetchAll, createBranch, commit } = useGitStore()

  // 命令定义
  const commands: Command[] = useMemo(() => [
    // Git 操作
    { id: 'pull', label: '拉取 (Pull)', description: '从远程仓库拉取更新', icon: Download, action: () => { pull(); onClose() }, shortcut: 'Ctrl+Shift+P', category: 'git' },
    { id: 'push', label: '推送 (Push)', description: '推送到远程仓库', icon: Upload, action: () => { push(); onClose() }, shortcut: 'Ctrl+Shift+U', category: 'git' },
    { id: 'fetch', label: '获取 (Fetch)', description: '获取远程更新', icon: RefreshCw, action: () => { fetch(); onClose() }, shortcut: 'Ctrl+Shift+F', category: 'git' },
    { id: 'refresh', label: '刷新状态', description: '刷新所有仓库状态', icon: RotateCcw, action: () => { fetchAll(); onClose() }, shortcut: 'Ctrl+R', category: 'git' },
    
    // 导航
    { id: 'nav-dashboard', label: '概览', description: '查看仓库概览', icon: BarChart3, action: () => { navigate('/dashboard'); onClose() }, shortcut: 'G D', category: 'navigation' },
    { id: 'nav-changes', label: '变更', description: '查看未提交变更', icon: FileText, action: () => { navigate('/changes'); onClose() }, shortcut: 'G C', category: 'navigation' },
    { id: 'nav-commits', label: '提交历史', description: '查看提交历史', icon: GitCommit, action: () => { navigate('/commits'); onClose() }, shortcut: 'G H', category: 'navigation' },
    { id: 'nav-branches', label: '分支', description: '查看和管理分支', icon: GitBranch, action: () => { navigate('/branches'); onClose() }, shortcut: 'G B', category: 'navigation' },
    { id: 'nav-tags', label: '标签', description: '查看和管理标签', icon: Tag, action: () => { navigate('/tags'); onClose() }, shortcut: 'G T', category: 'navigation' },
    { id: 'nav-stash', label: '贮藏', description: '查看贮藏列表', icon: Archive, action: () => { navigate('/stash'); onClose() }, shortcut: 'G S', category: 'navigation' },
    { id: 'nav-remotes', label: '远程仓库', description: '管理远程仓库', icon: Globe, action: () => { navigate('/remotes'); onClose() }, shortcut: 'G R', category: 'navigation' },
    { id: 'nav-submodules', label: '子模块', description: '管理子模块', icon: FolderGit2, action: () => { navigate('/submodules'); onClose() }, category: 'navigation' },
    { id: 'nav-compare', label: '分支比较', description: '比较两个分支', icon: GitCompare, action: () => { navigate('/compare'); onClose() }, category: 'navigation' },
    { id: 'nav-graph', label: '分支图', description: '查看分支图', icon: Network, action: () => { navigate('/graph'); onClose() }, category: 'navigation' },
    { id: 'nav-search', label: '代码搜索', description: '搜索代码', icon: Code, action: () => { navigate('/search'); onClose() }, shortcut: 'Ctrl+Shift+S', category: 'navigation' },
    { id: 'nav-browser', label: '文件浏览', description: '浏览仓库文件', icon: Folder, action: () => { navigate('/browser'); onClose() }, category: 'navigation' },
    { id: 'nav-stats', label: '统计', description: '查看仓库统计', icon: BarChart3, action: () => { navigate('/stats'); onClose() }, category: 'navigation' },
    { id: 'nav-hooks', label: 'Git Hooks', description: '管理 Git Hooks', icon: FileCode, action: () => { navigate('/hooks'); onClose() }, category: 'navigation' },
    { id: 'nav-settings', label: '设置', description: '应用设置', icon: Settings, action: () => { navigate('/settings'); onClose() }, shortcut: 'Ctrl+,', category: 'settings' },
    
    // 分支操作
    { id: 'branch-new', label: '新建分支', description: '创建新分支', icon: Plus, action: () => { navigate('/branches?action=create'); onClose() }, shortcut: 'Ctrl+Shift+B', category: 'branch' },
    { id: 'branch-merge', label: '合并分支', description: '合并分支到当前分支', icon: GitMerge, action: () => { navigate('/branches?action=merge'); onClose() }, category: 'branch' },
    
    // 视图
    { id: 'view-history', label: '查看历史', description: '查看操作历史', icon: History, action: () => { navigate('/commits'); onClose() }, category: 'view' },
  ], [navigate, pull, push, fetch, fetchAll, onClose])

  // 过滤命令
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands
    const searchLower = search.toLowerCase()
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.id.includes(searchLower)
    )
  }, [commands, search])

  // 分组命令
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  const categoryLabels: Record<string, string> = {
    git: 'Git 操作',
    navigation: '导航',
    branch: '分支',
    file: '文件',
    settings: '设置',
    view: '视图'
  }

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
          }
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredCommands, selectedIndex, onClose])

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // 自动聚焦
  useEffect(() => {
    if (open) {
      setSearch('')
      inputRef.current?.focus()
    }
  }, [open])

  // 滚动到选中项
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    selectedElement?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  let currentIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* 搜索栏 */}
        <div className="flex items-center px-4 py-3 border-b border-gray-700 gap-3">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索命令..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
            autoFocus
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
            ESC
          </kbd>
        </div>

        {/* 命令列表 */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {categoryLabels[category] || category}
              </div>
              {cmds.map((cmd) => {
                const index = currentIndex++
                const isSelected = index === selectedIndex
                
                return (
                  <button
                    key={cmd.id}
                    data-index={index}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <cmd.icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{cmd.label}</div>
                      {cmd.description && (
                        <div className={`text-sm truncate ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                          {cmd.description}
                        </div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className={`px-2 py-0.5 rounded text-xs ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </button>
                )
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-12 text-center text-gray-500">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>没有找到匹配的命令</p>
              <p className="text-sm mt-1">尝试其他关键词</p>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↑↓</kbd>
            <span>选择</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Enter</kbd>
            <span>执行</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Esc</kbd>
            <span>关闭</span>
          </span>
        </div>
      </div>
    </div>
  )
}
