# Client Portal Modernization — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a sidebar navigation element, app header element, and sidebar page layout to the Baserow Builder, making published client portals feel like cohesive apps.

**Architecture:** Two new multi-page container elements (`SidebarNavigationElement`, `AppHeaderElement`) that render in a new `PAGE_PLACES.SIDEBAR` zone and the existing `PAGE_PLACES.HEADER` zone. `PageContent.vue` gains a CSS Grid wrapper when sidebar elements are present. The existing `IFrameElement` already handles embed needs — no new element needed there.

**Tech Stack:** Vue 3 / Nuxt 3 (frontend), Django REST Framework (backend), SCSS with CSS custom properties (styling), PostgreSQL (database).

**Key Reference Files:**
- Element type pattern: `web-frontend/modules/builder/elementTypes.js` (HeadingElementType line 1466, HeaderElementType line 2249, MenuElementType line 2501)
- Element component pattern: `web-frontend/modules/builder/components/elements/components/HeadingElement.vue`
- Container component pattern: `web-frontend/modules/builder/components/elements/components/MultiPageContainerElement.vue`
- Page renderer: `web-frontend/modules/builder/components/page/PageContent.vue`
- Backend models: `backend/src/baserow/contrib/builder/elements/models.py` (HeaderElement line 1032, MenuElement line 1094)
- Backend types: `backend/src/baserow/contrib/builder/elements/element_types.py` (MultiPageContainerElementType line 2153, HeaderElementType line 2166)
- Backend registration: `backend/src/baserow/contrib/builder/apps.py` (lines 180-217)
- Frontend registration: `web-frontend/modules/builder/plugin.js` (lines 220-240)
- Enums: `web-frontend/modules/builder/enums.js` (PAGE_PLACES line 104)
- Locales: `web-frontend/modules/builder/locales/en.json` (elementType block line 99)
- SCSS barrel: `web-frontend/modules/core/assets/scss/components/builder/elements/all.scss`

---

### Task 1: Add PAGE_PLACES.SIDEBAR Enum

**Files:**
- Modify: `web-frontend/modules/builder/enums.js:104-108`

**Step 1: Add SIDEBAR to PAGE_PLACES**

In `web-frontend/modules/builder/enums.js`, find the `PAGE_PLACES` object (line 104) and add `SIDEBAR`:

```javascript
export const PAGE_PLACES = {
  HEADER: 'header',
  CONTENT: 'content',
  FOOTER: 'footer',
  SIDEBAR: 'sidebar',
}
```

**Step 2: Verify no code breaks**

Run: `cd /Users/btrofimo/dev_projects/tcr-baserow && grep -r "PAGE_PLACES" web-frontend/modules/builder/ --include="*.js" --include="*.vue" -l`

Check each file to confirm no code assumes PAGE_PLACES only has 3 keys. The main consumers are:
- `PageContent.vue` — filters by HEADER/FOOTER explicitly, content is the default. Adding SIDEBAR won't break this.
- `elementTypes.js` — `getPagePlace()` returns CONTENT by default, individual types override. Safe.

**Step 3: Commit**

```bash
git add web-frontend/modules/builder/enums.js
git commit -m "feat(builder): add PAGE_PLACES.SIDEBAR enum for sidebar navigation"
```

---

### Task 2: Backend — SidebarNavigationElement Model

**Files:**
- Modify: `backend/src/baserow/contrib/builder/elements/models.py`

**Step 1: Add SidebarNavigationElement model**

Add after the `FooterElement` class (line 1041) and before the `MenuItemElement` class (line 1044):

```python
class SidebarNavigationElement(MultiPageElement, ContainerElement):
    """
    A multi-page sidebar navigation element that provides persistent
    navigation for client portals. Renders in the SIDEBAR page zone.
    """

    title = FormulaField(
        help_text="The portal title displayed at the top of the sidebar.",
        default="",
        blank=True,
    )
    show_user_info = models.BooleanField(
        default=True,
        help_text="Whether to show the authenticated user info at the bottom.",
    )
    collapsed_by_default = models.BooleanField(
        default=False,
        help_text="Whether the sidebar starts collapsed on load.",
    )
```

This follows the exact pattern of `HeaderElement` (line 1032) — extends `MultiPageElement` for cross-page sharing and `ContainerElement` for holding child elements.

**Step 2: Create migration**

Run: `cd /Users/btrofimo/dev_projects/tcr-baserow && python backend/src/baserow/manage.py makemigrations builder --name add_sidebar_navigation_element`

Expected: A new migration file in `backend/src/baserow/contrib/builder/migrations/` creating the `builder_sidebarnavigationelement` table.

**Step 3: Run migration**

Run: `cd /Users/btrofimo/dev_projects/tcr-baserow && python backend/src/baserow/manage.py migrate builder`

Expected: `Applying builder.XXXX_add_sidebar_navigation_element... OK`

**Step 4: Commit**

```bash
git add backend/src/baserow/contrib/builder/elements/models.py backend/src/baserow/contrib/builder/migrations/
git commit -m "feat(builder): add SidebarNavigationElement backend model"
```

