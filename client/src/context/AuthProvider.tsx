import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authService, hasToken, setToken } from '../api'
import type { User } from '../api'
import type { LoginInput, SignupInput } from '../validation/auth.schema'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(hasToken())

  useEffect(() => {
    if (!hasToken()) return
    const restoreSession = async () => {
      try {
        setUser(await authService.me())
      } catch {
        setToken(null)
      } finally {
        setChecking(false)
      }
    }
    restoreSession()
  }, [])

  const login = useCallback(async ({ email, password }: LoginInput) => {
    const result = await authService.login(email, password)
    setToken(result.token)
    setUser(result.user)
  }, [])

  const signup = useCallback(async (data: SignupInput) => {
    const result = await authService.signup(data)
    setToken(result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, checking, login, signup, logout }),
    [user, checking, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
