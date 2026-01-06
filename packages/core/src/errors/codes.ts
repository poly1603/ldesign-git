/**
 * Git 错误码枚举
 * @module errors/codes
 */

/**
 * Git 错误码枚举
 *
 * 定义所有可能的 Git 操作错误码，便于错误处理和国际化
 */
export enum GitErrorCode {
  // ==================== 通用错误 ====================
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  /** 操作取消 */
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  /** 超时错误 */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** 权限不足 */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** 无效参数 */
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',

  // ==================== 仓库错误 ====================
  /** 仓库未找到 */
  REPOSITORY_NOT_FOUND = 'REPOSITORY_NOT_FOUND',
  /** 仓库已存在 */
  REPOSITORY_ALREADY_EXISTS = 'REPOSITORY_ALREADY_EXISTS',
  /** 不是 Git 仓库 */
  NOT_A_REPOSITORY = 'NOT_A_REPOSITORY',
  /** 仓库损坏 */
  REPOSITORY_CORRUPTED = 'REPOSITORY_CORRUPTED',
  /** 初始化失败 */
  INIT_FAILED = 'INIT_FAILED',
  /** 克隆失败 */
  CLONE_FAILED = 'CLONE_FAILED',

  // ==================== 分支错误 ====================
  /** 分支未找到 */
  BRANCH_NOT_FOUND = 'BRANCH_NOT_FOUND',
  /** 分支已存在 */
  BRANCH_ALREADY_EXISTS = 'BRANCH_ALREADY_EXISTS',
  /** 创建分支失败 */
  BRANCH_CREATE_FAILED = 'BRANCH_CREATE_FAILED',
  /** 删除分支失败 */
  BRANCH_DELETE_FAILED = 'BRANCH_DELETE_FAILED',
  /** 切换分支失败 */
  BRANCH_CHECKOUT_FAILED = 'BRANCH_CHECKOUT_FAILED',
  /** 重命名分支失败 */
  BRANCH_RENAME_FAILED = 'BRANCH_RENAME_FAILED',
  /** 分支名无效 */
  BRANCH_NAME_INVALID = 'BRANCH_NAME_INVALID',
  /** 无法删除当前分支 */
  CANNOT_DELETE_CURRENT_BRANCH = 'CANNOT_DELETE_CURRENT_BRANCH',

  // ==================== 提交错误 ====================
  /** 提交未找到 */
  COMMIT_NOT_FOUND = 'COMMIT_NOT_FOUND',
  /** 提交失败 */
  COMMIT_FAILED = 'COMMIT_FAILED',
  /** 没有可提交的更改 */
  NOTHING_TO_COMMIT = 'NOTHING_TO_COMMIT',
  /** 提交信息无效 */
  COMMIT_MESSAGE_INVALID = 'COMMIT_MESSAGE_INVALID',
  /** 提交哈希无效 */
  COMMIT_HASH_INVALID = 'COMMIT_HASH_INVALID',
  /** 修改提交失败 */
  COMMIT_AMEND_FAILED = 'COMMIT_AMEND_FAILED',

  // ==================== 合并错误 ====================
  /** 合并失败 */
  MERGE_FAILED = 'MERGE_FAILED',
  /** 存在冲突 */
  MERGE_CONFLICT = 'MERGE_CONFLICT',
  /** 快进合并失败 */
  MERGE_FF_FAILED = 'MERGE_FF_FAILED',
  /** 正在合并中 */
  MERGE_IN_PROGRESS = 'MERGE_IN_PROGRESS',
  /** 中止合并失败 */
  MERGE_ABORT_FAILED = 'MERGE_ABORT_FAILED',

  // ==================== 变基错误 ====================
  /** 变基失败 */
  REBASE_FAILED = 'REBASE_FAILED',
  /** 变基冲突 */
  REBASE_CONFLICT = 'REBASE_CONFLICT',
  /** 正在变基中 */
  REBASE_IN_PROGRESS = 'REBASE_IN_PROGRESS',
  /** 中止变基失败 */
  REBASE_ABORT_FAILED = 'REBASE_ABORT_FAILED',
  /** 继续变基失败 */
  REBASE_CONTINUE_FAILED = 'REBASE_CONTINUE_FAILED',

  // ==================== Cherry-pick 错误 ====================
  /** Cherry-pick 失败 */
  CHERRY_PICK_FAILED = 'CHERRY_PICK_FAILED',
  /** Cherry-pick 冲突 */
  CHERRY_PICK_CONFLICT = 'CHERRY_PICK_CONFLICT',
  /** 正在 Cherry-pick 中 */
  CHERRY_PICK_IN_PROGRESS = 'CHERRY_PICK_IN_PROGRESS',

