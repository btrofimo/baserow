import { CognitoJwtVerifier } from 'aws-jwt-verify'

// Lazy singleton — created once on first use
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      tokenUse: 'id',
      clientId: process.env.COGNITO_CLIENT_ID!,
    })
  }
  return verifier
}

export function extractBearerToken(
  header: string | undefined | null
): string | null {
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }
  return header.slice(7)
}

export function parseCognitoIdToken(
  token: string
): { sub: string; email: string } {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Malformed JWT: expected 3 parts')
  }

  const payload = JSON.parse(atob(parts[1]))
  return {
    sub: payload.sub,
    email: payload.email,
  }
}

export async function verifyCognitoToken(
  token: string
): Promise<{ sub: string; email: string }> {
  const payload = await getVerifier().verify(token)
  return {
    sub: payload.sub,
    email: payload.email as string,
  }
}

export function buildCognitoLoginUrl(): string {
  const domain = process.env.COGNITO_DOMAIN!
  const clientId = process.env.COGNITO_CLIENT_ID!
  const redirectUri = process.env.COGNITO_REDIRECT_URI!

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: redirectUri,
  })

  return `https://${domain}/login?${params.toString()}`
}

export function buildCognitoLogoutUrl(): string {
  const domain = process.env.COGNITO_DOMAIN!
  const clientId = process.env.COGNITO_CLIENT_ID!
  const logoutUri = process.env.COGNITO_LOGOUT_URI!

  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutUri,
  })

  return `https://${domain}/logout?${params.toString()}`
}
