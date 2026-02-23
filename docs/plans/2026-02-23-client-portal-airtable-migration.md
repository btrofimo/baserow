# Client Portal Migration: TanStack Start + Airtable + AWS Cognito

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Baserow-fork-based client portal with a standalone TanStack Start app backed by Airtable and AWS Cognito, hosted on EC2.

**Architecture:** A full-stack React app using TanStack Start (server functions as API proxy), TanStack Router (file-based routing), TanStack Query (data fetching/caching), TanStack Table (project list), and TanStack Form (project submission). AWS Cognito handles invitation-only auth with hosted login UI. Airtable stores all project data. The app runs on the existing EC2 instance behind Nginx.

**Tech Stack:**
- **Framework:** TanStack Start (React, full-stack, Vite-based)
- **Routing:** TanStack Router (type-safe, file-based)
- **Data Fetching:** TanStack Query (caching, mutations, SSR dehydration)
- **Tables:** TanStack React Table (sorting, pagination, column resize)
- **Forms:** TanStack React Form (validation, server submission)
- **Auth:** AWS Cognito (User Pool, hosted UI, JWT, `aws-jwt-verify`)
- **Data:** Airtable REST API (Personal Access Token, server-side proxy)
- **Styling:** Tailwind CSS
- **Hosting:** AWS EC2 (Node.js + Nginx reverse proxy)

**Airtable Tables Required:**
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| Projects | Project records | Street, City, State, File No, Status (single-select), Priority (single-select), Request Type (multi-select), Submitted By (email), Cognito User ID |
| Comments | Messaging thread per project | Project (linked record), Author (email), Body (long text), Created At (auto) |
| Users | Map Cognito IDs to client info | Cognito Sub (text), Email, Name, Company |

---

## Task 1: Scaffold TanStack Start Project

**Files:**
- Create: `portal/` (new project root, sibling to `web-frontend/`)
- Create: `portal/package.json`
- Create: `portal/vite.config.ts`
- Create: `portal/tsconfig.json`
- Create: `portal/src/routes/__root.tsx`
- Create: `portal/src/routes/index.tsx`
- Create: `portal/src/router.tsx`
- Create: `portal/src/app.tsx`
- Create: `portal/.env.example`

**Step 1: Create project with TanStack CLI**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
npx @tanstack/cli create portal
```

Select these options during interactive setup:
- Add-ons: Tailwind CSS, TanStack Query
- TypeScript: Yes

**Step 2: Verify the scaffold works**

```bash
cd portal
npm install
npm run dev
```

Expected: Dev server starts on `http://localhost:3000`, shows TanStack Start welcome page.

**Step 3: Add remaining TanStack dependencies**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npm install @tanstack/react-table @tanstack/react-form aws-jwt-verify
```

**Step 4: Create environment config**

Create `portal/.env.example`:
```env
# Airtable
AIRTABLE_PAT=pat_xxxxxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_PROJECTS_TABLE=Projects
AIRTABLE_COMMENTS_TABLE=Comments
AIRTABLE_USERS_TABLE=Users

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=your-app.auth.us-east-1.amazoncognito.com
COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
COGNITO_LOGOUT_URI=http://localhost:3000

# App
PORT=3000
NODE_ENV=development
```

Copy to `.env` and fill in real values:
```bash
cp .env.example .env
```

**Step 5: Add .env to .gitignore**

Ensure `portal/.gitignore` includes:
```
.env
.env.local
```

**Step 6: Commit scaffold**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/
git commit -m "chore(portal): scaffold TanStack Start project with dependencies"
```

---

## Task 2: Airtable API Client (Server-Side)

**Files:**
- Create: `portal/src/lib/airtable.server.ts`
- Test: `portal/src/lib/__tests__/airtable.server.test.ts`

**Step 1: Write the failing test**

