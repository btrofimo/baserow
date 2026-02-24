# Portal Improvements Design

## Date: 2026-02-24

## Overview

Comprehensive improvements to the TCR Client Portal covering custom authentication UI, address geocoding, security hardening, and UX polish.

## 1. Custom Cognito Login UI

**Approach**: Build custom login/forgot-password pages within the portal using Cognito's unauthenticated APIs (`InitiateAuth`, `RespondToAuthChallenge`, `ForgotPassword`, `ConfirmForgotPassword`) via raw fetch calls. No AWS SDK dependency needed.

**Requirement**: Enable `ALLOW_USER_PASSWORD_AUTH` in the Cognito App Client settings (one-click in AWS Console).

**Pages**:
- `/auth/login` — Email/password form with TCR branding, handles NEW_PASSWORD_REQUIRED challenge
- `/auth/forgot-password` — Email → verification code → new password flow

**Auth Flow**:
1. User enters credentials on custom login page
2. Server function calls Cognito `InitiateAuth` with `USER_PASSWORD_AUTH`
3. On success: return JWT tokens, store in sessionStorage, redirect to `/projects`
4. On `NEW_PASSWORD_REQUIRED`: show change password form, call `RespondToAuthChallenge`
5. On error: show error message inline

## 2. OSM Nominatim Geocoding

**Approach**: Server-side proxy to Nominatim API with rate limiting (1 req/sec), proper User-Agent header, and US-only results.

**Components**:
- `AddressAutocomplete` component with debounced search (400ms), dropdown suggestions, keyboard navigation
- Server function wraps Nominatim API call
- On address selection: auto-fills Street, City, State fields + stores lat/lng

**Nominatim Requirements**:
- User-Agent: `TCR-Client-Portal/1.0 (tcrprojects.com)`
- Rate limit: 1 request per second (server-side throttle)
- Attribution: "Search powered by OpenStreetMap Nominatim" in form

## 3. Security Fixes

- **Airtable formula injection**: Escape double quotes in all `filterByFormula` values
- **Record ID validation**: Validate Airtable record IDs match `/^rec[a-zA-Z0-9]{14}$/` pattern
- **Zod validation**: Add Zod schemas to all server function input validators

## 4. Code Quality

- Extract shared `getAirtable()` into `src/lib/airtable-helpers.server.ts`
- Add `.playwright-mcp/` to `.gitignore`

## 5. UX Polish

- Loading skeleton states for projects list and detail
- Error boundary with toast-style notifications
- Favicon and meta description
- Auth callback loading spinner with TCR branding

## Implementation Order

1. Foundation: Security fixes, shared helpers, Zod validation
2. Custom Login UI: Cognito server lib, auth functions, login/forgot-password pages
3. Geocoding: Nominatim lib, server function, AddressAutocomplete, form integration
4. UX Polish: Loading states, error handling, meta tags
