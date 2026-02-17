# Accessibility Token Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all WCAG AA contrast failures in the TCR design system color tokens across dark and light themes.

**Architecture:** Add four new semantic `-text` CSS custom properties to `_theme.scss` for accessible foreground text (primary, success, error, warning). Adjust three neutral scale values that fail even basic contrast requirements. Migrate ~120 `color:` property usages across ~30 SCSS component files from base tokens to text tokens.

**Tech Stack:** SCSS, CSS custom properties, Vite/Nuxt build system

---

### Task 1: Add semantic text tokens to dark mode in `_theme.scss`

**Files:**
- Modify: `web-frontend/modules/core/assets/scss/_theme.scss:6-110` (dark mode block)

**Step 1: Add text tokens after scrollbar properties in dark mode block**

In `_theme.scss`, inside the `:root, [data-theme='dark']` block, add after line 109 (`--scrollbar-thumb-active`):

```scss
  // Accessible text colors (WCAG AA 4.5:1 on dark surfaces)
  --color-primary-text: #ec6b2d;   // 5.02:1 on #232323
  --color-success-text: #3dbb78;   // 6.42:1 on #232323
  --color-error-text: #ef7068;     // 5.38:1 on #232323
  --color-warning-text: #d4a05f;   // 6.73:1 on #232323
```

**Step 2: Verify the file is syntactically correct**

Run: `cd /Users/btrofimo/dev_projects/tcr-baserow && npx sass --no-source-map --style=compressed web-frontend/modules/core/assets/scss/_theme.scss /dev/null 2>&1 || echo "SYNTAX ERROR"`

Expected: No output (clean compilation) or minimal CSS output. If "SYNTAX ERROR" appears, check placement.

---

### Task 2: Add semantic text tokens to light mode in `_theme.scss`

**Files:**
- Modify: `web-frontend/modules/core/assets/scss/_theme.scss:112-205` (light mode block)

**Step 1: Add text tokens after scrollbar properties in light mode block**

In `_theme.scss`, inside the `[data-theme='light']` block, add after line 203 (`--scrollbar-thumb-active`):

```scss
  // Accessible text colors (WCAG AA 4.5:1 on light surfaces)
  --color-primary-text: #c54318;   // 4.80:1 on #fafafa
  --color-success-text: #067647;   // 5.45:1 on #fafafa
  --color-error-text: #d92d20;     // 4.63:1 on #fafafa
  --color-warning-text: #806422;   // 5.35:1 on #fafafa
```

**Step 2: Add text tokens to prefers-color-scheme media query**

In the `@media (prefers-color-scheme: light)` block, add after line 287 (`--scrollbar-thumb-active`):

```scss
    --color-primary-text: #c54318;
    --color-success-text: #067647;
    --color-error-text: #d92d20;
    --color-warning-text: #806422;
```

---

### Task 3: Add SCSS variable re-assignments to `colors.scss`

**Files:**
- Modify: `web-frontend/modules/core/assets/scss/colors.scss:277` (after `$color-primary-900`)

**Step 1: Add text token SCSS variables**

After the `$color-primary-900: var(--color-primary-900);` line (277), add:

```scss

// Accessible text color variants (WCAG AA compliant for foreground text)
$color-primary-text: var(--color-primary-text);
$color-success-text: var(--color-success-text);
$color-error-text: var(--color-error-text);
$color-warning-text: var(--color-warning-text);
```

**Step 2: Commit token infrastructure**

```bash
git add web-frontend/modules/core/assets/scss/_theme.scss web-frontend/modules/core/assets/scss/colors.scss
git commit -m "feat: add semantic -text color tokens for WCAG AA compliance"
```

---

### Task 4: Adjust neutral scale values in `_theme.scss`

**Files:**
- Modify: `web-frontend/modules/core/assets/scss/_theme.scss`

**Step 1: Fix dark mode neutral-400 and neutral-500**

In the `:root, [data-theme='dark']` block:
- Change `--color-neutral-400: #5d5d5d;` to `--color-neutral-400: #757575;`
- Change `--color-neutral-500: #676767;` to `--color-neutral-500: #8a8a8a;`

**Step 2: Fix light mode neutral-400**

In the `[data-theme='light']` block:
- Change `--color-neutral-400: #b5b5b7;` to `--color-neutral-400: #767676;`

**Step 3: Fix prefers-color-scheme neutral-400**

In the `@media (prefers-color-scheme: light)` block:
- Change `--color-neutral-400: #b5b5b7;` to `--color-neutral-400: #767676;`

**Step 4: Commit neutral scale fix**

```bash
git add web-frontend/modules/core/assets/scss/_theme.scss
git commit -m "fix: adjust neutral-400/500 scale values for WCAG AA contrast"
```

---

### Task 5: Build verification checkpoint

**Step 1: Run the production build**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/web-frontend && make build-local 2>&1 | tail -20
```

Or if `make` is not available:

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/web-frontend && yarn build 2>&1 | tail -30
```