Create `portal/src/lib/__tests__/airtable.server.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAirtableClient } from '../airtable.server'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AirtableClient', () => {
  const client = createAirtableClient({
    pat: 'pat_test',
    baseId: 'appTEST',
  })

  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listRecords', () => {
    it('fetches records from a table with auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            { id: 'rec1', fields: { Name: 'Project A' } },
          ],
        }),
      })

      const result = await client.listRecords('Projects')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v0/appTEST/Projects'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer pat_test',
          }),
        })
      )
      expect(result.records).toHaveLength(1)
      expect(result.records[0].fields.Name).toBe('Project A')
    })

    it('applies filterByFormula when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      })

      await client.listRecords('Projects', {
        filterByFormula: '{Status}="Active"',
      })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('filterByFormula')
      expect(calledUrl).toContain(encodeURIComponent('{Status}="Active"'))
    })

    it('applies sort parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      })

      await client.listRecords('Projects', {
        sort: [{ field: 'Status', direction: 'asc' as const }],
      })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('sort%5B0%5D%5Bfield%5D=Status')
      expect(calledUrl).toContain('sort%5B0%5D%5Bdirection%5D=asc')
    })

    it('applies pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [], offset: 'next123' }),
      })

      await client.listRecords('Projects', {
        pageSize: 25,
        offset: 'prev123',
      })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('pageSize=25')
      expect(calledUrl).toContain('offset=prev123')
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: { message: 'Invalid formula' } }),
      })

      await expect(client.listRecords('Projects')).rejects.toThrow(
        'Airtable API error (422)'
      )
    })
  })

  describe('createRecord', () => {
    it('creates a record with provided fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [{ id: 'recNew', fields: { Name: 'New Project' } }],
        }),
      })

      const result = await client.createRecord('Projects', {
        Name: 'New Project',
        Status: 'Submitted',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v0/appTEST/Projects'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            records: [{ fields: { Name: 'New Project', Status: 'Submitted' } }],
          }),
        })
      )
      expect(result.id).toBe('recNew')
    })
  })

  describe('updateRecord', () => {
    it('updates a record with partial fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [{ id: 'rec1', fields: { Status: 'Approved' } }],
        }),
      })

      const result = await client.updateRecord('Projects', 'rec1', {
        Status: 'Approved',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v0/appTEST/Projects'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            records: [{ id: 'rec1', fields: { Status: 'Approved' } }],
          }),
        })
      )
      expect(result.fields.Status).toBe('Approved')
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npx vitest run src/lib/__tests__/airtable.server.test.ts
```

Expected: FAIL — `createAirtableClient` not found.

**Step 3: Write minimal implementation**

Create `portal/src/lib/airtable.server.ts`:
```typescript
const AIRTABLE_API_URL = 'https://api.airtable.com/v0'

interface AirtableConfig {
  pat: string
  baseId: string
}

interface ListOptions {
  filterByFormula?: string
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
  pageSize?: number
  offset?: string
  fields?: string[]
}

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
  createdTime?: string
}

interface ListResponse {
  records: AirtableRecord[]
  offset?: string
}

function buildListUrl(
  baseId: string,
  table: string,
  options: ListOptions = {}
): string {
  const params = new URLSearchParams()

  if (options.filterByFormula) {
    params.set('filterByFormula', options.filterByFormula)
  }

  if (options.sort) {
    options.sort.forEach((s, i) => {
      params.set(`sort[${i}][field]`, s.field)
      params.set(`sort[${i}][direction]`, s.direction)
    })
  }

  if (options.pageSize) {
    params.set('pageSize', String(options.pageSize))
  }

  if (options.offset) {
    params.set('offset', options.offset)
  }

  if (options.fields) {
    options.fields.forEach((f) => params.append('fields[]', f))
  }

  const query = params.toString()
  return `${AIRTABLE_API_URL}/${baseId}/${table}${query ? `?${query}` : ''}`
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = (body as { error?: { message?: string } })?.error?.message ?? 'Unknown error'
    throw new Error(`Airtable API error (${response.status}): ${message}`)
  }
  return response.json() as Promise<T>
}

export function createAirtableClient(config: AirtableConfig) {
  const headers = {
    Authorization: `Bearer ${config.pat}`,
    'Content-Type': 'application/json',
  }

  return {
    async listRecords(
      table: string,
      options: ListOptions = {}
    ): Promise<ListResponse> {
      const url = buildListUrl(config.baseId, table, options)
      const response = await fetch(url, { headers })
      return handleResponse<ListResponse>(response)
    },

    async createRecord(
      table: string,
      fields: Record<string, unknown>
    ): Promise<AirtableRecord> {
      const url = `${AIRTABLE_API_URL}/${config.baseId}/${table}`
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ records: [{ fields }] }),
      })
      const data = await handleResponse<{ records: AirtableRecord[] }>(response)
      return data.records[0]
    },

    async updateRecord(
      table: string,
      recordId: string,
      fields: Record<string, unknown>
    ): Promise<AirtableRecord> {
      const url = `${AIRTABLE_API_URL}/${config.baseId}/${table}`
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ records: [{ id: recordId, fields }] }),
      })
      const data = await handleResponse<{ records: AirtableRecord[] }>(response)
      return data.records[0]
    },
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npx vitest run src/lib/__tests__/airtable.server.test.ts
```