---

### Task 3: Backend — SidebarNavigationElementType

**Files:**
- Modify: `backend/src/baserow/contrib/builder/elements/element_types.py`
- Modify: `backend/src/baserow/contrib/builder/apps.py`

**Step 1: Add SidebarNavigationElementType**

In `element_types.py`, add after `FooterElementType` (line 2181):

```python
class SidebarNavigationElementType(MultiPageContainerElementType):
    """
    A sidebar navigation container element that can be displayed on multiple pages.
    Provides persistent navigation for client portals.
    """

    type = "sidebar_navigation"
    model_class = SidebarNavigationElement
    serializer_field_names = ["title", "show_user_info", "collapsed_by_default"]
    allowed_fields = ["title", "show_user_info", "collapsed_by_default"]
    simple_formula_fields = ["title"]

    class SerializedDict(MultiPageContainerElementType.SerializedDict):
        title: BaserowFormulaObject
        show_user_info: bool
        collapsed_by_default: bool

    @property
    def serializer_field_overrides(self):
        from baserow.core.formula.serializers import FormulaSerializerField

        overrides = {
            **super().serializer_field_overrides,
            "title": FormulaSerializerField(
                help_text="The title displayed at the top of the sidebar.",
                required=False,
                allow_blank=True,
            ),
            "show_user_info": serializers.BooleanField(
                help_text="Whether to show user info at the bottom of the sidebar.",
                required=False,
                default=True,
            ),
            "collapsed_by_default": serializers.BooleanField(
                help_text="Whether the sidebar starts collapsed.",
                required=False,
                default=False,
            ),
        }
        return overrides

    def get_pytest_params(self, pytest_data_fixture):
        return {
            "title": "",
            "show_user_info": True,
            "collapsed_by_default": False,
        }
```

Add the model import at the top of the file where other models are imported:

```python
from baserow.contrib.builder.elements.models import SidebarNavigationElement
```

**Step 2: Register in apps.py**

In `backend/src/baserow/contrib/builder/apps.py`, add the import (around line 180, alphabetically):

```python
SidebarNavigationElementType,
```

And add registration (after FooterElementType, around line 215):

```python
element_type_registry.register(SidebarNavigationElementType())
```

**Step 3: Commit**

```bash
git add backend/src/baserow/contrib/builder/elements/element_types.py backend/src/baserow/contrib/builder/apps.py
git commit -m "feat(builder): add SidebarNavigationElementType backend type + registration"
```

---

### Task 4: Backend — AppHeaderElement Model + Type

**Files:**
- Modify: `backend/src/baserow/contrib/builder/elements/models.py`
- Modify: `backend/src/baserow/contrib/builder/elements/element_types.py`
- Modify: `backend/src/baserow/contrib/builder/apps.py`

**Step 1: Add AppHeaderElement model**

In `models.py`, add after `SidebarNavigationElement`:

```python
class AppHeaderElement(MultiPageElement, ContainerElement):
    """
    A multi-page app header element that displays breadcrumbs, page title,
    and user avatar. Renders in the HEADER page zone.
    """

    show_breadcrumbs = models.BooleanField(
        default=True,
        help_text="Whether to show breadcrumb navigation.",
    )
    show_page_title = models.BooleanField(
        default=True,
        help_text="Whether to show the current page title.",
    )
    show_user_avatar = models.BooleanField(
        default=True,
        help_text="Whether to show the user avatar and dropdown.",
    )
    title_override = FormulaField(
        help_text="Optional title to display instead of the page name.",
        default="",
        blank=True,
    )
```

**Step 2: Add AppHeaderElementType**

In `element_types.py`, add after `SidebarNavigationElementType`:

```python
class AppHeaderElementType(MultiPageContainerElementType):
    """
    An app header container element that can be displayed on multiple pages.
    Provides breadcrumbs, page title, and user actions.
    """

    type = "app_header"
    model_class = AppHeaderElement
    serializer_field_names = [
        "show_breadcrumbs",
        "show_page_title",
        "show_user_avatar",
        "title_override",
    ]
    allowed_fields = [
        "show_breadcrumbs",
        "show_page_title",
        "show_user_avatar",
        "title_override",
    ]
    simple_formula_fields = ["title_override"]

    class SerializedDict(MultiPageContainerElementType.SerializedDict):
        show_breadcrumbs: bool
        show_page_title: bool
        show_user_avatar: bool
        title_override: BaserowFormulaObject

    @property
    def serializer_field_overrides(self):
        from baserow.core.formula.serializers import FormulaSerializerField

        overrides = {
            **super().serializer_field_overrides,
            "show_breadcrumbs": serializers.BooleanField(
                required=False, default=True,
            ),
            "show_page_title": serializers.BooleanField(
                required=False, default=True,
            ),
            "show_user_avatar": serializers.BooleanField(
                required=False, default=True,
            ),
            "title_override": FormulaSerializerField(
                help_text="Optional override for the page title.",
                required=False,
                allow_blank=True,
            ),
        }
        return overrides

    def get_pytest_params(self, pytest_data_fixture):
        return {
            "show_breadcrumbs": True,
            "show_page_title": True,
            "show_user_avatar": True,
            "title_override": "",
        }
```

