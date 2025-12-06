import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { gitApi } from '../../services/api'
import { Loader2 } from 'lucide-react'

interface ContributorStat {
  name: string
  email: string
  commits: number
}

interface CommitActivity {
  date: string
  count: number
}

interface FileTypeStat {
  extension: string
  count: number
}

interface DashboardChartsProps {
  theme?: 'light' | 'dark'
}

export function CommitActivityChart({ theme = 'dark' }: DashboardChartsProps) {
  const [data, setData] = useState<CommitActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await gitApi.getCommitActivity(30)
      if (response.data?.success) {
        setData(response.data.data || [])
      }
    } catch (err) {
      console.error('获取提交活动失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      textStyle: {
        color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
      }
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.slice(5)), // MM-DD format
      axisLine: { lineStyle: { color: theme === 'dark' ? '#374151' : '#e5e7eb' } },
      axisLabel: { color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme === 'dark' ? '#374151' : '#e5e7eb' } },
      axisLabel: { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }
    },
    series: [{
      data: data.map(d => d.count),
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#1d4ed8' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: '#60a5fa'
        }
      }
    }]
  }

  return <ReactECharts option={option} style={{ height: '200px' }} />
}

export function ContributorsChart({ theme = 'dark' }: DashboardChartsProps) {
  const [data, setData] = useState<ContributorStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await gitApi.getContributorStats()
      if (response.data?.success) {
        setData((response.data.data || []).slice(0, 8))
      }
    } catch (err) {
      console.error('获取贡献者统计失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        暂无贡献者数据
      </div>
    )
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      textStyle: {
        color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
      },
      formatter: (params: any) => `${params.name}<br/>提交: ${params.value} (${params.percent}%)`
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        fontSize: 11
      }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: theme === 'dark' ? '#111827' : '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 12,
          fontWeight: 'bold'
        }
      },
      labelLine: { show: false },
      data: data.map((d, i) => ({
        value: d.commits,
        name: d.name,
        itemStyle: {
          color: [
            '#3b82f6', '#22c55e', '#f97316', '#a855f7',
            '#ec4899', '#14b8a6', '#eab308', '#ef4444'
          ][i % 8]
        }
      }))
    }]
  }

  return <ReactECharts option={option} style={{ height: '200px' }} />
}

export function FileTypesChart({ theme = 'dark' }: DashboardChartsProps) {
  const [data, setData] = useState<FileTypeStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await gitApi.getFileTypeStats()
      if (response.data?.success) {
        setData((response.data.data || []).slice(0, 10))
      }
    } catch (err) {
      console.error('获取文件类型统计失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        暂无文件类型数据
      </div>
    )
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      textStyle: {
        color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
      }
    },
    grid: {
      top: 10,
      right: 20,
      bottom: 30,
      left: 60
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: theme === 'dark' ? '#374151' : '#e5e7eb' } },
      axisLabel: { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.extension).reverse(),
      axisLine: { lineStyle: { color: theme === 'dark' ? '#374151' : '#e5e7eb' } },
      axisLabel: { color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.count).reverse(),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#22c55e' },
            { offset: 1, color: '#16a34a' }
          ]
        },
        borderRadius: [0, 4, 4, 0]
      },
      emphasis: {
        itemStyle: {
          color: '#4ade80'
        }
      }
    }]
  }

  return <ReactECharts option={option} style={{ height: '200px' }} />
}

export function CommitHeatmap({ theme = 'dark' }: DashboardChartsProps) {
  const [data, setData] = useState<CommitActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await gitApi.getCommitActivity(90)
      if (response.data?.success) {
        setData(response.data.data || [])
      }
    } catch (err) {
      console.error('获取提交活动失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  // 生成最近 90 天的日期
  const today = new Date()
  const days = []
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const found = data.find(d => d.date === dateStr)
    days.push({
      date: dateStr,
      count: found?.count || 0,
      dayOfWeek: date.getDay()
    })
  }

  // 按周分组
  const weeks: typeof days[] = []
  let currentWeek: typeof days = []
  days.forEach((day, i) => {
    currentWeek.push(day)
    if (day.dayOfWeek === 6 || i === days.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  const getColor = (count: number) => {
    if (count === 0) return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
    if (count <= 2) return 'bg-green-900/50'
    if (count <= 5) return 'bg-green-700'
    if (count <= 10) return 'bg-green-500'
    return 'bg-green-400'
  }

  return (
    <div className="flex gap-0.5 overflow-x-auto pb-2">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-0.5">
          {week.map((day, di) => (
            <div
              key={di}
              className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-colors cursor-pointer`}
              title={`${day.date}: ${day.count} 次提交`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default {
  CommitActivityChart,
  ContributorsChart,
  FileTypesChart,
  CommitHeatmap
}
