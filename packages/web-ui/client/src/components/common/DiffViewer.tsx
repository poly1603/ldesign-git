import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronRight, File, Plus, Minus } from 'lucide-react'

interface DiffViewerProps {
  diff: string
  fileName?: string
}

interface FileDiff {
  fileName: string
  oldPath: string
  newPath: string
  additions: number
  deletions: number
  chunks: DiffChunk[]
}

interface DiffChunk {
  header: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

interface DiffLine {
  type: 'add' | 'del' | 'normal' | 'header'
  content: string
  oldNum?: number
  newNum?: number
}

function parseDiff(diffText: string): FileDiff[] {
  const files: FileDiff[] = []
  if (!diffText) return files

  const fileDiffs = diffText.split(/^diff --git /m).filter(Boolean)

  for (const fileDiff of fileDiffs) {
    const lines = fileDiff.split('\n')
    let fileName = ''
    let oldPath = ''
    let newPath = ''
    let additions = 0
    let deletions = 0
    const chunks: DiffChunk[] = []

    // Parse header
    const headerMatch = lines[0]?.match(/a\/(.+?) b\/(.+)/)
    if (headerMatch) {
      oldPath = headerMatch[1]
      newPath = headerMatch[2]
      fileName = newPath
    }

    let currentChunk: DiffChunk | null = null
    let oldNum = 0
    let newNum = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // Chunk header
      const chunkMatch = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)/)
      if (chunkMatch) {
        if (currentChunk) chunks.push(currentChunk)
        oldNum = parseInt(chunkMatch[1]) - 1
        newNum = parseInt(chunkMatch[3]) - 1
        currentChunk = {
          header: line,
          oldStart: parseInt(chunkMatch[1]),
          oldLines: parseInt(chunkMatch[2]) || 1,
          newStart: parseInt(chunkMatch[3]),
          newLines: parseInt(chunkMatch[4]) || 1,
          lines: [{ type: 'header', content: chunkMatch[5] || '' }]
        }
        continue
      }

      if (!currentChunk) continue

      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++
        newNum++
        currentChunk.lines.push({ type: 'add', content: line.slice(1), newNum })
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++
        oldNum++
        currentChunk.lines.push({ type: 'del', content: line.slice(1), oldNum })
      } else if (!line.startsWith('\\') && !line.startsWith('index') && !line.startsWith('---') && !line.startsWith('+++')) {
        oldNum++
        newNum++
        currentChunk.lines.push({ type: 'normal', content: line.startsWith(' ') ? line.slice(1) : line, oldNum, newNum })
      }
    }

    if (currentChunk) chunks.push(currentChunk)

    if (fileName) {
      files.push({ fileName, oldPath, newPath, additions, deletions, chunks })
    }
  }

  return files
}

