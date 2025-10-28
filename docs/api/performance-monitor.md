# PerformanceMonitor

性能监控工具，用于监控和优化 Git 操作的性能。

## 导入

```typescript
import { PerformanceMonitor } from '@ldesign/git'
```

## 构造函数

```typescript
new PerformanceMonitor(repoPath: string, options?: PerformanceMonitorOptions)
```

### 参数

- `repoPath` - Git 仓库路径
- `options` - 可选配置项
  - `samplingInterval` - 采样间隔（毫秒），默认 100
  - `enableMemoryTracking` - 是否启用内存追踪，默认 true
  - `enableDiskTracking` - 是否启用磁盘追踪，默认 true
  - `thresholds` - 性能阈值配置

### 示例

```typescript
const monitor = new PerformanceMonitor('/path/to/repo', {
  samplingInterval: 50,
  enableMemoryTracking: true,
  thresholds: {
    warningTime: 1000, // 操作超过 1 秒警告
    criticalTime: 5000 // 操作超过 5 秒严重警告
  }
})
```

## 方法

### start()

开始监控 Git 操作。

```typescript
await monitor.start()
```

**返回值：** `Promise<void>`

**示例：**

```typescript
const monitor = new PerformanceMonitor('/path/to/repo')
await monitor.start()

// 执行 Git 操作
// ...

await monitor.stop()
```

---

### stop()

停止监控。

```typescript
await monitor.stop()
```

**返回值：** `Promise<void>`

---

### getReport()

获取性能报告。

```typescript
await monitor.getReport(options?: ReportOptions)
```

**参数：**
- `options` - 报告选项
  - `format` - 报告格式：'json' | 'text' | 'html'，默认 'json'
  - `includeDetails` - 是否包含详细信息，默认 true

**返回值：** `Promise<PerformanceReport>`

**报告结构：**

```typescript
interface PerformanceReport {
  totalOperations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  slowestOperation: {
    name: string
    duration: number
    timestamp: Date
  }
  fastestOperation: {
    name: string
    duration: number
    timestamp: Date
  }
  operations: OperationMetric[]
  memoryUsage?: MemoryMetrics
  diskUsage?: DiskMetrics
}
```

**示例：**

```typescript
const report = await monitor.getReport({ format: 'json' })

console.log(`Total operations: ${report.totalOperations}`)
console.log(`Average time: ${report.averageTime}ms`)
console.log(`Slowest: ${report.slowestOperation.name} (${report.slowestOperation.duration}ms)`)

// 按耗时排序
const sortedOps = report.operations.sort((a, b) => b.duration - a.duration)
console.log('Top 5 slowest operations:')
sortedOps.slice(0, 5).forEach((op, i) => {
  console.log(`${i + 1}. ${op.name}: ${op.duration}ms`)
})
```

---

### analyzeBottlenecks()

分析性能瓶颈。

```typescript
await monitor.analyzeBottlenecks()
```

**返回值：** `Promise<Bottleneck[]>`

**Bottleneck 结构：**

```typescript
interface Bottleneck {
  operation: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  suggestion: string
  metrics: {
    averageTime: number
    callCount: number
    totalTime: number
  }
}
```

**示例：**

```typescript
const bottlenecks = await monitor.analyzeBottlenecks()

bottlenecks.forEach(b => {
  console.log(`[${b.severity.toUpperCase()}] ${b.operation}`)
  console.log(`  Reason: ${b.reason}`)
  console.log(`  Suggestion: ${b.suggestion}`)
  console.log(`  Avg time: ${b.metrics.averageTime}ms`)
})
```

---

### optimizeRepository()

优化仓库性能。

```typescript
await monitor.optimizeRepository(options?: OptimizeOptions)
```

**参数：**
- `options` - 优化选项
  - `gc` - 是否运行垃圾回收，默认 true
  - `prune` - 是否清理不需要的对象，默认 true
  - `repack` - 是否重新打包对象，默认 true
  - `aggressive` - 是否使用积极优化，默认 false

**返回值：** `Promise<OptimizeResult>`

**示例：**

```typescript
console.log('Optimizing repository...')

const result = await monitor.optimizeRepository({
  gc: true,
  prune: true,
  repack: true,
  aggressive: false
})

console.log(`Optimization complete!`)
console.log(`Space saved: ${result.spaceSaved} MB`)
console.log(`Objects pruned: ${result.objectsPruned}`)
console.log(`Time taken: ${result.timeTaken}ms`)
```

