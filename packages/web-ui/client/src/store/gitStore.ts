import { create } from 'zustand'
import type { GitStatus, Branch, Commit, Remote, Tag, Stash } from '../types'
import { gitApi } from '../services/api'
import { wsService } from '../services/websocket'

interface GitStore {
  // 状态
  status: GitStatus | null
  branches: Branch[]
  commits: Commit[]
  remotes: Remote[]
  tags: Tag[]
  stashes: Stash[]
  conflicts: string[]
  
  // 加载状态
  loading: boolean
  error: string | null
  
  // Actions
  fetchStatus: () => Promise<void>
  fetchBranches: () => Promise<void>
  fetchCommits: (limit?: number) => Promise<void>
  fetchRemotes: () => Promise<void>
  fetchTags: () => Promise<void>
  fetchStashes: () => Promise<void>
  fetchConflicts: () => Promise<void>
  fetchAll: () => Promise<void>
  
  // 分支操作
  createBranch: (name: string, startPoint?: string) => Promise<void>
  deleteBranch: (name: string, force?: boolean) => Promise<void>
  checkoutBranch: (name: string, create?: boolean) => Promise<void>
  mergeBranch: (name: string) => Promise<void>
  
  // 提交操作
  commit: (message: string, files?: string[]) => Promise<void>
  addFiles: (files: string[]) => Promise<void>
  resetFiles: (files: string[]) => Promise<void>
  discardChanges: (files: string[]) => Promise<void>
  
  // 同步操作
  fetch: () => Promise<void>
  pull: (rebase?: boolean) => Promise<void>
  push: (force?: boolean) => Promise<void>
  
  // WebSocket
  initWebSocket: () => void
  cleanupWebSocket: () => void
  
  // 错误处理
  setError: (error: string | null) => void
  clearError: () => void
}

export const useGitStore = create<GitStore>((set, get) => ({
  // 初始状态
  status: null,
  branches: [],
  commits: [],
  remotes: [],
  tags: [],
  stashes: [],
  conflicts: [],
  loading: false,
  error: null,

  // Fetch操作
  fetchStatus: async () => {
    try {
      set({ loading: true, error: null })
      const response = await gitApi.getStatus()
      if (response.data && response.data.success) {
        set({ status: response.data.data, loading: false })
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchBranches: async () => {
    try {
      const response = await gitApi.getBranches()
      if (response.data && response.data.success) {
        set({ branches: response.data.data })
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  fetchCommits: async (limit = 50) => {
    try {
      const response = await gitApi.getCommits(limit)
      if (response.data && response.data.success) {
        set({ commits: response.data.data })
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  fetchRemotes: async () => {
    try {
      const response = await gitApi.getRemotes()
      if (response.data && response.data.success) {
        set({ remotes: response.data.data })
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  fetchTags: async () => {
    try {
      const response = await gitApi.getTags()
      if (response.data && response.data.success) {
        set({ tags: response.data.data })
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  fetchStashes: async () => {
    try {
      const response = await gitApi.getStashes()
      if (response.data && response.data.success) {
        set({ stashes: response.data.data })
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  fetchConflicts: async () => {
    try {
      const response = await gitApi.getConflicts()
      if (response.data && response.data.success) {
        set({ conflicts: response.data.data })
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  fetchAll: async () => {
    const { fetchStatus, fetchBranches, fetchCommits, fetchRemotes } = get()
    await Promise.all([
      fetchStatus(),
      fetchBranches(),
      fetchCommits(),
      fetchRemotes(),
    ])
  },

  // 分支操作
  createBranch: async (name: string, startPoint?: string) => {
    try {
      set({ loading: true, error: null })
      await gitApi.createBranch(name, startPoint)
      await get().fetchBranches()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deleteBranch: async (name: string, force = false) => {
    try {
      set({ loading: true, error: null })
      await gitApi.deleteBranch(name, force)
      await get().fetchBranches()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  checkoutBranch: async (name: string, create = false) => {
    try {
      set({ loading: true, error: null })
      await gitApi.checkoutBranch(name, create)
      await Promise.all([get().fetchStatus(), get().fetchBranches()])
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  mergeBranch: async (name: string) => {
    try {
      set({ loading: true, error: null })
      await gitApi.mergeBranch(name)
      await Promise.all([get().fetchStatus(), get().fetchCommits()])
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // 提交操作
  commit: async (message: string, files?: string[]) => {
    try {
      set({ loading: true, error: null })
      await gitApi.commit(message, files)
      await Promise.all([get().fetchStatus(), get().fetchCommits()])
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  addFiles: async (files: string[]) => {
    try {
      await gitApi.addFiles(files)
      await get().fetchStatus()
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  resetFiles: async (files: string[]) => {
    try {
      await gitApi.resetFiles(files)
      await get().fetchStatus()
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  discardChanges: async (files: string[]) => {
    try {
      await gitApi.discardChanges(files)
      await get().fetchStatus()
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  // 同步操作
  fetch: async () => {
    try {
      set({ loading: true, error: null })
      await gitApi.fetch()
      await get().fetchStatus()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  pull: async (rebase = false) => {
    try {
      set({ loading: true, error: null })
      await gitApi.pull('origin', undefined, rebase)
      await Promise.all([get().fetchStatus(), get().fetchCommits()])
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  push: async (force = false) => {
    try {
      set({ loading: true, error: null })
      await gitApi.push('origin', undefined, force)
      await get().fetchStatus()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // WebSocket
  initWebSocket: () => {
    wsService.connect()
    
    // 监听状态更新
    wsService.on('status', (data) => {
      set({ status: data })
    })
    
    wsService.on('branches', (data) => {
      set({ branches: data })
    })
    
    wsService.on('commits', (data) => {
      set({ commits: data })
    })
    
    wsService.on('notification', (data) => {
      if (data.status) set({ status: data.status })
      if (data.branches) set({ branches: data.branches })
    })
    
    wsService.on('error', (error) => {
      set({ error })
    })
  },

  cleanupWebSocket: () => {
    wsService.disconnect()
  },

  // 错误处理
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}))