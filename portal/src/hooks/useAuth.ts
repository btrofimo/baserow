import { createContext, useContext } from 'react'

interface AuthUser {
  sub: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  idToken: string | null
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

export const AuthContext = createContext<AuthState>({
  user: null,
  idToken: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
