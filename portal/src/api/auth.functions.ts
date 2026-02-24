import { createServerFn } from '@tanstack/react-start'
import {
  buildCognitoLoginUrl,
  buildCognitoLogoutUrl,
  exchangeCodeForTokens,
  parseCognitoIdToken,
} from '../lib/auth.server'

export const getLoginUrl = createServerFn({ method: 'GET' }).handler(
  async () => {
    return { url: buildCognitoLoginUrl() }
  }
)

export const getLogoutUrl = createServerFn({ method: 'GET' }).handler(
  async () => {
    return { url: buildCognitoLogoutUrl() }
  }
)

export const handleAuthCallback = createServerFn({ method: 'POST' })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const tokens = await exchangeCodeForTokens(data.code)
    const user = parseCognitoIdToken(tokens.idToken)
    return {
      idToken: tokens.idToken,
      user,
    }
  })
