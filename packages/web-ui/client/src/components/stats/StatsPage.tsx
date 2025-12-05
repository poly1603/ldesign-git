import { useState, useEffect } from 'react'
import { useGitStore } from '../../store/gitStore'
import { gitApi } from '../../services/api'
import { 
  BarChart3, Users, Calendar, FileCode, TrendingUp, RefreshCw,
  GitCommit, GitBranch, Tag, Clock, Database, Code, FolderTree,
  Activity, PieChart, Zap
} from 'lucide-react'

export default function StatsPage() {
  const { branches, tags, commits, status } = useGitStore()
  const [contributors, setContributors] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [fileTypes, setFileTypes] = useState<any[]>([])
  const [repoStats, setRepoStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activityDays, setActivityDays] = useState(30)

  useEffect(() => {
    fetchStats()
  }, [activityDays])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [contribRes, activityRes, fileTypesRes, repoRes] = await Promise.all([
        gitApi.getContributorStats(),
        gitApi.getCommitActivity(activityDays),
        gitApi.getFileTypeStats(),
        gitApi.getStatus()
      ])
      if (contribRes.data?.success) setContributors(contribRes.data.data || [])
      if (activityRes.data?.success) setActivity(activityRes.data.data || [])
      if (fileTypesRes.data?.success) setFileTypes(fileTypesRes.data.data || [])
      if (repoRes.data?.success) setRepoStats(repoRes.data.data)
    } catch (error) {
      console.error('获取统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCommits = contributors.reduce((sum, c) => sum + c.commits, 0)
  const totalFiles = fileTypes.reduce((sum, f) => sum + f.count, 0)
  const maxCommits = Math.max(...contributors.map(c => c.commits), 1)
  const maxActivity = Math.max(...activity.map(a => a.count), 1)
  const maxFileCount = Math.max(...fileTypes.map(f => f.count), 1)
  const totalActivityCommits = activity.reduce((sum, a) => sum + a.count, 0)
  const avgCommitsPerDay = activity.length > 0 ? (totalActivityCommits / activity.length).toFixed(1) : 0

  // 计算周活动热力图数据
  const weekdayActivity = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
  activity.forEach(a => {
    const day = new Date(a.date).getDay()
    weekdayActivity[day] += a.count
  })
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const maxWeekday = Math.max(...weekdayActivity, 1)

  const StatCard = ({ icon: Icon, label, value, color, subValue }: any) => (
    <div className="bg-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gray-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold text-white">仓库统计</h1>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">刷新</span>
        </button>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard icon={GitCommit} label="总提交数" value={totalCommits} color="bg-blue-600" />
        <StatCard icon={Users} label="贡献者" value={contributors.length} color="bg-purple-600" />
        <StatCard icon={GitBranch} label="分支数" value={branches.length} color="bg-green-600" />
        <StatCard icon={Tag} label="标签数" value={tags.length} color="bg-yellow-600" />
        <StatCard icon={FileCode} label="文件总数" value={totalFiles} color="bg-cyan-600" />
        <StatCard icon={Activity} label="日均提交" value={avgCommitsPerDay} color="bg-pink-600" subValue={`最近 ${activityDays} 天`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 贡献者排行 */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">贡献者排行</h2>
            </div>
            <span className="text-xs text-gray-500">共 {contributors.length} 人</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-auto">
            {contributors.slice(0, 15).map((c, i) => (
              <div key={i} className="flex items-center space-x-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-yellow-500 text-black' : 
                  i === 1 ? 'bg-gray-400 text-black' : 
                  i === 2 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate">{c.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{c.commits} ({((c.commits / totalCommits) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${(c.commits / maxCommits) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {contributors.length === 0 && (
              <p className="text-gray-500 text-center py-4">暂无贡献者数据</p>
            )}
          </div>
        </div>

        {/* 提交活动 */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">提交活动</h2>
            </div>
            <select
              value={activityDays}
              onChange={(e) => setActivityDays(Number(e.target.value))}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
            >
              <option value={7}>近 7 天</option>
              <option value={14}>近 14 天</option>
              <option value={30}>近 30 天</option>
              <option value={60}>近 60 天</option>
              <option value={90}>近 90 天</option>
            </select>
          </div>
          <div className="flex items-end space-x-1 h-32 mb-4">
            {activity.map((a, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:from-green-500 hover:to-green-300 transition-colors cursor-pointer group relative"
                style={{ height: `${Math.max((a.count / maxActivity) * 100, 4)}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 border border-gray-700">
                  {a.date}<br/>{a.count} 次提交
                </div>
              </div>
            ))}
          </div>
          {activity.length > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>{activity[0]?.date}</span>
              <span>共 {totalActivityCommits} 次提交</span>
              <span>{activity[activity.length - 1]?.date}</span>
            </div>
          )}
        </div>

        {/* 周活动分布 */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">按星期分布</h2>
          </div>
          <div className="space-y-3">
            {weekdays.map((day, i) => (
              <div key={i} className="flex items-center space-x-3">
                <span className="w-8 text-sm text-gray-400">{day}</span>
                <div className="flex-1 h-6 bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded transition-all flex items-center justify-end pr-2"
                    style={{ width: `${(weekdayActivity[i] / maxWeekday) * 100}%` }}
                  >
                    {weekdayActivity[i] > 0 && (
                      <span className="text-xs text-white font-medium">{weekdayActivity[i]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 代码语言/文件类型饼图 */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">文件类型分布</h2>
          </div>
          <div className="flex">
            {/* 简化饼图 */}
            <div className="relative w-32 h-32 mr-4">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  const colors = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#06b6d4', '#f97316', '#ef4444']
                  let offset = 0
                  return fileTypes.slice(0, 8).map((f, i) => {
                    const percent = (f.count / totalFiles) * 100
                    const dash = `${percent} ${100 - percent}`
                    const el = (
                      <circle
                        key={i}
                        cx="18" cy="18" r="15.9"
                        fill="transparent"
                        stroke={colors[i]}
                        strokeWidth="3"
                        strokeDasharray={dash}
                        strokeDashoffset={-offset}
                      />
                    )
                    offset += percent
                    return el
                  })
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{totalFiles}</span>
              </div>
            </div>
            <div className="flex-1 space-y-1 max-h-32 overflow-auto">
              {fileTypes.slice(0, 8).map((f, i) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-red-500']
                return (
                  <div key={i} className="flex items-center space-x-2 text-sm">
                    <div className={`w-3 h-3 rounded ${colors[i]}`} />
                    <span className="text-white font-mono">{f.extension}</span>
                    <span className="text-gray-500">({((f.count / totalFiles) * 100).toFixed(1)}%)</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 仓库状态 */}
        <div className="bg-gray-800 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">当前仓库状态</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">{status?.modified?.length || 0}</p>
              <p className="text-sm text-yellow-400 mt-1">已修改</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">{status?.created?.length || 0}</p>
              <p className="text-sm text-green-400 mt-1">新增</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">{status?.deleted?.length || 0}</p>
              <p className="text-sm text-red-400 mt-1">删除</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">{status?.notAdded?.length || 0}</p>
              <p className="text-sm text-gray-400 mt-1">未跟踪</p>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">当前分支:</span>
              <span className="text-white font-medium">{status?.current || '-'}</span>
            </div>
            {status?.tracking && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">跟踪:</span>
                <span className="text-white">{status.tracking}</span>
              </div>
            )}
            {(status?.ahead || status?.behind) && (
              <div className="flex items-center space-x-2">
                {status?.ahead > 0 && <span className="text-green-400">↑{status.ahead}</span>}
                {status?.behind > 0 && <span className="text-red-400">↓{status.behind}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
