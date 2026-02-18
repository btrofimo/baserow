# UI Reskin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle auth pages (login, signup, forgot-password), form views, 404 error page, and email template to match Figma designs — dark split-panel layout with TCR branding.

**Architecture:** Theme-First Reskin — modify SCSS and layout templates only, preserving all existing auth logic (Vuelidate, Vuex, 2FA, invitations, OAuth registry). The auth layout changes from a centered card to a split-panel (form left, background image right). Form view gets a global SCSS restyle. 404 gets a custom error page component. Email template is a new Django HTML template.

**Tech Stack:** Vue 3 (Nuxt 3), SCSS with CSS custom properties (`$color-*` tokens), Django templates (email), Vuelidate (existing validation)

---

## Figma Reference

The Figma exports live in `/UI/` as standalone Vite+Vue projects. Use them as **visual reference only** — do not copy their components or CSS directly. The relevant screens are:
- `/UI/Login/src/LogIn/LogIn.vue` — login layout, spacing, typography
- `/UI/Signup/src/CreateAnAccount/CreateAnAccount.vue` — signup fields, social auth placement
- `/UI/forgot/src/ForgotPassword/ForgotPassword.vue` — password recovery, icon, pagination dots
- `/UI/404/src/Error/Error.vue` — error page typography, button layout
- `/UI/email/src/` — welcome email layout
- `/UI/Auth1.png` — background image for auth split panel

## Color Token Reference

All colors use the existing theme system. Key tokens:
- `$color-neutral-900` = `#232323` (dark background)
- `$color-neutral-100` = `#f7f7f7` (light text / light background)
- `$color-neutral-600` = `#4f4f4f` (dark borders)
- `$color-neutral-500` = `#8a8a8a` (muted text)
- `$color-neutral-300` = light borders
- `$color-primary-500` = `#dc4b1a` (TCR orange — buttons)
- `$color-primary-400` = `#ec6b2d` (TCR orange — links, accents)
- `$white` = `#ffffff`

Use `themed-alpha($color, $alpha)` for alpha blending (never raw `rgba()` with CSS vars).

---

### Task 1: Copy background image to static assets

**Files:**
- Copy: `UI/Auth1.png` → `web-frontend/modules/core/static/img/auth-bg.jpg`

**Step 1: Copy and optimize the image**

The Figma export includes `Auth1.png` (8.8MB). Convert to optimized JPEG for production.

Run:
```bash
# Convert PNG to optimized JPEG (quality 85, much smaller file)
sips -s format jpeg -s formatOptions 85 UI/Auth1.png --out web-frontend/modules/core/static/img/auth-bg.jpg
```

Expected: File created at `web-frontend/modules/core/static/img/auth-bg.jpg`, roughly 200-500KB.

**Step 2: Commit**

```bash
git add web-frontend/modules/core/static/img/auth-bg.jpg
git commit -m "feat: add auth background image from Figma design"
```

---

### Task 2: Restyle auth layout to split-panel

**Files:**
- Modify: `web-frontend/modules/core/layouts/login.vue` (lines 1-23)
- Modify: `web-frontend/modules/core/assets/scss/components/auth.scss` (lines 1-43)

**Step 1: Update the login layout template**

Replace the entire contents of `web-frontend/modules/core/layouts/login.vue` with:

```vue
<template>
  <div class="auth__split">
    <Toasts></Toasts>
    <div class="auth__panel">
      <div class="auth__container">
        <slot />
      </div>
      <div class="auth__copyright">
        &copy; TCR CG, PLLC
      </div>
    </div>
    <div class="auth__image" />
  </div>
</template>

<script>
import { useHead } from '#imports'
import Toasts from '@baserow/modules/core/components/toasts/Toasts'

export default {
  components: { Toasts },
  setup() {
    useHead({
      bodyAttrs: { class: 'auth__body' },
    })
  },
}
</script>
```

Key changes:
- Wraps content in `.auth__split` flex container with `.auth__panel` (form) and `.auth__image` (background)
- Adds copyright footer inside the form panel
- Existing `<slot />` preserved so all child pages render unchanged

**Step 2: Replace the body and container styles in auth.scss**