export default function DiffViewer({ diff, fileName }: DiffViewerProps) {
  const files = useMemo(() => parseDiff(diff), [diff])
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  // 当文件列表变化时，自动展开所有文件
  useEffect(() => {
    setExpandedFiles(new Set(files.map(f => f.fileName)))
  }, [files])

  const toggleFile = (name: string) => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(name)) newExpanded.delete(name)
    else newExpanded.add(name)
    setExpandedFiles(newExpanded)
  }

  if (!diff || files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>选择文件查看差异</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      {files.map((file, idx) => (
        <div key={idx} className="border-b border-gray-700">
          {/* File Header */}
          <div
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-750 cursor-pointer sticky top-0 z-10"
            onClick={() => toggleFile(file.fileName)}
          >
            {expandedFiles.has(file.fileName) ? (
              <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
            )}
            <File className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-white font-mono flex-1">{file.fileName}</span>
            <div className="flex items-center space-x-3 text-xs">
              {file.additions > 0 && (
                <span className="flex items-center text-green-400">
                  <Plus className="w-3 h-3 mr-1" />{file.additions}
                </span>
              )}
              {file.deletions > 0 && (
                <span className="flex items-center text-red-400">
                  <Minus className="w-3 h-3 mr-1" />{file.deletions}
                </span>
              )}
              {/* Change bar */}
              <div className="flex h-2 w-20 rounded overflow-hidden">
                {file.additions > 0 && (
                  <div
                    className="bg-green-500"
                    style={{ width: `${(file.additions / (file.additions + file.deletions)) * 100}%` }}
                  />
                )}
                {file.deletions > 0 && (
                  <div
                    className="bg-red-500"
                    style={{ width: `${(file.deletions / (file.additions + file.deletions)) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* File Content */}
          {expandedFiles.has(file.fileName) && (
            <div className="bg-gray-950">
              {file.chunks.map((chunk, chunkIdx) => (
                <div key={chunkIdx}>
                  {/* Chunk Header */}
                  <div className="flex bg-blue-900/30 text-blue-300 text-xs font-mono px-4 py-1">
                    <span className="w-20 text-right pr-2 text-gray-500">...</span>
                    <span className="w-20 text-right pr-2 text-gray-500">...</span>
                    <span className="flex-1 pl-2">{chunk.header}</span>
                  </div>

                  {/* Lines */}
                  {chunk.lines.filter(l => l.type !== 'header').map((line, lineIdx) => (
                    <div
                      key={lineIdx}
                      className={`flex text-xs font-mono ${
                        line.type === 'add' ? 'bg-green-900/20' :
                        line.type === 'del' ? 'bg-red-900/20' : ''
                      }`}
                    >
                      {/* Old line number */}
                      <span className={`w-20 text-right pr-2 py-0.5 select-none border-r border-gray-800 ${
                        line.type === 'add' ? 'bg-green-900/30 text-gray-600' :
                        line.type === 'del' ? 'bg-red-900/30 text-red-400/50' :
                        'text-gray-600'
                      }`}>
                        {line.type !== 'add' ? line.oldNum : ''}
                      </span>
                      {/* New line number */}
                      <span className={`w-20 text-right pr-2 py-0.5 select-none border-r border-gray-800 ${
                        line.type === 'add' ? 'bg-green-900/30 text-green-400/50' :
                        line.type === 'del' ? 'bg-red-900/30 text-gray-600' :
                        'text-gray-600'
                      }`}>
                        {line.type !== 'del' ? line.newNum : ''}
                      </span>
                      {/* Change indicator */}
                      <span className={`w-6 text-center py-0.5 select-none ${
                        line.type === 'add' ? 'bg-green-900/40 text-green-400' :
                        line.type === 'del' ? 'bg-red-900/40 text-red-400' : ''
                      }`}>
                        {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ''}
                      </span>
                      {/* Content */}
                      <span className={`flex-1 py-0.5 px-2 whitespace-pre ${
                        line.type === 'add' ? 'text-green-300' :
                        line.type === 'del' ? 'text-red-300' :
                        'text-gray-300'
                      }`}>
                        {line.content || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// 简化版单文件 Diff 视图
export function SimpleDiffViewer({ diff }: { diff: string }) {
  if (!diff) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>暂无差异</p>
      </div>
    )
  }

  const lines = diff.split('\n')

  return (
    <div className="h-full overflow-auto bg-gray-950">
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {lines.map((line, i) => {
            const isAdd = line.startsWith('+') && !line.startsWith('+++')
            const isDel = line.startsWith('-') && !line.startsWith('---')
            const isChunk = line.startsWith('@@')
            const isHeader = line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')

            return (
              <tr
                key={i}
                className={
                  isAdd ? 'bg-green-900/30' :
                  isDel ? 'bg-red-900/30' :
                  isChunk ? 'bg-blue-900/30' :
                  isHeader ? 'bg-gray-800' : ''
                }
              >
                <td className="w-12 text-right pr-2 py-0.5 text-gray-600 select-none border-r border-gray-800">
                  {i + 1}
                </td>
                <td className="w-6 text-center py-0.5 select-none">
                  {isAdd && <span className="text-green-400">+</span>}
                  {isDel && <span className="text-red-400">-</span>}
                </td>
                <td className={`py-0.5 px-2 whitespace-pre ${
                  isAdd ? 'text-green-300' :
                  isDel ? 'text-red-300' :
                  isChunk ? 'text-blue-300' :
                  isHeader ? 'text-gray-500' :
                  'text-gray-300'
                }`}>
                  {isAdd || isDel ? line.slice(1) : line}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
