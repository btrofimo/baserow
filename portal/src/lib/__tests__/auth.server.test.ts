import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractBearerToken, parseCognitoIdToken } from '../auth.server'

describe('extractBearerToken', () => {
  it('extracts token from valid Bearer header', () => {
    const token = extractBearerToken('Bearer eyJhbGciOiJSUzI1NiJ9.test.sig')
    expect(token).toBe('eyJhbGciOiJSUzI1NiJ9.test.sig')
  })

  it('returns null for missing header', () => {
    expect(extractBearerToken(undefined)).toBeNull()
    expect(extractBearerToken('')).toBeNull()
  })

  it('returns null for non-Bearer header', () => {
    expect(extractBearerToken('Basic abc123')).toBeNull()
  })
})

describe('parseCognitoIdToken', () => {
  function makeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const body = btoa(JSON.stringify(payload))
    return `${header}.${body}.fake-signature`
  }

  it('extracts sub and email from a valid ID token payload', () => {
    const token = makeJwt({
      sub: 'user-123',
      email: 'client@example.com',
      email_verified: true,
      token_use: 'id',
    })

    const result = parseCognitoIdToken(token)
    expect(result).toEqual({
      sub: 'user-123',
      email: 'client@example.com',
    })
  })

  it('throws for malformed token', () => {
    expect(() => parseCognitoIdToken('not-a-jwt')).toThrow()
  })
})
