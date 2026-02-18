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
