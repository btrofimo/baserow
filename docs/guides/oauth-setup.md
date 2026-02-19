# OAuth Provider Setup — Microsoft & Apple

## Prerequisites

- Baserow admin access (Settings > Authentication)
- Azure Portal access (for Microsoft)
- Apple Developer account (for Apple)

## Microsoft (Azure AD / Entra ID)

### 1. Register Application

1. Go to [Azure Portal](https://portal.azure.com) > Azure Active Directory > App Registrations
2. Click "New registration"
3. Name: "TCR Projects"
4. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
5. Redirect URI: Web — `https://<your-domain>/api/sso/oauth2/callback/`
6. Click "Register"

### 2. Configure Credentials

1. In the app overview, copy the **Application (client) ID**
2. Go to "Certificates & secrets" > "New client secret"
3. Set description and expiry, click "Add"
4. Copy the **secret value** immediately (it won't be shown again)
5. Go to "Overview" and copy the **Directory (tenant) ID**

### 3. Configure API Permissions

1. Go to "API permissions" > "Add a permission"
2. Select "Microsoft Graph" > "Delegated permissions"
3. Add: `openid`, `email`, `profile`
4. Click "Grant admin consent" if available

### 4. Add to Baserow

1. Go to Baserow admin > Settings > Authentication
2. Add new OAuth2 provider
3. Provider name: "Microsoft"
4. Client ID: (from step 2)
5. Client Secret: (from step 2)
6. Authorization URL: `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize`
7. Token URL: `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token`
8. User info URL: `https://graph.microsoft.com/oidc/userinfo`
9. Scopes: `openid email profile`
10. Save

## Apple Sign-In

### 1. Register Services ID

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Certificates, Identifiers & Profiles > Identifiers
3. Click "+" > Select "Services IDs"
4. Description: "TCR Projects"
5. Identifier: `com.tcrprojects.auth` (reverse domain notation)
6. Enable "Sign in with Apple"
7. Configure: Add your domain and redirect URL `https://<your-domain>/api/sso/oauth2/callback/`

### 2. Create Sign-In Key

1. Go to Keys > Click "+"
2. Name: "TCR Projects Sign-In"
3. Enable "Sign in with Apple"
4. Configure: Select your Services ID
5. Download the `.p8` key file
6. Note the **Key ID**
7. Note your **Team ID** (top right of developer portal)

### 3. Add to Baserow

1. Go to Baserow admin > Settings > Authentication
2. Add new OAuth2 provider
3. Provider name: "Apple"
4. Client ID: (Services ID from step 1, e.g., `com.tcrprojects.auth`)
5. Client Secret: Generate a JWT using your .p8 key (see Apple docs)
6. Authorization URL: `https://appleid.apple.com/auth/authorize`
7. Token URL: `https://appleid.apple.com/auth/token`
8. Scopes: `name email`
9. Save

**Note:** Apple's OAuth flow requires a signed JWT as the client secret, which must be regenerated periodically. See [Apple's documentation](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens) for details.

## Verification

After configuring either provider:
1. Log out of Baserow
2. Visit the login page
3. You should see the provider button(s) rendered automatically
4. Click to test the OAuth flow