Expected: PASS — all 6 tests green.

**Step 5: Commit**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/src/lib/airtable.server.ts portal/src/lib/__tests__/airtable.server.test.ts
git commit -m "feat(portal): add Airtable API client with tests"
```

---

## Task 3: Cognito Auth Helpers (Server-Side JWT Verification)

**Files:**
- Create: `portal/src/lib/auth.server.ts`
- Test: `portal/src/lib/__tests__/auth.server.test.ts`

**Step 1: Write the failing test**

Create `portal/src/lib/__tests__/auth.server.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npx vitest run src/lib/__tests__/auth.server.test.ts
```

Expected: FAIL — modules not found.

**Step 3: Write minimal implementation**

Create `portal/src/lib/auth.server.ts`:
```typescript
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

export async function exchangeCodeForTokens(
  code: string
): Promise<{ idToken: string; accessToken: string; refreshToken: string }> {
  const domain = process.env.COGNITO_DOMAIN!
  const clientId = process.env.COGNITO_CLIENT_ID!
  const redirectUri = process.env.COGNITO_REDIRECT_URI!

  const response = await fetch(`https://${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npx vitest run src/lib/__tests__/auth.server.test.ts
```

Expected: PASS — all 5 tests green.

**Step 5: Commit**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/src/lib/auth.server.ts portal/src/lib/__tests__/auth.server.test.ts
git commit -m "feat(portal): add Cognito auth helpers with JWT parsing and verification"
```

---

## Task 4: Server Functions (API Proxy Layer)

**Files:**
- Create: `portal/src/api/projects.functions.ts`
- Create: `portal/src/api/auth.functions.ts`
- Create: `portal/src/api/comments.functions.ts`

**Step 1: Create auth server functions**

Create `portal/src/api/auth.functions.ts`:
```typescript
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
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const tokens = await exchangeCodeForTokens(data.code)
    const user = parseCognitoIdToken(tokens.idToken)
    return {
      idToken: tokens.idToken,
      user,
    }
  })
```

**Step 2: Create projects server functions**

Create `portal/src/api/projects.functions.ts`:
```typescript
import { createServerFn } from '@tanstack/react-start'
import { createAirtableClient } from '../lib/airtable.server'
import { verifyCognitoToken } from '../lib/auth.server'

function getAirtable() {
  return createAirtableClient({
    pat: process.env.AIRTABLE_PAT!,
    baseId: process.env.AIRTABLE_BASE_ID!,
  })
}

export const listProjects = createServerFn({ method: 'POST' })
  .validator((data: { idToken: string; offset?: string }) => data)
  .handler(async ({ data }) => {
    const user = await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    return airtable.listRecords(process.env.AIRTABLE_PROJECTS_TABLE!, {
      filterByFormula: `{Cognito User ID}="${user.sub}"`,
      sort: [{ field: 'Created', direction: 'desc' }],
      pageSize: 25,
      offset: data.offset,
    })
  })

export const getProject = createServerFn({ method: 'POST' })
  .validator((data: { idToken: string; recordId: string }) => data)
  .handler(async ({ data }) => {
    const user = await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    // Fetch the specific project and verify ownership
    const result = await airtable.listRecords(
      process.env.AIRTABLE_PROJECTS_TABLE!,
      {
        filterByFormula: `AND(RECORD_ID()="${data.recordId}", {Cognito User ID}="${user.sub}")`,
      }
    )

    if (result.records.length === 0) {
      throw new Error('Project not found')
    }

    return result.records[0]
  })

export const submitProject = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      idToken: string
      fields: {
        street: string
        city: string
        state: string
        fileNo: string
        requestType: string[]
        priority: string
        notes?: string
      }
    }) => data
  )
  .handler(async ({ data }) => {
    const user = await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    return airtable.createRecord(process.env.AIRTABLE_PROJECTS_TABLE!, {
      Street: data.fields.street,
      City: data.fields.city,
      State: data.fields.state,
      'File No': data.fields.fileNo,
      'Request Type': data.fields.requestType,
      Priority: data.fields.priority,
      Notes: data.fields.notes ?? '',
      Status: 'Submitted',
      'Cognito User ID': user.sub,
      'Submitted By': user.email,
    })
  })
```

**Step 3: Create comments server functions**

Create `portal/src/api/comments.functions.ts`:
```typescript
import { createServerFn } from '@tanstack/react-start'
import { createAirtableClient } from '../lib/airtable.server'
import { verifyCognitoToken } from '../lib/auth.server'

