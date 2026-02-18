# UI Reskin — Auth, Form View, 404, Email Template

**Date**: 2026-02-18
**Status**: Approved
**Approach**: Theme-First Reskin (Approach A) — restyle existing components via SCSS + layout changes, preserve all logic

## Scope

| Screen | Integration Point | Notes |
|---|---|---|
| Login | Replace `/login` page styling | Dark split-layout, Apple+Microsoft OAuth |
| Signup | Replace `/signup` page styling | Multi-field registration form |
| Forgot Password | Replace `/forgot-password` page styling | Icon-led single-field |
| 404 Error | Replace error page | Full-screen dark typography |
| Email Template | New/replace welcome email | Light mode, Django template |
| Form View | Restyle global form view SCSS | Modern aesthetic for all shared forms |
| OAuth Setup | Configuration guide | Microsoft + Apple provider setup |

**Target**: Both admin and client portal authentication surfaces.
**Theme**: Dark default, light mode optional (respects `[data-theme='light']`).

## Figma Reference

Source exports in `/UI/` directory:
- `Login/` — split-panel login with social auth
- `Signup/` — multi-field registration
- `forgot/` — password recovery with step indicators
- `404/` — full-screen error page
- `email/` — welcome email template (light mode)
- `newprojectform/` — construction project intake form
- `sidebar/` — collapsible navigation (directional reference only)
- `Auth1.png` — aerial neighborhood photo for background

## Design

### 1. Auth Layout

**File**: `web-frontend/modules/core/layouts/login.vue`

Replace centered card layout with split-panel:

```
┌─────────────────────────┬─────────────────────────┐
│     Form Panel          │   Background Image      │
│  (min 480px, max 640px) │   (flex: 1, cover)      │
│                         │                         │
│  ┌─ Logo ──────────┐   │   Auth1.png with dark   │
│  ├─ Heading ───────┤   │   overlay               │
│  ├─ Form Fields ───┤   │                         │
│  ├─ Actions ───────┤   │                         │
│  ├─ Social Auth ───┤   │                         │
│  └─ Footer Link ───┘   │                         │
│  © TCR CG, PLLC         │                         │
└─────────────────────────┴─────────────────────────┘
```

- Layout: `display: flex; flex-direction: row`
- Form panel: `min-width: 480px; max-width: 640px`
- Image panel: `flex: 1; background-size: cover`
- Content area: `max-width: 360px` centered within form panel
- Responsive: below 768px, image panel hidden, form full-width
- Form panel background: `$color-neutral-900` (dark) / `$color-neutral-50` (light)

### 2. Auth Component Styling

**File**: `web-frontend/modules/core/assets/scss/components/auth.scss`

**Inputs**:
- Background: transparent (dark) / white (light)
- Border: 1px `$color-neutral-600` (dark) / `$color-neutral-300` (light)
- Focus: `$color-primary-500` border + `themed-alpha($color-primary-500, 0.16)` ring
- Placeholder: `$color-neutral-500`
- Text: `$color-neutral-100` (dark) / `$color-neutral-900` (light)
- Height: 44px, 14px font, 12px border-radius

