# Changelog v0.4.0

## [0.4.0] - 2025-10-28

### ⚡ 性能与现代化

本版本专注于性能优化、大文件支持和现代 Monorepo 工作流。

### ✨ 新增功能

#### 核心管理器 (4个)

##### 1. PerformanceMonitor - 性能监控器 ⚡
**文件**: `src/core/performance-monitor.ts`

**功能**:
- 实时操作追踪 (`startTracking`, `track`, `trackSync`)
- 详细的性能统计 (`getOperationStats`, `getPerformanceReport`)
- 慢操作自动检测 (`getSlowOperations`)
- 失败操作追踪 (`getFailedOperations`)
- 性能数据导出 (`exportMetrics`)
- 自动日志记录
- 可配置的慢操作阈值

**使用示例**:
```typescript
const monitor = new PerformanceMonitor({
  slowThreshold: 1000,
  autoLog: true
})

// 追踪操作
await monitor.track('push', async () => {
  await git.push()
})

// 获取报告
const report = monitor.getPerformanceReport()
console.log(`平均耗时: ${report.averageDuration}ms`)
console.log(`成功率: ${(report.successfulOperations / report.totalOperations * 100).toFixed(2)}%`)
```

##### 2. LFSManager - Git LFS 管理器 🔒
**文件**: `src/core/lfs-manager.ts`

**功能**:
- LFS 安装检测和配置 (`isInstalled`, `install`, `uninstall`)
- 文件跟踪管理 (`track`, `untrack`, `listTracked`)
- LFS 对象操作 (`pull`, `push`, `fetch`, `prune`)
- 文件列表查询 (`listFiles`)
- 状态查询 (`getStatus`)
- 历史文件迁移 (`migrate`)

**使用示例**:
```typescript
const lfs = new LFSManager()

// 配置 LFS
await lfs.install()
await lfs.track('*.psd')
await lfs.track('videos/*.mp4')

// 管理对象
await lfs.pull()
await lfs.prune({ olderThan: '7d' })

// 查看状态
const status = await lfs.getStatus()
console.log('LFS 版本:', status.version)
console.log('跟踪的模式:', status.trackedPatterns)
```

##### 3. MonorepoManager - Monorepo 管理器 📦
**文件**: `src/core/monorepo-manager.ts`

**功能**:
- 自动包发现 (`discoverPackages`)
- 智能变更检测 (`detectChangedPackages`)
- 依赖影响分析 (`getAffectedPackages`)
- 版本管理 (`bumpVersion`)
- 依赖关系图 (`getDependencyGraph`)
- 发布顺序计算 (`getPublishOrder`)

**使用示例**:
```typescript
const monorepo = new MonorepoManager({
  packages: ['packages/*', 'apps/*']
})

// 检测变更
const changed = await monorepo.detectChangedPackages('main')

// 分析影响
const impact = await monorepo.getAffectedPackages(
  changed.map(p => p.name)
)

// 更新版本
await monorepo.bumpVersion(impact.allAffected, 'patch')

// 获取发布顺序
const order = await monorepo.getPublishOrder()
```

##### 4. ReflogManager - Reflog 管理器 🕐
**文件**: `src/advanced/reflog-manager.ts`

**功能**:
- Reflog 列表查询 (`list`)
- 详情查看 (`show`)
- 条目删除 (`delete`)
- 条目过期 (`expire`)
- 引用存在检查 (`exists`)

**使用示例**:
```typescript
const reflog = new ReflogManager()

// 查看历史
const entries = await reflog.list('HEAD', 20)

// 清理旧条目
await reflog.expire({ expireTime: '30.days.ago' })
```

### 📊 数据统计

**代码量**:
- 新增管理器: 4 个
- 新增代码: ~3000+ 行
- 新增接口: 50+ 个
- 新增方法: 120+ 个

**测试覆盖**:
- PerformanceMonitor: ✅ 基础功能测试
- LFSManager: ✅ 基础功能测试
- MonorepoManager: ✅ 基础功能测试
- ReflogManager: ✅ 基础功能测试

### 🎯 核心价值

