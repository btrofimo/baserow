<template>
  <div class="portal">
    <div class="portal__welcome">
      <h1 class="portal__welcome-text">
        Hey, Welcome {{ userName }}.
      </h1>
    </div>

    <div class="portal__content">
      <PortalSearch @search="handleSearch" />

      <div class="portal__body">
        <PortalSidebar :active-count="activeProjectCount" />

        <div class="portal__main">
          <div v-if="isLoading" class="portal__loading">
            Loading projects...
          </div>
          <div v-else-if="errorMsg" class="portal__error">
            <p>{{ errorMsg }}</p>
          </div>
          <ProjectTable
            v-else
            :rows="filteredRows"
            :field-map="fieldMap"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useNuxtApp, createError } from '#app'
import { useHead, useAsyncData } from '#imports'

import PortalSidebar from '@baserow/modules/core/components/portal/PortalSidebar'
import PortalSearch from '@baserow/modules/core/components/portal/PortalSearch'
import ProjectTable from '@baserow/modules/core/components/portal/ProjectTable'
import RowService from '@baserow/modules/database/services/row'

definePageMeta({
  layout: 'app',
  middleware: [
    'settings',
    'authenticated',
    'impersonate',
    'workspacesAndApplications',
  ],
})

const route = useRoute()
const { $store, $client, $i18n } = useNuxtApp()

useHead(() => ({
  title: 'Portal',
}))

const searchQuery = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const rows = ref([])
const fieldMap = ref({})

const userName = computed(() => {
  return $store.getters['auth/getName'] || 'User'
})

const workspaceId = parseInt(route.params.workspaceId, 10)

const { pending } = await useAsyncData(
  `portal-${workspaceId}`,
  async () => {
    isLoading.value = true
    errorMsg.value = ''

    try {
      await $store.dispatch('workspace/selectById', workspaceId)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workspace not found.',
      })
    }

    const apps = $store.getters['application/getAllOfWorkspace'](
      $store.getters['workspace/getSelected']
    )

    const database = apps.find((app) => app.type === 'database')
    if (!database || !database.tables || database.tables.length === 0) {
      isLoading.value = false
      errorMsg.value = 'No project database found in this workspace.'
      return { rows: [], fieldMap: {} }
    }

    const table = database.tables[0]
    const tableId = table.id

    const fields = table.fields || []
    const fMap = {}
    for (const field of fields) {
      const name = field.name.toLowerCase()
      if (name.includes('street')) fMap.street = field.id
      else if (name.includes('city') || name.includes('state')) fMap.city_state_zip = field.id
      else if (name.includes('file') && name.includes('no')) fMap.file_no = field.id
      else if (name.includes('status')) fMap.project_status = field.id
      else if (name.includes('priority')) fMap.priority = field.id
      else if (name.includes('request') || name.includes('deliverable')) fMap.request = field.id
    }
    fieldMap.value = fMap

    const { data } = await RowService($client).fetchAll({
      tableId,
      page: 1,
      size: 200,
    })

    rows.value = data.results || []
    isLoading.value = false
    return { rows: data.results, fieldMap: fMap }
  }
)

const filteredRows = computed(() => {
  if (!searchQuery.value) return rows.value
  const q = searchQuery.value.toLowerCase()
  return rows.value.filter((row) => {
    return Object.values(row).some((val) => {
      if (typeof val === 'string') return val.toLowerCase().includes(q)
      if (typeof val === 'object' && val !== null) {
        if (val.value) return val.value.toLowerCase().includes(q)
        if (Array.isArray(val)) {
          return val.some((v) => v.value && v.value.toLowerCase().includes(q))
        }
      }
      return false
    })
  })
})

const activeProjectCount = computed(() => {
  return rows.value.filter((row) => {
    const statusFieldId = fieldMap.value.project_status
    if (!statusFieldId) return true
    const status = row[`field_${statusFieldId}`]
    if (!status) return true
    const val = typeof status === 'object' ? status.value : status
    return !['Completed', 'Archived', 'Withdrawn'].includes(val)
  }).length
})

function handleSearch(query) {
  searchQuery.value = query
}
</script>
