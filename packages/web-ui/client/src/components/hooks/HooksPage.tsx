import { useState, useEffect } from 'react'
import { gitApi } from '../../services/api'
import { FileCode, Save, RefreshCw, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'

interface Hook {
  name: string
  enabled: boolean
  content: string
}

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([])
  const [selectedHook, setSelectedHook] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchHooks()
  }, [])

  const fetchHooks = async () => {
    setLoading(true)
    try {
      const response = await gitApi.getHooks()
      if (response.data?.success) {
        setHooks(response.data.data || [])
      }
    } catch (error) {
      console.error('获取 Hooks 失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectHook = (name: string) => {
    setSelectedHook(name)
    const hook = hooks.find(h => h.name === name)
    setEditContent(hook?.content || getDefaultHookContent(name))
  }

  const handleToggle = async (name: string) => {
    const hook = hooks.find(h => h.name === name)
    if (!hook) return
    
    setSaving(true)
    try {
      await gitApi.saveHook(name, hook.content || getDefaultHookContent(name), !hook.enabled)
      await fetchHooks()
    } catch (error) {
      console.error('切换 Hook 失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!selectedHook) return
    const hook = hooks.find(h => h.name === selectedHook)
    if (!hook) return
    
    setSaving(true)
    try {
      await gitApi.saveHook(selectedHook, editContent, hook.enabled)
      await fetchHooks()
      alert('Hook 已保存')
    } catch (error) {
      console.error('保存 Hook 失败:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultHookContent = (name: string) => {
    const templates: Record<string, string> = {
      'pre-commit': `#!/bin/sh
# pre-commit hook - 提交前执行
# 常用于代码检查、格式化、单元测试等

# 示例 1: 运行 ESLint 检查
# npm run lint
# if [ $? -ne 0 ]; then
#   echo "❌ ESLint 检查失败，请修复后再提交"
#   exit 1
# fi

# 示例 2: 运行 TypeScript 类型检查
# npx tsc --noEmit
# if [ $? -ne 0 ]; then
#   echo "❌ TypeScript 类型检查失败"
#   exit 1
# fi

# 示例 3: 运行 Prettier 格式化检查
# npx prettier --check "src/**/*.{ts,tsx,js,jsx}"

# 示例 4: 运行单元测试
# npm test

echo "✅ pre-commit 检查通过"
exit 0
`,
      'prepare-commit-msg': `#!/bin/sh
# prepare-commit-msg hook - 准备提交信息时执行
# 参数: $1 = 提交信息文件, $2 = 提交类型, $3 = SHA1

COMMIT_MSG_FILE=$1
COMMIT_TYPE=$2

# 示例 1: 自动添加分支名称前缀
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ -n "$BRANCH_NAME" ]; then
  # 提取 feature/xxx 或 fix/xxx 中的编号
  ISSUE_ID=$(echo $BRANCH_NAME | grep -oE '[A-Z]+-[0-9]+' | head -1)
  if [ -n "$ISSUE_ID" ]; then
    # 检查是否已经包含 issue ID
    if ! grep -q "$ISSUE_ID" "$COMMIT_MSG_FILE"; then
      sed -i.bak "1s/^/[$ISSUE_ID] /" "$COMMIT_MSG_FILE"
    fi
  fi
fi

# 示例 2: 添加提交模板
# if [ "$COMMIT_TYPE" = "" ]; then
#   echo "\n# 请选择提交类型:" >> "$COMMIT_MSG_FILE"
#   echo "# feat: 新功能" >> "$COMMIT_MSG_FILE"
#   echo "# fix: 修复 bug" >> "$COMMIT_MSG_FILE"
#   echo "# docs: 文档更新" >> "$COMMIT_MSG_FILE"
# fi
`,
      'commit-msg': `#!/bin/sh
# commit-msg hook - 提交信息输入后执行
# 用于验证提交信息格式

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# 示例 1: 检查提交信息长度
MSG_LEN=$(echo -n "$COMMIT_MSG" | wc -c)
if [ $MSG_LEN -lt 10 ]; then
  echo "❌ 提交信息太短，至少需要 10 个字符"
  exit 1
fi

# 示例 2: 检查 Conventional Commits 格式
# PATTERN="^(feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?: .+$"
# if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
#   echo "❌ 提交信息格式不正确"
#   echo "格式: <type>(<scope>): <subject>"
#   echo "示例: feat(user): 添加用户登录功能"
#   exit 1
# fi

echo "✅ 提交信息检查通过"
exit 0
`,
      'post-commit': `#!/bin/sh
# post-commit hook - 提交完成后执行
# 用于通知、统计等

# 示例 1: 显示提交统计
echo "\n📊 提交统计:"
echo "今日提交: $(git log --since=midnight --oneline | wc -l) 次"
echo "本周提交: $(git log --since='1 week ago' --oneline | wc -l) 次"

# 示例 2: 发送通知
# curl -X POST -H 'Content-type: application/json' \\
#   --data '{"text":"新提交: '$(git log -1 --pretty=%s)'"}' \\
#   YOUR_WEBHOOK_URL

# 示例 3: 自动打标签
# COMMIT_COUNT=$(git rev-list --count HEAD)
# if [ $(($COMMIT_COUNT % 100)) -eq 0 ]; then
#   git tag -a "build-$COMMIT_COUNT" -m "Build $COMMIT_COUNT"
#   echo "🏷️ 已创建标签: build-$COMMIT_COUNT"
# fi
`,
      'pre-push': `#!/bin/sh
# pre-push hook - 推送前执行
# 用于推送前的最终检查

REMOTE=$1
URL=$2

# 示例 1: 运行所有测试
# echo "🧪 正在运行测试..."
# npm test
# if [ $? -ne 0 ]; then
#   echo "❌ 测试失败，推送已取消"
#   exit 1
# fi

# 示例 2: 检查是否推送到主分支
BRANCH=$(git symbolic-ref --short HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "⚠️ 注意: 正在推送到 $BRANCH 分支"
  # read -p "确认推送? (y/n) " -n 1 -r
  # if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  #   exit 1
  # fi
fi

# 示例 3: 检查提交大小
# MAX_SIZE=5242880  # 5MB
# for commit in $(git rev-parse @{u}..HEAD); do
#   size=$(git cat-file -s $commit)
#   if [ $size -gt $MAX_SIZE ]; then
#     echo "❌ 提交 $commit 太大 ($size bytes)"
#     exit 1
#   fi
# done

echo "✅ pre-push 检查通过"
exit 0
`,
      'pre-rebase': `#!/bin/sh
# pre-rebase hook - 变基前执行
# $1 = 上游分支, $2 = 当前分支 (可能为空)

UPSTREAM=$1
BRANCH=$2

# 示例 1: 禁止在 main 分支上 rebase
if [ -z "$BRANCH" ]; then
  BRANCH=$(git symbolic-ref --short HEAD)
fi

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "❌ 禁止在 $BRANCH 分支上进行 rebase"
  exit 1
fi

# 示例 2: 检查工作区是否干净
if ! git diff-index --quiet HEAD --; then
  echo "❌ 工作区有未提交的更改，请先提交或贮藏"
  exit 1
fi

echo "✅ pre-rebase 检查通过"
exit 0
`,
      'post-checkout': `#!/bin/sh
# post-checkout hook - 检出后执行
# $1 = 旧 HEAD, $2 = 新 HEAD, $3 = 是否切换分支 (1=是, 0=否)

OLD_HEAD=$1
NEW_HEAD=$2
BRANCH_CHECKOUT=$3

# 示例 1: 切换分支时自动安装依赖
if [ "$BRANCH_CHECKOUT" = "1" ]; then
  if [ -f "package.json" ]; then
    if [ -f "package-lock.json" ]; then
      # 检查 package-lock.json 是否有变化
      if git diff --name-only "$OLD_HEAD" "$NEW_HEAD" | grep -q "package-lock.json"; then
        echo "📦 检测到依赖变化，正在安装..."
        npm install
      fi
    fi
  fi
fi

# 示例 2: 显示分支信息
if [ "$BRANCH_CHECKOUT" = "1" ]; then
  BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
  echo "\n🔀 已切换到分支: $BRANCH"
  echo "最近提交: $(git log -1 --pretty='%s')"
fi
`,
      'post-merge': `#!/bin/sh
# post-merge hook - 合并后执行
# $1 = squash 合并标志 (0 或 1)

SQUASH=$1

# 示例 1: 检测依赖变化并自动安装
CHANGED_FILES=$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)

if echo "$CHANGED_FILES" | grep -q "package-lock.json"; then
  echo "📦 package-lock.json 已变化，正在安装依赖..."
  npm install
fi

if echo "$CHANGED_FILES" | grep -q "requirements.txt"; then
  echo "🐍 requirements.txt 已变化，请运行: pip install -r requirements.txt"
fi

# 示例 2: 检测数据库迁移文件
if echo "$CHANGED_FILES" | grep -qE "migrations/|migrate/"; then
  echo "🗄️ 检测到数据库迁移文件变化，请运行迁移命令"
fi

# 示例 3: 显示合并摘要
echo "\n✅ 合并完成"
echo "变更文件数: $(echo \"$CHANGED_FILES\" | wc -l)"
`
    }
    return templates[name] || `#!/bin/sh
# ${name} hook
# 这个 hook 在 ${getHookDescription(name)} 时执行

# 在下面添加你的命令
exit 0
`
  }

  const getHookDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'pre-commit': '提交前',
      'prepare-commit-msg': '准备提交信息时',
      'commit-msg': '提交信息输入后',
      'post-commit': '提交完成后',
      'pre-push': '推送前',
      'pre-rebase': '变基前',
      'post-checkout': '检出后',
      'post-merge': '合并后'
    }
    return descriptions[name] || name
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* 左侧 Hook 列表 */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-transparent">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Git Hooks</h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {hooks.map(hook => (
            <div
              key={hook.name}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                selectedHook === hook.name ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-l-primary' : ''
              }`}
              onClick={() => handleSelectHook(hook.name)}
            >
              <div>
                <p className="text-sm text-gray-900 dark:text-white font-medium">{hook.name}</p>
                <p className="text-xs text-gray-500">{getHookDescription(hook.name)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(hook.name) }}
                disabled={saving}
                className="text-gray-400 hover:text-white"
              >
                {hook.enabled ? (
                  <ToggleRight className="w-6 h-6 text-green-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧编辑器 */}
      <div className="flex-1 flex flex-col">
        {selectedHook ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 dark:text-white font-medium">{selectedHook}</span>
                {hooks.find(h => h.name === selectedHook)?.enabled && (
                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">已启用</span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 text-white rounded-lg text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '保存中...' : '保存'}</span>
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 w-full p-4 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-300 font-mono text-sm resize-none focus:outline-none border-none"
              placeholder="输入 Hook 脚本..."
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p>选择一个 Hook 进行编辑</p>
          </div>
        )}
      </div>
    </div>
  )
}
