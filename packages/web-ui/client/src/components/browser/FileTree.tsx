import React, { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, FileText, FileCode, FileJson, Image, FileType } from 'lucide-react'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  loaded?: boolean
}

interface FileTreeProps {
  nodes: FileNode[]
  selectedPath: string | null
  onSelect: (path: string, type: 'file' | 'directory') => void
  onExpand: (path: string) => Promise<FileNode[]>
  loading?: boolean
}

// 文件图标映射
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-400" />
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-yellow-400" />
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-500" />
    case 'md':
    case 'mdx':
      return <FileText className="w-4 h-4 text-blue-300" />
    case 'css':
    case 'scss':
    case 'less':
      return <FileCode className="w-4 h-4 text-pink-400" />
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-400" />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image className="w-4 h-4 text-green-400" />
    case 'py':
      return <FileCode className="w-4 h-4 text-blue-500" />
    case 'go':
      return <FileCode className="w-4 h-4 text-cyan-400" />
    case 'rs':
      return <FileCode className="w-4 h-4 text-orange-500" />
    case 'vue':
      return <FileCode className="w-4 h-4 text-green-500" />
    case 'yaml':
    case 'yml':
      return <FileType className="w-4 h-4 text-red-400" />
    default:
      return <File className="w-4 h-4 text-gray-400" />
  }
}

function TreeNode({ 
  node, 
  depth, 
  selectedPath, 
  onSelect, 
  onExpand,
  expandedPaths,
  setExpandedPaths,
  loadingPaths
}: { 
  node: FileNode
  depth: number
  selectedPath: string | null
  onSelect: (path: string, type: 'file' | 'directory') => void
  onExpand: (path: string) => Promise<void>
  expandedPaths: Set<string>
  setExpandedPaths: React.Dispatch<React.SetStateAction<Set<string>>>
  loadingPaths: Set<string>
}) {
  const isExpanded = expandedPaths.has(node.path)
  const isSelected = selectedPath === node.path
  const isLoading = loadingPaths.has(node.path)
  const isDirectory = node.type === 'directory'

  const handleClick = async () => {
    if (isDirectory) {
      if (isExpanded) {
        setExpandedPaths(prev => {
          const next = new Set(prev)
          next.delete(node.path)
          return next
        })
      } else {
        setExpandedPaths(prev => new Set(prev).add(node.path))
        if (!node.loaded) {
          await onExpand(node.path)
        }
      }
    }
    onSelect(node.path, node.type)
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer rounded-md transition-colors ${
          isSelected 
            ? 'bg-primary/20 text-primary' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* 展开/折叠图标 */}
        {isDirectory && (
          <span className="w-4 h-4 flex items-center justify-center">
            {isLoading ? (
              <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </span>
        )}
        {!isDirectory && <span className="w-4" />}

        {/* 图标 */}
        {isDirectory ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
          )
        ) : (
          getFileIcon(node.name)
        )}

        {/* 名称 */}
        <span className="truncate text-sm">{node.name}</span>
      </div>

      {/* 子节点 */}
      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onExpand={onExpand}
              expandedPaths={expandedPaths}
              setExpandedPaths={setExpandedPaths}
              loadingPaths={loadingPaths}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ nodes, selectedPath, onSelect, onExpand, loading }: FileTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set())
  const [treeData, setTreeData] = useState<FileNode[]>(nodes)

  // 更新树数据
  React.useEffect(() => {
    setTreeData(nodes)
  }, [nodes])

  const handleExpand = useCallback(async (path: string) => {
    setLoadingPaths(prev => new Set(prev).add(path))
    try {
      const children = await onExpand(path)
      
      // 递归更新树数据
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === path) {
            return { ...node, children, loaded: true }
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) }
          }
          return node
        })
      }
      
      setTreeData(prev => updateNode(prev))
    } finally {
      setLoadingPaths(prev => {
        const next = new Set(prev)
        next.delete(path)
        return next
      })
    }
  }, [onExpand])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (treeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
        <Folder className="w-8 h-8 mb-2 opacity-50" />
        <span>空目录</span>
      </div>
    )
  }

  return (
    <div className="py-2">
      {treeData.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onExpand={handleExpand}
          expandedPaths={expandedPaths}
          setExpandedPaths={setExpandedPaths}
          loadingPaths={loadingPaths}
        />
      ))}
    </div>
  )
}

export default FileTree
