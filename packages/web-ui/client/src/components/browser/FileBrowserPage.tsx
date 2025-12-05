import { useState, useEffect } from 'react'
import { Folder, FileText, ChevronRight, Home, Loader2, AlertCircle, ArrowLeft, GitBranch } from 'lucide-react'
import { gitApi } from '../../services/api'
import { useGitStore } from '../../store/gitStore'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
}

export default function FileBrowserPage() {
  const { branches } = useGitStore()
  const [currentPath, setCurrentPath] = useState('')
  const [currentRef, setCurrentRef] = useState('HEAD')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [currentPath, currentRef])

  const fetchFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await gitApi.listFiles(currentPath, currentRef)
      if (response.data?.success) {
        setFiles(response.data.data || [])
      } else {
        setError('获取文件列表失败')
      }
    } catch (err: any) {
      setError(err.message || '获取文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = async (item: FileItem) => {
    if (item.type === 'directory') {
      setCurrentPath(item.path)
      setSelectedFile(null)
      setFileContent(null)
    } else {
      setSelectedFile(item.path)
      setLoadingContent(true)
      try {
        const response = await gitApi.getFileContent(item.path, currentRef)
        if (response.data?.success) {
          setFileContent(response.data.data || '')
        }
      } catch (err) {
        setFileContent('无法加载文件内容')
      } finally {
        setLoadingContent(false)
      }
    }
  }

  const navigateUp = () => {
    const parts = currentPath.split('/')
    parts.pop()
    setCurrentPath(parts.join('/'))
    setSelectedFile(null)
    setFileContent(null)
  }

  const navigateToRoot = () => {
    setCurrentPath('')
    setSelectedFile(null)
    setFileContent(null)
  }

  const pathParts = currentPath ? currentPath.split('/') : []

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-yellow-400" />
            <h1 className="text-lg font-semibold text-white">文件浏览器</h1>
          </div>
          
          {/* Branch/Ref selector */}
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-400" />
            <select
              value={currentRef}
              onChange={e => setCurrentRef(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="HEAD">HEAD</option>
              {branches.map(branch => (
                <option key={branch.name} value={branch.name}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={navigateToRoot}
            className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          >
            <Home className="w-4 h-4" />
          </button>
          {pathParts.map((part, i) => (
            <div key={i} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <button
                onClick={() => setCurrentPath(pathParts.slice(0, i + 1).join('/'))}
                className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
              >
                {part}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File list */}
        <div className="w-80 border-r border-gray-800 overflow-y-auto">
          {currentPath && (
            <button
              onClick={navigateUp}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-800 border-b border-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>..</span>
            </button>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-400 gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          ) : files.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              空目录
            </div>
          ) : (
            <div>
              {files.map(file => (
                <button
                  key={file.path}
                  onClick={() => handleItemClick(file)}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 ${
                    selectedFile === file.path ? 'bg-gray-800' : ''
                  }`}
                >
                  {file.type === 'directory' ? (
                    <Folder className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm truncate ${
                    file.type === 'directory' ? 'text-white' : 'text-gray-300'
                  }`}>
                    {file.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loadingContent ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : selectedFile ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-mono text-gray-300">{selectedFile}</span>
              </div>
              <pre className="flex-1 overflow-auto p-4 text-sm font-mono text-gray-300 bg-gray-950">
                {fileContent}
              </pre>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p>选择文件查看内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
