import { Router, Request, Response } from 'express'
import type { GitService } from '../services/git-service.js'
import type { ApiResponse } from '../types/index.js'

export function createApiRoutes(gitService: GitService): Router {
  const router = Router()

  // 辅助函数：处理API响应
  const handleResponse = async <T>(
    res: Response,
    operation: () => Promise<T>,
    successMessage?: string
  ) => {
    try {
      const data = await operation()
      const response: ApiResponse<T> = {
        success: true,
        data,
        message: successMessage
      }
      res.json(response)
    } catch (error: any) {
      console.error('API错误:', error)
      const response: ApiResponse = {
        success: false,
        error: error.message || '操作失败'
      }
      res.status(500).json(response)
    }
  }

  // ========== 状态 ==========
  router.get('/status', (req, res) => {
    handleResponse(res, () => gitService.getStatus())
  })

  // ========== 分支 ==========
  router.get('/branches', (req, res) => {
    handleResponse(res, () => gitService.getBranches())
  })

  router.post('/branches', (req, res) => {
    const { name, startPoint } = req.body
    handleResponse(res, () => gitService.createBranch(name, startPoint), '分支创建成功')
  })

  router.delete('/branches/:name', (req, res) => {
    const { name } = req.params
    const { force } = req.query
    handleResponse(res, () => gitService.deleteBranch(name, force === 'true'), '分支删除成功')
  })

  router.post('/branches/:name/checkout', (req, res) => {
    const { name } = req.params
    const { create } = req.body
    handleResponse(res, () => gitService.checkoutBranch(name, create), '分支切换成功')
  })

  router.post('/branches/:oldName/rename', (req, res) => {
    const { oldName } = req.params
    const { newName } = req.body
    handleResponse(res, () => gitService.renameBranch(oldName, newName), '分支重命名成功')
  })

  router.post('/branches/:name/merge', (req, res) => {
    const { name } = req.params
    const { noFastForward } = req.body
    handleResponse(res, () => gitService.mergeBranch(name, { noFastForward }), '合并成功')
  })

  router.post('/branches/:name/rebase', (req, res) => {
    const { name } = req.params
    const { interactive } = req.body
    handleResponse(res, () => gitService.rebaseBranch(name, interactive), '变基成功')
  })

  // ========== 提交 ==========
  router.get('/commits', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50
    handleResponse(res, () => gitService.getCommits(limit))
  })

  router.post('/commits', (req, res) => {
    const { message, files, amend } = req.body
    handleResponse(res, () => gitService.commit(message, files, amend), '提交成功')
  })

  router.get('/commits/:hash/diff', (req, res) => {
    const { hash } = req.params
    handleResponse(res, () => gitService.getCommitDiff(hash))
  })

  // ========== 文件操作 ==========
  router.post('/files/add', (req, res) => {
    const { files } = req.body
    handleResponse(res, () => gitService.addFiles(files), '文件已添加到暂存区')
  })

  router.post('/files/remove', (req, res) => {
    const { files } = req.body
    handleResponse(res, () => gitService.removeFiles(files), '文件已删除')
  })

  router.post('/files/reset', (req, res) => {
    const { files } = req.body
    handleResponse(res, () => gitService.resetFiles(files), '文件已从暂存区移除')
  })

  router.post('/files/discard', (req, res) => {
    const { files } = req.body
    handleResponse(res, () => gitService.discardChanges(files), '更改已丢弃')
  })

  // ========== 远程仓库 ==========
  router.get('/remotes', (req, res) => {
    handleResponse(res, () => gitService.getRemotes())
  })

  router.post('/remotes', (req, res) => {
    const { name, url } = req.body
    handleResponse(res, () => gitService.addRemote(name, url), '远程仓库已添加')
  })

  router.delete('/remotes/:name', (req, res) => {
    const { name } = req.params
    handleResponse(res, () => gitService.removeRemote(name), '远程仓库已删除')
  })

  router.post('/fetch', (req, res) => {
    const { remote, prune } = req.body
    handleResponse(res, () => gitService.fetch(remote || 'origin', prune !== false), '拉取成功')
  })

  router.post('/pull', (req, res) => {
    const { remote, branch, rebase } = req.body
    handleResponse(res, () => gitService.pull(remote, branch, rebase), '拉取成功')
  })

  router.post('/push', (req, res) => {
    const { remote, branch, force, tags } = req.body
    handleResponse(res, () => gitService.push(remote, branch, force, tags), '推送成功')
  })

  // ========== 标签 ==========
  router.get('/tags', (req, res) => {
    handleResponse(res, () => gitService.getTags())
  })

  router.post('/tags', (req, res) => {
    const { name, message, annotated } = req.body
    handleResponse(res, () => gitService.createTag(name, message, annotated), '标签创建成功')
  })

  router.delete('/tags/:name', (req, res) => {
    const { name } = req.params
    const { remote } = req.query
    handleResponse(res, () => gitService.deleteTag(name, remote === 'true'), '标签删除成功')
  })

  router.post('/tags/:name/push', (req, res) => {
    const { name } = req.params
    const { remote } = req.body
    handleResponse(res, () => gitService.pushTag(name, remote), '标签推送成功')
  })

  // ========== Stash ==========
  router.get('/stash', (req, res) => {
    handleResponse(res, () => gitService.getStashes())
  })

  router.post('/stash/save', (req, res) => {
    const { message, includeUntracked } = req.body
    handleResponse(res, () => gitService.stashSave(message, includeUntracked), '已保存到stash')
  })

  router.post('/stash/pop', (req, res) => {
    const { index } = req.body
    handleResponse(res, () => gitService.stashPop(index || 0), 'Stash已应用并删除')
  })

  router.post('/stash/apply', (req, res) => {
    const { index } = req.body
    handleResponse(res, () => gitService.stashApply(index || 0), 'Stash已应用')
  })

  router.delete('/stash/:index', (req, res) => {
    const index = parseInt(req.params.index)
    handleResponse(res, () => gitService.stashDrop(index), 'Stash已删除')
  })

  router.delete('/stash', (req, res) => {
    handleResponse(res, () => gitService.stashClear(), '所有stash已清除')
  })

  // ========== Diff ==========
  router.get('/diff', (req, res) => {
    const { target } = req.query
    handleResponse(res, () => gitService.getDiff(target as string))
  })

  router.get('/diff/:file', (req, res) => {
    const { file } = req.params
    handleResponse(res, () => gitService.getFileDiff(file))
  })

  // ========== 冲突 ==========
  router.get('/conflicts', (req, res) => {
    handleResponse(res, () => gitService.getConflicts())
  })

  router.post('/conflicts/:file/resolve', (req, res) => {
    const { file } = req.params
    const { useOurs } = req.body
    handleResponse(res, () => gitService.resolveConflict(file, useOurs !== false), '冲突已解决')
  })

  router.post('/conflicts/abort', (req, res) => {
    handleResponse(res, () => gitService.abortMerge(), '合并已中止')
  })

  router.post('/conflicts/continue', (req, res) => {
    handleResponse(res, () => gitService.continueMerge(), '合并已继续')
  })

  // ========== Reset & Revert ==========
  router.post('/reset', (req, res) => {
    const { mode, commit } = req.body
    handleResponse(res, () => gitService.reset(mode, commit), '重置成功')
  })

  router.post('/revert', (req, res) => {
    const { commit } = req.body
    handleResponse(res, () => gitService.revert(commit), '回退成功')
  })

  // ========== 其他操作 ==========
  router.post('/init', (req, res) => {
    handleResponse(res, () => gitService.init(), '仓库初始化成功')
  })

  router.post('/clone', (req, res) => {
    const { url, path } = req.body
    handleResponse(res, () => gitService.clone(url, path), '克隆成功')
  })

  router.post('/clean', (req, res) => {
    const { force, directories } = req.body
    handleResponse(res, () => gitService.clean(force, directories), '清理成功')
  })

  // ========== 统计分析 ==========
  router.get('/stats/repository', (req, res) => {
    handleResponse(res, () => gitService.getRepositoryStats())
  })

  router.get('/stats/commits', (req, res) => {
    handleResponse(res, () => gitService.getCommitAnalysis())
  })

  // ========== Worktree ==========
  router.get('/worktrees', (req, res) => {
    handleResponse(res, () => gitService.getWorktrees())
  })

  router.post('/worktrees', (req, res) => {
    const { path, branch } = req.body
    handleResponse(res, () => gitService.addWorktree(path, branch), 'Worktree已添加')
  })

  router.delete('/worktrees', (req, res) => {
    const { path } = req.body
    handleResponse(res, () => gitService.removeWorktree(path), 'Worktree已删除')
  })

  // ========== LFS ==========
  router.post('/lfs/track', (req, res) => {
    const { pattern } = req.body
    handleResponse(res, () => gitService.lfsTrack(pattern), 'LFS跟踪已添加')
  })

  router.post('/lfs/untrack', (req, res) => {
    const { pattern } = req.body
    handleResponse(res, () => gitService.lfsUntrack(pattern), 'LFS跟踪已移除')
  })

  router.get('/lfs/tracked', (req, res) => {
    handleResponse(res, () => gitService.lfsListTracked())
  })

  router.post('/lfs/pull', (req, res) => {
    handleResponse(res, () => gitService.lfsPull(), 'LFS文件已拉取')
  })

  router.post('/lfs/push', (req, res) => {
    handleResponse(res, () => gitService.lfsPush(), 'LFS文件已推送')
  })

  // ========== Monorepo ==========
  router.get('/monorepo/packages', (req, res) => {
    handleResponse(res, () => gitService.detectPackages())
  })

  router.get('/monorepo/workspace', (req, res) => {
    handleResponse(res, () => gitService.analyzeWorkspace())
  })

  return router
}