import { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Theme = 'dark' | 'light' | 'system'
type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  accentColor: AccentColor
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  toggleTheme: () => void
}

// 主题色配置
export const ACCENT_COLORS: Record<AccentColor, { name: string; primary: string; hover: string; bg: string; rgb: string }> = {
  blue: { name: '蓝色', primary: '#3b82f6', hover: '#2563eb', bg: 'rgb(59 130 246 / 0.1)', rgb: '59 130 246' },
  green: { name: '绿色', primary: '#22c55e', hover: '#16a34a', bg: 'rgb(34 197 94 / 0.1)', rgb: '34 197 94' },
  purple: { name: '紫色', primary: '#a855f7', hover: '#9333ea', bg: 'rgb(168 85 247 / 0.1)', rgb: '168 85 247' },
  orange: { name: '橙色', primary: '#f97316', hover: '#ea580c', bg: 'rgb(249 115 22 / 0.1)', rgb: '249 115 22' },
  pink: { name: '粉色', primary: '#ec4899', hover: '#db2777', bg: 'rgb(236 72 153 / 0.1)', rgb: '236 72 153' },
  teal: { name: '青色', primary: '#14b8a6', hover: '#0d9488', bg: 'rgb(20 184 166 / 0.1)', rgb: '20 184 166' },
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as Theme) || 'dark'
  })

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('accentColor')
    return (saved as AccentColor) || 'blue'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')

  // 获取系统主题
  const getSystemTheme = useCallback((): 'dark' | 'light' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }, [])

  // 解析实际主题
  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme
    setResolvedTheme(resolved)

    // 更新 DOM - Tailwind darkMode: 'class' 只检查 dark class
    const root = document.documentElement
    if (resolved === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // 设置 CSS 变量
    const colors = ACCENT_COLORS[accentColor]
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-hover', colors.hover)
    root.style.setProperty('--color-primary-bg', colors.bg)
    root.style.setProperty('--color-primary-rgb', colors.rgb)
    
    // 更新 meta 标签
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', resolved === 'dark' ? '#111827' : '#ffffff')
    }
  }, [theme, accentColor, getSystemTheme])

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setResolvedTheme(getSystemTheme())
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, getSystemTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }, [])

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem('accentColor', color)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, accentColor, setTheme, setAccentColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 主题切换按钮组件
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-700 rounded-lg">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-2 rounded-md transition-colors ${
            theme === value 
              ? 'bg-gray-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}

// 简单的主题切换图标按钮
export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { toggleTheme, resolvedTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${className}`}
      title={resolvedTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-gray-400" />
      ) : (
        <Moon className="w-4 h-4 text-gray-600" />
      )}
    </button>
  )
}

// 主题色选择器
import { Check, Palette } from 'lucide-react'

export function AccentColorPicker() {
  const { accentColor, setAccentColor } = useTheme()
  const [open, setOpen] = useState(false)

  const colors: Array<{ value: keyof typeof ACCENT_COLORS; color: string }> = [
    { value: 'blue', color: '#3b82f6' },
    { value: 'green', color: '#22c55e' },
    { value: 'purple', color: '#a855f7' },
    { value: 'orange', color: '#f97316' },
    { value: 'pink', color: '#ec4899' },
    { value: 'teal', color: '#14b8a6' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
        title="主题色"
      >
        <Palette className="w-4 h-4" style={{ color: ACCENT_COLORS[accentColor].primary }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">主题色</div>
            <div className="grid grid-cols-3 gap-2">
              {colors.map(({ value, color }) => (
                <button
                  key={value}
                  onClick={() => {
                    setAccentColor(value)
                    setOpen(false)
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                  title={ACCENT_COLORS[value].name}
                >
                  {accentColor === value && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// 设置面板（主题 + 颜色）
export function ThemeSettings() {
  const { theme, setTheme, accentColor, setAccentColor, resolvedTheme } = useTheme()

  const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '系统', icon: Monitor },
  ]

  const colors: Array<{ value: keyof typeof ACCENT_COLORS; color: string }> = [
    { value: 'blue', color: '#3b82f6' },
    { value: 'green', color: '#22c55e' },
    { value: 'purple', color: '#a855f7' },
    { value: 'orange', color: '#f97316' },
    { value: 'pink', color: '#ec4899' },
    { value: 'teal', color: '#14b8a6' },
  ]

  return (
    <div className="space-y-4">
      {/* 主题模式 */}
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">外观</div>
        <div className="flex gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                theme === value
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 主题色 */}
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">主题色</div>
        <div className="flex gap-2">
          {colors.map(({ value, color }) => (
            <button
              key={value}
              onClick={() => setAccentColor(value)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                accentColor === value ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''
              }`}
              style={{ 
                backgroundColor: color,
                ['--tw-ring-color' as string]: accentColor === value ? color : undefined
              }}
              title={ACCENT_COLORS[value].name}
            >
              {accentColor === value && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