Add model import:
```python
from baserow.contrib.builder.elements.models import AppHeaderElement
```

**Step 3: Register in apps.py**

Add import and registration like Task 3.

**Step 4: Create + run migration**

Run: `cd /Users/btrofimo/dev_projects/tcr-baserow && python backend/src/baserow/manage.py makemigrations builder --name add_app_header_element && python backend/src/baserow/manage.py migrate builder`

**Step 5: Commit**

```bash
git add backend/src/baserow/contrib/builder/elements/models.py backend/src/baserow/contrib/builder/elements/element_types.py backend/src/baserow/contrib/builder/apps.py backend/src/baserow/contrib/builder/migrations/
git commit -m "feat(builder): add AppHeaderElement backend model + type"
```

---

### Task 5: Frontend — SidebarNavigationElement Vue Component

**Files:**
- Create: `web-frontend/modules/builder/components/elements/components/SidebarNavigationElement.vue`

**Step 1: Create the sidebar component**

This component follows the `MultiPageContainerElement.vue` pattern but adds sidebar-specific UI: a title bar, auto-generated nav links from portal pages, and user info at the bottom.

```vue
<template>
  <nav
    class="sidebar-nav-element"
    :class="{
      'sidebar-nav-element--collapsed': isCollapsed,
    }"
  >
    <div class="sidebar-nav-element__header">
      <div v-if="resolvedTitle" class="sidebar-nav-element__title">
        {{ resolvedTitle }}
      </div>
      <button
        class="sidebar-nav-element__toggle"
        @click="toggleCollapsed"
      >
        <i class="iconoir-menu"></i>
      </button>
    </div>

    <div class="sidebar-nav-element__nav">
      <template v-if="mode === 'editing' && children.length === 0">
        <AddElementZone @add-element="showAddElementModal" />
        <AddElementModal ref="addElementModal" :page="elementPage" />
      </template>
      <template v-else-if="children.length > 0">
        <template v-for="child in children">
          <ElementPreview
            v-if="mode === 'editing'"
            :key="child.id"
            :element="child"
            @move="$emit('move', $event)"
          />
          <PageElement
            v-else
            :key="`${child.id}else`"
            :element="child"
            :mode="mode"
          />
        </template>
      </template>
      <template v-else>
        <a
          v-for="page in navPages"
          :key="page.id"
          class="sidebar-nav-element__link"
          :class="{
            'sidebar-nav-element__link--active': isActivePage(page),
          }"
          :href="getPagePath(page)"
          @click.prevent="navigateToPage(page)"
        >
          <span class="sidebar-nav-element__link-label">{{ page.name }}</span>
        </a>
      </template>
    </div>

    <div
      v-if="element.show_user_info && currentUser"
      class="sidebar-nav-element__user"
    >
      <div class="sidebar-nav-element__avatar">
        {{ userInitials }}
      </div>
      <span class="sidebar-nav-element__username">{{ currentUser.name }}</span>
    </div>
  </nav>
</template>

<script>
import containerElement from '@baserow/modules/builder/mixins/containerElement'
import AddElementZone from '@baserow/modules/builder/components/elements/AddElementZone.vue'
import AddElementModal from '@baserow/modules/builder/components/elements/AddElementModal.vue'
import ElementPreview from '@baserow/modules/builder/components/elements/ElementPreview.vue'
import PageElement from '@baserow/modules/builder/components/page/PageElement.vue'
import { ensureString } from '@baserow/modules/core/utils/validator'

export default {
  name: 'SidebarNavigationElement',
  components: {
    PageElement,
    ElementPreview,
    AddElementModal,
    AddElementZone,
  },
  mixins: [containerElement],
  props: {
    element: {
      type: Object,
      required: true,
    },
  },
  emits: ['move'],
  data() {
    return {
      isCollapsed: this.element.collapsed_by_default,
    }
  },
  computed: {
    resolvedTitle() {
      return ensureString(this.resolveFormula(this.element.title))
    },
    navPages() {
      const builder = this.builder
      return this.$store.getters['page/getVisiblePages'](builder)
    },
    currentUser() {
      return this.$store.getters['userSourceUser/getUser'](this.builder)
    },
    userInitials() {
      if (!this.currentUser?.name) return '?'
      return this.currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    },
  },
  methods: {
    toggleCollapsed() {
      this.isCollapsed = !this.isCollapsed
    },
    isActivePage(page) {
      return this.currentPage?.id === page.id
    },
    getPagePath(page) {
      return page.path || `/${page.id}`
    },
    navigateToPage(page) {
      this.$router.push(this.getPagePath(page))
    },
    showAddElementModal() {
      this.$refs.addElementModal.show({
        placeInContainer: null,
        parentElementId: this.element.id,
      })
    },
  },
}
</script>
```

