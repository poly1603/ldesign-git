# @ldesign/git 快速参考

## 🚀 5 分钟快速上手

### 安装

```bash
pnpm add @ldesign/git        # 项目依赖
pnpm add -g @ldesign/git     # 全局安装 CLI
```

### 最常用命令

```bash
# 状态查看
ldesign-git status

# 智能提交
ldesign-git commit smart

# 分支操作
ldesign-git branch list
ldesign-git branch create feature/new -c
ldesign-git branch cleanup

# 标签操作
ldesign-git tag create v1.0.0 -a -m "Release 1.0.0"
ldesign-git tag push v1.0.0

# 工作流
ldesign-git workflow init git-flow
ldesign-git workflow feature start user-login
ldesign-git workflow feature finish user-login

# 分析
ldesign-git analyze commits
ldesign-git report -o report.md
```

## 📋 命令速查表

### 基础命令 (2)
| 命令 | 说明 |
|------|------|
| `status` | 查看状态 |
| `init` | 初始化仓库 |

### 分支管理 (7)
| 命令 | 说明 |
|------|------|
| `branch list` | 列出分支 |
| `branch create <name>` | 创建分支 |
| `branch delete <name>` | 删除分支 |
| `branch rename <old> <new>` | 重命名分支 |
| `branch compare <b1> <b2>` | 比较分支 |
| `branch cleanup` | 清理已合并分支 |
| `branch checkout <name>` | 切换分支 |

### 标签管理 (6)
| 命令 | 说明 |
|------|------|
| `tag list` | 列出标签 |
| `tag create <name>` | 创建标签 |
| `tag delete <name>` | 删除标签 |
| `tag push <name>` | 推送标签 |
| `tag info <name>` | 标签信息 |
| `tag latest` | 最新标签 |

### 智能提交 (3)
| 命令 | 说明 |
|------|------|
| `commit smart` | 智能提交 |
| `commit validate <msg>` | 验证提交 |
| `commit analyze` | 分析变更 |

### 工作流 (7)
| 命令 | 说明 |
|------|------|
| `workflow init [type]` | 初始化工作流 |
| `workflow feature start <name>` | 开始功能 |
| `workflow feature finish <name>` | 完成功能 |
| `workflow release start <ver>` | 开始发布 |
| `workflow release finish <ver>` | 完成发布 |
| `workflow hotfix start <name>` | 开始热修复 |
| `workflow hotfix finish <name>` | 完成热修复 |

### 分析 (4)
| 命令 | 说明 |
|------|------|
| `analyze commits` | 提交分析 |
| `analyze contributors` | 贡献者分析 |
| `analyze repository` | 仓库分析 |
| `report` | 生成报告 |

### 冲突解决 (4)
| 命令 | 说明 |
|------|------|
| `conflict list` | 列出冲突 |
| `conflict resolve` | 交互式解决 |
| `conflict abort` | 中止操作 |
| `conflict resolve-all` | 批量解决 |

### Hooks (7)
| 命令 | 说明 |
|------|------|
| `hooks list` | 列出 hooks |
| `hooks templates` | 可用模板 |
| `hooks install <template>` | 安装模板 |
| `hooks enable <type>` | 启用 hook |
| `hooks disable <type>` | 禁用 hook |
| `hooks show <type>` | 查看内容 |
| `hooks backup` | 备份 hooks |

**总计**: 40 个命令

## 💡 常用选项

| 选项 | 说明 |
|------|------|
| `-h, --help` | 显示帮助 |
| `-V, --version` | 显示版本 |
| `-f, --force` | 强制执行 |
| `-r, --remote` | 远程操作 |
| `-a, --all` | 全部/所有 |
| `-o, --output <file>` | 输出文件 |
| `--dry-run` | 预览模式 |

## 🎨 颜色和图标

| 颜色/图标 | 含义 |
|-----------|------|
| 🟢 绿色 ✓ | 成功 |
| 🔴 红色 ✗ | 错误 |
| 🟡 黄色 ⚠ | 警告 |
| 🔵 蓝色 ℹ | 信息 |
| M | 修改 |
| A | 新增 |
| D | 删除 |
| R | 重命名 |

## 📚 快速示例

### 完整的功能开发

```bash
# 1. 创建并切换分支
ldesign-git branch create feature/user-profile -c

# 2. 开发...

# 3. 智能提交
ldesign-git commit smart

# 4. 推送
git push -u origin feature/user-profile

# 5. 完成功能
ldesign-git workflow feature finish user-profile
```

### 版本发布

```bash
# 1. 开始发布
ldesign-git workflow release start 1.0.0

# 2. 更新版本文件...

# 3. 完成发布
ldesign-git workflow release finish 1.0.0
```

### 紧急修复

```bash
# 1. 开始热修复
ldesign-git workflow hotfix start critical-bug

# 2. 修复并提交...

# 3. 完成热修复
ldesign-git workflow hotfix finish critical-bug -v 1.0.1
```

### 仓库维护

```bash
# 清理分支
ldesign-git branch cleanup --dry-run
ldesign-git branch cleanup

# 分析仓库
ldesign-git analyze repository

# 生成报告
ldesign-git report -o monthly-report.md
```

## 🔗 相关资源

- 📖 [完整文档](./README.md)
- 🚀 [快速开始](./docs/getting-started.md)
- 💻 [CLI 使用指南](./docs/cli-usage.md)
- 🔄 [工作流指南](./docs/workflows-guide.md)
- ✨ [最佳实践](./docs/best-practices.md)
- 💡 [代码示例](./examples/)

## 📞 获取帮助

```bash
# 查看所有命令
ldesign-git --help

# 查看子命令帮助
ldesign-git branch --help
ldesign-git commit --help
ldesign-git workflow --help
```

---

**提示**: 收藏此页面作为日常参考！

