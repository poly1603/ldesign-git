/**
 * TypeScript 类型工具
 * @module types/utilities
 */

import type {
  CommitInfo,
  BranchInfo,
  TagInfo,
  StashInfo,
  SubmoduleInfo,
  RemoteInfo,
  WorktreeInfo,
  ReflogEntry,
  StatusResult,
  CommitType,
  WorkflowType,
  ReportFormat,
  ConfigScope
} from './index'

// ==================== 基础类型工具 ====================

/**
 * 深度部分类型
 *
 * 将对象的所有属性（包括嵌套属性）变为可选
 *
 * @example
 * ```ts
 * type Config = { a: { b: { c: number } } }
 * type PartialConfig = DeepPartial<Config>
 * // { a?: { b?: { c?: number } } }
 * ```
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

/**
 * 深度只读类型
 *
 * 将对象的所有属性（包括嵌套属性）变为只读
 *
 * @example
 * ```ts
 * type Config = { a: { b: number } }
 * type ReadonlyConfig = DeepReadonly<Config>
 * // { readonly a: { readonly b: number } }
 * ```
 */
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T

/**
 * 深度必填类型
 *
 * 将对象的所有属性（包括嵌套属性）变为必填
 */
export type DeepRequired<T> = T extends object
  ? { [P in keyof T]-?: DeepRequired<T[P]> }
  : T

/**
 * 可空类型
 *
 * 添加 null 和 undefined 到类型
 */
export type Nullable<T> = T | null | undefined

/**
 * 非空类型
 *
 * 移除 null 和 undefined
 */
export type NonNullable<T> = Exclude<T, null | undefined>

/**
 * 可能的 Promise 类型
 *
 * 表示值可以是同步或异步
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * 获取 Promise 的解析类型
 */
export type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T

/**
 * 获取数组元素类型
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never

/**
 * 获取函数返回类型
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never

/**
 * 获取对象的键类型（字符串键）
 */
export type StringKeys<T> = Extract<keyof T, string>

/**
 * 获取对象的值类型
 */
export type ValueOf<T> = T[keyof T]

/**
 * 使部分键可选
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 使部分键必填
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * 排除特定属性
 */
export type Without<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * 递归 Pick
 */
export type DeepPick<T, K extends keyof T> = {
  [P in K]: T[P] extends object ? DeepPick<T[P], keyof T[P]> : T[P]
}

/**
 * 字符串字面量联合类型
 */
export type LiteralUnion<T extends string> = T | (string & {})

// ==================== Git 特定类型工具 ====================

/**
 * 提交信息（带可选字段）
 */
export type PartialCommitInfo = DeepPartial<CommitInfo>

/**
 * 只读提交信息
 */
export type ReadonlyCommitInfo = DeepReadonly<CommitInfo>

/**
 * 分支信息（带可选字段）
 */
export type PartialBranchInfo = DeepPartial<BranchInfo>

/**
 * Git 命令结果
 */
export interface GitCommandResult<T = void> {
  success: boolean
  data?: T
  error?: Error
  duration?: number
}

/**
 * 带进度的操作结果
 */
export interface ProgressResult<T> {
  result: T
  progress: {
    total: number
    completed: number
    failed: number
  }
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * 过滤选项
 */
export interface FilterOptions<T> {
  include?: Partial<T>
  exclude?: Partial<T>
  limit?: number
  offset?: number
  sortBy?: keyof T
  sortOrder?: 'asc' | 'desc'
}

/**
 * 操作状态
 */
export type OperationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * 操作结果
 */
export interface OperationResult<T = void> {
  status: OperationStatus
  data?: T
  error?: Error
  startTime: Date
  endTime?: Date
}

// ==================== 类型守卫 ====================

/**
 * 检查是否是 CommitInfo
 */
export function isCommitInfo(value: unknown): value is CommitInfo {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.hash === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.author === 'string' &&
    typeof obj.date === 'string'
  )
}

/**
 * 检查是否是 BranchInfo
 */
export function isBranchInfo(value: unknown): value is BranchInfo {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.current === 'boolean' &&
    typeof obj.commit === 'string'
  )
}

/**
 * 检查是否是 TagInfo
 */
export function isTagInfo(value: unknown): value is TagInfo {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.commit === 'string' &&
    (obj.type === 'lightweight' || obj.type === 'annotated')
  )
}

/**
 * 检查是否是 StashInfo
 */
export function isStashInfo(value: unknown): value is StashInfo {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.index === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.date === 'string'
  )
}

/**
 * 检查是否是 SubmoduleInfo
 */
export function isSubmoduleInfo(value: unknown): value is SubmoduleInfo {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.path === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.commit === 'string'
  )
}