**Step 2: Commit**

```bash
git add web-frontend/modules/builder/components/elements/components/SidebarNavigationElement.vue
git commit -m "feat(builder): add SidebarNavigationElement Vue component"
```

---

### Task 6: Frontend — SidebarNavigationElementForm

**Files:**
- Create: `web-frontend/modules/builder/components/elements/components/forms/general/SidebarNavigationElementForm.vue`

**Step 1: Create the form component**

Follows the `HeadingElementForm.vue` pattern. Uses `elementForm` mixin, `allowedValues` array, and `InjectedFormulaInput` for the title.

```vue
<template>
  <form @submit.prevent @keydown.enter.prevent>
    <FormGroup
      :label="$t('sidebarNavigationElementForm.title')"
      small-label
    >
      <InjectedFormulaInput
        v-model="values.title"
        :placeholder="$t('sidebarNavigationElementForm.titlePlaceholder')"
      />
    </FormGroup>
    <FormGroup small-label>
      <Checkbox v-model="values.show_user_info">
        {{ $t('sidebarNavigationElementForm.showUserInfo') }}
      </Checkbox>
    </FormGroup>
    <FormGroup small-label>
      <Checkbox v-model="values.collapsed_by_default">
        {{ $t('sidebarNavigationElementForm.collapsedByDefault') }}
      </Checkbox>
    </FormGroup>
  </form>
</template>

<script>
import elementForm from '@baserow/modules/builder/mixins/elementForm'
import InjectedFormulaInput from '@baserow/modules/builder/components/elements/components/forms/general/InjectedFormulaInput.vue'

export default {
  name: 'SidebarNavigationElementForm',
  components: { InjectedFormulaInput },
  mixins: [elementForm],
  data() {
    return {
      values: {
        title: {},
        show_user_info: true,
        collapsed_by_default: false,
      },
      allowedValues: ['title', 'show_user_info', 'collapsed_by_default'],
    }
  },
}
</script>
```

**Step 2: Commit**

```bash
git add web-frontend/modules/builder/components/elements/components/forms/general/SidebarNavigationElementForm.vue
git commit -m "feat(builder): add SidebarNavigationElementForm"
```

---

### Task 7: Frontend — AppHeaderElement Vue Component + Form

**Files:**
- Create: `web-frontend/modules/builder/components/elements/components/AppHeaderElement.vue`
- Create: `web-frontend/modules/builder/components/elements/components/forms/general/AppHeaderElementForm.vue`

**Step 1: Create AppHeaderElement component**

```vue
<template>
  <header class="app-header-element">
    <div class="app-header-element__left">
      <button
        class="app-header-element__hamburger"
        @click="toggleSidebar"
      >
        <i class="iconoir-menu"></i>
      </button>
      <nav
        v-if="element.show_breadcrumbs"
        class="app-header-element__breadcrumbs"
      >
        <span
          v-for="(crumb, index) in breadcrumbs"
          :key="index"
          class="app-header-element__crumb"
        >
          <template v-if="index > 0"> / </template>
          {{ crumb }}
        </span>
      </nav>
      <h1
        v-if="element.show_page_title"
        class="app-header-element__title"
      >
        {{ resolvedTitle }}
      </h1>
    </div>
    <div class="app-header-element__right">
      <template
        v-if="mode === 'editing' && children.length === 0"
      >
        <AddElementZone @add-element="showAddElementModal" />
        <AddElementModal ref="addElementModal" :page="elementPage" />
      </template>
      <template v-else>
        <template v-for="child in children">
          <ElementPreview
            v-if="mode === 'editing'"
            :key="child.id"
            :element="child"
            @move="$emit('move', $event)"
          />
          <PageElement
            v-else
            :key="`${child.id}else`"
            :element="child"
            :mode="mode"
          />
        </template>
      </template>
      <div
        v-if="element.show_user_avatar && currentUser"
        class="app-header-element__avatar"
      >
        {{ userInitials }}
      </div>
    </div>
  </header>
</template>

<script>
import containerElement from '@baserow/modules/builder/mixins/containerElement'
import AddElementZone from '@baserow/modules/builder/components/elements/AddElementZone.vue'
import AddElementModal from '@baserow/modules/builder/components/elements/AddElementModal.vue'
import ElementPreview from '@baserow/modules/builder/components/elements/ElementPreview.vue'
import PageElement from '@baserow/modules/builder/components/page/PageElement.vue'
import { ensureString } from '@baserow/modules/core/utils/validator'

export default {
  name: 'AppHeaderElement',
  components: {
    PageElement,
    ElementPreview,
    AddElementModal,
    AddElementZone,
  },
  mixins: [containerElement],
  props: {
    element: {
      type: Object,
      required: true,
    },
  },
  emits: ['move'],
  computed: {
    resolvedTitle() {
      const override = ensureString(
        this.resolveFormula(this.element.title_override)
      )
      if (override) return override
      return this.currentPage?.name || ''
    },
    breadcrumbs() {
      const crumbs = []
      if (this.builder?.name) crumbs.push(this.builder.name)
      if (this.currentPage?.name) crumbs.push(this.currentPage.name)
      return crumbs
    },
    currentUser() {
      return this.$store.getters['userSourceUser/getUser'](this.builder)
    },
    userInitials() {
      if (!this.currentUser?.name) return '?'
      return this.currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    },
  },
  methods: {
    toggleSidebar() {
      this.$store.dispatch('builder/toggleSidebarCollapsed')
    },
    showAddElementModal() {
      this.$refs.addElementModal.show({
        placeInContainer: null,
        parentElementId: this.element.id,
      })
    },
  },
}
</script>
```