#### 1. 性能优化 ⚡
- **实时监控**: 追踪每个 Git 操作的执行时间
- **瓶颈识别**: 自动标记慢操作（可配置阈值）
- **统计分析**: 详细的操作统计和成功率分析
- **数据导出**: 支持将性能数据导出为 JSON

#### 2. 大文件支持 🔒
- **完整集成**: 全面支持 Git LFS 所有操作
- **智能追踪**: 灵活的文件模式匹配
- **存储优化**: 自动清理和对象管理
- **无缝迁移**: 支持将历史文件迁移到 LFS

#### 3. Monorepo 支持 📦
- **智能检测**: 自动发现工作空间中的所有包
- **变更分析**: 精确检测哪些包发生了变更
- **影响评估**: 计算变更对其他包的影响
- **版本管理**: 自动化的版本号更新
- **发布顺序**: 基于依赖关系的智能排序

#### 4. 历史追踪 🕐
- **完整管理**: Reflog 的所有操作
- **历史恢复**: 轻松追踪和恢复历史状态
- **清理优化**: 灵活的过期策略
- **引用验证**: 检查引用是否存在

### 🔧 改进

- ✅ 完善的 TypeScript 类型定义
- ✅ 统一的错误处理
- ✅ 详细的 JSDoc 注释
- ✅ 完整的使用示例
- ✅ 模块化的代码结构

### 📚 文档更新

- ✅ 新增 `NEW_FEATURES_V04.md` - 详细的功能说明
- ✅ 新增 `examples/v04-new-features.ts` - 完整的使用示例
- ✅ 更新 `README.md` - 添加 v0.4.0 功能
- ✅ 更新 `package.json` - 版本号更新到 0.4.0
- ✅ 更新导出 - 所有新管理器已导出

### 🚀 使用场景

#### 场景 1: 性能优化
```typescript
const monitor = new PerformanceMonitor({ autoLog: true })
const git = new GitManager()

await monitor.track('fetch', async () => {
  await git.fetch()
})

const report = monitor.getPerformanceReport()
// 分析瓶颈，优化慢操作
```

#### 场景 2: 大文件管理
```typescript
const lfs = new LFSManager()

// 配置大文件追踪
await lfs.track('*.zip')
await lfs.track('*.psd')

// 定期清理
await lfs.prune({ olderThan: '7d' })
```

#### 场景 3: Monorepo 发布
```typescript
const monorepo = new MonorepoManager({
  packages: ['packages/*']
})

// 1. 检测变更
const changed = await monorepo.detectChangedPackages('main')

// 2. 分析影响
const impact = await monorepo.getAffectedPackages(
  changed.map(p => p.name)
)

// 3. 更新版本
await monorepo.bumpVersion(impact.allAffected, 'patch')

// 4. 按正确顺序发布
const order = await monorepo.getPublishOrder()
for (const pkg of order) {
  // 发布包...
}
```

#### 场景 4: 历史恢复
```typescript
const reflog = new ReflogManager()

// 查看最近的操作
const entries = await reflog.list('HEAD', 10)

// 恢复到特定状态
// git reset --hard HEAD@{5}
```

### ⚠️ 破坏性变更

无破坏性变更，完全向后兼容。

### 📦 依赖更新

无依赖变更。

### 🐛 Bug 修复

无重大 Bug 修复（新功能版本）。

### 🔜 下一步计划

#### Phase 2 完成 (2/3)
- ✅ ReflogManager
- 📝 BisectManager - 自动化二分查找
- 📝 BlameAnalyzer - 文件溯源分析

#### Phase 3 计划
- 📝 SignManager - GPG 签名支持
- 📝 AdvancedAnalytics - 高级代码分析
- 📝 NotesManager - Git Notes 管理

#### 补充功能
- 📝 AttributesManager - .gitattributes 管理
- 📝 ReferenceManager - Git 引用管理

### 🙏 致谢

感谢所有贡献者和使用者的支持！

---

**完整功能列表**: 参见 `NEW_FEATURES_V04.md`  
**使用示例**: 参见 `examples/v04-new-features.ts`  
**API 文档**: 参见 `API.md`

**版本**: v0.4.0  
**发布日期**: 2025-10-28  
**状态**: ✅ 稳定版
