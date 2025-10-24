# CLI 使用指南

完整的 @ldesign/git CLI 工具使用文档。

## 📋 目录

- [基础命令](#基础命令)
- [分支管理](#分支管理)
- [标签管理](#标签管理)
- [智能提交](#智能提交)
- [工作流管理](#工作流管理)
- [仓库分析](#仓库分析)
- [冲突解决](#冲突解决)
- [Hooks 管理](#hooks-管理)
- [全局选项](#全局选项)

## 基础命令

### status - 查看仓库状态

显示美化的仓库状态信息。

```bash
ldesign-git status
ldesign-git st  # 简写
```

**输出示例**:
```
✓ 仓库状态

Git 状态

  当前分支: main
  领先远程: 2 个提交

┌────────┬──────────────────┐
│ 状态   │ 文件             │
├────────┼──────────────────┤
│ M      │ src/index.ts     │
│ A      │ src/new-file.ts  │
└────────┴──────────────────┘
```

### init - 初始化仓库

初始化新的 Git 仓库。

```bash
ldesign-git init
```

## 分支管理

### branch list - 列出分支

列出所有本地分支。

```bash
ldesign-git branch list
ldesign-git branch ls  # 简写

# 选项
-r, --remote    # 只显示远程分支
-a, --all       # 显示所有分支（本地+远程）
```

**示例**:
```bash
# 列出所有本地分支
ldesign-git branch list

# 列出远程分支
ldesign-git branch list -r

# 列出所有分支
ldesign-git branch list -a
```

### branch create - 创建分支

创建新分支。

```bash
ldesign-git branch create <name>

# 选项
-s, --start-point <ref>  # 起始点（提交/分支/标签）
-c, --checkout           # 创建后立即切换
```

**示例**:
```bash
# 创建分支
ldesign-git branch create feature/new-feature

# 从指定提交创建
ldesign-git branch create bugfix/fix -s abc1234

# 创建并切换
ldesign-git branch create feature/login -c
```

### branch delete - 删除分支

删除本地或远程分支。

```bash
ldesign-git branch delete <name>
ldesign-git branch del <name>  # 简写

# 选项
-f, --force   # 强制删除（即使未合并）
-r, --remote  # 删除远程分支
```

**示例**:
```bash
# 删除本地分支
ldesign-git branch delete feature/old-feature

# 强制删除未合并的分支
ldesign-git branch delete feature/experimental -f

# 删除远程分支
ldesign-git branch delete feature/old-feature -r
```

### branch rename - 重命名分支

重命名分支。

```bash
ldesign-git branch rename <oldName> <newName>

# 选项
-f, --force  # 强制重命名
```

**示例**:
```bash
ldesign-git branch rename old-name new-name
ldesign-git branch rename typo-name correct-name -f
```

### branch compare - 比较分支

比较两个分支的差异。

```bash
ldesign-git branch compare <branch1> <branch2>
```

**示例**:
```bash
ldesign-git branch compare main feature/new-feature
```

**输出示例**:
```
main vs feature/new-feature

  领先: 5 个提交
  落后: 0 个提交

feature/new-feature 独有的提交：
  abc1234 feat: add new feature
  def5678 fix: fix bug
  ...
```

### branch cleanup - 清理已合并分支

清理已经合并到主分支的分支。

```bash
ldesign-git branch cleanup

# 选项
-t, --target <branch>  # 目标分支（默认: main）
--dry-run              # 只显示将要删除的分支
```

**示例**:
```bash
# 预览将要删除的分支
ldesign-git branch cleanup --dry-run

# 执行清理
ldesign-git branch cleanup

# 清理已合并到 develop 的分支
ldesign-git branch cleanup -t develop
```

### branch checkout - 切换分支

切换到指定分支。

```bash
ldesign-git branch checkout <name>
ldesign-git branch co <name>  # 简写

# 选项
-b, --create  # 如果分支不存在则创建
```

**示例**:
```bash
# 切换到已存在的分支
ldesign-git branch co feature/new-feature

# 创建并切换
ldesign-git branch co feature/new-feature -b
```

## 标签管理

### tag list - 列出标签

列出所有标签。

```bash
ldesign-git tag list
ldesign-git tag ls  # 简写

# 选项
-p, --pattern <pattern>  # 匹配模式（支持通配符）
-s, --sorted             # 按版本号排序
```

**示例**:
```bash
# 列出所有标签
ldesign-git tag list

# 按版本号排序
ldesign-git tag list -s

# 匹配特定模式
ldesign-git tag list -p "v1.*"
```

### tag create - 创建标签

创建新标签。

```bash
ldesign-git tag create <name>

# 选项
-a, --annotated         # 创建注释标签
-m, --message <message> # 标签消息
-r, --ref <ref>         # 引用（提交/分支）
-f, --force             # 强制创建
```

**示例**:
```bash
# 创建轻量级标签
ldesign-git tag create v1.0.0

# 创建注释标签
ldesign-git tag create v1.0.0 -a -m "Release 1.0.0"

# 在特定提交上创建标签
ldesign-git tag create v0.9.0 -r abc1234
```

### tag delete - 删除标签

删除标签。

```bash
ldesign-git tag delete <name>
ldesign-git tag del <name>  # 简写

# 选项
-r, --remote  # 删除远程标签
```

### tag push - 推送标签

推送标签到远程。

```bash
ldesign-git tag push <name>

# 选项
-r, --remote <remote>  # 远程名称（默认: origin）
-a, --all              # 推送所有标签
```

**示例**:
```bash
# 推送单个标签
ldesign-git tag push v1.0.0

# 推送所有标签
ldesign-git tag push --all
```

### tag info - 查看标签信息

查看标签的详细信息。

```bash
ldesign-git tag info <name>
```

### tag latest - 查看最新标签

查看最新的标签。

```bash
ldesign-git tag latest
```

## 智能提交

### commit smart - 智能提交

自动分析变更并生成规范的提交信息。

```bash
ldesign-git commit smart

# 选项
--no-interactive  # 非交互模式，使用自动建议
```

**交互式流程**:
1. 自动分析文件变更
2. 显示变更统计
3. 提供提交类型建议
4. 交互式输入提交信息
5. 自动提交

### commit validate - 验证提交信息

验证提交信息是否符合 Conventional Commits 规范。

```bash
ldesign-git commit validate <message>
```

**示例**:
```bash
ldesign-git commit validate "feat(user): add login feature"
ldesign-git commit validate "invalid message"
```

### commit analyze - 分析变更

分析当前的文件变更并给出提交建议。

```bash
ldesign-git commit analyze
```

**输出**:
- 文件变更统计
- 建议的提交类型
- 置信度评分
- 建议原因

## 工作流管理

### workflow init - 初始化工作流

初始化 Git Flow 或其他工作流。

```bash
ldesign-git workflow init [type]

# 类型: git-flow | github-flow | gitlab-flow
```

**示例**:
```bash
# 交互式选择
ldesign-git workflow init

# 直接指定
ldesign-git workflow init git-flow
```

### workflow feature - 功能分支管理

管理功能分支的生命周期。

```bash
# 开始新功能
ldesign-git workflow feature start <name>

# 选项
-b, --base <branch>  # 基础分支（默认: develop）
-p, --push           # 推送到远程

# 完成功能
ldesign-git workflow feature finish <name>

# 选项
--no-delete  # 不删除功能分支
```

**示例**:
```bash
# 开始新功能
ldesign-git workflow feature start user-authentication -p

# 完成功能
ldesign-git workflow feature finish user-authentication
```

### workflow release - 发布管理

管理版本发布流程。

```bash
# 开始发布
ldesign-git workflow release start <version>

# 完成发布
ldesign-git workflow release finish <version>

# 选项
--no-delete  # 不删除发布分支
--no-tag     # 不创建标签
```

### workflow hotfix - 热修复管理

管理紧急热修复。

```bash
# 开始热修复
ldesign-git workflow hotfix start <name>

# 完成热修复
ldesign-git workflow hotfix finish <name>

# 选项
-v, --version <version>  # 版本号
--no-delete              # 不删除热修复分支
--no-tag                 # 不创建标签
```

## 仓库分析

### analyze commits - 提交分析

分析提交历史。

```bash
ldesign-git analyze commits

# 选项
-n, --number <count>    # 分析的提交数量（默认: 1000）
--author <author>       # 只分析指定作者
```

### analyze contributors - 贡献者分析

分析贡献者排行。

```bash
ldesign-git analyze contributors

# 选项
-l, --limit <number>  # 显示贡献者数量（默认: 10）
```

### analyze repository - 仓库分析

分析仓库整体情况。

```bash
ldesign-git analyze repository
ldesign-git analyze repo  # 简写
```

### report - 生成报告

生成多格式的分析报告。

```bash
ldesign-git report

# 选项
-f, --format <format>  # 格式: markdown/json/csv/html（默认: markdown）
-o, --output <file>    # 输出文件路径
```

**示例**:
```bash
# 生成 Markdown 报告
ldesign-git report -f markdown -o report.md

# 生成 JSON 报告
ldesign-git report -f json -o data.json

# 生成 HTML 报告
ldesign-git report -f html -o report.html
```

## 冲突解决

### conflict list - 列出冲突

列出所有冲突文件。

```bash
ldesign-git conflict list
ldesign-git conflict ls  # 简写
```

### conflict resolve - 交互式解决

交互式解决冲突。

```bash
ldesign-git conflict resolve
```

**流程**:
1. 显示所有冲突文件
2. 逐个处理每个冲突
3. 选择解决策略（ours/theirs/manual/skip）
4. 自动标记为已解决
5. 询问是否继续操作

### conflict abort - 中止操作

中止当前的 merge/rebase/cherry-pick 操作。

```bash
ldesign-git conflict abort
```

### conflict resolve-all - 批量解决

批量解决所有冲突。

```bash
ldesign-git conflict resolve-all --ours
ldesign-git conflict resolve-all --theirs
```

### conflict report - 生成冲突报告

生成详细的冲突报告。

```bash
ldesign-git conflict report

# 选项
-o, --output <file>  # 输出文件路径
```

## Hooks 管理

### hooks list - 列出 hooks

列出已安装的 hooks。

```bash
ldesign-git hooks list
ldesign-git hooks ls  # 简写
```

### hooks templates - 列出模板

列出可用的 hook 模板。

```bash
ldesign-git hooks templates
```

**可用模板**:
- `commit-msg-validation` - 提交信息验证
- `pre-commit-lint` - 预提交代码检查
- `pre-push-test` - 推送前测试
- `prepare-commit-msg` - 自动添加分支名
- `full-workflow` - 完整工作流

### hooks install - 安装模板

从模板安装 hooks。

```bash
ldesign-git hooks install <template>
```

**示例**:
```bash
ldesign-git hooks install commit-msg-validation
ldesign-git hooks install full-workflow
```

### hooks enable/disable - 启用/禁用

启用或禁用特定的 hook。

```bash
ldesign-git hooks enable <type>
ldesign-git hooks disable <type>
```

**示例**:
```bash
ldesign-git hooks enable pre-commit
ldesign-git hooks disable pre-push
```

### hooks show - 查看内容

查看 hook 的脚本内容。

```bash
ldesign-git hooks show <type>
```

### hooks backup - 备份

备份现有的 hooks。

```bash
ldesign-git hooks backup
```

### hooks uninstall - 卸载

卸载特定 hook 或所有 hooks。

```bash
ldesign-git hooks uninstall <type>
ldesign-git hooks uninstall-all
```

## 全局选项

所有命令都支持以下全局选项：

```bash
-h, --help     # 显示帮助信息
-V, --version  # 显示版本号
```

## 💡 使用技巧

### 1. 使用别名

```bash
# status 别名
ldesign-git st

# branch list 别名
ldesign-git branch ls

# branch checkout 别名
ldesign-git branch co feature/new-feature

# tag list 别名
ldesign-git tag ls
```

### 2. 链式操作

虽然不能直接链式调用，但可以组合使用：

```bash
# 创建并切换分支
ldesign-git branch create feature/new -c

# 创建注释标签并推送
ldesign-git tag create v1.0.0 -a -m "Release 1.0.0"
ldesign-git tag push v1.0.0
```

### 3. Dry-run 模式

在执行破坏性操作前先预览：

```bash
# 预览将要删除的分支
ldesign-git branch cleanup --dry-run

# 确认无误后执行
ldesign-git branch cleanup
```

### 4. 交互式确认

删除操作会自动询问确认：

```bash
ldesign-git branch delete old-branch
# 会提示: 确定要删除分支 old-branch 吗？
```

### 5. 智能默认值

很多命令都提供了智能的默认值：

```bash
# 默认推送到 origin
ldesign-git tag push v1.0.0

# 默认基于 develop 分支
ldesign-git workflow feature start new-feature

# 默认分析 1000 个提交
ldesign-git analyze commits
```

## 🎨 输出说明

### 颜色含义

- 🟢 绿色 - 成功、新增
- 🔴 红色 - 错误、删除
- 🟡 黄色 - 警告、修改
- 🔵 蓝色 - 信息
- ⚪ 灰色 - 次要信息

### 图标说明

- ✓ - 成功
- ✗ - 失败
- ⚠ - 警告
- ℹ - 信息
- → - 箭头
- • - 列表项

### 状态标记

- `M` - 修改 (Modified)
- `A` - 新增 (Added)
- `D` - 删除 (Deleted)
- `R` - 重命名 (Renamed)

## 🔧 故障排除

### 命令未找到

如果提示命令未找到：

```bash
# 检查是否已全局安装
npm list -g @ldesign/git

# 或使用 npx 运行
npx @ldesign/git status
```

### 权限错误

某些操作可能需要权限：

```bash
# Windows 上可能需要管理员权限
# 以管理员身份运行终端

# Linux/Mac 上可能需要
sudo ldesign-git hooks install commit-msg-validation
```

### Git 仓库未初始化

如果提示不是 Git 仓库：

```bash
# 先初始化仓库
ldesign-git init

# 或在正确的目录运行命令
cd /path/to/your/git/repo
ldesign-git status
```

## 📖 更多资源

- [快速开始](./getting-started.md)
- [工作流指南](./workflows-guide.md)
- [API 参考](./api-reference.md)
- [最佳实践](./best-practices.md)
- [示例代码](../examples/)

## 💬 反馈

如有问题或建议，请通过以下方式联系：

- GitHub Issues
- Email
- 社区论坛