Replace lines 1-43 of `auth.scss` (everything from `.auth__body` through the end of `.auth__container`) with:

```scss
.auth__body {
  background: $color-neutral-900;
  color: $color-neutral-100;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.auth__split {
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
}

.auth__panel {
  display: flex;
  flex-direction: column;
  min-width: 480px;
  max-width: 640px;
  width: 44%;
  height: 100%;
  overflow-y: auto;
  background: $color-neutral-900;

  @media screen and (max-width: 768px) {
    min-width: 100%;
    max-width: 100%;
    width: 100%;
  }
}

.auth__container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 32px;

  @media screen and (max-width: 480px) {
    padding: 16px;
  }
}

.auth__image {
  flex: 1;
  background: url('@baserow/modules/core/static/img/auth-bg.jpg') center / cover no-repeat;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.15);
  }

  @media screen and (max-width: 768px) {
    display: none;
  }
}

.auth__copyright {
  padding: 32px;
  font-size: 11px;
  color: $color-neutral-500;
}
```

**Step 3: Verify the build compiles**

Run:
```bash
cd web-frontend && yarn build 2>&1 | tail -20
```

Expected: Build succeeds with no SCSS compilation errors.

**Step 4: Commit**

```bash
git add web-frontend/modules/core/layouts/login.vue web-frontend/modules/core/assets/scss/components/auth.scss
git commit -m "feat: restyle auth layout to dark split-panel with background image"
```

---

### Task 3: Restyle auth wrapper and form controls

**Files:**
- Modify: `web-frontend/modules/core/assets/scss/components/auth.scss` (lines 45-275)

**Step 1: Replace the auth wrapper and all component styles**

Replace everything from `.auth__logo` (line 45) through the end of the file with:

