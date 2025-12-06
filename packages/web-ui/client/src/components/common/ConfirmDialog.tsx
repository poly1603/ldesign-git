import { useEffect, useRef } from 'react'
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  loading = false
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !loading) onConfirm()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, onConfirm, loading])

  if (!open) return null

  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
    info: <Info className="w-6 h-6 text-blue-400" />
  }

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-500 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className="flex-shrink-0 p-2 rounded-full bg-gray-700">
            {icons[type]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-gray-400">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 ${buttonColors[type]}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                处理中...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// 用于创建简单的确认钩子
import { useState, useCallback } from 'react'

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    message: string
    type: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {}
  })

  const confirm = useCallback((options: {
    title: string
    message: string
    type?: 'danger' | 'warning' | 'info'
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        onConfirm: () => {
          setState(s => ({ ...s, open: false }))
          resolve(true)
        }
      })
    })
  }, [])

  const close = useCallback(() => {
    setState(s => ({ ...s, open: false }))
  }, [])

  const ConfirmDialogComponent = useCallback(() => (
    <ConfirmDialog
      open={state.open}
      onClose={close}
      onConfirm={state.onConfirm}
      title={state.title}
      message={state.message}
      type={state.type}
    />
  ), [state, close])

  return { confirm, close, ConfirmDialog: ConfirmDialogComponent }
}