**Step 2: Create AppHeaderElementForm**

```vue
<template>
  <form @submit.prevent @keydown.enter.prevent>
    <FormGroup small-label>
      <Checkbox v-model="values.show_breadcrumbs">
        {{ $t('appHeaderElementForm.showBreadcrumbs') }}
      </Checkbox>
    </FormGroup>
    <FormGroup small-label>
      <Checkbox v-model="values.show_page_title">
        {{ $t('appHeaderElementForm.showPageTitle') }}
      </Checkbox>
    </FormGroup>
    <FormGroup small-label>
      <Checkbox v-model="values.show_user_avatar">
        {{ $t('appHeaderElementForm.showUserAvatar') }}
      </Checkbox>
    </FormGroup>
    <FormGroup
      :label="$t('appHeaderElementForm.titleOverride')"
      small-label
    >
      <InjectedFormulaInput
        v-model="values.title_override"
        :placeholder="$t('appHeaderElementForm.titleOverridePlaceholder')"
      />
    </FormGroup>
  </form>
</template>

<script>
import elementForm from '@baserow/modules/builder/mixins/elementForm'
import InjectedFormulaInput from '@baserow/modules/builder/components/elements/components/forms/general/InjectedFormulaInput.vue'

export default {
  name: 'AppHeaderElementForm',
  components: { InjectedFormulaInput },
  mixins: [elementForm],
  data() {
    return {
      values: {
        show_breadcrumbs: true,
        show_page_title: true,
        show_user_avatar: true,
        title_override: {},
      },
      allowedValues: [
        'show_breadcrumbs',
        'show_page_title',
        'show_user_avatar',
        'title_override',
      ],
    }
  },
}
</script>
```

**Step 3: Commit**

```bash
git add web-frontend/modules/builder/components/elements/components/AppHeaderElement.vue web-frontend/modules/builder/components/elements/components/forms/general/AppHeaderElementForm.vue
git commit -m "feat(builder): add AppHeaderElement component + form"
```

---

### Task 8: Frontend — Register Element Types in elementTypes.js

**Files:**
- Modify: `web-frontend/modules/builder/elementTypes.js`
- Create: `web-frontend/modules/builder/assets/icons/element-sidebar_navigation.svg`
- Create: `web-frontend/modules/builder/assets/icons/element-app_header.svg`

**Step 1: Create placeholder SVG icons**

Create simple placeholder SVGs for the element picker. These can be refined later.

`element-sidebar_navigation.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" fill="none">
  <rect x="1" y="1" width="30" height="78" rx="4" stroke="#999" stroke-width="1" fill="#f5f5f5"/>
  <rect x="35" y="1" width="84" height="78" rx="4" stroke="#ddd" stroke-width="1" fill="none"/>
  <rect x="5" y="8" width="22" height="3" rx="1" fill="#999"/>
  <rect x="5" y="18" width="22" height="2" rx="1" fill="#ccc"/>
  <rect x="5" y="24" width="22" height="2" rx="1" fill="#ccc"/>
  <rect x="5" y="30" width="22" height="2" rx="1" fill="#ccc"/>
</svg>
```

`element-app_header.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" fill="none">
  <rect x="1" y="1" width="118" height="20" rx="4" stroke="#999" stroke-width="1" fill="#f5f5f5"/>
  <rect x="1" y="25" width="118" height="54" rx="4" stroke="#ddd" stroke-width="1" fill="none"/>
  <rect x="8" y="8" width="40" height="3" rx="1" fill="#999"/>
  <circle cx="108" cy="11" r="6" fill="#ccc"/>
</svg>
```

**Step 2: Add type classes to elementTypes.js**

At the top of `elementTypes.js`, add imports (near the other component/form imports):

```javascript
import SidebarNavigationElement from '@baserow/modules/builder/components/elements/components/SidebarNavigationElement'
import SidebarNavigationElementForm from '@baserow/modules/builder/components/elements/components/forms/general/SidebarNavigationElementForm'
import AppHeaderElement from '@baserow/modules/builder/components/elements/components/AppHeaderElement'
import AppHeaderElementForm from '@baserow/modules/builder/components/elements/components/forms/general/AppHeaderElementForm'
```

Add SVG imports (near the other `elementImage*` imports):

