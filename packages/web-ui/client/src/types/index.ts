export interface GitStatus {
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

export interface Branch {
  name: string
  current: boolean
  commit: string
  label: string
}

export interface Commit {
  hash: string
  date: string
  message: string
  author_name: string
  author_email: string
  refs: string
}

export interface Remote {
  name: string
  url: string
  type: 'fetch' | 'push'
}

export interface Tag {
  name: string
  commit: string
  message?: string
  date?: string
  tagger?: string
}

export interface Stash {
  index: number
  branch: string
  message: string
  date: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}