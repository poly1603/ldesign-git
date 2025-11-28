import { useState } from 'react'
import { useGitStore } from '../store/gitStore'
import { GitBranch, Plus } from 'lucide-react'
import dayjs from 'dayjs'

// ========== 分支页面 ==========
export function BranchesPage() {
  const { branches, checkoutBranch, createBranch, deleteBranch, mergeBranch } = useGitStore()
  const [newBranchName, setNewBranchName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const handleCreate = async () => {
    if (!newBranchName.trim()) return
    try {
      await createBranch(newBranchName.trim())
      setNewBranchName('')
      setShowCreate(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleCheckout = async (name: string) => {
    if (confirm(`确定要切换到分支 "${name}" 吗？`)) {
      try {
        await checkoutBranch(name)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleDelete = async (name: string) => {
    if (confirm(`确定要删除分支 "${name}" 吗？`)) {
      try {
        await deleteBranch(name)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleMerge = async (name: string) => {
    if (confirm(`确定要合并分支 "${name}" 到当前分支吗？`)) {
      try {
        await mergeBranch(name)
      } catch (error) {
        console.error(error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">分支管理</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          <span>创建分支</span>
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-4 rounded-lg shadow">
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="输入分支名称..."
            className="w-full px-4 py-2 border rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="mt-3 flex space-x-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
              创建
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              取消
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow divide-y">
        {branches.map((branch) => (
          <div key={branch.name} className="p-4 hover:bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GitBranch className={`w-5 h-5 ${branch.current ? 'text-primary-600' : 'text-gray-400'}`} />
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${branch.current ? 'text-primary-600' : ''}`}>
                    {branch.name}
                  </span>
                  {branch.current && (
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">当前</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-mono">{branch.commit.substring(0, 7)}</span>
              </div>
            </div>
            {!branch.current && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCheckout(branch.name)}
                  className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                >
                  切换
                </button>
                <button
                  onClick={() => handleMerge(branch.name)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  合并
                </button>
                <button
                  onClick={() => handleDelete(branch.name)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  删除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ========== 提交历史页面 ==========
export function CommitsPage() {
  const { commits } = useGitStore()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">提交历史</h2>
      <div className="bg-white rounded-lg shadow divide-y">
        {commits.map((commit) => (
          <div key={commit.hash} className="p-4 hover:bg-gray-50">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-600"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{commit.message}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{commit.author_name}</span>
                  <span>{dayjs(commit.date).format('YYYY-MM-DD HH:mm')}</span>
                  <span className="font-mono text-xs">{commit.hash.substring(0, 7)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ========== 变更页面 ==========
export function ChangesPage() {
  const { status, addFiles, resetFiles, discardChanges, commit } = useGitStore()
  const [commitMessage, setCommitMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  if (!status) return <div>加载中...</div>

  const allFiles = [...status.modified, ...status.created, ...status.deleted, ...status.notAdded]
  
  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      alert('请输入提交信息')
      return
    }
    try {
      await commit(commitMessage, selectedFiles.length > 0 ? selectedFiles : undefined)
      setCommitMessage('')
      setSelectedFiles([])
    } catch (error) {
      console.error(error)
    }
  }

  const handleStage = async (files: string[]) => {
    try {
      await addFiles(files)
    } catch (error) {
      console.error(error)
    }
  }

  const handleUnstage = async (files: string[]) => {
    try {
      await resetFiles(files)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDiscard = async (files: string[]) => {
    if (confirm('确定要丢弃这些更改吗？此操作不可恢复！')) {
      try {
        await discardChanges(files)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const stagedFiles = [...status.modified, ...status.created, ...status.deleted].filter(
    f => !status.notAdded.includes(f)
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">变更</h2>

      {/* Commit Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-3">提交更改</h3>
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="输入提交信息..."
          className="w-full px-4 py-2 border rounded-lg resize-none"
          rows={3}
        />
        <button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || allFiles.length === 0}
          className="mt-3 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          提交 ({stagedFiles.length} 个文件)
        </button>
      </div>

      {/* Staged Files */}
      {stagedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">已暂存的更改 ({stagedFiles.length})</h3>
            <button
              onClick={() => handleUnstage(stagedFiles)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              取消暂存全部
            </button>
          </div>
          <div className="divide-y">
            {stagedFiles.map((file) => (
              <div key={file} className="p-3 flex justify-between items-center hover:bg-gray-50">
                <span className="text-sm">{file}</span>
                <button
                  onClick={() => handleUnstage([file])}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  取消暂存
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unstaged Files */}
      {status.notAdded.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">未暂存的更改 ({status.notAdded.length})</h3>
            <button
              onClick={() => handleStage(status.notAdded)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              暂存全部
            </button>
          </div>
          <div className="divide-y">
            {status.notAdded.map((file) => (
              <div key={file} className="p-3 flex justify-between items-center hover:bg-gray-50">
                <span className="text-sm">{file}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStage([file])}
                    className="text-xs px-2 py-1 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    暂存
                  </button>
                  <button
                    onClick={() => handleDiscard([file])}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    丢弃
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allFiles.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p>工作区干净，没有更改</p>
        </div>
      )}
    </div>
  )
}

// ========== 同步页面 ==========
export function SyncPage() {
  const { status, fetch, pull, push, loading } = useGitStore()

  const handleFetch = async () => {
    try {
      await fetch()
      alert('拉取远程更新成功')
    } catch (error: any) {
      alert(`拉取失败: ${error.message}`)
    }
  }

  const handlePull = async (rebase = false) => {
    try {
      await pull(rebase)
      alert('拉取成功')
    } catch (error: any) {
      alert(`拉取失败: ${error.message}`)
    }
  }

  const handlePush = async (force = false) => {
    if (force && !confirm('确定要强制推送吗？这可能会覆盖远程更改！')) {
      return
    }
    try {
      await push(force)
      alert('推送成功')
    } catch (error: any) {
      alert(`推送失败: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">同步</h2>

      {status && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">当前状态</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">当前分支:</span>
              <span className="font-medium">{status.current}</span>
            </div>
            {status.tracking && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">跟踪分支:</span>
                  <span className="font-medium">{status.tracking}</span>
                </div>
                {status.ahead > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">领先:</span>
                    <span className="font-medium text-green-600">{status.ahead} 个提交</span>
                  </div>
                )}
                {status.behind > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">落后:</span>
                    <span className="font-medium text-red-600">{status.behind} 个提交</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard
          title="拉取 (Fetch)"
          description="从远程仓库获取最新更改，但不合并"
          action={() => handleFetch()}
          disabled={loading}
          buttonText="Fetch"
        />
        <ActionCard
          title="拉取 (Pull)"
          description="拉取远程更改并合并到当前分支"
          action={() => handlePull(false)}
          disabled={loading}
          buttonText="Pull"
          secondary={{
            text: "Pull (Rebase)",
            action: () => handlePull(true)
          }}
        />
        <ActionCard
          title="推送 (Push)"
          description="将本地提交推送到远程仓库"
          action={() => handlePush(false)}
          disabled={loading}
          buttonText="Push"
          secondary={{
            text: "Force Push",
            action: () => handlePush(true)
          }}
        />
      </div>
    </div>
  )
}

function ActionCard({ title, description, action, disabled, buttonText, secondary }: {
  title: string
  description: string
  action: () => void
  disabled?: boolean
  buttonText: string
  secondary?: { text: string; action: () => void }
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="flex space-x-2">
        <button
          onClick={action}
          disabled={disabled}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
        >
          {buttonText}
        </button>
        {secondary && (
          <button
            onClick={secondary.action}
            disabled={disabled}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {secondary.text}
          </button>
        )}
      </div>
    </div>
  )
}