import { createContext, useContext, useEffect, useState, useCallback } from 'react'

/**
 * Light / dark theme provider.
 *  - Persists choice in localStorage under `pfe.theme`
 *  - Falls back to OS preference (`prefers-color-scheme`) on first visit
 *  - Toggles the `dark` class on <html> so Tailwind's `dark:` variants kick in
 */
const ThemeContext = createContext({ theme: 'light', toggle: () => {}, setTheme: () => {} })

const STORAGE_KEY = 'pfe.theme'

function detectInitial() {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(detectInitial)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next) => {
    if (next === 'dark' || next === 'light') setThemeState(next)
  }, [])

  const toggle = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
