import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

/**
 * Compact light/dark toggle. Mirrors the LanguageSwitcher visual style so it
 * sits naturally next to it in headers.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded
                  text-sand-700 hover:text-sand-900 hover:bg-sand-100
                  dark:text-sand-200 dark:hover:text-white dark:hover:bg-sand-800 ${className}`}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
