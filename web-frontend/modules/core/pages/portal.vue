<template>
  <div class="portal">
    <h1>Portal — workspace {{ $route.params.workspaceId }}</h1>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app',
  middleware: [
    'settings',
    'authenticated',
    'impersonate',
    'workspacesAndApplications',
  ],
})
</script>