```javascript
import elementImageSidebarNavigation from '@baserow/modules/builder/assets/icons/element-sidebar_navigation.svg?url'
import elementImageAppHeader from '@baserow/modules/builder/assets/icons/element-app_header.svg?url'
```

Add class definitions after `FooterElementType` (after line 2400):

```javascript
export class SidebarNavigationElementType extends MultiPageElementTypeMixin(
  ContainerElementTypeMixin(ElementType)
) {
  static getType() {
    return 'sidebar_navigation'
  }

  category() {
    return 'layoutElement'
  }

  get name() {
    return this.app.$i18n.t('elementType.sidebarNavigation')
  }

  get description() {
    return this.app.$i18n.t('elementType.sidebarNavigationDescription')
  }

  get iconClass() {
    return 'iconoir-sidebar-collapse'
  }

  get image() {
    return elementImageSidebarNavigation
  }

  get component() {
    return SidebarNavigationElement
  }

  get generalFormComponent() {
    return SidebarNavigationElementForm
  }

  getPagePlace() {
    return PAGE_PLACES.SIDEBAR
  }

  getDefaultChildValues(page, values) {
    return {}
  }

  getDefaultValues(page, values) {
    const superValues = super.getDefaultValues(page, values)
    return {
      ...superValues,
      style_padding_left: 0,
      style_padding_right: 0,
    }
  }

  isDisallowedReason({
    workspace,
    builder,
    page,
    parentElement,
    beforeElement,
    placeInContainer,
    pagePlace,
  }) {
    if (parentElement) {
      return this.app.$i18n.t('elementType.notAllowedInsideContainer')
    }

    const sharedPage = this.app.$store.getters['page/getSharedPage'](builder)

    if (
      page.id === sharedPage.id &&
      pagePlace &&
      pagePlace !== PAGE_PLACES.SIDEBAR
    ) {
      return this.app.$i18n.t('elementType.notAllowedUnlessSidebar')
    }

    return null
  }
}

export class AppHeaderElementType extends MultiPageElementTypeMixin(
  ContainerElementTypeMixin(ElementType)
) {
  static getType() {
    return 'app_header'
  }

  category() {
    return 'layoutElement'
  }

  get name() {
    return this.app.$i18n.t('elementType.appHeader')
  }

  get description() {
    return this.app.$i18n.t('elementType.appHeaderDescription')
  }

  get iconClass() {
    return 'iconoir-nav-arrow-down'
  }

  get image() {
    return elementImageAppHeader
  }

  get component() {
    return AppHeaderElement
  }

  get generalFormComponent() {
    return AppHeaderElementForm
  }

  getPagePlace() {
    return PAGE_PLACES.HEADER
  }

  getDefaultChildValues(page, values) {
    return {}
  }

  getDefaultValues(page, values) {
    const superValues = super.getDefaultValues(page, values)
    return {
      ...superValues,
      style_padding_left: 0,
      style_padding_right: 0,
    }
  }

  isDisallowedReason({
    workspace,
    builder,
    page,
    parentElement,
    beforeElement,
    placeInContainer,
    pagePlace,
  }) {
    if (parentElement) {
      return this.app.$i18n.t('elementType.notAllowedInsideContainer')
    }

    const sharedPage = this.app.$store.getters['page/getSharedPage'](builder)

    if (
      page.id === sharedPage.id &&
      pagePlace &&
      pagePlace !== PAGE_PLACES.HEADER
    ) {
      return this.app.$i18n.t('elementType.notAllowedUnlessHeader')
    }

    return null
  }
}
```

**Step 3: Commit**

```bash
git add web-frontend/modules/builder/elementTypes.js web-frontend/modules/builder/assets/icons/
git commit -m "feat(builder): add SidebarNavigation + AppHeader frontend element types"
```

---

### Task 9: Frontend — Register in plugin.js + Add Locale Strings

**Files:**
- Modify: `web-frontend/modules/builder/plugin.js`
- Modify: `web-frontend/modules/builder/locales/en.json`

**Step 1: Register in plugin.js**

Add imports (with the other element type imports around line 23):

```javascript
SidebarNavigationElementType,
AppHeaderElementType,
```

Add registration calls (after MenuElementType, around line 240):

```javascript
$registry.register('element', new SidebarNavigationElementType(context))
$registry.register('element', new AppHeaderElementType(context))
```

**Step 2: Add locale strings**

In `en.json`, inside the `"elementType"` block (around line 148, after `"menu"`), add:

```json
"sidebarNavigation": "Sidebar navigation",
"sidebarNavigationDescription": "A persistent sidebar for portal navigation",
"appHeader": "App header",
"appHeaderDescription": "A header bar with breadcrumbs and user avatar",
"notAllowedUnlessSidebar": "This element is allowed only in the page sidebar",
```

Add new top-level blocks for the form labels:

