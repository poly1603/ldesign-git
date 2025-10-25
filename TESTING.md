# @ldesign/git 测试指南

本文档介绍如何为 @ldesign/git 包编写和运行测试。

## 测试框架

我们使用 [Vitest](https://vitest.dev/) 作为测试框架，它提供：

- 快速的测试执行
- 与 Vite 生态系统集成
- Jest 兼容的 API
- 内置的 TypeScript 支持
- 优秀的错误报告

## 运行测试

### 运行所有测试

```bash
pnpm test
```

### 运行测试（单次）

```bash
pnpm test:run
```

### 运行特定测试文件

```bash
pnpm test errors
pnpm test logger
pnpm test cache
```

### 监听模式

```bash
pnpm test --watch
```

### 生成覆盖率报告

```bash
pnpm test --coverage
```

## 测试结构

测试文件位于各模块的 `__tests__` 目录中：

```
src/
├── errors/
│   ├── index.ts
│   └── __tests__/
│       └── errors.test.ts
├── logger/
│   ├── index.ts
│   └── __tests__/
│       └── logger.test.ts
├── cache/
│   ├── index.ts
│   └── __tests__/
│       └── cache.test.ts
└── core/
    ├── branch-manager.ts
    └── __tests__/
        └── branch-manager.test.ts
```

## 编写测试

### 基础测试结构

```typescript
import { describe, it, expect } from 'vitest'
import { MyClass } from '../index'

describe('MyClass', () => {
  it('should do something', () => {
    const instance = new MyClass()
    expect(instance.method()).toBe(expectedValue)
  })
})
```

### 使用 Mock

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('MyClass', () => {
  it('should call callback', () => {
    const callback = vi.fn()
    myFunction(callback)
    expect(callback).toHaveBeenCalled()
  })
})
```

### 异步测试

```typescript
describe('AsyncClass', () => {
  it('should handle async operations', async () => {
    const result = await myAsyncFunction()
    expect(result).toBe('success')
  })
})
```

### 测试错误处理

```typescript
describe('Error Handling', () => {
  it('should throw specific error', () => {
    expect(() => {
      dangerousFunction()
    }).toThrow(GitError)
  })

  it('should handle async errors', async () => {
    await expect(async () => {
      await asyncDangerousFunction()
    }).rejects.toThrow(GitError)
  })
})
```

## 测试最佳实践

### 1. 使用描述性的测试名称

```typescript
// ❌ 不好
it('test 1', () => { ... })

// ✅ 好
it('should create branch with valid name', () => { ... })
```

### 2. 每个测试只测试一件事

```typescript
// ❌ 不好 - 测试太多内容
it('should handle everything', () => {
  // 测试创建
  // 测试删除
  // 测试更新
})

// ✅ 好 - 分离测试
it('should create item', () => { ... })
it('should delete item', () => { ... })
it('should update item', () => { ... })
```

### 3. 使用 beforeEach/afterEach 进行设置和清理

```typescript
describe('MyClass', () => {
  let instance: MyClass

  beforeEach(() => {
    instance = new MyClass()
  })

  afterEach(() => {
    instance.cleanup()
  })

  it('should work', () => {
    expect(instance.method()).toBe(true)
  })
})
```

### 4. 测试边界情况

```typescript
describe('MyClass', () => {
  it('should handle empty input', () => { ... })
  it('should handle null input', () => { ... })
  it('should handle large input', () => { ... })
  it('should handle invalid input', () => { ... })
})
```

### 5. 使用类型安全的测试

```typescript
// ✅ 使用 TypeScript 类型
const result: ExpectedType = myFunction()
expect(result.property).toBe(value)
```

## 测试覆盖率

我们的目标是达到 80% 的测试覆盖率。

### 查看覆盖率

```bash
pnpm test --coverage
```

覆盖率报告将显示：

- **Statements**: 语句覆盖率
- **Branches**: 分支覆盖率
- **Functions**: 函数覆盖率
- **Lines**: 行覆盖率

### 覆盖率阈值

```javascript
// vitest.config.ts
export default {
  test: {
    coverage: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}
```

## 已实现的测试

### ✅ 错误处理系统测试

**文件**: `src/errors/__tests__/errors.test.ts`

测试覆盖：
- GitError 基类
- 所有错误子类（GitOperationError, GitConflictError 等）
- 类型守卫函数
- 错误转换工具

### ✅ 日志系统测试

**文件**: `src/logger/__tests__/logger.test.ts`

测试覆盖：
- 日志级别
- 日志记录
- 日志过滤
- 统计信息
- 子日志器

### ✅ 缓存系统测试

**文件**: `src/cache/__tests__/cache.test.ts`

测试覆盖：
- LRU 缓存逻辑
- TTL 过期
- 缓存统计
- getOrSet 模式

## 待添加的测试

### 核心管理器测试

- [ ] BranchManager
- [ ] TagManager
- [ ] StashManager
- [ ] RemoteManager
- [ ] DiffManager
- [ ] ConfigManager
- [ ] WorktreeManager
- [ ] MergeManager
- [ ] CommitAnalyzer

### 自动化测试

- [ ] SmartCommit
- [ ] WorkflowAutomation
- [ ] BatchOperations
- [ ] ChangelogGenerator

### 工具函数测试

- [ ] Validator
- [ ] Formatter

## 持续集成

测试应该在以下情况下运行：

1. **提交前** - 使用 Git hooks
2. **Pull Request** - CI/CD 流程
3. **发布前** - 确保所有测试通过

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm test --coverage
```

## 调试测试

### 使用 VS Code

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "--run"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 使用 console.log

```typescript
it('should debug test', () => {
  const result = myFunction()
  console.log('Result:', result)
  expect(result).toBe(expected)
})
```

## 贡献测试

如果你为项目贡献新功能，请确保：

1. ✅ 为新功能添加测试
2. ✅ 所有现有测试通过
3. ✅ 代码覆盖率不降低
4. ✅ 测试命名清晰
5. ✅ 包含边界情况测试

## 资源

- [Vitest 文档](https://vitest.dev/)
- [Vitest API](https://vitest.dev/api/)
- [测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**最后更新**: 2025-10-25  
**维护者**: LDesign Team


