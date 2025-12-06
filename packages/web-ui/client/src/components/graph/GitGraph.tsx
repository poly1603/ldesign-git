import React, { useMemo, useState } from 'react'
import { GitBranch, Tag, Copy, Check } from 'lucide-react'

interface GraphLine {
  graph: string
  hash: string
  refs: string[]
  message: string
}

interface GitGraphProps {
  data: GraphLine[]
  onCommitClick?: (hash: string) => void
}

// 分支颜色配置
const BRANCH_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f97316', // orange
  '#a855f7', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#eab308', // yellow
  '#ef4444', // red
]

interface NodeData {
  hash: string
  message: string
  refs: string[]
  column: number
  y: number
  isHead: boolean
  isMerge: boolean
}

export function GitGraph({ data, onCommitClick }: GitGraphProps) {
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  
  const ROW_HEIGHT = 44
  const COL_WIDTH = 20
  const NODE_RADIUS = 5
  const GRAPH_PADDING = 16

  // 解析数据
  const { nodes, maxColumn } = useMemo(() => {
    const nodes: NodeData[] = []
    let maxCol = 0

    data.forEach((line, index) => {
      if (!line.hash) return
      
      const graphStr = line.graph || ''
      let column = 0
      
      // 找到 * 的位置
      for (let i = 0; i < graphStr.length; i++) {
        if (graphStr[i] === '*') {
          column = Math.floor(i / 2)
          break
        }
      }
      
      maxCol = Math.max(maxCol, column)
      const isMerge = graphStr.includes('\\') || graphStr.includes('/')
      const isHead = line.refs.some(r => r.includes('HEAD'))
      
      nodes.push({
        hash: line.hash,
        message: line.message,
        refs: line.refs,
        column,
        y: index * ROW_HEIGHT + ROW_HEIGHT / 2,
        isHead,
        isMerge
      })
    })

    return { nodes, maxColumn: maxCol }
  }, [data, ROW_HEIGHT])

  const graphWidth = (maxColumn + 1) * COL_WIDTH + GRAPH_PADDING * 2
  const graphHeight = nodes.length * ROW_HEIGHT

  const getX = (column: number) => GRAPH_PADDING + column * COL_WIDTH + COL_WIDTH / 2
  
  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 1500)
  }

  return (
    <div className="relative overflow-auto">
      <div className="flex" style={{ minHeight: graphHeight }}>
        {/* SVG 图形区域 */}
        <svg 
          width={graphWidth} 
          height={graphHeight}
          className="flex-shrink-0"
        >
          {/* 绘制连接线 */}
          {nodes.map((node, i) => {
            if (i === nodes.length - 1) return null
            const next = nodes[i + 1]
            if (!next) return null
            
            const x1 = getX(node.column)
            const y1 = node.y
            const x2 = getX(next.column)
            const y2 = next.y
            const color = BRANCH_COLORS[node.column % BRANCH_COLORS.length]
            
            // 直线或曲线
            const path = node.column === next.column
              ? `M ${x1} ${y1} L ${x2} ${y2}`
              : `M ${x1} ${y1} C ${x1} ${y1 + 20}, ${x2} ${y2 - 20}, ${x2} ${y2}`
            
            return (
              <path
                key={`line-${i}`}
                d={path}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                opacity={0.8}
              />
            )
          })}
          
          {/* 绘制节点 */}
          {nodes.map((node, i) => {
            const x = getX(node.column)
            const color = BRANCH_COLORS[node.column % BRANCH_COLORS.length]
            const isHovered = hoveredCommit === node.hash
            const radius = isHovered ? NODE_RADIUS + 2 : NODE_RADIUS
            
            return (
              <g
                key={`node-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredCommit(node.hash)}
                onMouseLeave={() => setHoveredCommit(null)}
                onClick={() => onCommitClick?.(node.hash)}
              >
                {/* HEAD 外圈 */}
                {node.isHead && (
                  <circle
                    cx={x}
                    cy={node.y}
                    r={radius + 4}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    strokeDasharray="4,2"
                  />
                )}
                {/* 节点圆圈 */}
                <circle
                  cx={x}
                  cy={node.y}
                  r={radius}
                  fill={node.isHead ? '#fbbf24' : color}
                  stroke={isHovered ? '#fff' : 'transparent'}
                  strokeWidth={2}
                />
                {/* 合并节点内圈 */}
                {node.isMerge && (
                  <circle
                    cx={x}
                    cy={node.y}
                    r={radius - 2}
                    fill="white"
                    opacity={0.6}
                  />
                )}
              </g>
            )
          })}
        </svg>

        {/* 提交信息列表 */}
        <div className="flex-1 min-w-0">
          {nodes.map((node, i) => {
            const isHovered = hoveredCommit === node.hash
            const color = BRANCH_COLORS[node.column % BRANCH_COLORS.length]

            return (
              <div
                key={node.hash}
                style={{ height: ROW_HEIGHT }}
                className={`flex items-center px-3 gap-2 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800/50 ${
                  isHovered 
                    ? 'bg-blue-50 dark:bg-gray-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                onMouseEnter={() => setHoveredCommit(node.hash)}
                onMouseLeave={() => setHoveredCommit(null)}
                onClick={() => onCommitClick?.(node.hash)}
              >
                {/* Hash 带复制按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyHash(node.hash)
                  }}
                  className="group flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600"
                  style={{ backgroundColor: `${color}15`, color }}
                  title="点击复制"
                >
                  {node.hash.substring(0, 7)}
                  {copiedHash === node.hash ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                  )}
                </button>

                {/* Refs 标签 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {node.refs.map((ref, j) => {
                    const isTag = ref.includes('tag:')
                    const isHead = ref.includes('HEAD')
                    const isRemote = ref.includes('origin/')
                    let displayName = ref
                      .replace('HEAD -> ', '')
                      .replace('tag: ', '')
                    
                    // 保留 origin/ 前缀但用不同颜色区分
                    if (isRemote) {
                      displayName = ref.replace('HEAD -> ', '').replace('tag: ', '')
                    }

                    if (isHead && !ref.includes('->')) {
                      return (
                        <span
                          key={j}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-semibold rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        >
                          HEAD
                        </span>
                      )
                    }

                    return (
                      <span
                        key={j}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded ${
                          isTag
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                            : isRemote
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {isTag ? (
                          <Tag className="w-3 h-3" />
                        ) : (
                          <GitBranch className="w-3 h-3" />
                        )}
                        {displayName}
                      </span>
                    )
                  })}
                </div>

                {/* Message */}
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                  {node.message}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GitGraph
