import { useState, useEffect, useCallback } from 'react'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('forge_portal_key'))
  }, [])

  const login = useCallback((key: string) => {
    localStorage.setItem('forge_portal_key', key)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('forge_portal_key')
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout }
}