function getAirtable() {
  return createAirtableClient({
    pat: process.env.AIRTABLE_PAT!,
    baseId: process.env.AIRTABLE_BASE_ID!,
  })
}

export const listComments = createServerFn({ method: 'POST' })
  .validator((data: { idToken: string; projectRecordId: string }) => data)
  .handler(async ({ data }) => {
    await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    return airtable.listRecords(process.env.AIRTABLE_COMMENTS_TABLE!, {
      filterByFormula: `{Project}="${data.projectRecordId}"`,
      sort: [{ field: 'Created At', direction: 'asc' }],
    })
  })

export const addComment = createServerFn({ method: 'POST' })
  .validator(
    (data: { idToken: string; projectRecordId: string; body: string }) => data
  )
  .handler(async ({ data }) => {
    const user = await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    return airtable.createRecord(process.env.AIRTABLE_COMMENTS_TABLE!, {
      Project: [data.projectRecordId],
      Author: user.email,
      Body: data.body,
    })
  })
```

**Step 4: Verify build compiles**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npm run build
```

Expected: Build succeeds with no type errors.

**Step 5: Commit**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/src/api/
git commit -m "feat(portal): add server functions for projects, comments, and auth"
```

---

## Task 5: Auth Context and Login Flow

**Files:**
- Create: `portal/src/hooks/useAuth.ts`
- Create: `portal/src/routes/auth/callback.tsx`
- Modify: `portal/src/routes/__root.tsx`

**Step 1: Create auth hook**

Create `portal/src/hooks/useAuth.ts`:
```typescript
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
```

**Step 2: Create auth callback route**

Create `portal/src/routes/auth/callback.tsx`:
```typescript
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { handleAuthCallback } from '../../api/auth.functions'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      navigate({ to: '/' })
      return
    }

    handleAuthCallback({ data: { code } })
      .then((result) => {
        sessionStorage.setItem('idToken', result.idToken)
        sessionStorage.setItem('user', JSON.stringify(result.user))
        navigate({ to: '/projects' })
      })
      .catch(() => {
        navigate({ to: '/' })
      })
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Signing you in...</p>
    </div>
  )
}
```

**Step 3: Update root layout with auth provider**

Modify `portal/src/routes/__root.tsx`:
```typescript
import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '../hooks/useAuth'
import { getLoginUrl, getLogoutUrl } from '../api/auth.functions'
import { parseCognitoIdToken } from '../lib/auth.server'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
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
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <Outlet />
      </AuthContext.Provider>
    </QueryClientProvider>
  )
}
```

**Step 4: Verify build**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/src/hooks/ portal/src/routes/
git commit -m "feat(portal): add Cognito auth flow with login, callback, and context"
```

---

## Task 6: Landing Page (Login Gate)

**Files:**
- Modify: `portal/src/routes/index.tsx`

**Step 1: Write landing page with login redirect**

Replace `portal/src/routes/index.tsx`:
```typescript
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/projects' })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">TCR Client Portal</h1>
        <p className="text-lg text-gray-600">
          Submit and track your project requests
        </p>
        <button
          onClick={login}
          className="px-8 py-3 bg-[#dc4b1a] text-white rounded-lg text-lg font-medium hover:bg-[#c54318] transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Verify dev server renders page**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npm run dev
```

Open `http://localhost:3000`. Expected: Landing page with TCR branding and "Sign In" button.

