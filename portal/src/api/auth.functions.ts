import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  buildCognitoLoginUrl,
  buildCognitoLogoutUrl,
  exchangeCodeForTokens,
  parseCognitoIdToken,
} from '../lib/auth.server'
import {
  initiateAuth,
  respondToNewPasswordChallenge,
  forgotPassword,
  confirmForgotPassword,
  CognitoError,
} from '../lib/cognito.server'

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

const callbackInput = z.object({
  code: z.string().min(1),
})

export const handleAuthCallback = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => callbackInput.parse(data))
  .handler(async ({ data }) => {
    const tokens = await exchangeCodeForTokens(data.code)
    const user = parseCognitoIdToken(tokens.idToken)
    return {
      idToken: tokens.idToken,
      user,
    }
  })

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const login = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => loginInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const result = await initiateAuth(data.email, data.password)

      if (result.type === 'challenge') {
        return {
          type: 'challenge' as const,
          challengeName: result.challenge.challengeName,
          session: result.challenge.session,
          email: data.email,
        }
      }

      const user = parseCognitoIdToken(result.tokens.idToken)
      return {
        type: 'success' as const,
        idToken: result.tokens.idToken,
        user,
      }
    } catch (error) {
      if (error instanceof CognitoError) {
        return {
          type: 'error' as const,
          message: error.message,
          code: error.code,
        }
      }
      return {
        type: 'error' as const,
        message: 'An unexpected error occurred. Please try again.',
        code: 'UnknownError',
      }
    }
  })

const changePasswordInput = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
  session: z.string().min(1),
})

export const completeNewPassword = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => changePasswordInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const tokens = await respondToNewPasswordChallenge(
        data.email,
        data.newPassword,
        data.session
      )
      const user = parseCognitoIdToken(tokens.idToken)
      return {
        type: 'success' as const,
        idToken: tokens.idToken,
        user,
      }
    } catch (error) {
      if (error instanceof CognitoError) {
        return {
          type: 'error' as const,
          message: error.message,
          code: error.code,
        }
      }
      return {
        type: 'error' as const,
        message: 'Failed to change password. Please try again.',
        code: 'UnknownError',
      }
    }
  })

const forgotPasswordInput = z.object({
  email: z.string().email(),
})

export const requestPasswordReset = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => forgotPasswordInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const result = await forgotPassword(data.email)
      return {
        type: 'success' as const,
        destination: result.destination,
      }
    } catch (error) {
      if (error instanceof CognitoError) {
        return {
          type: 'error' as const,
          message: error.message,
          code: error.code,
        }
      }
      return {
        type: 'error' as const,
        message: 'Failed to send reset code. Please try again.',
        code: 'UnknownError',
      }
    }
  })

const confirmResetInput = z.object({
  email: z.string().email(),
  code: z.string().min(1),
  newPassword: z.string().min(8),
})

export const confirmPasswordReset = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => confirmResetInput.parse(data))
  .handler(async ({ data }) => {
    try {
      await confirmForgotPassword(data.email, data.code, data.newPassword)
      return { type: 'success' as const }
    } catch (error) {
      if (error instanceof CognitoError) {
        return {
          type: 'error' as const,
          message: error.message,
          code: error.code,
        }
      }
      return {
        type: 'error' as const,
        message: 'Failed to reset password. Please try again.',
        code: 'UnknownError',
      }
    }
  })
