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

# 常用便捷命令
ldesign-git status                   # 查看状态
ldesign-git clone <url>              # 克隆仓库
ldesign-git pull                     # 拉取更新
ldesign-git push                     # 推送更改
ldesign-git checkout <branch>        # 切换分支
ldesign-git merge <branch>           # 合并分支

# 智能提交
ldesign-git commit smart

# 工作流管理
ldesign-git workflow init git-flow
ldesign-git workflow feature start my-feature
```

## ✨ 功能特性

### 便捷命令
```bash
ldesign-git clone <url> [path]       # 克隆仓库
ldesign-git pull [remote] [branch]   # 拉取远程更新
ldesign-git push [remote] [branch]   # 推送到远程
ldesign-git checkout <target>        # 切换分支/恢复文件
ldesign-git merge <branch>           # 合并分支
ldesign-git add [files...]           # 添加文件到暂存区
ldesign-git reset [target]           # 重置 HEAD
ldesign-git fetch [remote]           # 获取远程更新
```

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

### 子模块管理
```bash
ldesign-git submodule list           # 列出所有子模块
ldesign-git submodule add <url> <path>  # 添加子模块
ldesign-git submodule update         # 更新子模块
ldesign-git submodule remove <path>  # 删除子模块
ldesign-git submodule sync           # 同步子模块 URL
ldesign-git submodule foreach <cmd>  # 在所有子模块执行命令
```

### Git LFS 管理
```bash
ldesign-git lfs install              # 安装 Git LFS
ldesign-git lfs track <pattern>      # 跟踪文件类型
ldesign-git lfs untrack <pattern>    # 取消跟踪
ldesign-git lfs list-files           # 列出 LFS 文件
ldesign-git lfs pull                 # 拉取 LFS 文件
ldesign-git lfs push                 # 推送 LFS 文件
```

### 工作树管理
```bash
ldesign-git worktree list            # 列出工作树
ldesign-git worktree add <path> [branch]  # 添加工作树
ldesign-git worktree remove <path>   # 删除工作树
ldesign-git worktree move <old> <new>  # 移动工作树
ldesign-git worktree lock <path>     # 锁定工作树
```

### Monorepo 管理
```bash
ldesign-git monorepo list            # 列出包
ldesign-git monorepo changed         # 查看变更的包
ldesign-git monorepo deps <pkg>      # 分析依赖
```

### 二分查找 (Bisect)
```bash
ldesign-git bisect start <bad> <good>  # 开始二分查找
ldesign-git bisect good              # 标记为好
ldesign-git bisect bad               # 标记为坏
ldesign-git bisect skip              # 跳过当前提交
ldesign-git bisect reset             # 重置
ldesign-git bisect run <command>     # 自动运行测试
```

### 代码溯源 (Blame)
```bash
ldesign-git blame file <path>        # 分析文件每行来源
ldesign-git blame stats <path>       # 作者贡献统计
ldesign-git blame recent <path>      # 查找最近修改
ldesign-git blame report <path>      # 生成报告
```

### 引用日志 (Reflog)
```bash
ldesign-git reflog list [ref]        # 列出引用日志
ldesign-git reflog show <ref>        # 显示详情
ldesign-git reflog exists <ref>      # 检查引用是否存在
ldesign-git reflog expire            # 清理过期条目
```

### 备注管理 (Notes)
```bash
ldesign-git notes add <ref> <msg>    # 添加备注
ldesign-git notes show [ref]         # 显示备注
ldesign-git notes list               # 列出所有备注
ldesign-git notes remove <ref>       # 删除备注
ldesign-git notes append <ref> <msg> # 追加备注
```

## 🎨 CLI 特性

- **美化输出** - 彩色显示、表格格式化、进度指示器
- **交互式操作** - 确认提示、智能输入表单
- **用户体验** - 详细反馈、友好错误提示、批量操作支持
- **高级功能** - Bisect、Blame、Reflog、Notes 等

## 📝 License

MIT