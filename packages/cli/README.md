# @ldesign/git-cli

LDesign Git CLI 工具 - 功能强大的命令行界面

## 📦 安装

```bash
npm install -g @ldesign/git-cli
# 或
pnpm add -g @ldesign/git-cli
```

## 🚀 快速开始

```bash
# 查看帮助
ldesign-git --help

# 查看状态
ldesign-git status

# 分支管理
ldesign-git branch list
ldesign-git branch create feature/new-feature
ldesign-git branch checkout feature/new-feature

# 智能提交
ldesign-git commit smart

# 工作流管理
ldesign-git workflow init git-flow
ldesign-git workflow feature start my-feature
```

## ✨ 功能特性

### 分支管理
```bash
ldesign-git branch list              # 列出所有分支
ldesign-git branch create <name>     # 创建分支
ldesign-git branch delete <name>     # 删除分支
ldesign-git branch rename <old> <new>  # 重命名分支
ldesign-git branch compare <b1> <b2>   # 比较分支
ldesign-git branch cleanup           # 清理已合并分支
```

### 标签管理
```bash
ldesign-git tag list                 # 列出所有标签
ldesign-git tag create <name>        # 创建标签
ldesign-git tag delete <name>        # 删除标签
ldesign-git tag push <name>          # 推送标签
ldesign-git tag latest               # 获取最新标签
```

### 智能提交
```bash
ldesign-git commit smart             # 智能提交（交互式）
ldesign-git commit smart --no-interactive  # 自动模式
ldesign-git commit validate <msg>    # 验证提交信息
ldesign-git commit analyze           # 分析当前变更
```

### 工作流自动化
```bash
ldesign-git workflow init            # 初始化工作流
ldesign-git workflow feature start <name>   # 开始新功能
ldesign-git workflow feature finish <name>  # 完成功能
ldesign-git workflow release start <ver>    # 开始发布
ldesign-git workflow hotfix start <name>    # 开始热修复
```

### 仓库分析
```bash
ldesign-git analyze commits          # 提交分析
ldesign-git analyze contributors     # 贡献者分析
ldesign-git analyze repository       # 仓库分析
ldesign-git report -f markdown       # 生成报告
```

### 冲突解决
```bash
ldesign-git conflict list            # 列出冲突
ldesign-git conflict resolve         # 交互式解决
ldesign-git conflict resolve-all --ours   # 批量使用我们的版本
```

### Hooks 管理
```bash
ldesign-git hooks list               # 列出已安装的 hooks
ldesign-git hooks templates          # 查看可用模板
ldesign-git hooks install <template> # 安装模板
ldesign-git hooks enable <name>      # 启用 hook
```

## 🎨 CLI 特性

- **美化输出** - 彩色显示、表格格式化、进度指示器
- **交互式操作** - 确认提示、智能输入表单
- **用户体验** - 详细反馈、友好错误提示、批量操作支持

## 📝 License

MIT