  // ==================== 标签错误 ====================
  /** 标签未找到 */
  TAG_NOT_FOUND = 'TAG_NOT_FOUND',
  /** 标签已存在 */
  TAG_ALREADY_EXISTS = 'TAG_ALREADY_EXISTS',
  /** 创建标签失败 */
  TAG_CREATE_FAILED = 'TAG_CREATE_FAILED',
  /** 删除标签失败 */
  TAG_DELETE_FAILED = 'TAG_DELETE_FAILED',
  /** 标签名无效 */
  TAG_NAME_INVALID = 'TAG_NAME_INVALID',

  // ==================== 远程仓库错误 ====================
  /** 远程仓库未找到 */
  REMOTE_NOT_FOUND = 'REMOTE_NOT_FOUND',
  /** 远程仓库已存在 */
  REMOTE_ALREADY_EXISTS = 'REMOTE_ALREADY_EXISTS',
  /** 添加远程仓库失败 */
  REMOTE_ADD_FAILED = 'REMOTE_ADD_FAILED',
  /** 删除远程仓库失败 */
  REMOTE_REMOVE_FAILED = 'REMOTE_REMOVE_FAILED',
  /** 远程 URL 无效 */
  REMOTE_URL_INVALID = 'REMOTE_URL_INVALID',

  // ==================== 网络错误 ====================
  /** 推送失败 */
  PUSH_FAILED = 'PUSH_FAILED',
  /** 推送被拒绝 */
  PUSH_REJECTED = 'PUSH_REJECTED',
  /** 拉取失败 */
  PULL_FAILED = 'PULL_FAILED',
  /** 获取失败 */
  FETCH_FAILED = 'FETCH_FAILED',
  /** 网络连接失败 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 认证失败 */
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',

  // ==================== 暂存区错误 ====================
  /** Stash 未找到 */
  STASH_NOT_FOUND = 'STASH_NOT_FOUND',
  /** 创建 Stash 失败 */
  STASH_CREATE_FAILED = 'STASH_CREATE_FAILED',
  /** 应用 Stash 失败 */
  STASH_APPLY_FAILED = 'STASH_APPLY_FAILED',
  /** 弹出 Stash 失败 */
  STASH_POP_FAILED = 'STASH_POP_FAILED',
  /** 删除 Stash 失败 */
  STASH_DROP_FAILED = 'STASH_DROP_FAILED',
  /** Stash 冲突 */
  STASH_CONFLICT = 'STASH_CONFLICT',

  // ==================== 子模块错误 ====================
  /** 子模块未找到 */
  SUBMODULE_NOT_FOUND = 'SUBMODULE_NOT_FOUND',
  /** 添加子模块失败 */
  SUBMODULE_ADD_FAILED = 'SUBMODULE_ADD_FAILED',
  /** 更新子模块失败 */
  SUBMODULE_UPDATE_FAILED = 'SUBMODULE_UPDATE_FAILED',
  /** 初始化子模块失败 */
  SUBMODULE_INIT_FAILED = 'SUBMODULE_INIT_FAILED',
  /** 删除子模块失败 */
  SUBMODULE_REMOVE_FAILED = 'SUBMODULE_REMOVE_FAILED',

  // ==================== 配置错误 ====================
  /** 配置键未找到 */
  CONFIG_KEY_NOT_FOUND = 'CONFIG_KEY_NOT_FOUND',
  /** 配置值无效 */
  CONFIG_VALUE_INVALID = 'CONFIG_VALUE_INVALID',
  /** 设置配置失败 */
  CONFIG_SET_FAILED = 'CONFIG_SET_FAILED',
  /** 删除配置失败 */
  CONFIG_UNSET_FAILED = 'CONFIG_UNSET_FAILED',

  // ==================== Hooks 错误 ====================
  /** Hook 执行失败 */
  HOOK_FAILED = 'HOOK_FAILED',
  /** Hook 未找到 */
  HOOK_NOT_FOUND = 'HOOK_NOT_FOUND',
  /** Hook 安装失败 */
  HOOK_INSTALL_FAILED = 'HOOK_INSTALL_FAILED',
  /** Hook 被拒绝 */
  HOOK_REJECTED = 'HOOK_REJECTED',