**Primary button** ("Sign in", "Create Account", "Reset password"):
- Background: `$color-primary-500` (#dc4b1a)
- Shadow: `inset 0px -2px 0px 0px rgba(12,14,18,0.05), inset 0px 0px 0px 1px rgba(12,14,18,0.18)`
- Full-width, 44px height, 14px semibold
- Hover: `filter: brightness(1.08)`

**Social auth buttons**:
- Outlined: transparent background, 1px `$color-neutral-600` border
- Same skeuomorphic shadow
- Platform icons at 20px
- Full-width, stacked vertically, 16px gap

**Checkbox**:
- 16px square, 4px radius, `$color-neutral-600` border
- Checked: `$color-primary-500` fill

**Links**:
- Brand links: `$color-primary-500` (#ec6b2d)
- Muted text: `$color-neutral-500`

**Typography**:
- Heading: 36px semibold (Login), 30px semibold (Signup, Forgot)
- Body: 14px regular
- Labels/small: 11px medium
- Font: system stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)

**Password requirements** (Signup):
- Inline checkmark indicators for strength rules
- Green when satisfied, muted when not

### 3. Form View Restyling

**File**: `web-frontend/modules/core/assets/scss/components/views/form.scss`

Global restyle of all shared form views:

**Layout**:
- Background: `$color-neutral-100` (light default) / `$color-neutral-900` (dark)
- Max-width: 680px centered
- Section dividers: 1px `$color-neutral-200`
- Padding: 32px desktop, 16px mobile

**Inputs**: Same styling as auth for consistency.

**Labels**: 14px medium, `$color-neutral-700` (light) / `$color-neutral-200` (dark).

**Helper text**: 12px regular, `$color-neutral-500`.

**Submit button**: Primary brand style, full-width mobile, auto-width desktop.

**File upload**:
- Dashed border: 1px dashed `$color-neutral-300`
- Background: `themed-alpha($color-neutral-200, 0.5)`
- Icon + "Click to upload or drag and drop" text

**Multi-select checkbox grid**:
- `display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`
- Card-style options with border, padding, check indicator

**Constraint**: Fields are dynamically rendered from table schema — CSS-only changes, no field structure modifications.

### 4. 404 Error Page

**File**: Nuxt error layout/page override

**Layout**:
- Full-screen centered, single column
- Min-height: 100vh, 96px vertical padding
- Content max-width: 768px
- Background: `$color-neutral-900` (dark) / `$color-neutral-50` (light)

**Content**:
- Subheading: "404 error" — 14px semibold, `$color-neutral-500`
- Main heading: "We can't find that page" — 60px semibold, `$color-neutral-100` / `$color-neutral-900`
- Body: "Sorry, the page you are looking for doesn't exist or has been moved." — 20px regular, `$color-neutral-400`
- Buttons side-by-side:
  - "Go back" — secondary outlined, left arrow icon, `$router.back()`
  - "Take me home" — primary brand, navigates to `/`

### 5. Email Welcome Template

**File**: Django email template (HTML) in backend templates directory

**Design** (light mode — email standard):
- Background: `#f5f5f5`
- Content card: white, max-width 600px, centered
- Padding: 32px

**Content**:
- Logo (TCR Projects branding)
- Greeting: "Hi {{ name }},"
- Body: Welcome message
- CTA: "Log in" button — brand orange, centered
- Footer: copyright, branding

**Constraints**:
- Inline CSS only (no external stylesheets)
- Table-based layout for Outlook/Gmail compatibility
- Django template variables (`{{ name }}`, `{{ login_url }}`)

### 6. OAuth Provider Configuration

Social auth buttons wire into existing `LoginButtons.vue` registry. They show/hide automatically based on configured providers.

**Microsoft (Azure AD / Entra ID)**:
1. Register app in Azure Portal > App Registrations
2. Set Redirect URI: `https://<domain>/api/sso/oauth2/callback/`
3. Scopes: `openid`, `email`, `profile`
4. Add Client ID + Client Secret + Tenant ID in Baserow admin > Settings > Authentication

**Apple Sign-In**:
1. Register Services ID at Apple Developer Portal > Certificates, Identifiers & Profiles
2. Create Sign-In key, download .p8 private key
3. Set Redirect URI: same pattern as Microsoft
4. Add Services ID + Team ID + Key ID + Private Key in Baserow admin > Authentication

**Button styling**: Outlined with platform icon, applied via SCSS. No custom backend code needed — uses Baserow's built-in OAuth2 provider type.

## Files Modified

| File | Change |
|---|---|
| `web-frontend/modules/core/layouts/login.vue` | Split-panel layout, background image |
| `web-frontend/modules/core/assets/scss/components/auth.scss` | Full restyle — dark theme, inputs, buttons, social auth |
| `web-frontend/modules/core/assets/scss/components/views/form.scss` | Global form view restyle |
| `web-frontend/modules/core/pages/login.vue` | Minor — pass background image prop if needed |
| `web-frontend/modules/core/pages/signup.vue` | Minor — adapt template for new field layout |
| `web-frontend/modules/core/pages/forgotPassword.vue` | Minor — add featured icon, pagination dots |
| Nuxt error page/layout | Replace with custom 404 |
| Backend email template | New welcome email HTML |
| Static assets | `Auth1.png` background image |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SCSS changes affect unrelated components | Scope all new styles under `.auth__*` namespace; form view under `.form-view__*` |
| System font stack differs across OS | Use `-apple-system, BlinkMacSystemFont, 'Segoe UI'` — renders SF Pro on macOS, Segoe on Windows |
| Email template renders inconsistently | Test in Litmus/Email on Acid; use table-based layout, inline CSS |
| OAuth provider not natively supported | Baserow has generic OAuth2 type — verify Apple compatibility before building button UI |
| Dark theme breaks existing light-mode usage | All styles use `$color-*` tokens that resolve per theme; light mode tested separately |