/**
 * 检查是否是 RemoteInfo
 */
export function isRemoteInfo(value: unknown): value is RemoteInfo {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.url === 'string' &&
    (obj.type === 'fetch' || obj.type === 'push')
  )
}

/**
 * 检查是否是 WorktreeInfo
 */
export function isWorktreeInfo(value: unknown): value is WorktreeInfo {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.path === 'string' &&
    typeof obj.branch === 'string' &&
    typeof obj.commit === 'string' &&
    typeof obj.isPrimary === 'boolean'
  )
}

/**
 * 检查是否是 ReflogEntry
 */
export function isReflogEntry(value: unknown): value is ReflogEntry {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.index === 'number' &&
    typeof obj.hash === 'string' &&
    typeof obj.operation === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.date === 'string'
  )
}

/**
 * 检查是否是 StatusResult
 */
export function isStatusResult(value: unknown): value is StatusResult {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.current === 'string' &&
    Array.isArray(obj.modified) &&
    Array.isArray(obj.created) &&
    Array.isArray(obj.deleted) &&
    typeof obj.isClean === 'boolean'
  )
}

/**
 * 检查是否是有效的 CommitType
 */
export function isCommitType(value: unknown): value is CommitType {
  const validTypes: CommitType[] = [
    'feat', 'fix', 'docs', 'style', 'refactor',
    'perf', 'test', 'build', 'ci', 'chore', 'revert'
  ]
  return typeof value === 'string' && validTypes.includes(value as CommitType)
}

/**
 * 检查是否是有效的 WorkflowType
 */
export function isWorkflowType(value: unknown): value is WorkflowType {
  const validTypes: WorkflowType[] = ['git-flow', 'github-flow', 'gitlab-flow', 'custom']
  return typeof value === 'string' && validTypes.includes(value as WorkflowType)
}

/**
 * 检查是否是有效的 ReportFormat
 */
export function isReportFormat(value: unknown): value is ReportFormat {
  const validFormats: ReportFormat[] = ['markdown', 'json', 'csv', 'html']
  return typeof value === 'string' && validFormats.includes(value as ReportFormat)
}

/**
 * 检查是否是有效的 ConfigScope
 */
export function isConfigScope(value: unknown): value is ConfigScope {
  const validScopes: ConfigScope[] = ['local', 'global', 'system']
  return typeof value === 'string' && validScopes.includes(value as ConfigScope)
}

// ==================== 类型断言 ====================

/**
 * 断言值为非空
 */
export function assertNonNull<T>(
  value: T | null | undefined,
  message = '值不能为空'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message)
  }
}

/**
 * 断言值为 CommitInfo
 */
export function assertCommitInfo(
  value: unknown,
  message = '无效的提交信息'
): asserts value is CommitInfo {
  if (!isCommitInfo(value)) {
    throw new Error(message)
  }
}

/**
 * 断言值为 BranchInfo
 */
export function assertBranchInfo(
  value: unknown,
  message = '无效的分支信息'
): asserts value is BranchInfo {
  if (!isBranchInfo(value)) {
    throw new Error(message)
  }
}

/**
 * 断言值为数组
 */
export function assertArray<T>(
  value: unknown,
  message = '值必须是数组'
): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(message)
  }
}

/**
 * 断言值为字符串
 */
export function assertString(
  value: unknown,
  message = '值必须是字符串'
): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(message)
  }
}

/**
 * 断言值为数字
 */
export function assertNumber(
  value: unknown,
  message = '值必须是数字'
): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(message)
  }
}

// ==================== 工具函数 ====================

/**
 * 安全地获取对象属性
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key]
}

/**
 * 安全地获取嵌套属性
 */
export function deepGet<T>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.')
  let result: unknown = obj

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue
    }
    result = (result as Record<string, unknown>)[key]
  }

  return (result as T) ?? defaultValue
}

/**
 * 类型安全的 Object.keys
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[]
}

/**
 * 类型安全的 Object.entries
 */
export function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}

/**
 * 类型安全的 Object.fromEntries
 */
export function typedFromEntries<K extends string, V>(
  entries: [K, V][]
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>
}

/**
 * 检查对象是否为空
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 检查值是否已定义
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * 检查值是否为对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 检查值是否为函数
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

/**
 * 过滤对象中的 undefined 值
 */
export function filterUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value
    }
  }
  return result
}

/**
 * 合并对象（深度合并）
 */
export function deepMerge<T extends object>(...objects: Partial<T>[]): T {
  const result: Record<string, unknown> = {}

  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      if (isObject(value) && isObject(result[key])) {
        result[key] = deepMerge(result[key] as object, value)
      } else if (value !== undefined) {
        result[key] = value
      }
    }
  }

  return result as T
}