```json
"sidebarNavigationElementForm": {
  "title": "Portal title",
  "titlePlaceholder": "Enter a title for the sidebar",
  "showUserInfo": "Show user info",
  "collapsedByDefault": "Collapsed by default"
},
"appHeaderElementForm": {
  "showBreadcrumbs": "Show breadcrumbs",
  "showPageTitle": "Show page title",
  "showUserAvatar": "Show user avatar",
  "titleOverride": "Title override",
  "titleOverridePlaceholder": "Leave empty to use page name"
},
```

**Step 3: Commit**

```bash
git add web-frontend/modules/builder/plugin.js web-frontend/modules/builder/locales/en.json
git commit -m "feat(builder): register new elements in plugin + add locale strings"
```

---

### Task 10: Frontend — Update PageContent.vue for Sidebar Layout

**Files:**
- Modify: `web-frontend/modules/builder/components/page/PageContent.vue`

**Step 1: Add sidebar computed + CSS Grid wrapper**

Replace the template in `PageContent.vue` (lines 1-33) with:

```html
<template>
  <div class="page" :class="{ 'page--has-sidebar': hasSidebar }">
    <PageElement
      v-for="element in sidebarElements"
      :key="element.id"
      :element="element"
      :mode="mode"
      class="page__sidebar"
      :application-context-additions="{
        page: currentPage,
        recordIndexPath: [],
      }"
    />
    <div class="page__main">
      <PageElement
        v-for="element in headerElements"
        :key="element.id"
        :element="element"
        :mode="mode"
        :application-context-additions="{
          page: currentPage,
          recordIndexPath: [],
        }"
      />
      <div class="page__content">
        <PageElement
          v-for="element in elements"
          :key="element.id"
          :element="element"
          :mode="mode"
          :application-context-additions="{
            page: currentPage,
            recordIndexPath: [],
          }"
        />
      </div>
      <PageElement
        v-for="element in footerElements"
        :key="element.id"
        :element="element"
        :mode="mode"
        :application-context-additions="{
          page: currentPage,
          recordIndexPath: [],
        }"
      />
    </div>
  </div>
</template>
```

In the `<script>` computed section (around line 64), add:

```javascript
sidebarElements() {
  return this.sharedElements.filter(
    (element) =>
      this.$registry.get('element', element.type).getPagePlace() ===
      PAGE_PLACES.SIDEBAR
  )
},
hasSidebar() {
  return this.sidebarElements.length > 0
},
```

**Step 2: Commit**

```bash
git add web-frontend/modules/builder/components/page/PageContent.vue
git commit -m "feat(builder): add sidebar layout zone to PageContent renderer"
```

---

### Task 11: SCSS — Sidebar and App Header Styles

**Files:**
- Create: `web-frontend/modules/core/assets/scss/components/builder/elements/sidebar_navigation_element.scss`
- Create: `web-frontend/modules/core/assets/scss/components/builder/elements/app_header_element.scss`
- Modify: `web-frontend/modules/core/assets/scss/components/builder/elements/all.scss`
- Create: `web-frontend/modules/core/assets/scss/components/builder/page_layout.scss`

**Step 1: Create sidebar SCSS**

`sidebar_navigation_element.scss`:
```scss
.sidebar-nav-element {
  width: 260px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: $color-neutral-50;
  border-right: 1px solid $color-neutral-200;
  overflow-y: auto;
  transition: width 0.2s ease;

  &--collapsed {
    width: 64px;

    .sidebar-nav-element__title,
    .sidebar-nav-element__link-label,
    .sidebar-nav-element__username {
      display: none;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    min-height: 56px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: $color-neutral-900;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    color: $color-neutral-500;
    display: none;

    &:hover {
      background: $color-neutral-100;
    }
  }

  &__nav {
    flex: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__link {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 6px;
    color: $color-neutral-700;
    text-decoration: none;
    font-size: 14px;
    line-height: 1.4;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: $color-neutral-100;
      color: $color-neutral-900;
    }

    &--active {
      background: themed-alpha($color-primary-500, 0.08);
      color: $color-primary-text;
      border-left: 3px solid $color-primary-500;
      padding-left: 9px;
    }
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    border-top: 1px solid $color-neutral-200;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $color-primary-500;
    color: $color-neutral-50;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__username {
    font-size: 13px;
    color: $color-neutral-700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 1024px) {
    width: 64px;

    .sidebar-nav-element__title,
    .sidebar-nav-element__link-label,
    .sidebar-nav-element__username {
      display: none;
    }

    .sidebar-nav-element__toggle {
      display: block;
    }
  }

  @media (max-width: 768px) {
    position: fixed;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    width: 260px;

    &--expanded {
      transform: translateX(0);
    }

    .sidebar-nav-element__title,
    .sidebar-nav-element__link-label,
    .sidebar-nav-element__username {
      display: block;
    }

    .sidebar-nav-element__toggle {
      display: block;
    }
  }
}
```

**Step 2: Create app header SCSS**