```scss
.auth__logo {
  height: 20px;
  margin-bottom: 80px;

  & img {
    height: 100%;
  }
}

.auth__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  width: 100%;
  gap: 8px;
  margin-bottom: 24px;
}

.auth__head-text {
  font-size: 11px;
  color: $color-neutral-500;

  a {
    font-weight: 600;
    color: $color-primary-400;
  }
}

.auth__head-title {
  overflow-wrap: break-word;
  margin: 0 0 12px;
  padding: 0;
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 44px;
  color: $color-neutral-100;

  &:last-child {
    margin-bottom: 12px;
  }
}

.auth__control {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: $color-neutral-300;
  margin-bottom: 12px;

  &.control--align-right {
    display: flex;
    justify-content: right;
  }
}

.auth__control-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 6px;
  color: $color-neutral-300;
}

.auth__control-error {
  height: 16px;
  margin-top: 6px;
  font-weight: 400;

  & .error {
    color: $color-neutral-400;

    i {
      color: $color-error-text;
    }
  }
}

.auth__action-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth__action-link {
  display: block;
  font-size: 11px;
  line-height: 20px;
  text-align: center;
  color: $color-neutral-500;

  a {
    font-weight: 500;
    color: $color-primary-400;
  }
}

.auth__error-help {
  margin: 32px 0;
}

.auth__separator {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: $color-neutral-500;
  margin: 24px 0;

  &::before,
  &::after {
    content: '';
    height: 1px;
    background-color: $color-neutral-700;
    flex-grow: 1;
  }

  &::before {
    margin-right: 16px;
  }

  &::after {
    margin-left: 16px;
  }
}

.auth__wrapper {
  max-width: 360px;
  width: 100%;
  margin: 0 auto;

  // Override form inputs for dark auth context
  .control__label,
  .control__label.control__label--small,
  .control__required,
  .control__messages {
    color: $color-neutral-300;
  }

  .form-input {
    background: transparent;
    border-color: $color-neutral-600;
    box-shadow: none;
    color: $color-neutral-100;

    &:hover:not(.form-input--error):not(.form-input--disabled) {
      border-color: $color-neutral-500;
    }

    &:focus,
    &:focus-within,
    &:active {
      &:not(.form-input--error):not(.form-input--disabled) {
        border-color: $color-primary-500;
        box-shadow: 0 0 0 3px themed-alpha($color-primary-500, 0.16);
      }
    }
  }

  .form-input__input {
    background: transparent;
    color: $color-neutral-100;

    &::placeholder {
      color: $color-neutral-500;
    }
  }

  .button {
    border-radius: 12px;
    min-height: 44px;
    font-size: 14px;
    font-weight: 600;
  }

  .button:not(.button--secondary):not(.button--ghost):not(.button--danger) {
    border: 1px solid transparent;
    background: $color-primary-500;
    box-shadow:
      inset 0px -2px 0px 0px rgba(12, 14, 18, 0.05),
      inset 0px 0px 0px 1px rgba(12, 14, 18, 0.18);

    &:hover:not([disabled]) {
      filter: brightness(1.08);
    }
  }

  .button--secondary {
    border-color: $color-neutral-600;
    background: transparent;
    color: $color-neutral-100;
    box-shadow:
      inset 0px -2px 0px 0px rgba(12, 14, 18, 0.05),
      inset 0px 0px 0px 1px rgba(12, 14, 18, 0.18);
  }

  // Social auth button overrides
  .auth-provider-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.auth__wrapper--small-centered {
  max-width: 360px;
  text-align: center;
}

// Light theme overrides
[data-theme='light'] {
  .auth__body {
    background: $color-neutral-50;
    color: $color-neutral-900;
  }

  .auth__panel {
    background: $color-neutral-50;
  }

  .auth__head-title {
    color: $color-neutral-900;
  }

  .auth__head-text {
    color: $color-neutral-600;
  }

  .auth__control,
  .auth__control-label {
    color: $color-neutral-700;
  }

  .auth__separator {
    color: $color-neutral-500;

    &::before,
    &::after {
      background-color: $color-neutral-200;
    }
  }

  .auth__wrapper {
    .control__label,
    .control__label.control__label--small,
    .control__required,
    .control__messages {
      color: $color-neutral-800;
    }

    .form-input {
      background: $white;
      border-color: $color-neutral-300;
      color: $color-neutral-900;

      &:hover:not(.form-input--error):not(.form-input--disabled) {
        border-color: $color-neutral-400;
      }
    }

    .form-input__input {
      background: $white;
      color: $color-neutral-900;

      &::placeholder {
        color: $color-neutral-600;
      }
    }

    .button--secondary {
      border-color: $color-neutral-200;
      background: $color-neutral-50;
      color: $color-neutral-900;
    }
  }
}
```

**Step 2: Verify build compiles**

Run:
```bash
cd web-frontend && yarn build 2>&1 | tail -20
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add web-frontend/modules/core/assets/scss/components/auth.scss
git commit -m "feat: restyle auth form controls for dark theme with light mode support"
```

---

### Task 4: Update login page template for new layout

**Files:**
- Modify: `web-frontend/modules/core/pages/login.vue` (lines 1-10)

**Step 1: Update the login page wrapper**

The login page currently wraps `<Login>` in `<div class="auth__wrapper">`. This is correct — no template changes needed. The `auth__wrapper` class has been restyled in Task 3 to work within the new split-panel layout.

Verify: Read `web-frontend/modules/core/pages/login.vue` and confirm it renders `<Login>` inside `<div class="auth__wrapper">`.

**Step 2: Visual check**

Run the dev server and verify `/login` shows the split-panel layout with dark form on left and background image on right.

Run:
```bash
cd web-frontend && yarn dev &
# Wait for server to start, then open http://localhost:3000/login in browser
```

**Step 3: Commit (if any adjustments needed)**

Only commit if changes were made. Otherwise skip.

---

### Task 5: Update signup page for dark theme

**Files:**
- Modify: `web-frontend/modules/core/pages/signup.vue` (lines 1-60, template only)

**Step 1: Review current signup template**

The signup page at `web-frontend/modules/core/pages/signup.vue` wraps content in `<div class="auth__wrapper">`. It renders:
- Logo
- Title ("Create an account")
- Header with login link + language picker
- Social login buttons (via `<LoginButtons>`)
- Separator ("or")
- Password register form (via `<PasswordRegister>`)
- Login actions

The SCSS changes from Task 3 handle the dark theme styling. The template structure is already compatible.