**Step 3: Commit**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/src/routes/index.tsx
git commit -m "feat(portal): add landing page with login gate"
```

---

## Task 7: Projects List Page (TanStack Table + Query)

**Files:**
- Create: `portal/src/routes/projects/index.tsx`
- Create: `portal/src/components/ProjectsTable.tsx`
- Create: `portal/src/components/StatusBadge.tsx`
- Create: `portal/src/components/PriorityBadge.tsx`
- Test: `portal/src/components/__tests__/StatusBadge.test.tsx`

**Step 1: Write the failing badge test**

Create `portal/src/components/__tests__/StatusBadge.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders status text', () => {
    render(<StatusBadge status="Submitted" />)
    expect(screen.getByText('Submitted')).toBeTruthy()
  })

  it('applies different styles per status', () => {
    const { rerender } = render(<StatusBadge status="Submitted" />)
    const submitted = screen.getByText('Submitted')
    expect(submitted.className).toContain('bg-blue')

    rerender(<StatusBadge status="In Review" />)
    const inReview = screen.getByText('In Review')
    expect(inReview.className).toContain('bg-yellow')

    rerender(<StatusBadge status="Approved" />)
    const approved = screen.getByText('Approved')
    expect(approved.className).toContain('bg-green')

    rerender(<StatusBadge status="Completed" />)
    const completed = screen.getByText('Completed')
    expect(completed.className).toContain('bg-gray')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npx vitest run src/components/__tests__/StatusBadge.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Implement StatusBadge**

Create `portal/src/components/StatusBadge.tsx`:
```typescript
const STATUS_STYLES: Record<string, string> = {
  Submitted: 'bg-blue-100 text-blue-800',
  'In Review': 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Completed: 'bg-gray-100 text-gray-800',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {status}
    </span>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npx vitest run src/components/__tests__/StatusBadge.test.tsx
```

Expected: PASS.

**Step 5: Create PriorityBadge**

Create `portal/src/components/PriorityBadge.tsx`:
```typescript
const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-orange-100 text-orange-800',
  Low: 'bg-slate-100 text-slate-800',
}

interface PriorityBadgeProps {
  priority: string
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority] ?? 'bg-slate-100 text-slate-600'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {priority}
    </span>
  )
}
```

**Step 6: Create ProjectsTable component**

Create `portal/src/components/ProjectsTable.tsx`:
```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'

interface Project {
  id: string
  fields: Record<string, unknown>
}

const columns: ColumnDef<Project>[] = [
  {
    id: 'fileNo',
    header: 'File No',
    accessorFn: (row) => row.fields['File No'] ?? '',
  },
  {
    id: 'street',
    header: 'Street',
    accessorFn: (row) => row.fields['Street'] ?? '',
  },
  {
    id: 'city',
    header: 'City',
    accessorFn: (row) => row.fields['City'] ?? '',
  },
  {
    id: 'state',
    header: 'State',
    accessorFn: (row) => row.fields['State'] ?? '',
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => row.fields['Status'] ?? '',
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
  {
    id: 'priority',
    header: 'Priority',
    accessorFn: (row) => row.fields['Priority'] ?? '',
    cell: ({ getValue }) => <PriorityBadge priority={getValue() as string} />,
  },
  {
    id: 'requestType',
    header: 'Request Type',
    accessorFn: (row) => {
      const val = row.fields['Request Type']
      return Array.isArray(val) ? val.join(', ') : ''
    },
  },
]

interface ProjectsTableProps {
  data: Project[]
}

export function ProjectsTable({ data }: ProjectsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' \u2191',
                        desc: ' \u2193',
                      }[header.column.getIsSorted() as string] ?? ''}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t">
        <span className="text-sm text-gray-600">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 7: Create projects list route**

Create `portal/src/routes/projects/index.tsx`:
```typescript
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listProjects } from '../../api/projects.functions'
import { ProjectsTable } from '../../components/ProjectsTable'

export const Route = createFileRoute('/projects/')({
  component: ProjectsListPage,
})

function ProjectsListPage() {
  const { isAuthenticated, idToken, user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', idToken],
    queryFn: () => listProjects({ data: { idToken: idToken! } }),
    enabled: !!idToken,
  })

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">TCR Client Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Projects</h2>
          <Link
            to="/projects/submit"
            className="px-4 py-2 bg-[#dc4b1a] text-white rounded-lg text-sm font-medium hover:bg-[#c54318] transition-colors"
          >
            Submit New Project
          </Link>
        </div>

        {isLoading && <p className="text-gray-500">Loading projects...</p>}
        {error && (
          <p className="text-red-600">
            Failed to load projects. Please try again.
          </p>
        )}
        {data && <ProjectsTable data={data.records} />}
      </main>
    </div>
  )
}
```

**Step 8: Verify build**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npm run build
```

Expected: Build succeeds.

**Step 9: Commit**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/src/components/ portal/src/routes/projects/
git commit -m "feat(portal): add projects list page with TanStack Table, sorting, and pagination"
```

---

## Task 8: Project Submission Form (TanStack Form)

**Files:**
- Create: `portal/src/routes/projects/submit.tsx`

**Step 1: Create submission form route**

Create `portal/src/routes/projects/submit.tsx`:
```typescript
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { submitProject } from '../../api/projects.functions'

export const Route = createFileRoute('/projects/submit')({
  component: SubmitProjectPage,
})

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const REQUEST_TYPES = [
  'Survey',
  'Inspection',
  'Appraisal',
  'Environmental',
  'Engineering',
  'Title Search',
]

const PRIORITIES = ['Low', 'Medium', 'High']

