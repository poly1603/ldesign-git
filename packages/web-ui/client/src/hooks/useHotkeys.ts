import { useEffect, useCallback, useRef } from 'react'

type KeyModifiers = {
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
}

type HotkeyConfig = {
  key: string
  modifiers?: KeyModifiers
  action: () => void
  description?: string
  enabled?: boolean
}

// 解析快捷键字符串，如 "Ctrl+Shift+P"
function parseHotkey(hotkey: string): { key: string; modifiers: KeyModifiers } {
  const parts = hotkey.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const modifiers: KeyModifiers = {}

  parts.slice(0, -1).forEach(part => {
    switch (part) {
      case 'ctrl':
      case 'control':
        modifiers.ctrl = true
        break
      case 'alt':
        modifiers.alt = true
        break
      case 'shift':
        modifiers.shift = true
        break
      case 'meta':
      case 'cmd':
      case 'command':
        modifiers.meta = true
        break
    }
  })

  return { key, modifiers }
}

// 检查事件是否匹配快捷键
function matchesHotkey(event: KeyboardEvent, key: string, modifiers: KeyModifiers = {}): boolean {
  const eventKey = event.key.toLowerCase()
  
  // 处理特殊键
  const normalizedKey = key.toLowerCase()
  
  if (eventKey !== normalizedKey) return false
  if (modifiers.ctrl && !event.ctrlKey) return false
  if (modifiers.alt && !event.altKey) return false
  if (modifiers.shift && !event.shiftKey) return false
  if (modifiers.meta && !event.metaKey) return false

  // 确保没有多余的修饰键
  if (!modifiers.ctrl && event.ctrlKey) return false
  if (!modifiers.alt && event.altKey) return false
  if (!modifiers.shift && event.shiftKey) return false
  if (!modifiers.meta && event.metaKey) return false

  return true
}

// 单个快捷键钩子
export function useHotkey(
  hotkey: string,
  action: () => void,
  options: { enabled?: boolean; preventDefault?: boolean } = {}
) {
  const { enabled = true, preventDefault = true } = options
  const { key, modifiers } = parseHotkey(hotkey)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的快捷键
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (matchesHotkey(event, key, modifiers)) {
        if (preventDefault) event.preventDefault()
        action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, key, modifiers, action, preventDefault])
}

// 多快捷键钩子
export function useHotkeys(hotkeys: HotkeyConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的快捷键
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      for (const config of hotkeys) {
        if (config.enabled === false) continue

        const { key, modifiers } = parseHotkey(config.key)
        if (matchesHotkey(event, key, modifiers)) {
          event.preventDefault()
          config.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkeys])
}

// 序列快捷键钩子 (如 G -> B)
export function useSequenceHotkey(
  sequence: string[], // 如 ['g', 'b']
  action: () => void,
  options: { timeout?: number; enabled?: boolean } = {}
) {
  const { timeout = 1000, enabled = true } = options
  const keysPressed = useRef<string[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的快捷键
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // 忽略带修饰键的按键
      if (event.ctrlKey || event.altKey || event.metaKey) return

      const key = event.key.toLowerCase()
      keysPressed.current.push(key)

      // 清除之前的超时
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      // 检查是否匹配序列
      const currentSequence = keysPressed.current.slice(-sequence.length)
      if (currentSequence.length === sequence.length &&
          currentSequence.every((k, i) => k === sequence[i].toLowerCase())) {
        event.preventDefault()
        action()
        keysPressed.current = []
        return
      }

      // 设置超时重置
      timeoutRef.current = setTimeout(() => {
        keysPressed.current = []
      }, timeout)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [sequence, action, timeout, enabled])
}

// 快捷键帮助面板数据
export const defaultHotkeys = [
  { key: 'Ctrl+K', description: '打开命令面板' },
  { key: 'Ctrl+R', description: '刷新状态' },
  { key: 'Ctrl+Shift+P', description: '拉取 (Pull)' },
  { key: 'Ctrl+Shift+U', description: '推送 (Push)' },
  { key: 'Ctrl+Shift+F', description: '获取 (Fetch)' },
  { key: 'Ctrl+Shift+B', description: '新建分支' },
  { key: 'Ctrl+Shift+S', description: '代码搜索' },
  { key: 'Ctrl+,', description: '打开设置' },
  { key: 'G D', description: '跳转到概览' },
  { key: 'G C', description: '跳转到变更' },
  { key: 'G H', description: '跳转到提交历史' },
  { key: 'G B', description: '跳转到分支' },
  { key: 'G T', description: '跳转到标签' },
  { key: 'G S', description: '跳转到贮藏' },
  { key: 'G R', description: '跳转到远程仓库' },
  { key: '?', description: '显示快捷键帮助' },
]
