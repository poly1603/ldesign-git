export interface GitStatusResponse {
  current: string
  tracking: string | null
  ahead: number
  behind: number
  modified: string[]
  created: string[]
  deleted: string[]
  renamed: { from: string; to: string }[]
  conflicted: string[]
  notAdded: string[]
  isClean: boolean
}

export interface BranchInfo {
  name: string
  current: boolean
  commit: string
  label: string
}

export interface CommitInfo {
  hash: string
  date: string
  message: string
  author_name: string
  author_email: string
  refs: string
}

export interface RemoteInfo {
  name: string
  url: string
  type: 'fetch' | 'push'
}

export interface TagInfo {
  name: string
  commit: string
  message?: string
  date?: string
  tagger?: string
}

export interface StashInfo {
  index: number
  branch: string
  message: string
  date: string
}

export interface DiffResult {
  file: string
  changes: number
  insertions: number
  deletions: number
  binary: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface WebSocketMessage {
  type: 'status' | 'branches' | 'commits' | 'error' | 'notification'
  data?: any
  error?: string
  timestamp: number
}

export interface CommitRequest {
  message: string
  files?: string[]
  amend?: boolean
}

export interface BranchRequest {
  name: string
  startPoint?: string
  checkout?: boolean
}

export interface MergeRequest {
  branch: string
  noFastForward?: boolean
  strategy?: string
}

export interface RebaseRequest {
  branch: string
  interactive?: boolean
}

export interface PushRequest {
  remote?: string
  branch?: string
  force?: boolean
  tags?: boolean
}

export interface PullRequest {
  remote?: string
  branch?: string
  rebase?: boolean
}

export interface CheckoutRequest {
  target: string
  create?: boolean
  force?: boolean
}

export interface ResetRequest {
  mode: 'soft' | 'mixed' | 'hard'
  commit?: string
}

export interface FileOperation {
  operation: 'add' | 'remove' | 'reset'
  files: string[]
}