**Step 2: Adjust heading size for signup**

The Figma design uses 30px for signup headings (vs 36px for login). Add a modifier class.

In `web-frontend/modules/core/pages/signup.vue`, change line 12 from:
```html
<h1 class="auth__head-title">{{ $t('signup.headTitle') }}</h1>
```
to:
```html
<h1 class="auth__head-title auth__head-title--sm">{{ $t('signup.headTitle') }}</h1>
```

Then add to `auth.scss` (inside the heading section, after `.auth__head-title`):
```scss
.auth__head-title--sm {
  font-size: 30px;
  line-height: 38px;
}
```

**Step 3: Commit**

```bash
git add web-frontend/modules/core/pages/signup.vue web-frontend/modules/core/assets/scss/components/auth.scss
git commit -m "feat: style signup page for dark split-panel layout"
```

---

### Task 6: Update forgot-password page for dark theme

**Files:**
- Modify: `web-frontend/modules/core/pages/forgotPassword.vue` (template, lines 1-96)
- Modify: `web-frontend/modules/core/assets/scss/components/auth.scss` (add featured icon styles)

**Step 1: Add featured icon class to auth.scss**

Append to `auth.scss`:

```scss
.auth__featured-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid $color-neutral-600;
  background: transparent;
  color: $color-neutral-400;
  font-size: 24px;
  margin-bottom: 24px;
}
```

**Step 2: Update forgot-password template**

In `web-frontend/modules/core/pages/forgotPassword.vue`, add the featured icon above the heading. Change the `<div v-if="!success">` block (lines 6-76) to include the icon:

After line 11 (`</div>` closing `.auth__logo`), add:
```html
<div class="auth__featured-icon">
  <i class="iconoir-key-alt"></i>
</div>
```

Also add `auth__head-title--sm` class to the h1 on line 13:
```html
<h1 class="margin-bottom-0 auth__head-title auth__head-title--sm">{{ $t('forgotPassword.title') }}</h1>
```

**Step 3: Commit**

```bash
git add web-frontend/modules/core/pages/forgotPassword.vue web-frontend/modules/core/assets/scss/components/auth.scss
git commit -m "feat: style forgot-password page with featured icon for dark theme"
```

---

### Task 7: Restyle form view SCSS

**Files:**
- Modify: `web-frontend/modules/core/assets/scss/components/views/form.scss` (676 lines)

**Step 1: Update public form page container and body styles**

This task only modifies the **public-facing form** styles (`.form-view__page`, `.form-view__body`, `.form-view__field-*`), not the editor sidebar styles.

Replace the following selectors in `form.scss`:

Replace `.form-view__page` (lines 169-180):
```scss
.form-view__page {
  min-height: 100%;
  background-color: $color-neutral-100;

  &.form-view__page--rounded {
    position: relative;
    overflow: hidden;

    @include rounded($rounded-lg);

    border: 1px solid $color-neutral-200;
  }
}
```

Replace `.form-view__body` (lines 326-331):
```scss
.form-view__body {
  padding: 32px 16px;
  max-width: 100%;
  width: 680px;
  margin: 0 auto;

  @media screen and (max-width: 480px) {
    padding: 16px;
  }
}
```

Replace `.form-view__title` (lines 341-348):
```scss
.form-view__title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px;
  line-height: 32px;
  color: $color-neutral-900;

  @include flex-align-items(5px);
}
```

Replace `.form-view__description` (lines 350-357):
```scss
.form-view__description {
  font-size: 14px;
  margin: 0;
  display: inline-block;
  line-height: 22px;
  color: $color-neutral-500;

  @include flex-align-items(5px);
}
```

Replace `.form-view__field-name` (lines 498-503):
```scss
.form-view__field-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 14px;
  line-height: 20px;
  color: $color-neutral-900;
}
```

Replace `.form-view__field-description` (lines 509-515):
```scss
.form-view__field-description {
  font-size: 12px;
  line-height: 160%;
  margin-bottom: 20px;
  color: $color-neutral-500;
  display: inline-block;
}
```

**Step 2: Update the submit button area**

