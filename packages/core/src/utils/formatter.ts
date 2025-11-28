/**
 * 格式化 Git 相关数据
 */

/**
 * 格式化提交哈希（显示前7位）
 */
export function formatCommitHash(hash: string): string {
  return hash.substring(0, 7)
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN')
}