function SubmitProjectPage() {
  const { isAuthenticated, idToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  const form = useForm({
    defaultValues: {
      street: '',
      city: '',
      state: '',
      fileNo: '',
      requestType: [] as string[],
      priority: '',
      notes: '',
    },
    onSubmit: async ({ value }) => {
      await submitProject({
        data: {
          idToken: idToken!,
          fields: value,
        },
      })
      navigate({ to: '/projects' })
    },
  })

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Submit New Project</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="bg-white shadow rounded-lg p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form.Field
              name="street"
              validators={{ onChange: ({ value }) => !value ? 'Street is required' : undefined }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="123 Main St"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="city"
              validators={{ onChange: ({ value }) => !value ? 'City is required' : undefined }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="state"
              validators={{ onChange: ({ value }) => !value ? 'State is required' : undefined }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="fileNo">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Number
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
            </form.Field>

            <form.Field
              name="priority"
              validators={{ onChange: ({ value }) => !value ? 'Priority is required' : undefined }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select priority</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="requestType">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Type
                  </label>
                  <div className="space-y-2">
                    {REQUEST_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.state.value.includes(type)}
                          onChange={(e) => {
                            const current = field.state.value
                            field.handleChange(
                              e.target.checked
                                ? [...current, type]
                                : current.filter((t) => t !== type)
                            )
                          }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="notes">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Any additional details..."
                />
              </div>
            )}
          </form.Field>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={form.state.isSubmitting}
              className="px-6 py-2 bg-[#dc4b1a] text-white rounded-lg text-sm font-medium hover:bg-[#c54318] transition-colors disabled:opacity-50"
            >
              {form.state.isSubmitting ? 'Submitting...' : 'Submit Project'}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/projects' })}
              className="px-6 py-2 border text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
```

**Step 2: Verify build**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/src/routes/projects/submit.tsx
git commit -m "feat(portal): add project submission form with validation"
```

---

## Task 9: Project Detail Page (Status + Messaging)

**Files:**
- Create: `portal/src/routes/projects/$projectId.tsx`
- Create: `portal/src/components/CommentThread.tsx`
- Create: `portal/src/components/StatusTimeline.tsx`

**Step 1: Create StatusTimeline component**

Create `portal/src/components/StatusTimeline.tsx`:
```typescript
import { StatusBadge } from './StatusBadge'

const STATUS_ORDER = ['Submitted', 'In Review', 'Approved', 'Completed']

interface StatusTimelineProps {
  currentStatus: string
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="flex items-center gap-2">
      {STATUS_ORDER.map((status, index) => (
        <div key={status} className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              index <= currentIndex ? 'bg-[#dc4b1a]' : 'bg-gray-300'
            }`}
          />
          <span
            className={`text-sm ${
              index <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}
          >
            {status}
          </span>
          {index < STATUS_ORDER.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                index < currentIndex ? 'bg-[#dc4b1a]' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Create CommentThread component**

Create `portal/src/components/CommentThread.tsx`:
```typescript
import { useForm } from '@tanstack/react-form'

interface Comment {
  id: string
  fields: {
    Author?: string
    Body?: string
    'Created At'?: string
  }
}

interface CommentThreadProps {
  comments: Comment[]
  onSubmit: (body: string) => Promise<void>
  isSubmitting: boolean
}

export function CommentThread({
  comments,
  onSubmit,
  isSubmitting,
}: CommentThreadProps) {
  const form = useForm({
    defaultValues: { body: '' },
    onSubmit: async ({ value }) => {
      await onSubmit(value.body)
      form.reset()
    },
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Messages</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-gray-500">No messages yet.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {comment.fields.Author ?? 'Unknown'}
              </span>
              <span className="text-xs text-gray-400">
                {comment.fields['Created At']
                  ? new Date(comment.fields['Created At']).toLocaleString()
                  : ''}
              </span>
            </div>
            <p className="text-sm text-gray-600">{comment.fields.Body}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex gap-2"
      >
        <form.Field name="body">
          {(field) => (
            <input
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Type a message..."
            />
          )}
        </form.Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-[#dc4b1a] text-white rounded-lg text-sm font-medium hover:bg-[#c54318] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
```

**Step 3: Create project detail route**

Create `portal/src/routes/projects/$projectId.tsx`:
```typescript
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getProject } from '../../api/projects.functions'
import { listComments, addComment } from '../../api/comments.functions'
import { StatusTimeline } from '../../components/StatusTimeline'
import { StatusBadge } from '../../components/StatusBadge'
import { PriorityBadge } from '../../components/PriorityBadge'
import { CommentThread } from '../../components/CommentThread'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const { isAuthenticated, idToken } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () =>
      getProject({ data: { idToken: idToken!, recordId: projectId } }),
    enabled: !!idToken,
  })

  const commentsQuery = useQuery({
    queryKey: ['comments', projectId],
    queryFn: () =>
      listComments({
        data: { idToken: idToken!, projectRecordId: projectId },
      }),
    enabled: !!idToken,
    refetchInterval: 30000,
  })

  const addCommentMutation = useMutation({
    mutationFn: (body: string) =>
      addComment({
        data: { idToken: idToken!, projectRecordId: projectId, body },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] })
    },
  })

  if (!isAuthenticated) return null

  const project = projectQuery.data
  const fields = project?.fields ?? {}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            to="/projects"
            className="text-sm text-[#dc4b1a] hover:underline"
          >
            &larr; Back to Projects
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {projectQuery.isLoading && <p>Loading project...</p>}
        {projectQuery.error && (
          <p className="text-red-600">Failed to load project.</p>
        )}

        {project && (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {(fields['Street'] as string) ?? 'Untitled Project'}
                  </h2>
                  <p className="text-gray-600">
                    {(fields['City'] as string) ?? ''},{' '}
                    {(fields['State'] as string) ?? ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={(fields['Status'] as string) ?? ''} />
                  <PriorityBadge
                    priority={(fields['Priority'] as string) ?? ''}
                  />
                </div>
              </div>

              <StatusTimeline
                currentStatus={(fields['Status'] as string) ?? ''}
              />

              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                  <span className="text-gray-500">File No:</span>{' '}
                  <span className="font-medium">
                    {(fields['File No'] as string) ?? 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Request Type:</span>{' '}
                  <span className="font-medium">
                    {Array.isArray(fields['Request Type'])
                      ? (fields['Request Type'] as string[]).join(', ')
                      : 'N/A'}
                  </span>
                </div>
                {fields['Notes'] && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Notes:</span>{' '}
                    <span>{fields['Notes'] as string}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <CommentThread
                comments={(commentsQuery.data?.records ?? []) as any}
                onSubmit={(body) => addCommentMutation.mutateAsync(body)}
                isSubmitting={addCommentMutation.isPending}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
```

**Step 4: Add row click navigation to ProjectsTable**

Modify `portal/src/components/ProjectsTable.tsx` — add `useNavigate` import and wrap each `<tr>` in the body:

```typescript
// Add to imports
import { useNavigate } from '@tanstack/react-router'

// Inside ProjectsTable component, add:
const navigate = useNavigate()

// Replace the <tr> in tbody with:
<tr
  key={row.id}
  className="hover:bg-gray-50 cursor-pointer"
  onClick={() => navigate({ to: '/projects/$projectId', params: { projectId: row.original.id } })}
>
```

**Step 5: Verify build**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npm run build
```

Expected: Build succeeds.

**Step 6: Commit**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/src/routes/projects/ portal/src/components/
git commit -m "feat(portal): add project detail page with status timeline and messaging"
```

---

## Task 10: AWS Cognito User Pool Setup

**This task is manual AWS Console work, not code.**

**Step 1: Create Cognito User Pool**

1. Go to AWS Console → Cognito → Create user pool
2. Sign-in experience: Email only
3. Security: Password policy (defaults are fine for <20 users)
4. Self-service sign-up: **Disable** (admin creates users)
5. Message delivery: Cognito default email (fine for <20 users)
6. App integration:
   - App client name: `tcr-portal`
   - Hosted UI: Enable
   - Cognito domain: `tcr-portal` (or your preferred subdomain)
   - Callback URL: `https://your-domain.com/auth/callback` and `http://localhost:3000/auth/callback`
   - Sign-out URL: `https://your-domain.com` and `http://localhost:3000`
   - OAuth grant types: Authorization code grant
   - OpenID Connect scopes: openid, profile, email

**Step 2: Record credentials in `.env`**

```env
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=tcr-portal.auth.us-east-1.amazoncognito.com
COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
COGNITO_LOGOUT_URI=http://localhost:3000
```

**Step 3: Create test user**

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username testclient@example.com \
  --user-attributes Name=email,Value=testclient@example.com \
  --temporary-password TempPass123!
```

**Step 4: Verify login flow end-to-end**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/portal
npm run dev
```

1. Open `http://localhost:3000`
2. Click "Sign In" → redirects to Cognito hosted UI
3. Enter test credentials → redirected back to `/auth/callback`
4. Should land on `/projects` (empty list)

---

## Task 11: Airtable Base Setup

**This task is manual Airtable work, not code.**

**Step 1: Configure Projects table**

Ensure your existing Airtable base has these fields (add any missing):

| Field Name | Type | Options |
|-----------|------|---------|
| Street | Single line text | |
| City | Single line text | |
| State | Single line text | |
| File No | Single line text | |
| Status | Single select | Submitted, In Review, Approved, Rejected, Completed |
| Priority | Single select | Low, Medium, High |
| Request Type | Multiple select | Survey, Inspection, Appraisal, Environmental, Engineering, Title Search |
| Notes | Long text | |
| Cognito User ID | Single line text | |
| Submitted By | Email | |
| Created | Created time | |

**Step 2: Create Comments table**

| Field Name | Type | Notes |
|-----------|------|-------|
| Project | Link to Projects | Link to Projects table |
| Author | Email | |
| Body | Long text | |
| Created At | Created time | |

**Step 3: Create Users table**

| Field Name | Type |
|-----------|------|
| Cognito Sub | Single line text |
| Email | Email |
| Name | Single line text |
| Company | Single line text |

**Step 4: Create Personal Access Token**

1. Go to https://airtable.com/create/tokens
2. Create token with scopes: `data.records:read`, `data.records:write`
3. Grant access to your base
4. Copy token to `.env` as `AIRTABLE_PAT`

**Step 5: Record base/table IDs in `.env`**

```env
AIRTABLE_PAT=pat_xxxxxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_PROJECTS_TABLE=Projects
AIRTABLE_COMMENTS_TABLE=Comments
AIRTABLE_USERS_TABLE=Users
```

---

## Task 12: EC2 Deployment

**Files:**
- Create: `portal/Dockerfile`
- Create: `portal/nginx.conf`

**Step 1: Create Dockerfile**

Create `portal/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]
```

**Step 2: Create Nginx config**

Create `portal/nginx.conf`:
```nginx
server {
    listen 80;
    server_name portal.tcrprojects.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Step 3: Build and deploy**

```bash
# On EC2
cd /opt/tcr-portal
git pull
docker build -t tcr-portal .
docker stop tcr-portal || true
docker rm tcr-portal || true
docker run -d \
  --name tcr-portal \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  tcr-portal
```

**Step 4: Update Cognito callback URLs**

Update Cognito App Client settings:
- Add `https://portal.tcrprojects.com/auth/callback` to Allowed Callback URLs
- Add `https://portal.tcrprojects.com` to Allowed Sign-out URLs

Update `portal/.env` on EC2:
```env
COGNITO_REDIRECT_URI=https://portal.tcrprojects.com/auth/callback
COGNITO_LOGOUT_URI=https://portal.tcrprojects.com
```

**Step 5: Verify production deployment**

1. Open `https://portal.tcrprojects.com`
2. Sign in with test user
3. Verify project list loads from Airtable
4. Submit a test project
5. Check it appears in Airtable
6. Add a comment, verify it persists

**Step 6: Commit deployment configs**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow
git add portal/Dockerfile portal/nginx.conf
git commit -m "chore(portal): add Dockerfile and Nginx config for EC2 deployment"
```

---

## Summary

| Task | Description | Type |
|------|------------|------|
| 1 | Scaffold TanStack Start project | Setup |
| 2 | Airtable API client (server-side) | Backend, TDD |
| 3 | Cognito auth helpers (JWT verification) | Backend, TDD |
| 4 | Server functions (API proxy layer) | Backend |
| 5 | Auth context and login flow | Frontend |
| 6 | Landing page (login gate) | Frontend |
| 7 | Projects list page (TanStack Table + Query) | Frontend, TDD |
| 8 | Project submission form (TanStack Form) | Frontend |
| 9 | Project detail page (status + messaging) | Frontend |
| 10 | AWS Cognito User Pool setup | Infrastructure |
| 11 | Airtable base setup | Infrastructure |
| 12 | EC2 deployment | Infrastructure |

**Estimated total:** 12 tasks, ~40 commits, all code included above.

**Dependencies:**
- Tasks 1-3: Can run in parallel (scaffold, airtable client, auth helpers)
- Task 4: Depends on 2 + 3
- Tasks 5-6: Depend on 4
- Tasks 7-9: Depend on 5
- Tasks 10-11: Can run anytime (manual AWS/Airtable setup)
- Task 12: Depends on all code tasks (1-9)