Replace `.form-view__actions` (lines 573-583):
```scss
.form-view__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 20px;
  font-size: 14px;

  &--single {
    justify-content: flex-end;
  }

  @media screen and (max-width: 480px) {
    flex-direction: column;
    gap: 12px;

    .button {
      width: 100%;
    }
  }
}
```

**Step 3: Verify build compiles**

Run:
```bash
cd web-frontend && yarn build 2>&1 | tail -20
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add web-frontend/modules/core/assets/scss/components/views/form.scss
git commit -m "feat: restyle public form view with modern typography and spacing"
```

---

### Task 8: Restyle the 404 error page

**Files:**
- Modify: `web-frontend/modules/core/components/DefaultErrorPage.vue` (107 lines)
- Create: `web-frontend/modules/core/assets/scss/components/error_page.scss`
- Modify: `web-frontend/modules/core/assets/scss/components/all.scss` (add import)

**Step 1: Create the error page SCSS**

Create `web-frontend/modules/core/assets/scss/components/error_page.scss`:

```scss
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 96px 24px;
  background: $color-neutral-900;
  color: $color-neutral-100;
  text-align: center;
}

.error-page__content {
  max-width: 768px;
  width: 100%;
}

.error-page__subheading {
  font-size: 14px;
  font-weight: 600;
  color: $color-neutral-500;
  margin: 0 0 12px;
}

.error-page__title {
  font-size: 60px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 72px;
  margin: 0 0 24px;
  color: $color-neutral-100;

  @media screen and (max-width: 768px) {
    font-size: 36px;
    line-height: 44px;
  }
}

.error-page__body {
  font-size: 20px;
  line-height: 30px;
  color: $color-neutral-400;
  margin: 0 0 48px;

  @media screen and (max-width: 768px) {
    font-size: 16px;
    line-height: 24px;
  }
}

.error-page__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-page__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: filter 0.15s ease;

  &:hover {
    text-decoration: none;
    filter: brightness(1.08);
  }
}

.error-page__btn--primary {
  background: $color-primary-500;
  color: $white;
  box-shadow:
    inset 0px -2px 0px 0px rgba(12, 14, 18, 0.05),
    inset 0px 0px 0px 1px rgba(12, 14, 18, 0.18);
}

.error-page__btn--secondary {
  background: transparent;
  color: $color-neutral-100;
  border: 1px solid $color-neutral-600;
  box-shadow:
    inset 0px -2px 0px 0px rgba(12, 14, 18, 0.05),
    inset 0px 0px 0px 1px rgba(12, 14, 18, 0.18);
}
```

**Step 2: Add the import to all.scss**

In `web-frontend/modules/core/assets/scss/components/all.scss`, add the import alongside other component imports:

```scss
@import 'error_page';
```

**Step 3: Replace the DefaultErrorPage.vue template**

Replace the entire contents of `web-frontend/modules/core/components/DefaultErrorPage.vue` with:

```vue
<template>
  <div v-if="!redirecting" class="error-page">
    <div class="error-page__content">
      <p class="error-page__subheading">
        {{ statusCode }} {{ $t('errorLayout.errorLabel') }}
      </p>
      <h1 class="error-page__title">{{ title }}</h1>
      <p class="error-page__body">{{ description }}</p>
      <div v-if="showBackButton" class="error-page__actions">
        <a class="error-page__btn error-page__btn--secondary" @click="goBack">
          <i class="iconoir-nav-arrow-left"></i>
          {{ $t('errorLayout.goBack') }}
        </a>
        <nuxt-link
          class="error-page__btn error-page__btn--primary"
          :to="homeRoute"
        >
          {{ $t('errorLayout.takeHome') }}
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { logoutAndRedirectToLogin } from '@baserow/modules/core/utils/auth'

export default {
  props: {
    error: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      redirecting: false,
    }
  },
  head() {
    return {
      title: this.title,
    }
  },
  computed: {
    statusCode() {
      return (this.error && this.error.statusCode) || 500
    },
    title() {
      if (this.error.statusCode === 404) {
        return this.$t('errorLayout.notFoundTitle')
      }
      return this.error.message || this.$t('errorLayout.wrong')
    },
    description() {
      if (this.error.statusCode === 404) {
        return this.$t('errorLayout.notFound')
      }
      return this.error.content ?? this.$t('errorLayout.error')
    },
    showBackButton() {
      return !this.error.hideBackButton
    },
    homeRoute() {
      return this.isAuthenticated ? { name: 'dashboard' } : { name: 'login' }
    },
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
    }),
  },
  async created() {
    const showSessionExpiredToast =
      this.$store.getters['auth/isUserSessionExpired']
    if (showSessionExpiredToast) {
      this.redirecting = true
      await logoutAndRedirectToLogin(
        this.$router,
        this.$store,
        showSessionExpiredToast
      )
    }
  },
  methods: {
    goBack() {
      this.$router.back()
    },
  },
}
</script>
```