  // ==================== LFS 错误 ====================
  /** LFS 未安装 */
  LFS_NOT_INSTALLED = 'LFS_NOT_INSTALLED',
  /** LFS 追踪失败 */
  LFS_TRACK_FAILED = 'LFS_TRACK_FAILED',
  /** LFS 拉取失败 */
  LFS_PULL_FAILED = 'LFS_PULL_FAILED',
  /** LFS 推送失败 */
  LFS_PUSH_FAILED = 'LFS_PUSH_FAILED',

  // ==================== Worktree 错误 ====================
  /** Worktree 未找到 */
  WORKTREE_NOT_FOUND = 'WORKTREE_NOT_FOUND',
  /** 添加 Worktree 失败 */
  WORKTREE_ADD_FAILED = 'WORKTREE_ADD_FAILED',
  /** 删除 Worktree 失败 */
  WORKTREE_REMOVE_FAILED = 'WORKTREE_REMOVE_FAILED',
  /** Worktree 已锁定 */
  WORKTREE_LOCKED = 'WORKTREE_LOCKED',

  // ==================== 重置/恢复错误 ====================
  /** 重置失败 */
  RESET_FAILED = 'RESET_FAILED',
  /** 恢复失败 */
  RESTORE_FAILED = 'RESTORE_FAILED',
  /** 回退失败 */
  REVERT_FAILED = 'REVERT_FAILED',
  /** 清理失败 */
  CLEAN_FAILED = 'CLEAN_FAILED',

  // ==================== 文件操作错误 ====================
  /** 文件未找到 */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  /** 添加文件失败 */
  FILE_ADD_FAILED = 'FILE_ADD_FAILED',
  /** 删除文件失败 */
  FILE_REMOVE_FAILED = 'FILE_REMOVE_FAILED',
  /** 文件已被忽略 */
  FILE_IGNORED = 'FILE_IGNORED',

  // ==================== Diff 错误 ====================
  /** 获取 Diff 失败 */
  DIFF_FAILED = 'DIFF_FAILED',
  /** 无差异 */
  NO_DIFF = 'NO_DIFF',

  // ==================== 日志/历史错误 ====================
  /** 获取日志失败 */
  LOG_FAILED = 'LOG_FAILED',
  /** Reflog 失败 */
  REFLOG_FAILED = 'REFLOG_FAILED',
  /** Blame 失败 */
  BLAME_FAILED = 'BLAME_FAILED',

  // ==================== 验证错误 ====================
  /** 验证失败 */
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  /** 格式错误 */
  FORMAT_ERROR = 'FORMAT_ERROR',

  // ==================== 缓存错误 ====================
  /** 缓存未命中 */
  CACHE_MISS = 'CACHE_MISS',
  /** 缓存写入失败 */
  CACHE_WRITE_FAILED = 'CACHE_WRITE_FAILED',
  /** 缓存读取失败 */
  CACHE_READ_FAILED = 'CACHE_READ_FAILED',

  // ==================== 操作错误 ====================
  /** 操作进行中 */
  OPERATION_IN_PROGRESS = 'OPERATION_IN_PROGRESS',
  /** 操作失败 */
  OPERATION_FAILED = 'OPERATION_FAILED',
  /** 操作不支持 */
  OPERATION_NOT_SUPPORTED = 'OPERATION_NOT_SUPPORTED'
}

/**
 * 错误码消息映射（中文）
 */
