import { useState, useEffect, useCallback } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('forge_theme')
    return saved === 'dark'
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('forge_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('forge_theme', 'light')
    }
  }, [dark])

  const toggle = useCallback(() => setDark(d => !d), [])

  return { dark, toggle }
}
