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
