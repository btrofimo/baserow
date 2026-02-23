import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { useState, useEffect, useMemo, useCallback } from 'react'

import { AuthContext } from '../hooks/useAuth'
import { getLoginUrl, getLogoutUrl } from '../api/auth.functions'

import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TCR Client Portal',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const [idToken, setIdToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ sub: string; email: string } | null>(null)

  useEffect(() => {
    const storedToken = sessionStorage.getItem('idToken')
    const storedUser = sessionStorage.getItem('user')
    if (storedToken && storedUser) {
      setIdToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = useCallback(async () => {
    const { url } = await getLoginUrl()
    window.location.href = url
  }, [])

  const logout = useCallback(async () => {
    sessionStorage.removeItem('idToken')
    sessionStorage.removeItem('user')
    setIdToken(null)
    setUser(null)
    const { url } = await getLogoutUrl()
    window.location.href = url
  }, [])

  const authValue = useMemo(
    () => ({
      user,
      idToken,
      isAuthenticated: !!idToken && !!user,
      login,
      logout,
    }),
    [user, idToken, login, logout]
  )

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TanStackQueryProvider>
          <AuthContext.Provider value={authValue}>
            {children}
          </AuthContext.Provider>
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
