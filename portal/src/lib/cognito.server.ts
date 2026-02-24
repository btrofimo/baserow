const COGNITO_ERROR_MESSAGES: Record<string, string> = {
  NotAuthorizedException: 'Incorrect email or password.',
  UserNotFoundException: 'No account found with that email.',
  UserNotConfirmedException: 'Please verify your email before signing in.',
  PasswordResetRequiredException: 'You must reset your password before signing in.',
  InvalidPasswordException: 'Password does not meet requirements. Use at least 8 characters with uppercase, lowercase, numbers, and symbols.',
  LimitExceededException: 'Too many attempts. Please try again later.',
  CodeMismatchException: 'Invalid verification code. Please try again.',
  ExpiredCodeException: 'Verification code has expired. Please request a new one.',
}

export class CognitoError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(COGNITO_ERROR_MESSAGES[code] ?? message)
    this.name = 'CognitoError'
  }
}

function getRegion(): string {
  return process.env.COGNITO_USER_POOL_ID!.split('_')[0]
}

async function cognitoRequest(
  target: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const region = getRegion()

  const response = await fetch(
    `https://cognito-idp.${region}.amazonaws.com/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
      },
      body: JSON.stringify(body),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    const errorType =
      (data as { __type?: string }).__type ?? 'UnknownError'
    const message =
      (data as { message?: string }).message ?? 'Authentication failed'
    throw new CognitoError(errorType, message)
  }

  return data
}

interface CognitoTokens {
  idToken: string
  accessToken: string
  refreshToken: string
}

interface CognitoChallenge {
  challengeName: 'NEW_PASSWORD_REQUIRED'
  session: string
}

type AuthResponse =
  | { type: 'success'; tokens: CognitoTokens }
  | { type: 'challenge'; challenge: CognitoChallenge }

export async function initiateAuth(
  email: string,
  password: string
): Promise<AuthResponse> {
  const data = (await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID!,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  })) as {
    AuthenticationResult?: {
      IdToken: string
      AccessToken: string
      RefreshToken: string
    }
    ChallengeName?: string
    Session?: string
  }

  if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return {
      type: 'challenge',
      challenge: {
        challengeName: 'NEW_PASSWORD_REQUIRED',
        session: data.Session!,
      },
    }
  }

  return {
    type: 'success',
    tokens: {
      idToken: data.AuthenticationResult!.IdToken,
      accessToken: data.AuthenticationResult!.AccessToken,
      refreshToken: data.AuthenticationResult!.RefreshToken,
    },
  }
}

export async function respondToNewPasswordChallenge(
  email: string,
  newPassword: string,
  session: string
): Promise<CognitoTokens> {
  const data = (await cognitoRequest('RespondToAuthChallenge', {
    ClientId: process.env.COGNITO_CLIENT_ID!,
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    Session: session,
    ChallengeResponses: {
      USERNAME: email,
      NEW_PASSWORD: newPassword,
    },
  })) as {
    AuthenticationResult: {
      IdToken: string
      AccessToken: string
      RefreshToken: string
    }
  }

  return {
    idToken: data.AuthenticationResult.IdToken,
    accessToken: data.AuthenticationResult.AccessToken,
    refreshToken: data.AuthenticationResult.RefreshToken,
  }
}

export async function forgotPassword(
  email: string
): Promise<{ destination: string }> {
  const data = (await cognitoRequest('ForgotPassword', {
    ClientId: process.env.COGNITO_CLIENT_ID!,
    Username: email,
  })) as {
    CodeDeliveryDetails?: { Destination?: string }
  }

  return {
    destination: data.CodeDeliveryDetails?.Destination ?? email,
  }
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  await cognitoRequest('ConfirmForgotPassword', {
    ClientId: process.env.COGNITO_CLIENT_ID!,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  })
}
