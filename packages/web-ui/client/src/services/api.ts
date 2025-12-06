import axios from 'axios'
import type { ApiResponse, GitStatus, Branch, Commit, Remote, Tag, Stash } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Response interceptor - keep full response structure
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || error.message || 'Request failed'
    throw new Error(message)
  }
)

export const gitApi = {
  // Status
  getStatus: () => api.get<ApiResponse<GitStatus>>('/status'),
  
  // Branches
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
  
  // Commits
  getCommits: (limit = 50) => 
    api.get<ApiResponse<Commit[]>>('/commits', { params: { limit } }),
  commit: (message: string, files?: string[], amend = false) => 
    api.post('/commits', { message, files, amend }),
  getCommitDiff: (hash: string) => 
    api.get(`/commits/${hash}/diff`),
  
  // Diff
  getDiff: (target?: string) => api.get('/diff', { params: { target } }),
  getFileDiff: (file: string) => api.get(`/diff/${encodeURIComponent(file)}`),
  
  // File operations
  addFiles: (files: string[]) => api.post('/files/add', { files }),
  removeFiles: (files: string[]) => api.post('/files/remove', { files }),
  resetFiles: (files: string[]) => api.post('/files/reset', { files }),
  discardChanges: (files: string[]) => api.post('/files/discard', { files }),
  
  // Remotes
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
  
  // Tags
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
  
  // Conflicts
  getConflicts: () => api.get<ApiResponse<string[]>>('/conflicts'),
  resolveConflict: (file: string, useOurs = true) => 
    api.post(`/conflicts/${file}/resolve`, { useOurs }),
  abortMerge: () => api.post('/conflicts/abort'),
  continueMerge: () => api.post('/conflicts/continue'),
  
  // Other
  reset: (mode: 'soft' | 'mixed' | 'hard', commit = 'HEAD') => 
    api.post('/reset', { mode, commit }),
  revert: (commit: string) => api.post('/revert', { commit }),
  init: () => api.post('/init'),
  clone: (url: string, path?: string) => api.post('/clone', { url, path }),
  clean: (force = false, directories = false) => 
    api.post('/clean', { force, directories }),
  
  // Submodules
  getSubmodules: () => api.get('/submodules'),
  addSubmodule: (url: string, path: string, options?: any) =>
    api.post('/submodules', { url, path, ...options }),
  removeSubmodule: (path: string) => api.delete(`/submodules/${encodeURIComponent(path)}`),
  initSubmodules: (recursive = true) => api.post('/submodules/init', { recursive }),
  updateSubmodules: (options?: any) => api.post('/submodules/update', options),
  syncSubmodules: () => api.post('/submodules/sync'),
  
  // AI
  generateCommitMessage: (diff: string, language: 'zh' | 'en' = 'zh') =>
    api.post('/ai/generate-commit-message', { diff, language }),
  setAIConfig: (apiKey: string, baseUrl?: string, model?: string) =>
    api.post('/ai/config', { apiKey, baseUrl, model }),
  
  // Blame
  getBlame: (file: string) => api.get(`/blame/${encodeURIComponent(file)}`),
  
  // Branch Compare
  compareBranches: (base: string, compare: string) => 
    api.get(`/compare/${encodeURIComponent(base)}/${encodeURIComponent(compare)}`),
  
  // Cherry-pick
  cherryPick: (commits: string[], noCommit = false) =>
    api.post('/cherry-pick', { commits, noCommit }),
  abortCherryPick: () => api.post('/cherry-pick/abort'),
  
  // Reflog
  getReflog: (limit = 100) => api.get('/reflog', { params: { limit } }),
  resetToReflog: (ref: string, mode: 'soft' | 'mixed' | 'hard' = 'mixed') =>
    api.post('/reflog/reset', { ref, mode }),
  
  // Stats
  getContributorStats: () => api.get('/stats/contributors'),
  getCommitActivity: (days = 30) => api.get('/stats/activity', { params: { days } }),
  getFileTypeStats: () => api.get('/stats/file-types'),
  
  // Bisect
  bisectStart: (bad?: string, good?: string) => api.post('/bisect/start', { bad, good }),
  bisectGood: () => api.post('/bisect/good'),
  bisectBad: () => api.post('/bisect/bad'),
  bisectReset: () => api.post('/bisect/reset'),
  
  // Hooks
  getHooks: () => api.get('/hooks'),
  saveHook: (name: string, content: string, enabled: boolean) =>
    api.post(`/hooks/${name}`, { content, enabled }),
  
  // Search
  searchCommits: (q: string, options: { author?: string; since?: string; until?: string; path?: string; limit?: number } = {}) =>
    api.get('/commits/search', { params: { q, ...options } }),
  
  // File History
  getFileHistory: (file: string, limit = 50) =>
    api.get(`/files/${encodeURIComponent(file)}/history`, { params: { limit } }),
  
  // Conflict Resolution
  getConflictContent: (file: string) => api.get(`/conflicts/${encodeURIComponent(file)}/content`),
  saveConflictResolution: (file: string, content: string) =>
    api.post(`/conflicts/${encodeURIComponent(file)}/save`, { content }),
  
  // Commit Details
  getCommitDetails: (hash: string) => api.get(`/commits/${hash}/details`),
  
  // Branch Graph
  getBranchGraph: (limit = 100) => api.get('/graph', { params: { limit } }),
  
  // Code Search
  searchCode: (q: string, options: { pattern?: string; caseSensitive?: boolean; regex?: boolean } = {}) =>
    api.get('/search/code', { params: { q, ...options } }),
  
  // File Browser
  listFiles: (path = '', ref = 'HEAD') => api.get('/browse', { params: { path, ref } }),
  getFileContent: (path: string, ref = 'HEAD') => api.get('/browse/content', { params: { path, ref } }),
  
  // Repository Info
  getRepoInfo: () => api.get('/repo/info'),
  
  // SSH Key Generation
  generateSSHKey: (email: string, type: 'ed25519' | 'rsa' = 'ed25519') =>
    api.post('/ssh/generate', { email, type }),
  listSSHKeys: () => api.get('/ssh/keys'),
  
  // Git Credentials
  getCredentials: () => api.get('/credentials'),
  saveCredential: (credential: { provider: string; username: string; token: string }) =>
    api.post('/credentials', credential),
  deleteCredential: (id: string) => api.delete(`/credentials/${id}`),
}
