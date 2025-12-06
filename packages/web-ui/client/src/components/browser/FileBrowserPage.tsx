import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Folder, FileText, ChevronRight, Home, Loader2, AlertCircle, GitBranch, Save, RotateCcw, Eye, Edit3, Database, HardDrive, Info, User, Clock } from 'lucide-react'
import { gitApi } from '../../services/api'
import { useGitStore } from '../../store/gitStore'
import { useTheme } from '../common/ThemeProvider'
import FileTree from './FileTree'

// 懒加载 Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'))

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  loaded?: boolean
}

// 根据文件扩展名获取语言
function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript',
    json: 'json', jsonc: 'json',
    md: 'markdown', mdx: 'markdown',
    css: 'css', scss: 'scss', less: 'less',
    html: 'html', htm: 'html',
    xml: 'xml', svg: 'xml',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    rb: 'ruby',
    php: 'php',
    c: 'c', h: 'c',
    cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
    cs: 'csharp',
    sql: 'sql',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    yaml: 'yaml', yml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    dockerfile: 'dockerfile',
    vue: 'html',
    graphql: 'graphql', gql: 'graphql',
  }
  return langMap[ext] || 'plaintext'
}

export default function FileBrowserPage() {
  const { branches } = useGitStore()
  const { resolvedTheme } = useTheme()
  const [currentRef, setCurrentRef] = useState('HEAD')
  const [treeData, setTreeData] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [originalContent, setOriginalContent] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showBlame, setShowBlame] = useState(false)
  const [blameData, setBlameData] = useState<any[]>([])
  const [loadingBlame, setLoadingBlame] = useState(false)

  // 加载根目录文件
  useEffect(() => {
    fetchRootFiles()
  }, [currentRef])

  const fetchRootFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await gitApi.listFiles('', currentRef)
      if (response.data?.success) {
        const files: FileItem[] = response.data.data || []
        setTreeData(files.map(f => ({
          name: f.name,
          path: f.path,
          type: f.type,
          loaded: f.type === 'file',
          children: f.type === 'directory' ? [] : undefined
        })))
      } else {
        setError('获取文件列表失败')
      }
    } catch (err: any) {
      setError(err.message || '获取文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 展开目录获取子文件
  const handleExpand = useCallback(async (path: string): Promise<FileNode[]> => {
    try {
      const response = await gitApi.listFiles(path, currentRef)
      if (response.data?.success) {
        const files: FileItem[] = response.data.data || []
        return files.map(f => ({
          name: f.name,
          path: f.path,
          type: f.type,
          loaded: f.type === 'file',
          children: f.type === 'directory' ? [] : undefined
        }))
      }
    } catch (err) {
      console.error('获取子目录失败:', err)
    }
    return []
  }, [currentRef])

  // 选择文件或目录
  const handleSelect = useCallback(async (path: string, type: 'file' | 'directory') => {
    if (type === 'file') {
      // 检查是否有未保存的更改
      if (hasChanges) {
        if (!confirm('有未保存的更改，确定要切换文件吗？')) {
          return
        }
      }
      
      setSelectedFile(path)
      setLoadingContent(true)
      setIsEditing(false)
      setHasChanges(false)
      
      try {
        const response = await gitApi.getFileContent(path, currentRef)
        if (response.data?.success) {
          const content = response.data.data || ''
          setFileContent(content)
          setOriginalContent(content)
        }
      } catch (err) {
        setFileContent('// 无法加载文件内容')
        setOriginalContent(null)
      } finally {
        setLoadingContent(false)
      }
    }
  }, [currentRef, hasChanges])

  // 处理编辑器内容变化
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value)
      setHasChanges(value !== originalContent)
    }
  }

  // 获取 Git Blame 数据
  const handleToggleBlame = async () => {
    if (showBlame) {
      setShowBlame(false)
      return
    }
    if (!selectedFile) return
    
    setLoadingBlame(true)
    try {
      const response = await gitApi.getBlame(selectedFile)
      if (response.data?.success) {
        setBlameData(response.data.data || [])
        setShowBlame(true)
      }
    } catch (err) {
      console.error('获取 Blame 失败:', err)
    } finally {
      setLoadingBlame(false)
    }
  }

  // 保存文件（注意：这里保存的是工作目录的文件，不是 Git 历史中的）
  const handleSave = async () => {
    if (!selectedFile || !fileContent) return
    
    setSaving(true)
    try {
      // 这里需要调用后端API保存文件
      // 目前后端可能没有这个接口，所以只是模拟
      alert('注意：当前查看的是 Git 仓库中的文件（只读）。如需编辑，请在本地文件系统中修改。')
    } finally {
      setSaving(false)
    }
  }

  // 重置更改
  const handleReset = () => {
    if (originalContent !== null) {
      setFileContent(originalContent)
      setHasChanges(false)
    }
  }

  const isGitRef = currentRef !== 'HEAD' || true // 始终显示为 Git 内容

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Folder className="w-5 h-5 text-yellow-500" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">文件浏览器</h1>
          
          {/* 来源指示器 */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Database className="w-3 h-3" />
            <span>Git 仓库</span>
          </div>
        </div>
        
        {/* Branch/Ref selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>显示 Git 仓库中的文件快照（只读）</span>
          </div>
          
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-400" />
            <select
              value={currentRef}
              onChange={e => setCurrentRef(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="HEAD">HEAD (当前)</option>
              {branches.filter(b => !b.name.startsWith('remotes/')).map(branch => (
                <option key={branch.name} value={branch.name}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：文件树 */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
              <Home className="w-3 h-3" />
              <span>仓库根目录</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <span className="text-sm text-red-500">{error}</span>
              </div>
            ) : (
              <FileTree
                nodes={treeData}
                selectedPath={selectedFile}
                onSelect={handleSelect}
                onExpand={handleExpand}
              />
            )}
          </div>
        </div>

        {/* 右侧：文件内容/编辑器 */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-950">
          {loadingContent ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedFile ? (
            <>
              {/* 文件标签栏 */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {selectedFile}
                  </span>
                  {hasChanges && (
                    <span className="w-2 h-2 rounded-full bg-orange-500" title="未保存的更改" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Blame 切换 */}
                  <button
                    onClick={handleToggleBlame}
                    disabled={loadingBlame}
                    className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                      showBlame 
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title="Git Blame - 查看每行的修改者"
                  >
                    {loadingBlame ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                  </button>

                  {/* 编辑模式切换 */}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-1.5 rounded transition-colors ${
                      isEditing 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={isEditing ? '切换到只读模式' : '切换到编辑模式'}
                  >
                    {isEditing ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  
                  {hasChanges && (
                    <>
                      <button
                        onClick={handleReset}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title="撤销更改"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        保存
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Monaco Editor 或 Blame 视图 */}
              <div className="flex-1 overflow-hidden">
                {showBlame && blameData.length > 0 ? (
                  <div className="h-full overflow-auto bg-white dark:bg-gray-950">
                    <table className="w-full text-xs font-mono">
                      <tbody>
                        {blameData.map((line, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                            <td className="w-8 text-right pr-2 py-1 text-gray-400 select-none bg-gray-50 dark:bg-gray-900">
                              {line.lineNumber}
                            </td>
                            <td className="w-48 px-2 py-1 text-gray-500 border-r border-gray-200 dark:border-gray-700 truncate" title={`${line.author} - ${line.date}\n${line.summary}`}>
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="truncate">{line.author}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{line.date}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1 whitespace-pre text-gray-700 dark:text-gray-300">
                              {line.content}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  }>
                    <MonacoEditor
                      height="100%"
                      language={getLanguage(selectedFile)}
                      value={fileContent || ''}
                      onChange={handleEditorChange}
                      theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                      options={{
                        readOnly: !isEditing,
                        minimap: { enabled: true },
                        fontSize: 13,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        renderWhitespace: 'selection',
                        bracketPairColorization: { enabled: true },
                      }}
                    />
                  </Suspense>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FileText className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">选择文件查看内容</p>
              <p className="text-sm text-gray-400">从左侧文件树中选择一个文件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