**Step 4: Add i18n keys for the new error page text**

Find the English locale file for the core module. Search for existing `errorLayout` keys and add:

- `errorLayout.errorLabel`: `"error"`
- `errorLayout.notFoundTitle`: `"We can't find that page"`
- `errorLayout.goBack`: `"Go back"`
- `errorLayout.takeHome`: `"Take me home"`

The locale file is at `web-frontend/modules/core/locales/en.json`. Find the `errorLayout` section and add the new keys alongside existing ones.

**Step 5: Verify build compiles**

Run:
```bash
cd web-frontend && yarn build 2>&1 | tail -20
```

Expected: Build succeeds.

**Step 6: Commit**

```bash
git add web-frontend/modules/core/components/DefaultErrorPage.vue web-frontend/modules/core/assets/scss/components/error_page.scss web-frontend/modules/core/assets/scss/components/all.scss web-frontend/modules/core/locales/en.json
git commit -m "feat: redesign 404 error page with dark theme and modern typography"
```

---

### Task 9: Create welcome email template

**Files:**
- Create: `backend/src/baserow/core/templates/baserow/core/user/welcome.html`

**Step 1: Create the welcome email template**

Create `backend/src/baserow/core/templates/baserow/core/user/welcome.html`. Follow the exact pattern from `reset_password.html` — MJML-style table layout, Django template tags, inline CSS.

```html
{% load i18n %}
<!doctype html>
<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title></title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    #outlook a { padding: 0; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    p { display: block; margin: 13px 0; }
  </style>
  <!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
  <![endif]-->
  <!--[if lte mso 11]>
    <style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width:479px) {
      table.mj-full-width-mobile { width: 100% !important; }
      td.mj-full-width-mobile { width: auto !important; }
    }
  </style>
</head>

<body style="word-spacing:normal;background-color:#f5f5f5;">
  <div aria-roledescription="email" style="background-color:#f5f5f5;" role="article" lang="und" dir="auto">
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:left;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:190px;" ><![endif]-->
              <div class="mj-column-px-190 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tbody>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;padding-bottom:0;word-break:break-word;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                          <tbody>
                            <tr>
                              <td style="width:140px;">
                                <a href="{{ baserow_embedded_share_url }}" target="_blank">
                                  <img alt="" src="{{ logo_url }}" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="140" height="auto" />
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tbody>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:600;line-height:1;text-align:left;color:#070810;">{% trans "Welcome to TCR Projects" %}</div>
                      </td>
                    </tr>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:170%;text-align:left;color:#545454;">{% blocktrans trimmed with user.first_name as name %}Hi {{ name }},{% endblocktrans %}</div>
                      </td>
                    </tr>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:170%;text-align:left;color:#545454;">{% blocktrans trimmed %}We're glad to have you onboard! Your account has been created and you're ready to start managing your projects.{% endblocktrans %}</div>
                      </td>
                    </tr>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;padding-top:20px;padding-bottom:20px;word-break:break-word;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                          <tbody>
                            <tr>
                              <td align="center" bgcolor="#dc4b1a" role="presentation" style="border:none;border-radius:8px;cursor:auto;mso-padding-alt:12px 30px;background:#dc4b1a;" valign="middle">
                                <a href="{{ login_url }}" style="display:inline-block;background:#dc4b1a;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:600;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:12px 30px;mso-padding-alt:0px;border-radius:8px;" target="_blank"> {% trans "Log in" %} </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:170%;text-align:left;color:#9c9c9f;">{% blocktrans trimmed %}&copy; TCR CG, PLLC. All rights reserved.{% endblocktrans %}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]></td></tr></table><![endif]-->
  </div>
</body>

</html>
```

