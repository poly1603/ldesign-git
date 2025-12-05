import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGitStore } from '../../store/gitStore'
import {
  GitBranch, GitCommit, FileText, Tag, Archive, Globe,
  ChevronRight, Plus, Minus, Edit3, AlertCircle, CheckCircle2,
  Clock, User, ArrowUpRight, ArrowDownRight, RefreshCw,
  FolderGit2, Zap, TrendingUp
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function NewDashboard() {
  const navigate = useNavigate()
  const { 
    status, branches, commits, remotes, tags, stashes,
    fetchAll, fetchTags, fetchStashes
  } = useGitStore()

  useEffect(() => {
    fetchAll()
    fetchTags()
    fetchStashes()
  }, [])

  const currentBranch = branches.find(b => b.current)
  const recentCommits = commits.slice(0, 6)
  
  // 统计数据
  const stats = {
    modified: status?.modified?.length || 0,
    created: status?.created?.length || 0,
    deleted: status?.deleted?.length || 0,
    untracked: status?.notAdded?.length || 0,
  }
  const totalChanges = stats.modified + stats.created + stats.deleted + stats.untracked

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">仓库概览</h1>
            <p className="text-gray-400 mt-1">Git 仓库状态一览</p>
          </div>
          <button
            onClick={() => fetchAll()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>

        {/* 状态卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            icon={GitBranch}
            label="当前分支"
            value={currentBranch?.name || '-'}
            color="blue"
            onClick={() => navigate('/branches')}
            extra={
              status?.tracking && (
                <div className="flex items-center space-x-2 mt-2 text-xs">
                  {status.ahead > 0 && (
                    <span className="flex items-center text-green-400">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      领先 {status.ahead}
                    </span>
                  )}
                  {status.behind > 0 && (
                    <span className="flex items-center text-orange-400">
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                      落后 {status.behind}
                    </span>
                  )}
                  {status.ahead === 0 && status.behind === 0 && (
                    <span className="flex items-center text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      已同步
                    </span>
                  )}
                </div>
              )
            }
          />
          
          <StatusCard
            icon={FileText}
            label="未提交变更"
            value={totalChanges}
            color={totalChanges > 0 ? 'yellow' : 'green'}
            onClick={() => navigate('/changes')}
            extra={
              totalChanges > 0 && (
                <div className="flex items-center space-x-3 mt-2 text-xs">
                  {stats.modified > 0 && <span className="text-yellow-400">~{stats.modified}</span>}
                  {stats.created > 0 && <span className="text-green-400">+{stats.created}</span>}
                  {stats.deleted > 0 && <span className="text-red-400">-{stats.deleted}</span>}
                  {stats.untracked > 0 && <span className="text-gray-400">?{stats.untracked}</span>}
                </div>
              )
            }
          />
          
          <StatusCard
            icon={GitCommit}
            label="总提交数"
            value={commits.length}
            color="purple"
            onClick={() => navigate('/commits')}
          />
          
          <StatusCard
            icon={Tag}
            label="标签"
            value={tags.length}
            color="cyan"
            onClick={() => navigate('/tags')}
          />
        </div>

        {/* 主要内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 最近提交 */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                最近提交
              </h3>
              <button
                onClick={() => navigate('/commits')}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-700">
              {recentCommits.length > 0 ? (
                recentCommits.map((commit) => (
                  <div key={commit.hash} className="px-5 py-3 hover:bg-gray-750 transition-colors">
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{commit.message}</p>
                        <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {commit.author_name}
                          </span>
                          <span>{dayjs(commit.date).fromNow()}</span>
                          <code className="px-1.5 py-0.5 bg-gray-700 rounded font-mono">
                            {commit.hash.substring(0, 7)}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <GitCommit className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>暂无提交记录</p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧面板 */}
          <div className="space-y-6">
            {/* 变更摘要 */}
            {totalChanges > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-700">
                  <h3 className="font-semibold text-white flex items-center">
                    <Edit3 className="w-4 h-4 mr-2 text-gray-400" />
                    待提交变更
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {stats.modified > 0 && (
                    <ChangeItem 
                      icon={Edit3} 
                      label="已修改" 
                      count={stats.modified} 
                      color="yellow" 
                    />
                  )}
                  {stats.created > 0 && (
                    <ChangeItem 
                      icon={Plus} 
                      label="新文件" 
                      count={stats.created} 
                      color="green" 
                    />
                  )}
                  {stats.deleted > 0 && (
                    <ChangeItem 
                      icon={Minus} 
                      label="已删除" 
                      count={stats.deleted} 
                      color="red" 
                    />
                  )}
                  {stats.untracked > 0 && (
                    <ChangeItem 
                      icon={AlertCircle} 
                      label="未跟踪" 
                      count={stats.untracked} 
                      color="gray" 
                    />
                  )}
                  <button
                    onClick={() => navigate('/changes')}
                    className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    查看变更
                  </button>
                </div>
              </div>
            )}

            {/* 分支列表 */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center">
                  <GitBranch className="w-4 h-4 mr-2 text-gray-400" />
                  分支
                </h3>
                <span className="text-xs text-gray-500">{branches.length} 个</span>
              </div>
              <div className="divide-y divide-gray-700 max-h-48 overflow-y-auto">
                {branches.slice(0, 5).map((branch) => (
                  <div
                    key={branch.name}
                    className="px-5 py-2.5 hover:bg-gray-750 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <GitBranch className={`w-4 h-4 ${branch.current ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${branch.current ? 'text-white font-medium' : 'text-gray-400'}`}>
                        {branch.name}
                      </span>
                      {branch.current && (
                        <span className="px-1.5 py-0.5 bg-green-900/50 text-green-400 text-xs rounded">
                          当前
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-gray-600 font-mono">
                      {branch.commit.substring(0, 7)}
                    </code>
                  </div>
                ))}
              </div>
              {branches.length > 5 && (
                <button
                  onClick={() => navigate('/branches')}
                  className="w-full py-2.5 text-sm text-blue-400 hover:bg-gray-750 transition-colors"
                >
                  查看全部 {branches.length} 个分支
                </button>
              )}
            </div>

            {/* 贮藏 */}
            {stashes.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-white flex items-center">
                    <Archive className="w-4 h-4 mr-2 text-gray-400" />
                    贮藏
                  </h3>
                  <span className="text-xs text-gray-500">{stashes.length} 个</span>
                </div>
                <div className="p-5">
                  <button
                    onClick={() => navigate('/stash')}
                    className="w-full py-2 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    查看贮藏列表
                  </button>
                </div>
              </div>
            )}

            {/* 远程仓库 */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-gray-400" />
                  远程仓库
                </h3>
                <span className="text-xs text-gray-500">{remotes.length} 个</span>
              </div>
              <div className="divide-y divide-gray-700">
                {remotes.map((remote) => (
                  <div key={remote.name} className="px-5 py-2.5">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-white font-medium">{remote.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {remote.url || '-'}
                    </p>
                  </div>
                ))}
                {remotes.length === 0 && (
                  <div className="p-5 text-center text-gray-500 text-sm">
                    暂无远程仓库
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 状态卡片组件
function StatusCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  onClick,
  extra 
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan'
  onClick?: () => void
  extra?: React.ReactNode
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  }

  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
  }

  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all hover:scale-[1.02] text-left ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-gray-800 ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {extra}
    </button>
  )
}

// 变更项组件
function ChangeItem({ 
  icon: Icon, 
  label, 
  count, 
  color 
}: {
  icon: React.ElementType
  label: string
  count: number
  color: 'green' | 'yellow' | 'red' | 'gray'
}) {
  const colors = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    gray: 'text-gray-400',
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Icon className={`w-4 h-4 ${colors[color]}`} />
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      <span className={`font-medium ${colors[color]}`}>{count}</span>
    </div>
  )
}