export const GitErrorMessages: Record<GitErrorCode, string> = {
  // 通用错误
  [GitErrorCode.UNKNOWN_ERROR]: '未知错误',
  [GitErrorCode.OPERATION_CANCELLED]: '操作已取消',
  [GitErrorCode.TIMEOUT_ERROR]: '操作超时',
  [GitErrorCode.PERMISSION_DENIED]: '权限不足',
  [GitErrorCode.INVALID_ARGUMENT]: '无效参数',

  // 仓库错误
  [GitErrorCode.REPOSITORY_NOT_FOUND]: '仓库未找到',
  [GitErrorCode.REPOSITORY_ALREADY_EXISTS]: '仓库已存在',
  [GitErrorCode.NOT_A_REPOSITORY]: '不是 Git 仓库',
  [GitErrorCode.REPOSITORY_CORRUPTED]: '仓库已损坏',
  [GitErrorCode.INIT_FAILED]: '初始化仓库失败',
  [GitErrorCode.CLONE_FAILED]: '克隆仓库失败',

  // 分支错误
  [GitErrorCode.BRANCH_NOT_FOUND]: '分支未找到',
  [GitErrorCode.BRANCH_ALREADY_EXISTS]: '分支已存在',
  [GitErrorCode.BRANCH_CREATE_FAILED]: '创建分支失败',
  [GitErrorCode.BRANCH_DELETE_FAILED]: '删除分支失败',
  [GitErrorCode.BRANCH_CHECKOUT_FAILED]: '切换分支失败',
  [GitErrorCode.BRANCH_RENAME_FAILED]: '重命名分支失败',
  [GitErrorCode.BRANCH_NAME_INVALID]: '分支名无效',
  [GitErrorCode.CANNOT_DELETE_CURRENT_BRANCH]: '无法删除当前分支',

  // 提交错误
  [GitErrorCode.COMMIT_NOT_FOUND]: '提交未找到',
  [GitErrorCode.COMMIT_FAILED]: '提交失败',
  [GitErrorCode.NOTHING_TO_COMMIT]: '没有可提交的更改',
  [GitErrorCode.COMMIT_MESSAGE_INVALID]: '提交信息无效',
  [GitErrorCode.COMMIT_HASH_INVALID]: '提交哈希无效',
  [GitErrorCode.COMMIT_AMEND_FAILED]: '修改提交失败',

  // 合并错误
  [GitErrorCode.MERGE_FAILED]: '合并失败',
  [GitErrorCode.MERGE_CONFLICT]: '存在合并冲突',
  [GitErrorCode.MERGE_FF_FAILED]: '快进合并失败',
  [GitErrorCode.MERGE_IN_PROGRESS]: '正在合并中',
  [GitErrorCode.MERGE_ABORT_FAILED]: '中止合并失败',

  // 变基错误
  [GitErrorCode.REBASE_FAILED]: '变基失败',
  [GitErrorCode.REBASE_CONFLICT]: '变基时发生冲突',
  [GitErrorCode.REBASE_IN_PROGRESS]: '正在变基中',
  [GitErrorCode.REBASE_ABORT_FAILED]: '中止变基失败',
  [GitErrorCode.REBASE_CONTINUE_FAILED]: '继续变基失败',

  // Cherry-pick 错误
  [GitErrorCode.CHERRY_PICK_FAILED]: 'Cherry-pick 失败',
  [GitErrorCode.CHERRY_PICK_CONFLICT]: 'Cherry-pick 时发生冲突',
  [GitErrorCode.CHERRY_PICK_IN_PROGRESS]: '正在 Cherry-pick 中',

  // 标签错误
  [GitErrorCode.TAG_NOT_FOUND]: '标签未找到',
  [GitErrorCode.TAG_ALREADY_EXISTS]: '标签已存在',
  [GitErrorCode.TAG_CREATE_FAILED]: '创建标签失败',
  [GitErrorCode.TAG_DELETE_FAILED]: '删除标签失败',
  [GitErrorCode.TAG_NAME_INVALID]: '标签名无效',

  // 远程仓库错误
  [GitErrorCode.REMOTE_NOT_FOUND]: '远程仓库未找到',
  [GitErrorCode.REMOTE_ALREADY_EXISTS]: '远程仓库已存在',
  [GitErrorCode.REMOTE_ADD_FAILED]: '添加远程仓库失败',
  [GitErrorCode.REMOTE_REMOVE_FAILED]: '删除远程仓库失败',
  [GitErrorCode.REMOTE_URL_INVALID]: '远程 URL 无效',

  // 网络错误
  [GitErrorCode.PUSH_FAILED]: '推送失败',
  [GitErrorCode.PUSH_REJECTED]: '推送被拒绝',
  [GitErrorCode.PULL_FAILED]: '拉取失败',
  [GitErrorCode.FETCH_FAILED]: '获取失败',
  [GitErrorCode.NETWORK_ERROR]: '网络连接失败',
  [GitErrorCode.AUTHENTICATION_FAILED]: '认证失败',

  // 暂存区错误
  [GitErrorCode.STASH_NOT_FOUND]: 'Stash 未找到',
  [GitErrorCode.STASH_CREATE_FAILED]: '创建 Stash 失败',
  [GitErrorCode.STASH_APPLY_FAILED]: '应用 Stash 失败',
  [GitErrorCode.STASH_POP_FAILED]: '弹出 Stash 失败',
  [GitErrorCode.STASH_DROP_FAILED]: '删除 Stash 失败',
  [GitErrorCode.STASH_CONFLICT]: '应用 Stash 时发生冲突',

  // 子模块错误
  [GitErrorCode.SUBMODULE_NOT_FOUND]: '子模块未找到',
  [GitErrorCode.SUBMODULE_ADD_FAILED]: '添加子模块失败',
  [GitErrorCode.SUBMODULE_UPDATE_FAILED]: '更新子模块失败',
  [GitErrorCode.SUBMODULE_INIT_FAILED]: '初始化子模块失败',
  [GitErrorCode.SUBMODULE_REMOVE_FAILED]: '删除子模块失败',

  // 配置错误
  [GitErrorCode.CONFIG_KEY_NOT_FOUND]: '配置键未找到',
  [GitErrorCode.CONFIG_VALUE_INVALID]: '配置值无效',
  [GitErrorCode.CONFIG_SET_FAILED]: '设置配置失败',
  [GitErrorCode.CONFIG_UNSET_FAILED]: '删除配置失败',

  // Hooks 错误
  [GitErrorCode.HOOK_FAILED]: 'Hook 执行失败',
  [GitErrorCode.HOOK_NOT_FOUND]: 'Hook 未找到',
  [GitErrorCode.HOOK_INSTALL_FAILED]: 'Hook 安装失败',
  [GitErrorCode.HOOK_REJECTED]: 'Hook 拒绝了操作',

  // LFS 错误
  [GitErrorCode.LFS_NOT_INSTALLED]: 'Git LFS 未安装',
  [GitErrorCode.LFS_TRACK_FAILED]: 'LFS 追踪失败',
  [GitErrorCode.LFS_PULL_FAILED]: 'LFS 拉取失败',
  [GitErrorCode.LFS_PUSH_FAILED]: 'LFS 推送失败',

  // Worktree 错误
  [GitErrorCode.WORKTREE_NOT_FOUND]: 'Worktree 未找到',
  [GitErrorCode.WORKTREE_ADD_FAILED]: '添加 Worktree 失败',
  [GitErrorCode.WORKTREE_REMOVE_FAILED]: '删除 Worktree 失败',
  [GitErrorCode.WORKTREE_LOCKED]: 'Worktree 已锁定',

  // 重置/恢复错误
  [GitErrorCode.RESET_FAILED]: '重置失败',
  [GitErrorCode.RESTORE_FAILED]: '恢复失败',
  [GitErrorCode.REVERT_FAILED]: '回退失败',
  [GitErrorCode.CLEAN_FAILED]: '清理失败',

  // 文件操作错误
  [GitErrorCode.FILE_NOT_FOUND]: '文件未找到',
  [GitErrorCode.FILE_ADD_FAILED]: '添加文件失败',
  [GitErrorCode.FILE_REMOVE_FAILED]: '删除文件失败',
  [GitErrorCode.FILE_IGNORED]: '文件已被忽略',

  // Diff 错误
  [GitErrorCode.DIFF_FAILED]: '获取差异失败',
  [GitErrorCode.NO_DIFF]: '无差异',

  // 日志/历史错误
  [GitErrorCode.LOG_FAILED]: '获取日志失败',
  [GitErrorCode.REFLOG_FAILED]: '获取 Reflog 失败',
  [GitErrorCode.BLAME_FAILED]: '获取 Blame 信息失败',

  // 验证错误
  [GitErrorCode.VALIDATION_FAILED]: '验证失败',
  [GitErrorCode.FORMAT_ERROR]: '格式错误',

  // 缓存错误
  [GitErrorCode.CACHE_MISS]: '缓存未命中',
  [GitErrorCode.CACHE_WRITE_FAILED]: '缓存写入失败',
  [GitErrorCode.CACHE_READ_FAILED]: '缓存读取失败',

  // 操作错误
  [GitErrorCode.OPERATION_IN_PROGRESS]: '操作进行中',
  [GitErrorCode.OPERATION_FAILED]: '操作失败',
  [GitErrorCode.OPERATION_NOT_SUPPORTED]: '不支持的操作'
}

/**
 * 获取错误消息
 *
 * @param code - 错误码
 * @returns 错误消息
 */
export function getErrorMessage(code: GitErrorCode): string {
  return GitErrorMessages[code] || '未知错误'
}

/**
 * 检查是否是有效的错误码
 *
 * @param code - 要检查的错误码
 * @returns 是否有效
 */
export function isValidErrorCode(code: unknown): code is GitErrorCode {
  return typeof code === 'string' && Object.values(GitErrorCode).includes(code as GitErrorCode)
}
