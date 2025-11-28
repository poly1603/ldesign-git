import { describe, it, expect, vi } from 'vitest'
import { GitLogger, LogLevel, createLogger } from '../index'

describe('GitLogger', () => {
  it('should create logger with default config', () => {
    const logger = new GitLogger()
    expect(logger.isEnabled()).toBe(true)
    expect(logger.getLevel()).toBe(LogLevel.INFO)
  })

  it('should create logger with custom config', () => {
    const logger = new GitLogger({
      level: LogLevel.DEBUG,
      enabled: false
    })
    expect(logger.isEnabled()).toBe(false)
    expect(logger.getLevel()).toBe(LogLevel.DEBUG)
  })

  it('should log info messages', () => {
    const logger = new GitLogger({ level: LogLevel.INFO })
    logger.info('Test info message')

    const logs = logger.getLogs()
    expect(logs.length).toBe(1)
    expect(logs[0].level).toBe(LogLevel.INFO)
    expect(logs[0].message).toBe('Test info message')
  })

  it('should log debug messages when level is DEBUG', () => {
    const logger = new GitLogger({ level: LogLevel.DEBUG })
    logger.debug('Debug message', { context: 'test' })

    const logs = logger.getLogs()
    expect(logs.length).toBe(1)
    expect(logs[0].level).toBe(LogLevel.DEBUG)
    expect(logs[0].data).toEqual({ context: 'test' })
  })

  it('should not log debug messages when level is INFO', () => {
    const logger = new GitLogger({ level: LogLevel.INFO })
    logger.debug('Debug message')

    const logs = logger.getLogs()
    expect(logs.length).toBe(0)
  })

  it('should log warn messages', () => {
    const logger = new GitLogger()
    logger.warn('Warning message')

    const logs = logger.getLogs()
    expect(logs.length).toBe(1)
    expect(logs[0].level).toBe(LogLevel.WARN)
  })

  it('should log error messages with Error object', () => {
    const logger = new GitLogger()
    const error = new Error('Test error')
    logger.error('Error occurred', error)

    const logs = logger.getLogs()
    expect(logs.length).toBe(1)
    expect(logs[0].level).toBe(LogLevel.ERROR)
    expect(logs[0].error).toBe(error)
  })

  it('should respect disabled state', () => {
    const logger = new GitLogger({ enabled: false })
    logger.info('Test message')

    const logs = logger.getLogs()
    expect(logs.length).toBe(0)
  })

  it('should enable and disable logger', () => {
    const logger = new GitLogger()
    logger.disable()
    expect(logger.isEnabled()).toBe(false)

    logger.enable()
    expect(logger.isEnabled()).toBe(true)
  })

  it('should set log level', () => {
    const logger = new GitLogger({ level: LogLevel.INFO })
    expect(logger.getLevel()).toBe(LogLevel.INFO)

    logger.setLevel(LogLevel.ERROR)
    expect(logger.getLevel()).toBe(LogLevel.ERROR)
  })

  it('should clear logs', () => {
    const logger = new GitLogger()
    logger.info('Message 1')
    logger.info('Message 2')

    expect(logger.getLogs().length).toBe(2)

    logger.clearLogs()
    expect(logger.getLogs().length).toBe(0)
  })

  it('should get logs by level', () => {
    const logger = new GitLogger({ level: LogLevel.DEBUG })
    logger.debug('Debug')
    logger.info('Info')
    logger.warn('Warn')
    logger.error('Error')

    const errorLogs = logger.getLogsByLevel(LogLevel.ERROR)
    expect(errorLogs.length).toBe(1)
    expect(errorLogs[0].message).toBe('Error')
  })

  it('should export logs as JSON', () => {
    const logger = new GitLogger()
    logger.info('Test message')

    const json = logger.exportLogsAsJSON()
    const parsed = JSON.parse(json)

    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBe(1)
    expect(parsed[0].message).toBe('Test message')
  })

  it('should create child logger with prefix', () => {
    const handler = vi.fn()
    const logger = new GitLogger({ handler })
    const child = logger.createChild('Child')

    child.info('Test message')

    expect(handler).toHaveBeenCalled()
    const call = handler.mock.calls[0][0]
    expect(call.message).toContain('[Child]')
    expect(call.message).toContain('Test message')
  })

  it('should use custom handler', () => {
    const handler = vi.fn()
    const logger = new GitLogger({ handler })

    logger.info('Test')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].message).toBe('Test')
  })
})

describe('createLogger', () => {
  it('should create logger instance', () => {
    const logger = createLogger({ level: LogLevel.WARN })
    expect(logger).toBeInstanceOf(GitLogger)
    expect(logger.getLevel()).toBe(LogLevel.WARN)
  })
})


