import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark' | 'custom'

export interface ThemeColors {
  primary: string          // e.g. '#A561DA'
  gradientStart: string    // e.g. '#A561DA'
  gradientEnd: string      // e.g. '#5B8CFF'
  bg: string
  card: string
  textPrimary: string
  textSecondary: string
  border: string
}

export interface Theme {
  mode: ThemeMode
  colors: ThemeColors
}

const PRESETS: Record<Exclude<ThemeMode, 'custom'>, ThemeColors> = {
  light: {
    primary: '#A561DA',
    gradientStart: '#A561DA',
    gradientEnd: '#5B8CFF',
    bg: '#F7F8FA',
    card: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  dark: {
    primary: '#B87DE3',
    gradientStart: '#9B51CF',
    gradientEnd: '#4A7BF0',
    bg: '#0F172A',
    card: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
  },
}

const DEFAULT_CUSTOM: ThemeColors = {
  primary: '#A561DA',
  gradientStart: '#A561DA',
  gradientEnd: '#5B8CFF',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
}

interface ThemeContextValue {
  theme: Theme
  setMode: (mode: ThemeMode) => void
  setCustomColors: (colors: Partial<ThemeColors>) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

function applyTheme(theme: Theme) {
  const colors = theme.mode === 'custom' ? theme.colors : PRESETS[theme.mode]
  const root = document.documentElement

  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-gradient-start', colors.gradientStart)
  root.style.setProperty('--color-gradient-end', colors.gradientEnd)
  root.style.setProperty('--color-bg', colors.bg)
  root.style.setProperty('--color-card', colors.card)
  root.style.setProperty('--color-text-primary', colors.textPrimary)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-border', colors.border)

  // Gradient shorthand
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`
  )

  // Dark mode class for Tailwind dark: prefix support
  if (theme.mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function loadSaved(): Theme {
  try {
    const raw = localStorage.getItem('pos-theme')
    if (raw) return JSON.parse(raw) as Theme
  } catch {}
  return { mode: 'light', colors: PRESETS.light }
}

function save(theme: Theme) {
  localStorage.setItem('pos-theme', JSON.stringify(theme))
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => loadSaved())

  useEffect(() => {
    applyTheme(theme)
    save(theme)
  }, [theme])

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme(prev => {
      const colors = mode === 'custom'
        ? prev.colors  // keep last custom colors
        : PRESETS[mode]
      return { mode, colors }
    })
  }, [])

  const setCustomColors = useCallback((partial: Partial<ThemeColors>) => {
    setTheme(prev => ({
      mode: 'custom',
      colors: { ...prev.colors, ...partial },
    }))
  }, [])

  return (
    <ThemeContext.Provider value={{
      theme,
      setMode,
      setCustomColors,
      isDark: theme.mode === 'dark',
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export { PRESETS, DEFAULT_CUSTOM }
