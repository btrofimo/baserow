# Accessibility Token Fix Design

**Date:** 2026-02-17
**Target:** WCAG 2.1 AA compliance for color tokens
**Scope:** All failing token pairings across dark and light themes

## Problem

The TCR design system color tokens fail WCAG AA contrast requirements in multiple critical pairings. The brand orange (`#dc4b1a`) fails AA for normal text in both themes. Neutral muted/disabled text tokens fail in dark mode. Several status colors (success, error, warning) fail for text use.

### Measured Failures

**Dark mode (on `neutral-50` #232323):**

| Token | Value | Ratio | Required |
|-------|-------|-------|----------|
| primary-500 | #dc4b1a | 3.79:1 | 4.5:1 |
| neutral-500 | #676767 | 2.78:1 | 4.5:1 |
| neutral-400 | #5d5d5d | 2.39:1 | 3.0:1 |
| success-500 | #079455 | 4.02:1 | 4.5:1 |
| error-500 | #d92d20 | 3.25:1 | 4.5:1 |
| error-600 | #e5514a | 4.20:1 | 4.5:1 |

**Light mode (on `neutral-50` #fafafa):**

| Token | Value | Ratio | Required |
|-------|-------|-------|----------|
| primary-500 | #dc4b1a | 3.97:1 | 4.5:1 |
| neutral-400 | #b5b5b7 | 1.96:1 | 3.0:1 |
| warning-500 | #ffc744 | 1.49:1 | 4.5:1 |
| warning-600 | #cc9f36 | 2.34:1 | 3.0:1 |
| success-600 | #079455 | 3.74:1 | 4.5:1 |

## Approach: Semantic `-text` Tokens + Neutral Scale Adjustment

### Rationale

Usage audit of ~460+ token references found:
- `primary-500`: 45% text, 24% background, 21% border (mixed — needs separate text token)
- `neutral-500`: 87% text (scale shift is appropriate)
- `neutral-400`: 59% text, 38% border (scale shift is appropriate)
- `success/error/warning-500`: 96-100% text (text tokens formalize this)

A single token value cannot serve both text (4.5:1) and decorative (no minimum) purposes. Adding `-text` tokens creates explicit semantic intent.

## Part 1: New Semantic Text Tokens

### Dark mode additions to `_theme.scss`:

```scss
--color-primary-text: #ec6b2d;   // 5.02:1 on #232323
--color-success-text: #3dbb78;   // 6.42:1 on #232323
--color-error-text: #ef7068;     // 5.38:1 on #232323
--color-warning-text: #d4a05f;   // 6.73:1 on #232323
```

### Light mode additions to `_theme.scss`:

```scss
--color-primary-text: #c54318;   // 4.80:1 on #fafafa
--color-success-text: #067647;   // 5.45:1 on #fafafa
--color-error-text: #d92d20;     // 4.63:1 on #fafafa
--color-warning-text: #806422;   // 5.35:1 on #fafafa
```

### SCSS variable additions to `colors.scss`:

```scss
$color-primary-text: var(--color-primary-text);
$color-success-text: var(--color-success-text);
$color-error-text: var(--color-error-text);
$color-warning-text: var(--color-warning-text);
```

## Part 2: Neutral Scale Adjustments

Direct value changes in `_theme.scss` (scale ordering preserved):

### Dark mode:

| Token | Current | New | Ratio |
|-------|---------|-----|-------|
| neutral-400 | #5d5d5d | #757575 | 3.41:1 (AA UI) |
| neutral-500 | #676767 | #8a8a8a | 4.55:1 (AA text) |

### Light mode:

| Token | Current | New | Ratio |
|-------|---------|-----|-------|
| neutral-400 | #b5b5b7 | #767676 | 4.35:1 (AA text) |

## Part 3: Component Migration

### Rules:
1. `color: $color-primary-500` -> `color: $color-primary-text` (~73 instances)
2. `color: $color-success-500` -> `color: $color-success-text` (~16 instances)
3. `color: $color-error-500` -> `color: $color-error-text` (~25 instances)
4. `color: $color-warning-500` / `$color-warning-600` -> `color: $color-warning-text` (~7 instances)

### Exclusions (do not touch):
- `background-color`, `border-color`, `fill`, `box-shadow` uses of any token
- `themed-alpha()` calls (derive from base token for subtle effects)
- `$colors` map in `colors.scss` (tag color backgrounds)
- Hover states using `primary-600` / `primary-700` (already pass AA)

### Deferred:
- Tag text-on-background contrast in dark mode (separate investigation)

## Validation

After implementation:
1. Run production build to verify compilation
2. Run contrast ratio script against all new values
3. Visual review in both dark and light modes
4. Verify focus indicators still meet 3:1 non-text contrast
