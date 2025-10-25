import { describe, it, expect } from 'vitest'
import {
  GitError,
  GitOperationError,
  GitConflictError,
  GitValidationError,
  GitNetworkError,
  isGitError,
  isGitConflictError,
  isGitNetworkError,
  toGitError
} from '../index'

describe('GitError', () => {
  it('should create GitError with message', () => {
    const error = new GitError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('GIT_ERROR')
    expect(error.name).toBe('GitError')
  })

  it('should create GitError with custom code', () => {
    const error = new GitError('Test error', 'CUSTOM_ERROR')
    expect(error.code).toBe('CUSTOM_ERROR')
  })

  it('should preserve original error', () => {
    const originalError = new Error('Original')
    const error = new GitError('Wrapped', 'GIT_ERROR', originalError)
    expect(error.originalError).toBe(originalError)
  })

  it('should include context', () => {
    const context = { file: 'test.ts', line: 42 }
    const error = new GitError('Test', 'GIT_ERROR', undefined, context)
    expect(error.context).toEqual(context)
  })

  it('should convert to JSON', () => {
    const error = new GitError('Test error', 'TEST_CODE')
    const json = error.toJSON()
    expect(json.name).toBe('GitError')
    expect(json.message).toBe('Test error')
    expect(json.code).toBe('TEST_CODE')
  })
})

describe('GitOperationError', () => {
  it('should create GitOperationError', () => {
    const error = new GitOperationError('commit', 'Commit failed')
    expect(error.message).toContain('commit')
    expect(error.message).toContain('Commit failed')
    expect(error.code).toBe('GIT_OPERATION_ERROR')
    expect(error.operation).toBe('commit')
  })
})

describe('GitConflictError', () => {
  it('should create GitConflictError', () => {
    const files = ['file1.ts', 'file2.ts']
    const error = new GitConflictError(files, 'merge')
    expect(error.conflictedFiles).toEqual(files)
    expect(error.conflictType).toBe('merge')
    expect(error.code).toBe('GIT_CONFLICT_ERROR')
  })

  it('should use custom message', () => {
    const error = new GitConflictError(['file.ts'], 'merge', 'Custom conflict message')
    expect(error.message).toBe('Custom conflict message')
  })
})

describe('GitValidationError', () => {
  it('should create GitValidationError', () => {
    const errors = ['Error 1', 'Error 2']
    const error = new GitValidationError('branchName', errors)
    expect(error.field).toBe('branchName')
    expect(error.errors).toEqual(errors)
    expect(error.code).toBe('GIT_VALIDATION_ERROR')
  })
})

describe('GitNetworkError', () => {
  it('should create GitNetworkError', () => {
    const error = new GitNetworkError('origin', 'push', 'Connection failed')
    expect(error.remote).toBe('origin')
    expect(error.operation).toBe('push')
    expect(error.message).toContain('origin')
    expect(error.message).toContain('push')
    expect(error.code).toBe('GIT_NETWORK_ERROR')
  })
})

describe('Type Guards', () => {
  it('should identify GitError', () => {
    const error = new GitError('Test')
    expect(isGitError(error)).toBe(true)
    expect(isGitError(new Error('Regular error'))).toBe(false)
    expect(isGitError('string')).toBe(false)
  })

  it('should identify GitConflictError', () => {
    const error = new GitConflictError(['file.ts'], 'merge')
    expect(isGitConflictError(error)).toBe(true)
    expect(isGitConflictError(new GitError('Test'))).toBe(false)
  })

  it('should identify GitNetworkError', () => {
    const error = new GitNetworkError('origin', 'push', 'Failed')
    expect(isGitNetworkError(error)).toBe(true)
    expect(isGitNetworkError(new GitError('Test'))).toBe(false)
  })
})

describe('Error Utilities', () => {
  it('should convert GitError to GitError', () => {
    const original = new GitError('Test')
    const converted = toGitError(original)
    expect(converted).toBe(original)
  })

  it('should convert Error to GitError', () => {
    const original = new Error('Test error')
    const converted = toGitError(original)
    expect(converted).toBeInstanceOf(GitError)
    expect(converted.message).toBe('Test error')
    expect(converted.originalError).toBe(original)
  })

  it('should convert string to GitError', () => {
    const converted = toGitError('String error')
    expect(converted).toBeInstanceOf(GitError)
    expect(converted.message).toBe('String error')
  })

  it('should convert unknown to GitError', () => {
    const converted = toGitError({ some: 'object' })
    expect(converted).toBeInstanceOf(GitError)
    expect(converted.message).toBe('未知错误')
  })
})


