export interface GitOptions {
  baseDir?: string
}

export interface RepositoryInfo {
  currentBranch: string
  modified: string[]
  created: string[]
  deleted: string[]
  renamed: Array<{ from: string; to: string }>
  staged: string[]
  ahead: number
  behind: number
}

export interface CommitInfo {
  hash: string
  message: string
  author: string
  date: string
}

export interface CommitStats {
  total: number
  latest: CommitInfo | null
  authors: number
  commits: CommitInfo[]
}


