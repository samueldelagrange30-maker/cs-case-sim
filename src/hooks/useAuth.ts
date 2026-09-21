import { useCallback, useEffect, useState } from 'react'
import {
  loadSession,
  loginWithIdentifier,
  logoutSession,
  registerAccount,
  type AuthResult,
  type AuthUser,
} from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setUser(loadSession())
    setReady(true)
  }, [])

  const register = useCallback(
    (email: string, username: string, password: string): AuthResult => {
      const res = registerAccount(email, username, password)
      if (res.ok) setUser(res.user)
      return res
    },
    [],
  )

  const login = useCallback(
    (identifier: string, password: string): AuthResult => {
      const res = loginWithIdentifier(identifier, password)
      if (res.ok) setUser(res.user)
      return res
    },
    [],
  )

  const logout = useCallback(() => {
    logoutSession()
    setUser(null)
  }, [])

  return { user, ready, isLoggedIn: !!user, register, login, logout }
}