---

### getMetrics()

获取实时性能指标。

```typescript
monitor.getMetrics()
```

**返回值：** `PerformanceMetrics`

**示例：**

```typescript
const metrics = monitor.getMetrics()

console.log('Current metrics:')
console.log(`  CPU usage: ${metrics.cpu}%`)
console.log(`  Memory: ${metrics.memory.used}/${metrics.memory.total} MB`)
console.log(`  Disk I/O: ${metrics.diskIO.read + metrics.diskIO.write} ops/s`)
```

---

### track()

手动追踪一个操作的性能。

```typescript
await monitor.track<T>(operationName: string, operation: () => Promise<T>)
```

**参数：**
- `operationName` - 操作名称
- `operation` - 要追踪的异步操作

**返回值：** `Promise<T>`

**示例：**

```typescript
const monitor = new PerformanceMonitor('/path/to/repo')
await monitor.start()

// 追踪自定义操作
const result = await monitor.track('custom-operation', async () => {
  // 执行一些操作
  return await someAsyncOperation()
})

const report = await monitor.getReport()
console.log(report.operations.find(op => op.name === 'custom-operation'))
```

---

### clear()

清除所有监控数据。

```typescript
monitor.clear()
```

**返回值：** `void`

**示例：**

```typescript
// 清除之前的监控数据
monitor.clear()

// 开始新的监控周期
await monitor.start()
```

## 类型定义

### PerformanceMonitorOptions

```typescript
interface PerformanceMonitorOptions {
  samplingInterval?: number
  enableMemoryTracking?: boolean
  enableDiskTracking?: boolean
  thresholds?: {
    warningTime?: number
    criticalTime?: number
  }
}
```

### PerformanceReport

```typescript
interface PerformanceReport {
  totalOperations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  slowestOperation: OperationSummary
  fastestOperation: OperationSummary
  operations: OperationMetric[]
  memoryUsage?: MemoryMetrics
  diskUsage?: DiskMetrics
}
```

### OperationMetric

```typescript
interface OperationMetric {
  name: string
  duration: number
  timestamp: Date
  success: boolean
  error?: string
  metadata?: Record<string, any>
}
```

## 完整示例

### 监控和优化工作流

```typescript
import { PerformanceMonitor, GitManager } from '@ldesign/git'

async function monitorAndOptimize() {
  const monitor = new PerformanceMonitor('/path/to/repo', {
    samplingInterval: 100,
    thresholds: {
      warningTime: 1000,
      criticalTime: 5000
    }
  })
  
  const git = new GitManager('/path/to/repo')
  
  // 开始监控
  await monitor.start()
  
  try {
    // 执行一系列操作
    await git.fetch('origin')
    await git.pull('origin', 'main')
    await git.add('.')
    await git.commit('Update files')
    await git.push('origin', 'main')
    
    // 停止监控
    await monitor.stop()
    
    // 获取报告
    const report = await monitor.getReport()
    console.log('\\nPerformance Report:')
    console.log(`Total operations: ${report.totalOperations}`)
    console.log(`Average time: ${report.averageTime}ms`)
    
    // 分析瓶颈
    const bottlenecks = await monitor.analyzeBottlenecks()
    if (bottlenecks.length > 0) {
      console.log('\\nBottlenecks detected:')
      bottlenecks.forEach(b => {
        console.log(`- ${b.operation}: ${b.reason}`)
        console.log(`  Suggestion: ${b.suggestion}`)
      })
      
      // 优化仓库
      console.log('\\nOptimizing repository...')
      const result = await monitor.optimizeRepository()
      console.log(`Space saved: ${result.spaceSaved} MB`)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

monitorAndOptimize()
```

## 最佳实践

1. **在 CI/CD 中使用**：在持续集成流程中监控性能，及时发现性能退化

2. **定期优化**：定期运行 `optimizeRepository()` 保持仓库健康

3. **设置合理的阈值**：根据项目规模设置适当的性能阈值

4. **关注慢操作**：重点关注 `slowestOperation`，优先优化耗时最长的操作

5. **清理监控数据**：长期运行时定期调用 `clear()` 避免内存占用过多

## 相关链接

- [示例：性能优化](/examples/performance)
- [指南：性能监控](/guide/performance-monitor)
