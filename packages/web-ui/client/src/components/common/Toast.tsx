import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// Toast 类型
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message, duration: 3000 })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 5000 })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message, duration: 4000 })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message, duration: 3000 })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast, onClose: () => void }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(onClose, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, onClose])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  }

  const bgColors = {
    success: 'bg-green-900/90 border-green-700',
    error: 'bg-red-900/90 border-red-700',
    warning: 'bg-yellow-900/90 border-yellow-700',
    info: 'bg-blue-900/90 border-blue-700'
  }

  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-in ${bgColors[toast.type]}`}
      role="alert"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-300">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// 动画样式 - 需要添加到 index.css
// @keyframes slide-in {
//   from { transform: translateX(100%); opacity: 0; }
//   to { transform: translateX(0); opacity: 1; }
// }
// .animate-slide-in { animation: slide-in 0.3s ease-out; }
