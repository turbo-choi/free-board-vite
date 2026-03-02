import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { authApi, setUnauthorizedHandler } from '@/lib/api'
import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from '@/lib/auth'
import type { User } from '@/types/domain'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (payload: { email: string; password: string }) => Promise<void>
  signup: (payload: { email: string; name: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(getStoredUser())
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredToken()
    clearStoredUser()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    let cancelled = false

    async function verify() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const me = await authApi.me()
        if (cancelled) return
        setUser(me)
        setStoredUser(me)
      } catch {
        if (cancelled) return
        logout()
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [token, logout])

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const response = await authApi.login(payload)
    setToken(response.token)
    setUser(response.user)
    setStoredToken(response.token)
    setStoredUser(response.user)
  }, [])

  const signup = useCallback(async (payload: { email: string; name: string; password: string }) => {
    const response = await authApi.signup(payload)
    setToken(response.token)
    setUser(response.user)
    setStoredToken(response.token)
    setStoredUser(response.user)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'ADMIN',
      isLoading,
      login,
      signup,
      logout,
    }),
    [isLoading, login, logout, signup, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