Expected: Build succeeds. If SCSS compilation errors occur, fix syntax in `_theme.scss` or `colors.scss`.

**Step 2: Run contrast verification script**

```bash
node -e "
function hexToRGB(h){return[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]}
function lin(c){return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)}
function lum(h){const[r,g,b]=hexToRGB(h).map(lin);return 0.2126*r+0.7152*g+0.0722*b}
function cr(a,b){const l1=lum(a),l2=lum(b);return((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2)}
const d='#232323',l='#fafafa';
const checks=[
  ['primary-text dark','#ec6b2d',d,4.5],['primary-text light','#c54318',l,4.5],
  ['success-text dark','#3dbb78',d,4.5],['success-text light','#067647',l,4.5],
  ['error-text dark','#ef7068',d,4.5],['error-text light','#d92d20',l,4.5],
  ['warning-text dark','#d4a05f',d,4.5],['warning-text light','#806422',l,4.5],
  ['neutral-400 dark','#757575',d,3.0],['neutral-400 light','#767676',l,3.0],
  ['neutral-500 dark','#8a8a8a',d,4.5],
];
let pass=0,fail=0;
checks.forEach(([name,fg,bg,req])=>{
  const r=cr(fg,bg);const ok=r>=req;
  console.log((ok?'PASS':'FAIL')+' '+name+': '+r+':1 (need '+req+':1)');
  ok?pass++:fail++;
});
console.log('\n'+pass+' passed, '+fail+' failed');
"
```

Expected: All 11 checks PASS.

---

### Task 6: Migrate primary text color in component SCSS files

**Files to modify** (only lines where CSS property is `color:`, NOT `background-color:`, `border-color:`, or `fill:`):

Replace `$color-primary-500` with `$color-primary-text` in `color:` properties in these files:

| File | Lines |
|------|-------|
| `typography.scss` | 15 |
| `helpers.scss` | 31 |
| `components/export_workspace.scss` | 114 |
| `components/dashboard.scss` | 310 |
| `components/button_add.scss` | 13 |
| `components/workspace_search.scss` | 39 |
| `components/deactivated_label.scss` | 3 |
| `components/form_input.scss` | 175, 194 |
| `components/card/rich_text.scss` | 15 |
| `components/trash.scss` | 44 |
| `components/context.scss` | 225 |
| `components/select.scss` | 15, 101 |
| `components/tabs.scss` | 83 |
| `components/api_docs.scss` | 62 |
| `components/dashboard/create_widget_card.scss` | 30 |
| `components/toast.scss` | 192 |
| `components/appearance_settings.scss` | 39, 49 |
| `components/tree.scss` | 134, 268, 277, 352 |
| `components/dashboard/dashboard_app.scss` | 87 |
| `components/fields/rich_text.scss` | 61 |
| `components/upload_files.scss` | 30 |
| `components/chips.scss` | 45, 49 |
| `components/box.scss` | 51 |
| `components/header.scss` | 67, 130, 197, 206 |
| `components/notification_panel.scss` | 35, 168 |
| `components/api_docs/nav_list.scss` | 22 |
| `components/sidebar.scss` | 143, 236 |

**Step 1: Run search-and-replace**

For each file, change ONLY lines where the property is `color:` (foreground text), NOT `background-color:`, `border-color:`, `border-bottom-color:`, or `fill:`.

The pattern to match: lines starting with `color: $color-primary-500` (with optional leading whitespace).