`app_header_element.scss`:
```scss
.app-header-element {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: $color-neutral-50;
  border-bottom: 1px solid $color-neutral-200;
  position: sticky;
  top: 0;
  z-index: 10;

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__hamburger {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    color: $color-neutral-500;

    &:hover {
      background: $color-neutral-100;
    }

    @media (max-width: 768px) {
      display: flex;
    }
  }

  &__breadcrumbs {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: $color-neutral-500;
  }

  &__crumb {
    white-space: nowrap;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: $color-neutral-900;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $color-primary-500;
    color: $color-neutral-50;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
    }
  }
}
```

**Step 3: Create page layout SCSS**

`page_layout.scss` (in the builder directory or update existing page SCSS):

```scss
.page--has-sidebar {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
  min-height: 100vh;

  .page__sidebar {
    grid-row: 1 / -1;
  }

  .page__main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .page__content {
    flex: 1;
    padding: 24px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;

    .page__sidebar {
      grid-row: auto;
    }
  }
}
```

**Step 4: Register in all.scss barrel file**

Add to `web-frontend/modules/core/assets/scss/components/builder/elements/all.scss`:

```scss
@import 'sidebar_navigation_element';
@import 'app_header_element';
```

Add page layout import to the builder barrel file (check where page SCSS is imported and add page_layout there).

**Step 5: Commit**

```bash
git add web-frontend/modules/core/assets/scss/components/builder/elements/sidebar_navigation_element.scss web-frontend/modules/core/assets/scss/components/builder/elements/app_header_element.scss web-frontend/modules/core/assets/scss/components/builder/elements/all.scss
git commit -m "feat(builder): add SCSS styles for sidebar navigation + app header elements"
```

---

### Task 12: Build Verification + Smoke Test

**Files:** None (verification only)

**Step 1: Run the frontend build**

Run: `cd /Users/btrofimo/dev_projects/tcr-baserow && (cd web-frontend && yarn build 2>&1 | tail -30)`

Expected: Build succeeds with no errors. Watch for:
- Import resolution errors (missing files)
- SCSS compilation errors (undefined variables)
- Vue template compilation errors

**Step 2: Fix any build errors**

If the build fails, read the error messages and fix. Common issues:
- Missing imports in `elementTypes.js`
- Missing locale keys
- SCSS variable typos
- Incorrect mixin usage

**Step 3: Run the backend checks**

Run: `cd /Users/btrofimo/dev_projects/tcr-baserow && python backend/src/baserow/manage.py check`

Expected: `System check identified no issues.`

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(builder): resolve build errors from new element integration"
```

---

### Task 13: Sidebar Vuex State for Mobile Toggle

**Files:**
- Modify: `web-frontend/modules/builder/store/builder.js` (or create new store module)

**Step 1: Add sidebar state**

Check if `web-frontend/modules/builder/store/builder.js` exists. If so, add sidebar state:

```javascript
// In state
sidebarCollapsed: false,

// In mutations
TOGGLE_SIDEBAR_COLLAPSED(state) {
  state.sidebarCollapsed = !state.sidebarCollapsed
},
SET_SIDEBAR_COLLAPSED(state, collapsed) {
  state.sidebarCollapsed = collapsed
},

// In actions
toggleSidebarCollapsed({ commit }) {
  commit('TOGGLE_SIDEBAR_COLLAPSED')
},
setSidebarCollapsed({ commit }, collapsed) {
  commit('SET_SIDEBAR_COLLAPSED', collapsed)
},

// In getters
isSidebarCollapsed: (state) => state.sidebarCollapsed,
```

If no builder store exists, create a minimal one or add the state to the page store.

**Step 2: Wire up SidebarNavigationElement to read this state**

In `SidebarNavigationElement.vue`, add a computed that reads the store:

```javascript
isCollapsedFromStore() {
  return this.$store.getters['builder/isSidebarCollapsed']
},
```

And use it alongside the local `isCollapsed` data for mobile toggle support.

**Step 3: Commit**

```bash
git add web-frontend/modules/builder/store/
git commit -m "feat(builder): add sidebar collapsed state to Vuex store"
```

---

### Task 14: Final Integration Test + Deploy

**Step 1: Full build verification**

Run frontend build:
```bash
cd /Users/btrofimo/dev_projects/tcr-baserow && (cd web-frontend && yarn build 2>&1 | tail -30)
```

Run backend checks:
```bash
python backend/src/baserow/manage.py check
python backend/src/baserow/manage.py migrate --check
```

**Step 2: Test in browser**

Start the dev server and verify:
1. New "Sidebar navigation" and "App header" elements appear in the Builder element picker under "Layout" category
2. Dragging sidebar element to a page renders the sidebar
3. Dragging app header element renders the header bar
4. Published portal shows sidebar + header + content in correct grid layout
5. Existing portals without sidebar/header elements render unchanged
6. IFrame element works for embedding MS Calendar/Bookings URLs

**Step 3: Deploy to EC2**

Follow the same deployment process used previously:
```bash
rsync -avz --delete web-frontend/ ec2-user@18.217.160.94:/home/ec2-user/tcr-baserow/web-frontend/
# SSH in and rebuild Docker image
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(builder): client portal modernization Phase 1 complete"
```
