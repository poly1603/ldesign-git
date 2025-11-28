import { useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import { GitBranch, GitCommit, FileText, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function Dashboard() {
  const { status, branches, commits, conflicts, fetchAll } = useGitStore()

  useEffect(() => {
    fetchAll()
  }, [])

  const currentBranch = branches.find(b => b.current)
  const recentCommits = commits.slice(0, 5)
  const totalChanges = status ? 
    status.modified.length + status.created.length + status.deleted.length : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">仪表盘</h2>
        <p className="text-gray-600 mt-1">Git 仓库概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GitBranch}
          title="当前分支"
          value={currentBranch?.name || '-'}
          color="blue"
        />
        <StatCard
          icon={GitCommit}
          title="总提交数"
          value={commits.length}
          color="green"
        />
        <StatCard
          icon={FileText}
          title="未提交更改"
          value={totalChanges}
          color={totalChanges > 0 ? 'yellow' : 'gray'}
        />
        <StatCard
          icon={AlertTriangle}
          title="冲突文件"
          value={conflicts.length}
          color={conflicts.length > 0 ? 'red' : 'gray'}
        />
      </div>

      {/* Status Overview */}
      {status && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">仓库状态</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusItem label="已修改" count={status.modified.length} color="yellow" />
            <StatusItem label="新增" count={status.created.length} color="green" />
            <StatusItem label="删除" count={status.deleted.length} color="red" />
            <StatusItem label="未跟踪" count={status.notAdded.length} color="gray" />
          </div>
          
          {status.tracking && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">跟踪分支: {status.tracking}</span>
                <div className="flex items-center space-x-4">
                  {status.ahead > 0 && (
                    <span className="text-green-600">↑ 领先 {status.ahead}</span>
                  )}
                  {status.behind > 0 && (
                    <span className="text-red-600">↓ 落后 {status.behind}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Commits */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">最近提交</h3>
        </div>
        <div className="divide-y">
          {recentCommits.length > 0 ? (
            recentCommits.map((commit) => (
              <div key={commit.hash} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{commit.message}</p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{commit.author_name}</span>
                      <span>{dayjs(commit.date).fromNow()}</span>
                      <span className="font-mono">{commit.hash.substring(0, 7)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <GitCommit className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无提交记录</p>
            </div>
          )}
        </div>
      </div>

      {/* Branches */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">分支列表</h3>
        </div>
        <div className="divide-y max-h-64 overflow-y-auto">
          {branches.map((branch) => (
            <div
              key={branch.name}
              className="p-4 hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <GitBranch className={`w-4 h-4 ${branch.current ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className={`${branch.current ? 'font-semibold text-primary-600' : 'text-gray-700'}`}>
                  {branch.name}
                </span>
                {branch.current && (
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                    当前
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {branch.commit.substring(0, 7)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color }: {
  icon: React.ElementType
  title: string
  value: string | number
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function StatusItem({ label, count, color }: {
  label: string
  count: number
  color: string
}) {
  const colorClasses = {
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
  }

  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
        {count}
      </p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  )
}