**DO NOT change:**
- `background-color: $color-primary-500` (backgrounds don't need text contrast)
- `border-color: $color-primary-500` (borders at 3:1 already pass)
- `$spinner-color: $color-primary-500` (loading spinner mixin default parameter)
- `@mixin loading($size: 1.4rem, $color: $color-primary-500)` (mixin default parameter)

**Step 2: Commit**

```bash
git add web-frontend/modules/core/assets/scss/
git commit -m "refactor: migrate color: primary-500 to primary-text for WCAG AA"
```

---

### Task 7: Migrate success text color in component SCSS files

**Files to modify** (only `color:` property lines):

Replace `$color-success-500` with `$color-success-text`:

| File | Lines |
|------|-------|
| `helpers.scss` | 35 |
| `components/choice_items.scss` | 78 |
| `components/admin_health.scss` | 59 |
| `components/webhook.scss` | 91, 264, 312 |
| `components/card/boolean.scss` | 5 |
| `components/icon.scss` | 18 |
| `components/upload_files.scss` | 162, 166 |
| `components/user_admin.scss` | 31 |
| `components/admin_dashboard.scss` | 54 |
| `components/fields/file.scss` | 72 |

**DO NOT change:**
- `background-color: $color-success-500` in `upload_files.scss:148`, `api_docs/parameters.scss:48`, `api_docs/example.scss:49`

**Step 1: Apply replacements and commit**

```bash
git add web-frontend/modules/core/assets/scss/
git commit -m "refactor: migrate color: success-500 to success-text for WCAG AA"
```

---

### Task 8: Migrate error text color in component SCSS files

**Files to modify** (only `color:` property lines):

Replace `$color-error-500` with `$color-error-text`:

| File | Lines |
|------|-------|
| `helpers.scss` | 43 |
| `components/webhook.scss` | 95, 268, 316 |
| `components/auth.scss` | 118 |
| `components/thumbnail.scss` | 18 |
| `components/context.scss` | 134, 137 |
| `components/snapshots_modal.scss` | 18, 53 |
| `components/modal-progress.scss` | 39 |
| `components/upload_files.scss` | 153, 170 |
| `components/user_admin.scss` | 35, 49 |
| `components/admin_health.scss` | 63 |
| `components/admin_dashboard.scss` | 58 |
| `components/formula_field.scss` | 38 |
| `components/views/form.scss` | 258, 272 |

Replace `$color-error-600` with `$color-error-text` (only `color:` lines):

| File | Lines |
|------|-------|
| `components/form.scss` | 41 |
| `components/array_field.scss` | 156 |
| `components/icon.scss` | 14 |
| `components/views/form.scss` | 506 |
| `components/automation/node/simulate_dispatch_node.scss` | 17 |

**DO NOT change:**
- `background-color: $color-error-500` in `views/grid.scss:621`, `api_docs/example.scss:53`, `builder/element_preview.scss:68,161`
- `border-color: $color-error-500` in `form_input.scss:52`, `form_textarea.scss:31`
- `border-color: $color-error-600` in `form.scss:26`, `dropdown.scss:28`, `builder/preview_navigation_bar_input.scss:11`, `builder/auth_provider_with_modal.scss:11`

**Step 1: Apply replacements and commit**

```bash
git add web-frontend/modules/core/assets/scss/
git commit -m "refactor: migrate color: error-500/600 to error-text for WCAG AA"
```

---

### Task 9: Migrate warning text color in component SCSS files

**Files to modify**:

Replace `$color-warning-500` with `$color-warning-text` (only `color:` lines):

| File | Lines |
|------|-------|
| `helpers.scss` | 39 |

Replace `$color-warning-600` with `$color-warning-text` (only `color:` lines):

| File | Lines |
|------|-------|
| `components/form.scss` | 141, 227 |
| `components/admin_health.scss` | 44 |
| `components/icon.scss` | 10 |

**DO NOT change:**
- `background-color: $color-warning-500` in `views/grid.scss:306`, `api_docs/example.scss:61`

**Step 1: Apply replacements and commit**

```bash
git add web-frontend/modules/core/assets/scss/
git commit -m "refactor: migrate color: warning-500/600 to warning-text for WCAG AA"
```

---

### Task 10: Final build and visual verification

**Step 1: Run production build**

```bash
cd /Users/btrofimo/dev_projects/tcr-baserow/web-frontend && yarn build 2>&1 | tail -30
```

Expected: Build succeeds with no SCSS compilation errors.

**Step 2: Run full contrast verification**

```bash
node -e "
function hexToRGB(h){return[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]}
function lin(c){return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)}
function lum(h){const[r,g,b]=hexToRGB(h).map(lin);return 0.2126*r+0.7152*g+0.0722*b}
function cr(a,b){const l1=lum(a),l2=lum(b);return((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2)}
const d='#232323',l='#fafafa';
console.log('=== ALL TOKEN CONTRAST RATIOS ===');
const checks=[
  ['primary-text dark','#ec6b2d',d,4.5],['primary-text light','#c54318',l,4.5],
  ['success-text dark','#3dbb78',d,4.5],['success-text light','#067647',l,4.5],
  ['error-text dark','#ef7068',d,4.5],['error-text light','#d92d20',l,4.5],
  ['warning-text dark','#d4a05f',d,4.5],['warning-text light','#806422',l,4.5],
  ['neutral-400 dark (UI)','#757575',d,3.0],['neutral-400 light (UI)','#767676',l,3.0],
  ['neutral-500 dark (text)','#8a8a8a',d,4.5],
  ['neutral-600 dark','#999999',d,4.5],['neutral-700 dark','#cecfd2',d,4.5],
  ['neutral-900 dark (body)','#f7f7f7',d,4.5],
  ['neutral-900 light (body)','#171717',l,4.5],
];
let pass=0,fail=0;
checks.forEach(([name,fg,bg,req])=>{
  const r=cr(fg,bg);const ok=r>=req;
  console.log((ok?'PASS':'FAIL')+' '+name+': '+r+':1 (need '+req+':1)');
  ok?pass++:fail++;
});
console.log('\n'+pass+'/'+checks.length+' passed');
"
```

Expected: All 15 checks PASS.

**Step 3: Visual check (manual)**

Start dev server and verify in browser:
- Dark mode: text is readable, links are visible orange, status messages are clear
- Light mode: same checks
- Switch between themes: no flash of wrong colors

---

### Task 11: Update memory and clean up

**Step 1: Update MEMORY.md**

Add accessibility tokens section to project memory.

**Step 2: Final commit if any cleanup needed**

```bash
git add -A && git status
```

Only commit if there are outstanding changes.
