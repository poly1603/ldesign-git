import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { defaultHotkeys } from '../../hooks/useHotkeys'

interface HotkeysHelpProps {
  open: boolean
  onClose: () => void
}

export default function HotkeysHelp({ open, onClose }: HotkeysHelpProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  // 分组快捷键
  const groups = {
    general: {
      label: '通用',
      keys: defaultHotkeys.filter(h => 
        h.key.includes('Ctrl+K') || h.key.includes('Ctrl+R') || h.key === '?' || h.key.includes('Ctrl+,')
      )
    },
    git: {
      label: 'Git 操作',
      keys: defaultHotkeys.filter(h => 
        h.key.includes('Ctrl+Shift+P') || h.key.includes('Ctrl+Shift+U') || h.key.includes('Ctrl+Shift+F')
      )
    },
    navigation: {
      label: '导航 (先按 G)',
      keys: defaultHotkeys.filter(h => h.key.startsWith('G '))
    },
    actions: {
      label: '操作',
      keys: defaultHotkeys.filter(h => 
        h.key.includes('Ctrl+Shift+B') || h.key.includes('Ctrl+Shift+S')
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">键盘快捷键</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groups).map(([key, group]) => (
              <div key={key}>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.keys.map((hotkey, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-900/50"
                    >
                      <span className="text-sm text-gray-300">{hotkey.description}</span>
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 font-mono">
                        {hotkey.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-300 mb-2">提示</h4>
            <ul className="text-sm text-blue-200/80 space-y-1">
              <li>• 序列快捷键（如 G B）需要在 1 秒内依次按下</li>
              <li>• 在输入框中时快捷键不会生效</li>
              <li>• 按 <kbd className="px-1 py-0.5 bg-blue-800 rounded text-xs">Ctrl+K</kbd> 可以打开命令面板搜索所有功能</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">
            按 <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">ESC</kbd> 关闭
          </p>
        </div>
      </div>
    </div>
  )
}
