import axios from 'axios'
import type { ApiResponse, GitStatus, Branch, Commit, Remote, Tag, Stash } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.error || error.message || '请求失败'
    throw new Error(message)
  }
)

export const gitApi = {
  // 状态
  getStatus: () => api.get<ApiResponse<GitStatus>>('/status'),
  
  // 分支
  getBranches: () => api.get<ApiResponse<Branch[]>>('/branches'),
  createBranch: (name: string, startPoint?: string) => 
    api.post('/branches', { name, startPoint }),
  deleteBranch: (name: string, force = false) => 
    api.delete(`/branches/${name}`, { params: { force } }),
  checkoutBranch: (name: string, create = false) => 
    api.post(`/branches/${name}/checkout`, { create }),
  renameBranch: (oldName: string, newName: string) => 
    api.post(`/branches/${oldName}/rename`, { newName }),
  mergeBranch: (name: string, noFastForward = false) => 
    api.post(`/branches/${name}/merge`, { noFastForward }),
  rebaseBranch: (name: string, interactive = false) => 
    api.post(`/branches/${name}/rebase`, { interactive }),
  
  // 提交
  getCommits: (limit = 50) => 
    api.get<ApiResponse<Commit[]>>('/commits', { params: { limit } }),
  commit: (message: string, files?: string[], amend = false) => 
    api.post('/commits', { message, files, amend }),
  getCommitDiff: (hash: string) => 
    api.get(`/commits/${hash}/diff`),
  
  // 文件操作
  addFiles: (files: string[]) => api.post('/files/add', { files }),
  removeFiles: (files: string[]) => api.post('/files/remove', { files }),
  resetFiles: (files: string[]) => api.post('/files/reset', { files }),
  discardChanges: (files: string[]) => api.post('/files/discard', { files }),
  
  // 远程
  getRemotes: () => api.get<ApiResponse<Remote[]>>('/remotes'),
  addRemote: (name: string, url: string) => 
    api.post('/remotes', { name, url }),
  removeRemote: (name: string) => api.delete(`/remotes/${name}`),
  fetch: (remote = 'origin', prune = true) => 
    api.post('/fetch', { remote, prune }),
  pull: (remote = 'origin', branch?: string, rebase = false) => 
    api.post('/pull', { remote, branch, rebase }),
  push: (remote = 'origin', branch?: string, force = false, tags = false) => 
    api.post('/push', { remote, branch, force, tags }),
  
  // 标签
  getTags: () => api.get<ApiResponse<Tag[]>>('/tags'),
  createTag: (name: string, message?: string, annotated = false) => 
    api.post('/tags', { name, message, annotated }),
  deleteTag: (name: string, remote = false) => 
    api.delete(`/tags/${name}`, { params: { remote } }),
  pushTag: (name: string, remote = 'origin') => 
    api.post(`/tags/${name}/push`, { remote }),
  
  // Stash
  getStashes: () => api.get<ApiResponse<Stash[]>>('/stash'),
  stashSave: (message?: string, includeUntracked = false) => 
    api.post('/stash/save', { message, includeUntracked }),
  stashPop: (index = 0) => api.post('/stash/pop', { index }),
  stashApply: (index = 0) => api.post('/stash/apply', { index }),
  stashDrop: (index: number) => api.delete(`/stash/${index}`),
  stashClear: () => api.delete('/stash'),
  
  // 冲突
  getConflicts: () => api.get<ApiResponse<string[]>>('/conflicts'),
  resolveConflict: (file: string, useOurs = true) => 
    api.post(`/conflicts/${file}/resolve`, { useOurs }),
  abortMerge: () => api.post('/conflicts/abort'),
  continueMerge: () => api.post('/conflicts/continue'),
  
  // 其他
  reset: (mode: 'soft' | 'mixed' | 'hard', commit = 'HEAD') => 
    api.post('/reset', { mode, commit }),
  revert: (commit: string) => api.post('/revert', { commit }),
  init: () => api.post('/init'),
  clone: (url: string, path?: string) => api.post('/clone', { url, path }),
  clean: (force = false, directories = false) => 
    api.post('/clean', { force, directories }),
}