**Step 2: Commit**

```bash
git add backend/src/baserow/core/templates/baserow/core/user/welcome.html
git commit -m "feat: add branded welcome email template with TCR orange CTA"
```

---

### Task 10: Update existing email templates to TCR branding

**Files:**
- Modify: `backend/src/baserow/core/templates/baserow/core/user/reset_password.html`
- Modify: All other email templates in `backend/src/baserow/core/templates/baserow/core/user/`

**Step 1: Update the CTA button color**

In all email templates, the CTA button uses `#5190ef` (Baserow blue). Replace with TCR orange `#dc4b1a`.

Search and replace in each email template file:
- Replace `bgcolor="#5190ef"` with `bgcolor="#dc4b1a"`
- Replace `background:#5190ef` with `background:#dc4b1a`

Files to update:
- `reset_password.html`
- `email_pending_verification.html`
- `change_email_confirmation.html`
- `workspace_invitation.html`

**Step 2: Update border-radius on CTA buttons**

Replace `border-radius:4px` with `border-radius:8px` in all CTA button `<td>` and `<a>` elements.

**Step 3: Verify templates render correctly**

This is a manual step — trigger a password reset email or use Django's email preview tools to verify the orange CTA renders correctly.

**Step 4: Commit**

```bash
git add backend/src/baserow/core/templates/baserow/core/
git commit -m "feat: update email templates to TCR orange branding (#dc4b1a)"
```

---

### Task 11: Wire up OAuth provider configuration guide

**Files:**
- Create: `docs/guides/oauth-setup.md`

**Step 1: Create the OAuth configuration guide**

Create `docs/guides/oauth-setup.md`:

```markdown
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
```

**Step 2: Commit**

```bash
git add docs/guides/oauth-setup.md
git commit -m "docs: add OAuth setup guide for Microsoft and Apple providers"
```

---

### Task 12: Visual verification and polish

**Files:**
- Potentially modify: Any SCSS files from previous tasks

**Step 1: Start dev server**

Run:
```bash
cd web-frontend && yarn dev
```

**Step 2: Verify each screen**

Open each URL and compare against Figma reference:

1. `http://localhost:3000/login` — split-panel, dark form, background image, social buttons
2. `http://localhost:3000/signup` — dark form, 30px heading, social buttons at top
3. `http://localhost:3000/forgot-password` — featured icon, centered form
4. Navigate to a non-existent URL — 404 error page with large typography
5. Open a shared form view URL — modern styled form

**Step 3: Check responsive breakpoints**

Resize browser to:
- 768px width — background image should disappear
- 480px width — reduced padding

**Step 4: Check light theme**

Toggle theme to light mode and verify:
- Form panel switches to light background
- Text colors invert
- Input borders lighten
- Buttons maintain brand color

**Step 5: Fix any visual issues found**

Make targeted SCSS adjustments as needed.

**Step 6: Commit polish fixes**

```bash
git add -A
git commit -m "fix: visual polish adjustments for auth and form view reskin"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Copy background image | Static asset |
| 2 | Auth layout → split-panel | `login.vue` layout, `auth.scss` |
| 3 | Auth form control styling | `auth.scss` |
| 4 | Login page verification | `login.vue` page |
| 5 | Signup page dark theme | `signup.vue`, `auth.scss` |
| 6 | Forgot-password dark theme | `forgotPassword.vue`, `auth.scss` |
| 7 | Form view SCSS restyle | `form.scss` |
| 8 | 404 error page redesign | `DefaultErrorPage.vue`, `error_page.scss`, `all.scss`, `en.json` |
| 9 | Welcome email template | `welcome.html` |
| 10 | Rebrand existing emails | All email templates |
| 11 | OAuth configuration guide | `oauth-setup.md` |
| 12 | Visual verification + polish | Any SCSS files |
