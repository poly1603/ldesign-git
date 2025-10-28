# @ldesign/git 文档

这是 @ldesign/git 的官方文档，使用 VitePress 构建。

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev
```

文档将在 http://localhost:5173 启动。

### 构建文档

```bash
pnpm build
```

构建后的文档将输出到 `.vitepress/dist` 目录。

### 预览构建结果

```bash
pnpm preview
```

## 文档结构

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress 配置
├── guide/                 # 指南
│   ├── index.md          # 介绍
│   ├── getting-started.md # 快速开始
│   └── installation.md   # 安装指南
├── api/                   # API 文档
│   ├── index.md          # API 概览
│   └── performance-monitor.md # PerformanceMonitor API
├── examples/              # 示例
│   └── index.md          # 示例概览
├── changelog.md          # 更新日志
├── index.md              # 首页
└── package.json
```

## 贡献文档

欢迎贡献文档！请遵循以下步骤：

1. Fork 项目
2. 创建文档分支 (`git checkout -b docs/new-feature`)
3. 编写文档
4. 提交更改 (`git commit -m 'docs: Add new feature documentation'`)
5. 推送到分支 (`git push origin docs/new-feature`)
6. 创建 Pull Request

### 文档编写规范

- 使用清晰的标题层级
- 提供代码示例
- 保持内容简洁明了
- 使用中文编写
- 代码块指定语言类型

## 相关链接

- [VitePress 官方文档](https://vitepress.dev/)
- [@ldesign/git GitHub](https://github.com/your-org/ldesign-git)
- [贡献指南](../CONTRIBUTING.md)

## 许可证

MIT
